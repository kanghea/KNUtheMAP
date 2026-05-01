// 결과물 — 가로 스와이프 트랙 카드 스켈레톤

import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function ResultsLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{
        display: 'flex', gap: 14, padding: '20px 16px 24px', overflowX: 'hidden',
      }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: '0 0 88%', maxWidth: 420,
            background: tok.cardBg,
            border: `1px solid ${tok.cardBorder}`,
            borderRadius: 20, overflow: 'hidden',
            boxShadow: tok.shadow,
          }}>
            <Skeleton tok={tok} width="100%" height={240} radius={0} pulse />
            <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton tok={tok} width="60%" height={16} pulse />
              <Skeleton tok={tok} width="40%" height={12} pulse />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 6 }}>
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} tok={tok} height={26} radius={8} pulse />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
