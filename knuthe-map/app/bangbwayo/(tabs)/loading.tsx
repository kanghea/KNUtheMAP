// /bangbwayo (tabs) 4개 탭 공유 로딩 — layout 가 헤더·탭바를 그리므로
// 이 파일에서는 본문 자리만 채운다.

import { getServerThemeTokens } from '@/lib/theme-server'
import { Card } from '@/components/shared/Card'
import { Skeleton } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default async function BangbwayoTabsLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
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
      <LoadingRunnerOverlay />
    </div>
  )
}
