// 방봐요 — "새로 시작" 탭 (디폴트 라우트).
//
// 활성 셋이 있으면 그 진행 상황을 우선 보여주고, 없으면 새 셋을 시작하는 CTA.
// 지난 투어 목록은 별도 탭(/bangbwayo/history)으로 분리됨.
//
// 성능: 무거운 데이터 페치(트랙·응답·사진·signed URL)는 <Suspense> 로 streaming.
// 페이지 진입 시 layout 헤더 + StartSetButton 자리(skeleton)가 즉시 도착하고,
// 활성 셋 카드는 데이터 도착 후 채워진다 — 방보기와 동일한 즉시 진입 인상.

import { Suspense } from 'react'
import { getServerUser }        from '@/lib/auth-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { Skeleton }             from '@/components/shared/Skeleton'
import { SetCardRow }           from '@/components/bangbwayo/SetCardRow'
import EnsureAnonymousSession   from '@/components/bangbwayo/EnsureAnonymousSession'
import AnonymousNotice          from '@/components/bangbwayo/AnonymousNotice'
import { buildSetCards,
         type SetCardInputSet,
         type SetCardInputTrack,
         type SetCardInputResponse,
         type SetCardInputPhoto,
         type SetCardInputBuilding } from '@/lib/bangbwayo-set-summary'
import StartSetButton           from '../_components/StartSetButton'
import type { ThemeTokens }     from '@/lib/theme-tokens'

function hrefFor(status: 'active' | 'ended' | 'results_generated', setId: string): string {
  return status === 'active'
    ? `/bangbwayo/sets/${setId}`
    : `/bangbwayo/sets/${setId}/results`
}

export default async function BangbwayoStartPage() {
  // 가벼운 부분만 await — 셸 즉시 도착.
  const [user, { tok }] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
  ])
  const isAnonymous = user?.is_anonymous === true

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
      {isAnonymous && <AnonymousNotice tok={tok} redirectAfter="/bangbwayo" />}
      {!user && <EnsureAnonymousSession tok={tok} />}

      <Suspense fallback={<ActiveSetSkeleton tok={tok} />}>
        <ActiveSetSection tok={tok} hasUser={!!user} />
      </Suspense>
    </div>
  )
}

/** 무거운 데이터 페치 — Suspense 안에서 streaming */
async function ActiveSetSection({ tok, hasUser }: { tok: ThemeTokens; hasUser: boolean }) {
  const supabase = await createSupabaseServer()

  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetCardInputSet[]
  const activeSet = sets.find((s) => s.status === 'active') ?? null

  if (sets.length === 0) {
    return (
      <>
        {hasUser && (
          <div style={{ marginBottom: 14 }}>
            <StartSetButton tok={tok} />
          </div>
        )}
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title={hasUser ? '아직 본 방이 없어요' : '준비 중…'}
            description={hasUser
              ? '방을 보러 갈 때 새 셋을 시작해 보세요. 본 방마다 트랙으로 기록돼요.'
              : '비로그인 사용을 위한 익명 세션을 만드는 중이에요.'}
          />
        </Card>
      </>
    )
  }

  // 활성 셋이 있을 때만 트랙·응답·사진·buildings 페치
  let activeCard = null
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
    <>
      {activeCard && (
        <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
          <SetCardRow
            tok={tok}
            summary={activeCard}
            href={hrefFor(activeCard.status, activeCard.id)}
          />
        </Card>
      )}

      {!activeCard && (
        <div style={{ marginBottom: 14 }}>
          <StartSetButton tok={tok} />
        </div>
      )}

      {!activeCard && (
        <Card tok={tok}>
          <EmptyState
            tok={tok}
            title="지금 진행 중인 투어가 없어요"
            description="방을 보러 갈 때 새 셋을 시작해 보세요. 지난 투어는 위 탭에서 다시 볼 수 있어요."
          />
        </Card>
      )}
    </>
  )
}

/** Suspense fallback — 활성 셋 카드/StartSetButton 자리에 들어가는 시각적 placeholder */
function ActiveSetSkeleton({ tok }: { tok: ThemeTokens }) {
  return (
    <>
      <Card tok={tok} padding="18px 20px" style={{
        marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <Skeleton tok={tok} width={8} height={8} radius={999} pulse />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton tok={tok} width={60} height={11} pulse />
          <Skeleton tok={tok} width="60%" height={15} pulse />
          <Skeleton tok={tok} width="40%" height={12} pulse />
        </div>
      </Card>
    </>
  )
}
