// /bangbwayo 메인 — 셋 목록 스켈레톤
//
// 페이지 전환 시 빈 화면 대신 즉시 노출되어 체감 지연을 줄인다.
// 실제 셋 카드와 같은 레이아웃의 회색 자리 표시.

import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeaderSkeleton } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function BangbwayoLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeaderSkeleton tok={tok} hasSubtitle />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        {/* 활성 셋 자리 */}
        <Card tok={tok} padding="18px 20px" style={{
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Skeleton tok={tok} width={8} height={8} radius={999} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton tok={tok} width={60} height={11} />
            <Skeleton tok={tok} width="60%" height={15} />
            <Skeleton tok={tok} width="40%" height={12} />
          </div>
        </Card>
        {/* 과거 셋 리스트 */}
        <Card tok={tok} padding={0} overflow="hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              padding: '14px 20px',
              borderTop: i === 1 ? 'none' : `1px solid ${tok.cardBorder}`,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <Skeleton tok={tok} width="50%" height={14} pulse />
              <Skeleton tok={tok} width="30%" height={12} pulse />
            </div>
          ))}
        </Card>
      </div>
      <LoadingRunnerOverlay />
    </PageWrapper>
  )
}
