import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function MeLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
          <Skeleton tok={tok} width={60} height={14} style={{ marginBottom: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} tok={tok} height={40} radius={10} pulse />
            ))}
          </div>
        </Card>
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
