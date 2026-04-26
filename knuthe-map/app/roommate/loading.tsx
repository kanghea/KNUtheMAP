import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { SkeletonCard } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function RoommateLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SkeletonCard tok={tok} height={180} radius={20} />
        {[1, 2, 3].map(i => <SkeletonCard key={i} tok={tok} height={88} radius={14} />)}
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
