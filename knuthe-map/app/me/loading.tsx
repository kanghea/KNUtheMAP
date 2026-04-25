import { getServerThemeTokens } from '@/lib/theme-server'

export default async function MeLoading() {
  const { tok } = await getServerThemeTokens()

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: tok.inputBg }} />
        <div>
          <div style={{ width: 80, height: 16, borderRadius: 6, background: tok.cardBorder }} />
          <div style={{ width: 40, height: 11, borderRadius: 4, background: tok.cardBorder, marginTop: 4 }} />
        </div>
      </header>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{
          background: tok.cardBg, borderRadius: 20, border: `1px solid ${tok.cardBorder}`,
          padding: 20, marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ width: 60, height: 14, borderRadius: 6, background: tok.cardBorder, marginBottom: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: '100%', height: 40, borderRadius: 10, background: tok.cardBorder }} />
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}
