// 트랙 카드 흐름 — 빈 카드 + 진행 바 스켈레톤

import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function TrackLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '8px 16px 24px' }}>
        {/* 진행 바 자리 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Skeleton tok={tok} width="100%" height={4} radius={999} style={{ flex: 1 }} />
          <Skeleton tok={tok} width={28} height={11} />
        </div>
        {/* 카드 자리 */}
        <div style={{
          background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
          borderRadius: 18, padding: 22, boxShadow: tok.shadow,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <Skeleton tok={tok} width={60} height={11} pulse />
          <Skeleton tok={tok} width="55%" height={20} pulse />
          <Skeleton tok={tok} width="100%" height={14} pulse />
          <Skeleton tok={tok} width="80%" height={14} pulse />
          <Skeleton tok={tok} width="100%" height={120} radius={12} pulse style={{ marginTop: 4 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginTop: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} tok={tok} height={36} radius={10} pulse />
            ))}
          </div>
        </div>
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
