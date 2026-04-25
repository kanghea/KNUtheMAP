import { getServerThemeTokens } from '@/lib/theme-server'

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
        <div style={{ flex: 1, height: 18, borderRadius: 6,
                      background: tok.cardBorder }} />
        <div style={{ width: 90, height: 30, borderRadius: 999, background: tok.cardBorder }} />
        <div style={{ width: 56, height: 30, borderRadius: 999, background: tok.cardBorder }} />
      </div>

      {/* 카드 리스트 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            display: 'flex', gap: 12, padding: '16px 16px 14px',
            borderBottom: `1px solid ${tok.cardBorder}`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}>
            <div style={{ width: 96, height: 96, borderRadius: 12, background: tok.cardBorder }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
              <div style={{ width: '50%', height: 18, borderRadius: 6, background: tok.cardBorder }} />
              <div style={{ width: '40%', height: 12, borderRadius: 6, background: tok.cardBorder }} />
              <div style={{ width: '70%', height: 12, borderRadius: 6, background: tok.cardBorder }} />
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }`}</style>
    </div>
  )
}
