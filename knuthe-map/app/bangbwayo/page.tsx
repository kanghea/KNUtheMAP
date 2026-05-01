// 방봐요 메인 — 활성 셋 + 과거 셋 + 새 셋 시작
//
// 셋·트랙 모델: 셋(투어) ⊃ 트랙(방 한 개) ⊃ 카드(체크리스트 항목)
//   메인 화면은 "지금 어디까지 와 있는가" 를 한눈에. 진행 중 셋이 있으면 그걸로 이어가고,
//   없으면 새로 시작. 과거는 별도 섹션.

import { redirect }            from 'next/navigation'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { SetCardRow }           from '@/components/bangbwayo/SetCardRow'
import { buildSetCards,
         type SetCardInputSet,
         type SetCardInputTrack,
         type SetCardInputResponse,
         type SetCardInputPhoto,
         type SetCardInputBuilding } from '@/lib/bangbwayo-set-summary'
import StartSetButton           from './_components/StartSetButton'

export default async function BangbwayoPage() {
  const user = await getServerUser()
  if (!user) redirect('/auth/sign-in?redirect=/bangbwayo')

  const { tok } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  // 셋 목록
  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetCardInputSet[]

  // 셋이 0개면 빈 상태로 빠른 렌더 (추가 쿼리 없음)
  if (sets.length === 0) {
    return (
      <PageWrapper tok={tok}>
        <DashboardHeader
          tok={tok}
          title="방봐요"
          subtitle="방 보러 갈 때 함께 가는 도구"
          backHref="/"
        />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
          <div style={{ marginBottom: 14 }}>
            <StartSetButton tok={tok} />
          </div>
          <Card tok={tok}>
            <EmptyState
              tok={tok}
              title="아직 본 방이 없어요"
              description="방을 보러 갈 때 새 셋을 시작해 보세요. 본 방마다 트랙으로 기록돼요."
            />
          </Card>
        </div>
      </PageWrapper>
    )
  }

  // 트랙·응답·사진·건물 한 번에 — 셋 카드 요약에 필요한 모든 데이터
  const setIds = sets.map((s) => s.id)
  const { data: tracksData } = await supabase
    .from('bangbwayo_tracks')
    .select('id, set_id, order_index, building_id, building_address_text, unit_number')
    .in('set_id', setIds)

  const tracks   = (tracksData ?? []) as SetCardInputTrack[]
  const trackIds = tracks.map((t) => t.id)

  const [respRes, photosRes] = await Promise.all([
    trackIds.length > 0
      ? supabase
          .from('bangbwayo_responses')
          .select('track_id, rating')
          .in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
    trackIds.length > 0
      ? supabase
          .from('bangbwayo_photos')
          .select('track_id, storage_path, created_at')
          .in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
  ])
  const responses = (respRes.data   ?? []) as SetCardInputResponse[]
  const photos    = (photosRes.data ?? []) as SetCardInputPhoto[]

  // 매칭된 건물명·주소
  const buildingIds = Array.from(new Set(
    tracks.map((t) => t.building_id).filter((id): id is string => !!id),
  ))
  let buildings: SetCardInputBuilding[] = []
  if (buildingIds.length > 0) {
    const { data: bData } = await supabase
      .from('buildings')
      .select('id, name, address')
      .in('id', buildingIds)
    buildings = (bData ?? []) as SetCardInputBuilding[]
  }

  const service = createServiceClient()
  const cards = await buildSetCards({
    service, sets, tracks, responses, photos, buildings,
  })

  const activeCard = cards.find((c) => c.status === 'active') ?? null
  const pastCards  = cards.filter((c) => c.status !== 'active')

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="방봐요"
        subtitle="방 보러 갈 때 함께 가는 도구"
        backHref="/"
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 활성 셋 ─────────────────────────────────────────────── */}
        {activeCard && (
          <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
            <SetCardRow
              tok={tok}
              summary={activeCard}
              href={`/bangbwayo/sets/${activeCard.id}`}
            />
          </Card>
        )}

        {/* ── 새 셋 시작 — 활성 셋 없을 때만 ─────────────────────── */}
        {!activeCard && (
          <div style={{ marginBottom: 14 }}>
            <StartSetButton tok={tok} />
          </div>
        )}

        {/* ── 과거 셋 ─────────────────────────────────────────────── */}
        {pastCards.length > 0 ? (
          <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
            <div style={{
              padding: '14px 20px 6px',
              fontSize: 12, fontWeight: 700, color: tok.textTertiary,
              letterSpacing: '0.04em',
            }}>
              지난 투어
            </div>
            {pastCards.map((c, i) => (
              <div key={c.id} style={{
                borderTop: i === 0 ? 'none' : `1px solid ${tok.cardBorder}`,
              }}>
                <SetCardRow
                  tok={tok}
                  summary={c}
                  href={`/bangbwayo/sets/${c.id}`}
                />
              </div>
            ))}
          </Card>
        ) : !activeCard && (
          <Card tok={tok}>
            <EmptyState
              tok={tok}
              title="아직 본 방이 없어요"
              description="방을 보러 갈 때 새 셋을 시작해 보세요. 본 방마다 트랙으로 기록돼요."
            />
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
