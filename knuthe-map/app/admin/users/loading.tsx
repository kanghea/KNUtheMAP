export default function AdminSubLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px',
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
        <div>
          <div style={{ width: 100, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ width: 60, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
        </div>
      </header>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            height: 64, borderRadius: 14,
            background: '#111111', border: '1px solid rgba(255,255,255,0.08)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}
