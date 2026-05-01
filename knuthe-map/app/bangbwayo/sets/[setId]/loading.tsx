// 셋 상세 — 트랙 목록 스켈레톤

import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function SetDetailLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderTop: i === 1 ? 'none' : `1px solid ${tok.cardBorder}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Skeleton tok={tok} width={28} height={28} radius={999} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton tok={tok} width="60%" height={14} pulse />
                <Skeleton tok={tok} width="35%" height={11} pulse />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
