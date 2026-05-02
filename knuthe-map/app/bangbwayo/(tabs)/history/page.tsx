// 방봐요 — "지난 투어" 탭.
// status !== 'active' 인 셋들의 결과물 진입점 모음.

import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { SetCardRow }           from '@/components/bangbwayo/SetCardRow'
import { buildSetCards,
         type SetCardInputSet,
         type SetCardInputTrack,
         type SetCardInputResponse,
         type SetCardInputPhoto,
         type SetCardInputBuilding } from '@/lib/bangbwayo-set-summary'

export default async function BangbwayoHistoryPage() {
  const [themeRes, supabase] = await Promise.all([
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  const { tok } = themeRes

  // 종료된 셋만 — active 는 "새로 시작" 탭이 다룸.
  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .neq('status', 'active')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetCardInputSet[]

  if (sets.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title="지난 투어 기록이 없어요"
            description="투어를 마치면 여기서 결과물을 다시 볼 수 있어요."
          />
        </Card>
      </div>
    )
  }

  // 셋 카드 빌드용 데이터 일괄 fetch
  const setIds      = sets.map((s) => s.id)
  const { data: tracksData } = await supabase
    .from('bangbwayo_tracks')
    .select('id, set_id, order_index, building_id, building_address_text, unit_number')
    .in('set_id', setIds)

  const tracks   = (tracksData ?? []) as SetCardInputTrack[]
  const trackIds = tracks.map((t) => t.id)
  const buildingIds = Array.from(new Set(
    tracks.map((t) => t.building_id).filter((id): id is string => !!id),
  ))

  const [respRes, photosRes, buildingsRes] = await Promise.all([
    trackIds.length > 0
      ? supabase.from('bangbwayo_responses').select('track_id, rating').in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
    trackIds.length > 0
      ? supabase.from('bangbwayo_photos').select('track_id, storage_path, created_at').in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
    buildingIds.length > 0
      ? supabase.from('buildings').select('id, name, address').in('id', buildingIds)
      : Promise.resolve({ data: [] }),
  ])
  const responses = (respRes.data       ?? []) as SetCardInputResponse[]
  const photos    = (photosRes.data     ?? []) as SetCardInputPhoto[]
  const buildings = (buildingsRes.data  ?? []) as SetCardInputBuilding[]

  const service = createServiceClient()
  const cards = await buildSetCards({
    service, sets, tracks, responses, photos, buildings,
  })

  // 결과물 페이지로 이동 — 종료된 셋이라 status 가 ended/results_generated 둘 중 하나.
  function hrefFor(id: string): string {
    return `/bangbwayo/sets/${id}/results`
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
      <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
        {cards.map((c, i) => (
          <div key={c.id} style={{
            borderTop: i === 0 ? 'none' : `1px solid ${tok.cardBorder}`,
          }}>
            <SetCardRow tok={tok} summary={c} href={hrefFor(c.id)} />
          </div>
        ))}
      </Card>
    </div>
  )
}
