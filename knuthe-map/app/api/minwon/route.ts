import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/minwon — 민원 접수
//
// multipart/form-data 필드:
//   complaint_text   (text, ≥5자)
//   building_address (text)
//   building_phone   (text)
//   user_school      (text)
//   user_dept        (text)
//   user_grade       (text)        e.g. '21학번'
//   user_age         (string→int, 1..120)
//   user_phone       (text)
//   image            (File, 선택, 10MB 이하, jpeg/png/webp)
// ─────────────────────────────────────────────────────────────────────────────

const ALLOWED_MIME    = ['image/jpeg', 'image/png', 'image/webp'] as const
const MAX_SIZE_BYTES  = 10 * 1024 * 1024
const BUCKET          = 'minwon-images'

function getStr(form: FormData, key: string): string {
  const v = form.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const form = await req.formData()

  const complaintText   = getStr(form, 'complaint_text')
  const buildingAddress = getStr(form, 'building_address')
  const buildingPhone   = getStr(form, 'building_phone')
  const userSchool      = getStr(form, 'user_school')
  const userDept        = getStr(form, 'user_dept')
  const userGrade       = getStr(form, 'user_grade')
  const userAgeStr      = getStr(form, 'user_age')
  const userPhone       = getStr(form, 'user_phone')

  // ── 검증 ────────────────────────────────────────────────────────
  if (complaintText.length < 5)
    return NextResponse.json({ error: '민원 내용은 최소 5자 이상 입력해주세요.' }, { status: 400 })
  if (!buildingAddress)
    return NextResponse.json({ error: '건물 주소를 입력해주세요.' }, { status: 400 })
  if (!buildingPhone)
    return NextResponse.json({ error: '건물주 연락처를 입력해주세요.' }, { status: 400 })
  if (!userSchool || !userDept || !userGrade || !userPhone)
    return NextResponse.json({ error: '접수자 정보를 모두 입력해주세요.' }, { status: 400 })

  const userAge = Number(userAgeStr)
  if (!Number.isInteger(userAge) || userAge < 1 || userAge > 120)
    return NextResponse.json({ error: '올바른 나이를 입력해주세요.' }, { status: 400 })

  // ── 이미지 업로드 (선택) ────────────────────────────────────────
  let imageUrl: string | null = null
  const imageVal = form.get('image')
  if (imageVal && imageVal instanceof File && imageVal.size > 0) {
    if (!ALLOWED_MIME.includes(imageVal.type as typeof ALLOWED_MIME[number]))
      return NextResponse.json({ error: '허용되지 않는 이미지 형식 (jpeg/png/webp)' }, { status: 400 })
    if (imageVal.size > MAX_SIZE_BYTES)
      return NextResponse.json({ error: '이미지는 10MB 이하여야 합니다.' }, { status: 400 })

    const ext = imageVal.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${guard.user.id}/${crypto.randomUUID()}.${ext}`
    const buf  = Buffer.from(await imageVal.arrayBuffer())

    const service = createServiceClient()
    const { error: upErr } = await service.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: imageVal.type, upsert: false })
    if (upErr)
      return NextResponse.json({ error: `이미지 업로드 실패: ${upErr.message}` }, { status: 500 })

    imageUrl = service.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  // ── DB 삽입 ────────────────────────────────────────────────────
  // RLS 정책상 본인이 직접 insert 가능하지만, 이미지 업로드가 service role 로
  // 이뤄졌으므로 일관성을 위해 service client 로 user_id 명시 삽입.
  const service = createServiceClient()
  const { data, error } = await service
    .from('minwons')
    .insert({
      user_id:          guard.user.id,
      complaint_text:   complaintText,
      image_url:        imageUrl,
      building_address: buildingAddress,
      building_phone:   buildingPhone,
      user_school:      userSchool,
      user_dept:        userDept,
      user_grade:       userGrade,
      user_age:         userAge,
      user_phone:       userPhone,
    })
    .select('id')
    .single()

  if (error)
    return NextResponse.json({ error: `접수 실패: ${error.message}` }, { status: 500 })

  return NextResponse.json({ id: data.id, ok: true })
}
