import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { IconChevronLeft } from './icons'

interface DashboardHeaderProps {
  tok: ThemeTokens
  title: string
  subtitle?: string | null
  /** 뒤로가기 링크 — `null`이면 버튼 자체 숨김. 기본 `'/'` */
  backHref?: string | null
  /** 접근성 라벨 (기본 '뒤로') */
  backLabel?: string
  /** 헤더 우측 슬롯 (아바타·액션 버튼 등) */
  right?: ReactNode
  /** 헤더 외부 스타일 오버라이드 */
  style?: CSSProperties
}

const HEADER_BASE: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
}

const ICON_BTN_SIZE = 34
const ICON_BTN_RADIUS = 10

function iconBtnStyle(tok: ThemeTokens): CSSProperties {
  return {
    width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: ICON_BTN_RADIUS,
    background: tok.inputBg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', flexShrink: 0,
  }
}

/**
 * 모든 대시보드(/admin·/agent·/owner·/me·...)의 통일 헤더.
 * - 좌측: 뒤로가기 아이콘 + 제목/부제
 * - 우측: 임의 슬롯 (없으면 빈 공간)
 *
 * 시각 언어를 고정해두어 페이지마다 색·여백·폰트 크기가 어긋나지 않게 한다.
 */
export function DashboardHeader({
  tok,
  title,
  subtitle,
  backHref = '/',
  backLabel = '뒤로',
  right,
  style,
}: DashboardHeaderProps) {
  return (
    <header style={{
      ...HEADER_BASE,
      // 테마 토글 즉각 반영 — CSS 변수 사용. globals.css 의 --header-bg /
      // --header-border 가 [data-theme] 에 따라 자동 전환되므로 router.refresh()
      // 결과를 기다릴 필요가 없다. (tok 은 다른 요소들에서 그대로 사용)
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--header-border)',
      transition: 'background 180ms ease, border-color 180ms ease',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {backHref && (
          <Link href={backHref} aria-label={backLabel} style={iconBtnStyle(tok)}>
            <IconChevronLeft size={16} color={tok.textSecondary} />
          </Link>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{
            fontSize: 16, fontWeight: 800, color: tok.textPrimary, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: 11, color: tok.textTertiary, margin: '2px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right ?? null}
    </header>
  )
}

interface DashboardHeaderSkeletonProps {
  tok: ThemeTokens
  /** 부제 자리 자리표시 (기본 false) */
  hasSubtitle?: boolean
  /** 우측 아이콘 자리표시 (기본 false) */
  hasRight?: boolean
}

/**
 * `loading.tsx`에서 `<DashboardHeader>`와 같은 자리를 차지하는 스켈레톤.
 * 실제 헤더와 layout shift가 일어나지 않도록 동일한 padding/높이를 유지한다.
 */
export function DashboardHeaderSkeleton({
  tok,
  hasSubtitle = false,
  hasRight = false,
}: DashboardHeaderSkeletonProps) {
  return (
    <header style={{
      ...HEADER_BASE,
      background: 'var(--header-bg)',
      borderBottom: '1px solid var(--header-border)',
      transition: 'background 180ms ease, border-color 180ms ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: ICON_BTN_RADIUS,
          background: tok.inputBg,
        }} />
        <div>
          <div style={{ width: 130, height: 16, borderRadius: 6, background: tok.cardBorder }} />
          {hasSubtitle && (
            <div style={{ width: 80, height: 11, borderRadius: 4, background: tok.cardBorder, marginTop: 4 }} />
          )}
        </div>
      </div>
      {hasRight && (
        <div style={{
          width: ICON_BTN_SIZE, height: ICON_BTN_SIZE, borderRadius: ICON_BTN_RADIUS,
          background: tok.inputBg,
        }} />
      )}
    </header>
  )
}

/**
 * 헤더 우측에 자주 쓰이는 "마이페이지" 아바타 버튼.
 * `<DashboardHeader right={<HeaderAvatarLink ... />}>` 형태로 사용.
 */
export function HeaderAvatarLink({
  tok,
  href = '/me',
  ariaLabel = '마이페이지',
  children,
}: {
  tok: ThemeTokens
  href?: string
  ariaLabel?: string
  children: ReactNode
}) {
  return (
    <Link href={href} aria-label={ariaLabel} style={iconBtnStyle(tok)}>
      {children}
    </Link>
  )
}
