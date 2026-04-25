import { getServerThemeTokens } from '@/lib/theme-server'

export default async function MapLoading() {
  const { tok, theme } = await getServerThemeTokens()
  // 지도 영역 — 다크/라이트에 맞춘 부드러운 그라데이션
  const mapBg = theme === 'dark'
    ? 'linear-gradient(135deg,#0f172a 0%,#111827 40%,#0a0a0a 100%)'
    : 'linear-gradient(135deg,#e2e8f0 0%,#f1f5f9 40%,#f8fafc 100%)'

  return (
    <div style={{ position: 'fixed', inset: 0, background: tok.pageBg, zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: mapBg,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: theme === 'dark'
            ? 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)'
            : 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.6) 50%, transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.6s infinite',
        }} />
      </div>

      {/* 상단 검색바 자리 */}
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16,
        height: 44, borderRadius: 999,
        background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
        boxShadow: tok.shadow,
      }} />

      {/* 하단 필터 토글 자리 */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        width: 160, height: 44, borderRadius: 999,
        background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
        boxShadow: tok.shadow,
      }} />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
