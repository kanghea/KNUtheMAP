// 방봐요 — 트랙 카드 흐름 (한 항목 = 한 카드)
//
// 기획서 §6 의 "통합 카드 흐름". 한 화면에 한 항목만 보여주고, 그 안에서
// 가이드 → 사진 → 평가 → 메모가 모두 처리되도록 한다. 카드 사이는 자유 이동.
// 모든 응답·사진은 자동 저장 (저장 버튼 ❌, §9.5).

import { notFound, redirect } from 'next/navigation'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { signPathsCached }      from '@/lib/storage-signed-url-cache'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { getChecklistFor, type TimeOption } from '@/lib/bangbwayo-checklist'
import { formatTrackLabel }     from '@/lib/bangbwayo-track-label'
import TrackCardFlow            from './_components/TrackCardFlow'

interface TrackRow {
  id:                    string
  set_id:                string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
  time_option:           TimeOption
  deposit:               number | null
  monthly_rent:          number | null
  maintenance:           number | null
  floor:                 number | null
  contract_type:         '월세' | '전세' | '매매' | null
  overall_rating:        number | null
  overall_memo:          string | null
  status:                'draft' | 'saved' | 'closed' | 'included'
  visited_at:            string
}

export default async function TrackFlowPage({
  params,
}: {
  params: Promise<{ setId: string; trackId: string }>
}) {
  const { setId, trackId } = await params
  // 인증·테마·DB 클라이언트 + track/responses/photos 까지 한 번에 발사.
  // track/responses/photos 는 모두 trackId 만 알면 되므로 직렬 대기 불필요.
  const [user, themeRes, supabase] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bangbwayo/sets/${setId}/tracks/${trackId}`)}`)
  const { tok, theme } = themeRes

  const [trackRes, responsesRes, photosRes] = await Promise.all([
    supabase
      .from('bangbwayo_tracks')
      .select(`
        id, set_id, order_index, building_id, building_address_text, unit_number,
        time_option, deposit, monthly_rent, maintenance, floor, contract_type,
        overall_rating, overall_memo, status, visited_at
      `)
      .eq('id', trackId)
      .eq('set_id', setId)
      .maybeSingle(),
    supabase
      .from('bangbwayo_responses')
      .select('checklist_item_key, rating, memo')
      .eq('track_id', trackId),
    supabase
      .from('bangbwayo_photos')
      .select('id, checklist_item_key, storage_path, exif_lat, exif_lng')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true }),
  ])
  if (!trackRes.data) notFound()
  const track = trackRes.data as TrackRow

  // 마스터 체크리스트
  const checklist = getChecklistFor(track.time_option)

  // 사진 signed URL 과 building 조회는 photos/track 결과를 알아야 시작 가능 →
  // 다시 한 번 병렬로 묶음.
  const photos = (photosRes.data ?? []) as Array<{
    id: string; checklist_item_key: string | null; storage_path: string;
    exif_lat: number | null; exif_lng: number | null;
  }>
  const service = createServiceClient()
  const [signed, buildingRow] = await Promise.all([
    photos.length > 0
      ? signPathsCached(service, 'bangbwayo-photos', photos.map((p) => p.storage_path))
      : Promise.resolve({} as Record<string, string>),
    track.building_id
      ? supabase.from('buildings')
          .select('id, name, address, lat, lng')
          .eq('id', track.building_id)
          .maybeSingle()
          .then(({ data }) => data as {
            id: string; name: string | null; address: string | null;
            lat: number | null; lng: number | null;
          } | null)
      : Promise.resolve(null),
  ])
  const rData = responsesRes.data

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title={formatTrackLabel(track, buildingRow)}
        subtitle="체크 중"
        backHref={`/bangbwayo/sets/${setId}`}
      />

      <TrackCardFlow
        tok={tok}
        theme={theme}
        setId={setId}
        track={track}
        checklist={checklist}
        responses={(rData ?? []) as Array<{ checklist_item_key: string; rating: string | null; memo: string | null }>}
        photos={photos.map((p) => ({
          id:                  p.id,
          checklist_item_key:  p.checklist_item_key,
          storage_path:        p.storage_path,
          url:                 signed[p.storage_path] ?? null,
        }))}
        building={buildingRow}
        firstPhotoCoord={(() => {
          // 매칭 실패/지움 시의 폴백 — 사용자가 사진 찍은 위치 한 점.
          const p = photos.find((x) => x.exif_lat !== null && x.exif_lng !== null)
          return p ? { lat: p.exif_lat as number, lng: p.exif_lng as number } : null
        })()}
      />
    </PageWrapper>
  )
}
