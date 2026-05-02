'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRole, type Role } from '@/lib/useRole'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import type { ViewMode } from '@/lib/view-mode-cookie'

// ── 아이콘 ───────────────────────────────────────────────────────────────────
// color는 부모에서 active/inactive·테마에 따라 계산해 전달.

interface NavIconProps { color: string }

function IconHome({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconRooms({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  )
}

function IconReview({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconBuilding({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/><path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M8 10h.01"/><path d="M16 10h.01"/>
    </svg>
  )
}

function IconList({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function IconCheck({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconMe({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconRoommate({ color }: NavIconProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// ── nav 설정 ─────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: (color: string) => React.ReactNode
  match: (pathname: string) => boolean
  disabled?: boolean  // 미구현 탭
}

function navItems(role: Role, viewMode: ViewMode): NavItem[] {
  const me: NavItem = {
    href: '/me', label: '마이', icon: (c) => <IconMe color={c} />,
    match: (p) => p.startsWith('/me'),
  }

  // owner / agent / admin은 viewMode와 무관하게 자기 대시보드 nav 사용.
  if (role === 'owner') return [
    { href: '/owner',           label: '대시보드', icon: (c) => <IconBuilding color={c} />, match: (p) => p === '/owner' },
    { href: '/owner/units',     label: '호실관리', icon: (c) => <IconRooms color={c} />,    match: (p) => p.startsWith('/owner/units') },
    { href: '/owner/contracts', label: '계약관리', icon: (c) => <IconList color={c} />,     match: (p) => p.startsWith('/owner/contracts') },
    me,
  ]

  if (role === 'agent') return [
    { href: '/agent',            label: '대시보드', icon: (c) => <IconHome color={c} />,     match: (p) => p === '/agent' },
    { href: '/agent/buildings',  label: '건물관리', icon: (c) => <IconBuilding color={c} />, match: (p) => p.startsWith('/agent/buildings'), disabled: true },
    { href: '/agent/listings',   label: '매물관리', icon: (c) => <IconRooms color={c} />,    match: (p) => p.startsWith('/agent/listings'),  disabled: true },
    { href: '/agent/stats',      label: '통계',     icon: (c) => <IconList color={c} />,     match: (p) => p.startsWith('/agent/stats'),     disabled: true },
    me,
  ]

  if (role === 'admin') return [
    { href: '/admin',           label: '대시보드', icon: (c) => <IconHome color={c} />,  match: (p) => p === '/admin' },
    { href: '/admin/approvals', label: '승인관리', icon: (c) => <IconCheck color={c} />, match: (p) => p.startsWith('/admin/approvals') },
    { href: '/admin/users',     label: '사용자',   icon: (c) => <IconMe color={c} />,    match: (p) => p.startsWith('/admin/users') },
    me,
  ]

  // tenant / roommate는 viewMode 쿠키로 nav 분기 (사용자가 /me에서 토글).
  if (viewMode === 'roommate') return [
    { href: '/',          label: '홈',       icon: (c) => <IconHome color={c} />,     match: (p) => p === '/' },
    { href: '/roommate',  label: '룸메이트', icon: (c) => <IconRoommate color={c} />, match: (p) => p.startsWith('/roommate') },
    me,
  ]

  // 기본: 방보기 모드
  return [
    { href: '/',      label: '홈',      icon: (c) => <IconHome color={c} />,   match: (p) => p === '/' },
    { href: '/rooms', label: '방보기',  icon: (c) => <IconRooms color={c} />,  match: (p) => p.startsWith('/rooms') },
    { href: '/map',   label: '건물리뷰',icon: (c) => <IconReview color={c} />, match: (p) => p.startsWith('/map') },
    me,
  ]
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

interface Props {
  initialRole?:  Role
  /** 서버 컴포넌트(layout.tsx)에서 쿠키로 결정한 테마.
   *  hydration mismatch 방지를 위해 SSR과 동일한 값을 전달해야 함. */
  initialTheme?: ThemeMode
  /** 서버 컴포넌트에서 쿠키로 결정한 보기 모드. */
  initialViewMode?: ViewMode
}

// 햅틱 피드백 — 지원하지 않는 브라우저(iOS Safari 등)는 자동 무시.
function tapHaptic() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(8) } catch { /* noop */ }
  }
}

export default function PrefsIsland({ initialRole = 'tenant', initialTheme = 'dark', initialViewMode = 'rooms' }: Props) {
  const pathname          = usePathname()
  const searchParams      = useSearchParams()
  const router            = useRouter()
  const clientRole        = useRole()
  const role              = clientRole ?? initialRole  // 클라이언트 role 우선, 로딩 중엔 서버값 사용
  const tok               = THEME_TOKENS[initialTheme]

  // useTransition: 라우트 전환 중인지 추적해 진행 인디케이터를 띄움.
  const [isPending, startTransition] = useTransition()

  // 낙관적 active — 클릭한 href를 기록. `isPending`이 true인 동안만 의미가 있고,
  // 전환이 끝나면 자연스럽게 pathname 기반 매칭으로 돌아간다 (별도 클리어 불필요).
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // 토스트(준비 중 기능 안내).
  const [toast, setToast] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 토스트 타이머 cleanup (unmount/연속 클릭 race 방지).
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  const showToast = useCallback(() => {
    tapHaptic()
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(true)
    toastTimerRef.current = setTimeout(() => {
      setToast(false)
      toastTimerRef.current = null
    }, 2000)
  }, [])

  // 라우트 prefetch — 사용자가 항목에 손을 올리거나 터치 시작 시 미리 데이터를 받아둔다.
  // 클릭 시점에는 SSR 응답이 캐시에 와 있을 가능성이 높아 체감 지연이 거의 사라진다.
  const prefetchHref = useCallback((href: string) => {
    try { router.prefetch(href) } catch { /* noop */ }
  }, [router])

  // 클릭 핸들러 — 낙관적 active + 햅틱 + transition 안에서 router.push.
  // <Link>의 기본 동작을 가로채서:
  //   1) 같은 라우트면 무시
  //   2) 즉시 active 강조 이동
  //   3) 햅틱
  //   4) router.push를 startTransition으로 감싸 isPending 노출
  const handleNav = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string, isActive: boolean) => {
    // 새 탭/외부 모드 클릭 등은 기본 동작 유지
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    if (isActive) return  // 이미 그 페이지면 아무것도 안 함
    tapHaptic()
    setPendingHref(href)
    startTransition(() => { router.push(href) })
  }, [router])

  // 메모이즈 — role/viewMode가 안 바뀌면 배열·아이콘 ReactNode 재생성을 막는다.
  const items = useMemo(() => navItems(role, initialViewMode), [role, initialViewMode])

  // 색 매핑 — 다크/라이트 모두에서 active는 accent로 명확히, inactive는 textTertiary로 절제
  const activeIconColor   = tok.accentColor
  const inactiveIconColor = tok.textTertiary

  // 기본 스타일은 고정 객체로 캐싱 (active/disabled 변형만 분기).
  const baseItemStyle = useMemo<React.CSSProperties>(() => ({
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            3,
    padding:        '6px 12px',
    borderRadius:   999,
    textDecoration: 'none',
    transition:     'background .15s, transform .1s',
    flexShrink:     0,
    border:         'none',
    outline:        'none',
    background:     'transparent',
  }), [])

  const itemStyle = useCallback((active: boolean, disabled?: boolean): React.CSSProperties => ({
    ...baseItemStyle,
    background: active ? tok.accentBg : 'transparent',
    opacity:    disabled ? 0.4 : 1,
    cursor:     disabled ? 'default' : 'pointer',
  }), [baseItemStyle, tok.accentBg])

  const lblStyle = useCallback((active: boolean): React.CSSProperties => ({
    fontSize:   10,
    fontWeight: 600,
    color:      active ? tok.accentColor : tok.textTertiary,
    whiteSpace: 'nowrap',
  }), [tok.accentColor, tok.textTertiary])

  // 온보딩 중(`/?reset=1`)에는 숨김 — 모든 hooks 선언 이후에 분기.
  // useSearchParams() 를 써야 SSR/CSR 결과가 동일하고(hydration mismatch 방지),
  // 같은 pathname 안에서 쿼리만 바뀌는 클라이언트 네비게이션에도 반응한다.
  const isOnboarding = pathname === '/' && searchParams.get('reset') === '1'
  if (isOnboarding) return null

  return (
    <>
      <style>{`
        .knu-nav-item:active { transform: scale(0.88); }
        .knu-nav-item:focus-visible { outline: 2px solid ${tok.accentColor}; outline-offset: 2px; }
        @keyframes knu-nav-progress {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .knu-nav-progress {
          position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
          background: linear-gradient(90deg, transparent, ${tok.accentColor}, transparent);
          animation: knu-nav-progress 0.9s linear infinite;
          pointer-events: none;
        }
        @keyframes knu-nav-dot {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
        .knu-nav-dot {
          width: 4px; height: 4px; border-radius: 999px;
          background: ${tok.accentColor};
          animation: knu-nav-dot 0.8s ease-in-out infinite;
        }
      `}</style>

      {/* 준비 중 토스트 — 항상 어두운 배경(알림 관행) */}
      {toast && (
        <div role="status" aria-live="polite" style={{
          position:  'fixed',
          bottom:    'calc(90px + env(safe-area-inset-bottom))',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    31,
          background: 'rgba(15,23,42,0.94)',
          color:     '#fff',
          fontSize:  13,
          fontWeight: 600,
          padding:   '8px 18px',
          borderRadius: 999,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}>
          준비 중인 기능이에요
        </div>
      )}

      <nav
        aria-label="주 네비게이션"
        aria-busy={isPending || undefined}
        style={{
          position:     'fixed',
          bottom:       'calc(28px + env(safe-area-inset-bottom))',
          left:         '50%',
          transform:    'translateX(-50%)',
          zIndex:       30,
          width:        'max-content',
          background:   tok.cardBg,
          border:       `1px solid ${tok.cardBorder}`,
          boxShadow:    tok.shadow,
          borderRadius: 999,
          overflow:     'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', padding: '6px 8px' }}>
          {items.map((item, i) => {
            // 낙관적 강조: 라우트 전환 중에는 클릭한 href만 active.
            // 전환이 끝나면 pathname 매칭으로 자연스럽게 복귀.
            const active = (isPending && pendingHref)
              ? item.href === pendingHref
              : item.match(pathname)
            const color = active ? activeIconColor : inactiveIconColor
            const showPendingDot = isPending && pendingHref === item.href

            return (
              <div key={item.href} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <div style={{ width: 1, height: 20, background: tok.cardBorder, flexShrink: 0 }} />
                )}
                {item.disabled ? (
                  <button
                    type="button"
                    className="knu-nav-item"
                    onClick={showToast}
                    aria-label={`${item.label} (준비 중)`}
                    style={{ ...itemStyle(false, true) }}
                  >
                    {item.icon(inactiveIconColor)}
                    <span style={lblStyle(false)}>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    prefetch
                    className="knu-nav-item"
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    onClick={(e) => handleNav(e, item.href, item.match(pathname))}
                    onPointerEnter={() => prefetchHref(item.href)}
                    onPointerDown={() => prefetchHref(item.href)}
                    style={{ ...itemStyle(active), position: 'relative' }}
                  >
                    {/* 진행 중 dot — 클릭한 항목에만 작은 펄스 점을 띄움 */}
                    {showPendingDot && (
                      <span
                        aria-hidden
                        className="knu-nav-dot"
                        style={{ position: 'absolute', top: 4, right: 8 }}
                      />
                    )}
                    {item.icon(color)}
                    <span style={lblStyle(active)}>{item.label}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* island 하단 진행 바 — 라우트 전환 중 시각 신호 */}
        {isPending && <div className="knu-nav-progress" aria-hidden />}
      </nav>
    </>
  )
}
