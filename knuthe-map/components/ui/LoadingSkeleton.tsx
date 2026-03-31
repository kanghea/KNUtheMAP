'use client'

/**
 * 페이지 전환 시 즉시 보여줄 로딩 스켈레톤 컴포넌트.
 * 각 라우트의 loading.tsx에서 사용.
 */

const shimmer = `
@keyframes knu-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`

const shimmerBg: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '800px 100%',
  animation: 'knu-shimmer 1.5s infinite linear',
  borderRadius: 8,
}

function Block({ w = '100%', h = 16, mb = 12 }: { w?: string | number; h?: number; mb?: number }) {
  return <div style={{ ...shimmerBg, width: w, height: h, marginBottom: mb }} />
}

/** 일반 카드형 페이지 스켈레톤 (마이페이지, 대시보드 등) */
export function CardPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 120px' }}>
        <Block w={160} h={28} mb={24} />
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} style={{
            background: '#111',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Block w="60%" h={18} mb={16} />
            <Block w="90%" h={14} />
            <Block w="75%" h={14} />
            <Block w="40%" h={14} mb={0} />
          </div>
        ))}
      </div>
    </>
  )
}

/** 건물 상세 페이지 스켈레톤 */
export function BuildingDetailSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 120px' }}>
        {/* 히어로 이미지 영역 */}
        <div style={{ ...shimmerBg, width: '100%', height: 220, borderRadius: 0, marginBottom: 0 }} />
        <div style={{ padding: '20px 16px' }}>
          <Block w="70%" h={24} mb={8} />
          <Block w="50%" h={14} mb={24} />
          {/* 정보 카드 */}
          <div style={{
            background: '#111',
            borderRadius: 12,
            padding: 20,
            marginBottom: 16,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Block w="40%" h={16} mb={16} />
            <Block w="100%" h={14} />
            <Block w="100%" h={14} />
            <Block w="60%" h={14} mb={0} />
          </div>
          {/* 거래 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Block w={80} h={36} mb={0} />
            <Block w={80} h={36} mb={0} />
          </div>
          <div style={{
            background: '#111',
            borderRadius: 12,
            padding: 20,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Block w="100%" h={14} />
            <Block w="100%" h={14} />
            <Block w="100%" h={14} mb={0} />
          </div>
        </div>
      </div>
    </>
  )
}

/** 지도 페이지 스켈레톤 */
export function MapPageSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
        <div style={{ ...shimmerBg, width: '100%', height: '100%', borderRadius: 0 }} />
      </div>
    </>
  )
}

/** 리스트형 페이지 스켈레톤 (관리자 목록 등) */
export function ListPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 120px' }}>
        <Block w={140} h={28} mb={24} />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ ...shimmerBg, width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Block w="50%" h={14} mb={8} />
              <Block w="30%" h={12} mb={0} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/** 방 목록 페이지 스켈레톤 */
export function RoomsPageSkeleton() {
  return (
    <>
      <style>{shimmer}</style>
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
        {/* 필터 바 */}
        <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 8 }}>
          <Block w={70} h={32} mb={0} />
          <Block w={90} h={32} mb={0} />
          <Block w={70} h={32} mb={0} />
        </div>
        {/* 지도 영역 */}
        <div style={{ ...shimmerBg, width: '100%', height: 'calc(100% - 60px)', borderRadius: 0 }} />
      </div>
    </>
  )
}
