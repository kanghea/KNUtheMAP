import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { SkeletonCard } from '@/components/shared/Skeleton'

export default async function AdminUsersLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} tok={tok} height={64} radius={14} />)}
      </div>
    </PageWrapper>
  )
}
