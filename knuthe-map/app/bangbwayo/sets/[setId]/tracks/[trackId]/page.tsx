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
  const user = await getServerUser()
  if (!user) redirect(`/auth/sign-in?redirect=/bangbwayo/sets/${setId}/tracks/${trackId}`)

  const { tok, theme } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  const { data: trackData } = await supabase
    .from('bangbwayo_tracks')
    .select(`
      id, set_id, order_index, building_id, building_address_text, unit_number,
      time_option, deposit, monthly_rent, maintenance, floor, contract_type,
      overall_rating, overall_memo, status, visited_at
    `)
    .eq('id', trackId)
    .eq('set_id', setId)
    .maybeSingle()
  if (!trackData) notFound()
  const track = trackData as TrackRow

  // 마스터 체크리스트
  const checklist = getChecklistFor(track.time_option)

  // 응답 + 사진 한 번에
  const [{ data: rData }, { data: pData }, buildingRow] = await Promise.all([
    supabase
      .from('bangbwayo_responses')
      .select('checklist_item_key, rating, memo')
      .eq('track_id', trackId),
    supabase
      .from('bangbwayo_photos')
      .select('id, checklist_item_key, storage_path')
      .eq('track_id', trackId)
      .order('created_at', { ascending: true }),
    track.building_id
      ? supabase.from('buildings')
          .select('id, name, address')
          .eq('id', track.building_id)
          .maybeSingle()
          .then(({ data }) => data as { id: string; name: string | null; address: string | null } | null)
      : Promise.resolve(null),
  ])

  // 사진 signed URL — 비공개 버킷이라 매 요청 새로 발급
  const photos = (pData ?? []) as Array<{ id: string; checklist_item_key: string | null; storage_path: string }>
  const signed: Record<string, string> = {}
  if (photos.length > 0) {
    const service = createServiceClient()
    const { data: list } = await service.storage
      .from('bangbwayo-photos')
      .createSignedUrls(photos.map((p) => p.storage_path), 60 * 60)
    photos.forEach((p, i) => {
      const url = list?.[i]?.signedUrl
      if (url) signed[p.storage_path] = url
    })
  }

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
        photos={photos.map((p) => ({ ...p, url: signed[p.storage_path] ?? null }))}
        building={buildingRow}
      />
    </PageWrapper>
  )
}
