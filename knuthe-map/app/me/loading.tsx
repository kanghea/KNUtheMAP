export default function MeLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.07)' }} />
        <div>
          <div style={{ width: 80, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ width: 40, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
        </div>
      </header>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{
          background: '#111111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
          padding: 20, marginBottom: 16,
        }}>
          <div style={{ width: 60, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginBottom: 18 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ width: '100%', height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
