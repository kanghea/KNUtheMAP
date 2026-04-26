import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

export default function RoomLoading() {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>
      {/* 사진 갤러리 스켈레톤 */}
      <div style={{
        height: 280, background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.04) 50%, transparent 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ width: 160, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.08)', marginBottom: 8 }} />
        <div style={{ width: 120, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', marginBottom: 6 }} />
        <div style={{ width: 200, height: 13, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
      </div>

      <LoadingRunnerOverlay />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
