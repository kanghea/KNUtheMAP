import { getServerThemeTokens } from '@/lib/theme-server'

export default async function TransactionsLoading() {
  const { tok } = await getServerThemeTokens()

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        padding: '14px 20px',
      }}>
        <div style={{ width: 130, height: 16, borderRadius: 6, background: tok.cardBorder }} />
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            height: 92, borderRadius: 14,
            background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }`}</style>
    </div>
  )
}
