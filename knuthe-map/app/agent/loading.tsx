import { getServerThemeTokens } from '@/lib/theme-server'

export default async function AgentLoading() {
  const { tok } = await getServerThemeTokens()

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: tok.inputBg }} />
          <div>
            <div style={{ width: 120, height: 16, borderRadius: 6, background: tok.cardBorder }} />
            <div style={{ width: 80, height: 11, borderRadius: 4, background: tok.cardBorder, marginTop: 4 }} />
          </div>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: tok.inputBg }} />
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              height: 100, borderRadius: 16,
              background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
        <div style={{
          height: 180, borderRadius: 20,
          background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}
