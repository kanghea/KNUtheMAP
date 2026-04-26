import { getServerThemeTokens } from '@/lib/theme-server'
import { Skeleton } from '@/components/shared/Skeleton'

export default async function RoomsLoading() {
  const { tok } = await getServerThemeTokens()
  return (
    <div style={{ position: 'fixed', inset: 0, background: tok.pageBg,
                  display: 'flex', flexDirection: 'column', zIndex: 0 }}>
      {/* 상단 메타/툴바 자리 */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: `1px solid ${tok.cardBorder}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Skeleton tok={tok} width="100%" height={18} style={{ flex: 1 }} />
        <Skeleton tok={tok} width={90} height={30} radius={999} />
        <Skeleton tok={tok} width={56} height={30} radius={999} />
      </div>

      {/* 카드 리스트 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="knu-pulse" style={{
            display: 'flex', gap: 12, padding: '16px 16px 14px',
            borderBottom: `1px solid ${tok.cardBorder}`,
          }}>
            <Skeleton tok={tok} width={96} height={96} radius={12} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <Skeleton tok={tok} width="50%" height={18} />
              <Skeleton tok={tok} width="40%" height={12} />
              <Skeleton tok={tok} width="70%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
