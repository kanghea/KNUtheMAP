export default function OwnerLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div>
          <div style={{ width: 130, height: 16, borderRadius: 6, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ width: 80, height: 11, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginTop: 4 }} />
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.07)' }} />
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <div style={{ height: 200, borderRadius: 20, background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }} />
      </div>
    </div>
  )
}
