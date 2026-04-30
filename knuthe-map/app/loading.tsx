import { getServerThemeTokens } from '@/lib/theme-server'
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

// 루트(`/`) 라우트 전환용 스켈레톤.
//
// 기존엔 root에 loading.tsx가 없어 `/roommate` → `/` 이동 시 SSR이 끝날 때까지
// 이전 페이지가 그대로 보였다 (체감 지연의 가장 큰 원인). 랜딩 페이지(`_landing.tsx`)
// 의 시각 구조 — 헤더 / 히어로 / 구역 칩 / 카드들 / 하단 링크 — 와 동일한 자리표시를
// 깔아 클릭 즉시 화면이 바뀐 것처럼 보이게 한다. layout shift도 함께 줄어든다.
export default async function HomeLoading() {
  const { tok } = await getServerThemeTokens()

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg }}>
      {/* 헤더 자리 (랜딩 헤더와 같은 padding/높이) */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton tok={tok} width={32} height={32} radius={8} />
          <Skeleton tok={tok} width={110} height={15} radius={6} />
        </div>
        <Skeleton tok={tok} width={64} height={28} radius={999} />
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        {/* 히어로 자리 — 랜딩 히어로와 같은 22 radius */}
        <div className="knu-pulse" style={{
          margin: '16px 0 14px',
          height: 174, borderRadius: 22,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
        }} />

        {/* 구역 바로가기 자리 (제목 + 가로 칩) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10, padding: '0 2px',
          }}>
            <Skeleton tok={tok} width={86} height={13} radius={4} />
            <Skeleton tok={tok} width={60} height={11} radius={4} />
          </div>
          <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
            {[60, 70, 60, 60, 60, 70, 64, 70].map((w, i) => (
              <Skeleton key={i} tok={tok} width={w} height={56} radius={14} />
            ))}
          </div>
        </div>

        {/* 방 조건 필터 카드 */}
        <SkeletonCard tok={tok} height={72} radius={20} style={{ marginBottom: 14 }} />

        {/* 내 계약 관리 카드 */}
        <SkeletonCard tok={tok} height={120} radius={20} style={{ marginBottom: 14 }} />

        {/* 룸메이트 CTA 자리 */}
        <SkeletonCard tok={tok} height={156} radius={20} style={{ marginBottom: 14 }} />

        {/* 하단 링크 */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '4px 0',
        }}>
          <Skeleton tok={tok} width={64} height={11} radius={4} />
          <Skeleton tok={tok} width={86} height={11} radius={4} />
        </div>
      </div>

      <LoadingRunnerOverlay />
    </div>
  )
}
