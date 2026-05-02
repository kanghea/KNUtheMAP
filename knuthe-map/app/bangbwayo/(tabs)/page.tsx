// 방봐요 — "새로 시작" 탭 (디폴트 라우트).
//
// 활성 셋이 있으면 그 진행 상황을 우선 보여주고, 없으면 새 셋을 시작하는 CTA.
// 지난 투어 목록은 별도 탭(/bangbwayo/history)으로 분리됨.
//
// 셋·트랙 모델: 셋(투어) ⊃ 트랙(방 한 개) ⊃ 카드(체크리스트 항목)
// 라우팅:
//   · 활성 셋     → 트랙 목록(/bangbwayo/sets/{id}) — 이어서 작성
//   · 그 외 셋    → 결과물 페이지(/bangbwayo/sets/{id}/results)
//
// 비로그인 사용 — Supabase Anonymous Auth 로 자동 익명 세션 부여.

import { getServerUser }        from '@/lib/auth-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { SetCardRow }           from '@/components/bangbwayo/SetCardRow'
import EnsureAnonymousSession   from '@/components/bangbwayo/EnsureAnonymousSession'
import AnonymousNotice          from '@/components/bangbwayo/AnonymousNotice'
import { buildSetCards,
         type SetCardSummary,
         type SetCardInputSet,
         type SetCardInputTrack,
         type SetCardInputResponse,
         type SetCardInputPhoto,
         type SetCardInputBuilding } from '@/lib/bangbwayo-set-summary'
import StartSetButton           from '../_components/StartSetButton'

function hrefFor(status: 'active' | 'ended' | 'results_generated', setId: string): string {
  return status === 'active'
    ? `/bangbwayo/sets/${setId}`
    : `/bangbwayo/sets/${setId}/results`
}

export default async function BangbwayoStartPage() {
  const [user, themeRes, supabase] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  const isAnonymous = user?.is_anonymous === true
  const { tok } = themeRes

  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetCardInputSet[]
  const activeSet = sets.find((s) => s.status === 'active') ?? null

  // 본문은 layout 가 wrap 하므로 여기서는 컨테이너만.
  if (sets.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        {user && (
          <div style={{ marginBottom: 14 }}>
            <StartSetButton tok={tok} />
          </div>
        )}
        {!user && <EnsureAnonymousSession tok={tok} />}
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title={user ? '아직 본 방이 없어요' : '준비 중…'}
            description={user
              ? '방을 보러 갈 때 새 셋을 시작해 보세요. 본 방마다 트랙으로 기록돼요.'
              : '비로그인 사용을 위한 익명 세션을 만드는 중이에요.'}
          />
        </Card>
      </div>
    )
  }

  // 활성 카드 데이터 — 활성 셋이 있을 때만 트랙·응답·사진 fetch
  let activeCard: SetCardSummary | null = null
  if (activeSet) {
    const { data: tracksData } = await supabase
      .from('bangbwayo_tracks')
      .select('id, set_id, order_index, building_id, building_address_text, unit_number')
      .eq('set_id', activeSet.id)

    const tracks = (tracksData ?? []) as SetCardInputTrack[]
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
      service, sets: [activeSet], tracks, responses, photos, buildings,
    })
    activeCard = cards[0] ?? null
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
      {isAnonymous && <AnonymousNotice tok={tok} redirectAfter="/bangbwayo" />}

      {/* ── 활성 셋 ─────────────────────────────────────────────── */}
      {activeCard && (
        <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
          <SetCardRow
            tok={tok}
            summary={activeCard}
            href={hrefFor(activeCard.status, activeCard.id)}
          />
        </Card>
      )}

      {/* ── 새 셋 시작 — 활성 셋이 없을 때만 ──────────────────── */}
      {!activeCard && (
        <div style={{ marginBottom: 14 }}>
          <StartSetButton tok={tok} />
        </div>
      )}

      {/* ── 빠른 안내 ───────────────────────────────────────────
          지난 투어 목록은 다음 탭(/bangbwayo/history)으로 옮겼다는 사실을
          짧게 안내. */}
      {!activeCard && (
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title="지금 진행 중인 투어가 없어요"
            description="방을 보러 갈 때 새 셋을 시작해 보세요. 지난 투어는 위 탭에서 다시 볼 수 있어요."
          />
        </Card>
      )}
    </div>
  )
}
