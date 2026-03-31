export default function AgentLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
      }}>
        <div>
          <div style={{ width: 120, height: 16, borderRadius: 6, background: '#e2e8f0' }} />
          <div style={{ width: 80, height: 11, borderRadius: 4, background: '#f1f5f9', marginTop: 4 }} />
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f1f5f9' }} />
      </header>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 16, background: '#f1f5f9' }} />
          ))}
        </div>
        <div style={{ height: 180, borderRadius: 20, background: '#fff', border: '1px solid #f1f5f9' }} />
      </div>
    </div>
  )
}
