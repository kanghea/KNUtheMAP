export default function BuildingLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* 로드뷰 헤더 스켈레톤 */}
      <div style={{ height: 360, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', position: 'relative' }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>

      {/* 타이틀 스켈레톤 */}
      <div style={{ padding: '20px 20px 0', maxWidth: 672, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 180, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ width: 60, height: 20, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div style={{ width: 240, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }} />
        <div style={{ width: 160, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>

      {/* 거래 탭 스켈레톤 */}
      <div style={{ padding: '28px 20px', maxWidth: 672, margin: '0 auto', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[80, 60, 60].map((w, i) => (
            <div key={i} style={{ width: w, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
        <div style={{ height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)' }} />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
