import { NextRequest, NextResponse } from 'next/server'
import exifr from 'exifr'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }   from '@/lib/supabase'
import { requireAuth }           from '@/lib/auth-guard'
import { matchBuildingByCoord }  from '@/lib/bangbwayo-matching'
import { reverseGeocodeToRoadAddress } from '@/lib/bangbwayo-reverse-geocode'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const
const MAX_BYTES = 5 * 1024 * 1024  // 5MB — 클라이언트에서 리사이즈 권장

// POST /api/bangbwayo/sets/[setId]/tracks/[trackId]/photos
//
// multipart/form-data:
//   file:                File
//   checklist_item_key?: string  — 어떤 항목 카드에서 찍은 사진인지
//   exif_lat?:           string  — 클라이언트가 미리 파싱한 EXIF (선택)
//   exif_lng?:           string
//   exif_taken_at?:      string  — ISO 8601
//
// EXIF 좌표가 있고 트랙에 building_id 가 아직 없으면 자동 매칭 시도.
// (호수는 절대 자동화하지 않음 — 기획서 §4.2)
export async function POST(
  req:  NextRequest,
  { params }: { params: Promise<{ setId: string; trackId: string }> },
) {
  const { setId, trackId } = await params
  if (!UUID_RE.test(setId) || !UUID_RE.test(trackId))
    return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  // 트랙 본인 소유 확인 (RLS가 어차피 막지만 명시적으로)
  const { data: track } = await supabase
    .from('bangbwayo_tracks')
    .select('id, building_id, set_id, building_address_text')
    .eq('id', trackId)
    .eq('set_id', setId)
    .maybeSingle()
  if (!track)
    return NextResponse.json({ error: '트랙을 찾을 수 없어요' }, { status: 404 })

  const form = await req.formData()
  const file = form.get('file')               as File | null
  const itemKey = (form.get('checklist_item_key') as string | null)?.trim() || null
  const exifLatStr     = form.get('exif_lat')      as string | null
  const exifLngStr     = form.get('exif_lng')      as string | null
  const exifTakenAtStr = form.get('exif_taken_at') as string | null

  if (!file)
    return NextResponse.json({ error: '파일이 없어요' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type as typeof ALLOWED_MIME[number]))
    return NextResponse.json({ error: '허용되지 않는 형식 (jpeg/png/webp/heic)' }, { status: 400 })
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: '파일 크기는 5MB 이하' }, { status: 400 })

  // 클라이언트가 보낸 좌표(현재 위치 기준의 폴백) 우선 후보
  const clientLat = exifLatStr !== null ? Number(exifLatStr) : null
  const clientLng = exifLngStr !== null ? Number(exifLngStr) : null
  let exifTakenAt = exifTakenAtStr || null

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${trackId}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  // ── EXIF 좌표 추출 (사진 원본에서) ──────────────────────────────────────
  // exifr 는 JPEG·HEIC·WebP 의 GPS·DateTimeOriginal 을 모두 읽는다.
  // 사진 자체의 좌표가 가장 정확 (갤러리에서 옛 사진을 첨부해도 그때 좌표).
  // 실패하거나 좌표가 없으면 클라이언트가 보낸 현재 위치 폴백.
  let exifLat: number | null = null
  let exifLng: number | null = null
  try {
    const meta = await exifr.parse(buffer, {
      gps:   true,
      pick: ['latitude', 'longitude', 'DateTimeOriginal', 'CreateDate'],
    }) as { latitude?: number; longitude?: number; DateTimeOriginal?: Date; CreateDate?: Date } | undefined

    if (meta) {
      if (typeof meta.latitude  === 'number' && Number.isFinite(meta.latitude))  exifLat = meta.latitude
      if (typeof meta.longitude === 'number' && Number.isFinite(meta.longitude)) exifLng = meta.longitude
      const taken = meta.DateTimeOriginal ?? meta.CreateDate
      if (taken && !exifTakenAt) exifTakenAt = taken.toISOString()
    }
  } catch {
    // EXIF 파싱 실패 — 클라이언트 좌표로 폴백
  }
  if (exifLat === null && clientLat !== null && Number.isFinite(clientLat)) exifLat = clientLat
  if (exifLng === null && clientLng !== null && Number.isFinite(clientLng)) exifLng = clientLng

  // Storage 업로드 (service role — 비공개 버킷)

  const service = createServiceClient()
  const { error: upErr } = await service.storage
    .from('bangbwayo-photos')
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  // photos row insert — RLS 적용된 사용자 클라이언트로 (IDOR 한 번 더 방지)
  const { data: photoRow, error: insErr } = await supabase
    .from('bangbwayo_photos')
    .insert({
      track_id:           trackId,
      checklist_item_key: itemKey,
      storage_path:       path,
      exif_lat:           Number.isFinite(exifLat) ? exifLat : null,
      exif_lng:           Number.isFinite(exifLng) ? exifLng : null,
      exif_taken_at:      exifTakenAt,
      bytes:              file.size,
    })
    .select('id, track_id, checklist_item_key, storage_path, exif_lat, exif_lng, exif_taken_at')
    .single()

  if (insErr || !photoRow) {
    // photos row 생성 실패 시 storage object 정리 (고아 방지)
    await service.storage.from('bangbwayo-photos').remove([path]).catch(() => {})
    return NextResponse.json({ error: insErr?.message ?? '사진 메타 저장 실패' }, { status: 500 })
  }

  // 좌표 자동 매칭 + 주소 자동 입력 — 트랙에 building_id 가 아직 없을 때만 시도.
  // 우선순위:
  //   1. buildings 테이블 매칭 → building_id 설정 (formatTrackLabel 이 buildings.address 사용)
  //   2. 매칭 실패 + building_address_text 비어있음 → 네이버 역지오코딩으로 도로명주소 자동 입력
  let matchedBuilding: { id: string; name: string | null; address: string | null; distanceM: number } | null = null
  let geocodedAddress: string | null = null
  if (!track.building_id && Number.isFinite(exifLat) && Number.isFinite(exifLng)) {
    const m = await matchBuildingByCoord(supabase, exifLat as number, exifLng as number)
    if (m) {
      await supabase
        .from('bangbwayo_tracks')
        .update({ building_id: m.buildingId })
        .eq('id', trackId)
      matchedBuilding = {
        id:        m.buildingId,
        name:      m.name,
        address:   m.address,
        distanceM: Math.round(m.distanceM),
      }
    } else if (!track.building_address_text?.trim()) {
      // 좌표는 있는데 매칭 실패 + 사용자가 직접 입력한 주소도 없음 → 자동 입력
      geocodedAddress = await reverseGeocodeToRoadAddress(exifLat as number, exifLng as number)
      if (geocodedAddress) {
        await supabase
          .from('bangbwayo_tracks')
          .update({ building_address_text: geocodedAddress })
          .eq('id', trackId)
      }
    }
  }

  // 응답 — signed URL 도 같이 (즉시 미리보기용)
  const { data: signed } = await service.storage
    .from('bangbwayo-photos')
    .createSignedUrl(path, 60 * 60 * 24)

  return NextResponse.json({
    photo: {
      ...photoRow,
      url: signed?.signedUrl ?? null,
    },
    matchedBuilding,
    /** 매칭 실패 + 역지오코딩으로 자동 채워진 주소 — 클라이언트에 알려서 헤더 갱신용 */
    geocodedAddress,
  })
}
