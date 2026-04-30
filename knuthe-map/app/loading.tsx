import { cookies } from 'next/headers'
import { getServerThemeTokens } from '@/lib/theme-server'
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'
import { unsealViewMode, VIEW_MODE_COOKIE_NAME } from '@/lib/view-mode-cookie'

// 루트(`/`) 라우트 전환용 스켈레톤.
//
// 기존엔 root에 loading.tsx가 없어 `/roommate` → `/` 이동 시 SSR이 끝날 때까지
// 이전 페이지가 그대로 보였다 (체감 지연의 가장 큰 원인).
//
// `viewMode` 쿠키를 읽어 모드별로 다른 스켈레톤을 보여 layout shift 까지 줄인다.
//  - 룸메이트 모드: 보라 히어로 + 거주 유형 듀얼 + Top 3 + 프로필 스탯 + 모드 전환
//  - 방보기/기본:  기존 랜딩(히어로·구역칩·필터·계약·룸메이트 CTA) 자리
export default async function HomeLoading() {
  const { tok } = await getServerThemeTokens()
  const jar    = await cookies()
  const sealed = jar.get(VIEW_MODE_COOKIE_NAME)?.value
  const view   = sealed ? unsealViewMode(sealed) : null
  const isRoommate = view === 'roommate'

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg }}>
      {/* 헤더 자리 (랜딩 헤더와 같은 padding/높이) */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton tok={tok} width={32} height={32} radius={isRoommate ? 10 : 8} />
          <Skeleton tok={tok} width={isRoommate ? 70 : 110} height={15} radius={6} />
        </div>
        <Skeleton tok={tok} width={isRoommate ? 48 : 64} height={28} radius={999} />
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 100px' }}>
        {/* 히어로 자리 — 룸메이트는 더 크다 (SVG 일러스트 포함) */}
        <div className="knu-pulse" style={{
          margin: '16px 0 14px',
          height: isRoommate ? 320 : 174, borderRadius: 22,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
        }} />

        {isRoommate ? (
          <>
            {/* 거주 유형 듀얼 카드 */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              marginBottom: 14,
            }}>
              <SkeletonCard tok={tok} height={108} radius={18} />
              <SkeletonCard tok={tok} height={108} radius={18} />
            </div>

            {/* 호환도 Top 3 */}
            <SkeletonCard tok={tok} height={210} radius={20} style={{ marginBottom: 14 }} />

            {/* 내 프로필 미니 스탯 */}
            <SkeletonCard tok={tok} height={150} radius={20} style={{ marginBottom: 14 }} />

            {/* 모드 전환 카드 */}
            <SkeletonCard tok={tok} height={140} radius={20} style={{ marginBottom: 14 }} />

            {/* 호환도 인포 */}
            <SkeletonCard tok={tok} height={52} radius={14} style={{ marginBottom: 14 }} />
          </>
        ) : (
          <>
            {/* 구역 바로가기 자리 (제목 + 가로 칩) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 10, padding: '0 2px',
              }}>
                <Skeleton tok={tok} width={86} height={13} radius={4} />
                <Skeleton tok={tok} width={60} height={11} radius={4} />
              </div>
              <div style={{ display: 'flex', gap: 8, overflow: 'hidden' }}>
                {[60, 70, 60, 60, 60, 70, 64, 70].map((w, i) => (
                  <Skeleton key={i} tok={tok} width={w} height={56} radius={14} />
                ))}
              </div>
            </div>

            <SkeletonCard tok={tok} height={72}  radius={20} style={{ marginBottom: 14 }} />
            <SkeletonCard tok={tok} height={120} radius={20} style={{ marginBottom: 14 }} />
            <SkeletonCard tok={tok} height={156} radius={20} style={{ marginBottom: 14 }} />
          </>
        )}

        {/* 하단 링크 */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '4px 0',
        }}>
          <Skeleton tok={tok} width={64} height={11} radius={4} />
          <Skeleton tok={tok} width={86} height={11} radius={4} />
        </div>
      </div>

      <LoadingRunnerOverlay />
    </div>
  )
}
