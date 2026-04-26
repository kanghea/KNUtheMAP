import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { SkeletonCard } from '@/components/shared/Skeleton'

export default async function OwnerLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle hasRight />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <SkeletonCard tok={tok} height={200} radius={20} />
      </div>
    </PageWrapper>
  )
}
