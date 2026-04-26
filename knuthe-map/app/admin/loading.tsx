import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { SkeletonCard } from '@/components/shared/Skeleton'

export default async function AdminLoading() {
  const { tok } = await getServerThemeTokens()

  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} tok={tok} height={100} />)}
        </div>
        <SkeletonCard tok={tok} height={240} radius={20} />
      </div>
    </PageWrapper>
  )
}
