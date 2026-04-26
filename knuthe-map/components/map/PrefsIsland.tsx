'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useRole, type Role } from '@/lib/useRole'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

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

// ── nav 설정 ─────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: (color: string) => React.ReactNode
  match: (pathname: string) => boolean
  disabled?: boolean  // 미구현 탭
}

function navItems(role: Role): NavItem[] {
  const me: NavItem = {
    href: '/me', label: '마이', icon: (c) => <IconMe color={c} />,
    match: (p) => p.startsWith('/me'),
  }

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

  // tenant (default)
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
}

export default function PrefsIsland({ initialRole = 'tenant', initialTheme = 'dark' }: Props) {
  const pathname          = usePathname()
  const clientRole        = useRole()
  const role              = clientRole ?? initialRole  // 클라이언트 role 우선, 로딩 중엔 서버값 사용
  const [toast, setToast] = useState(false)
  const tok               = THEME_TOKENS[initialTheme]

  // 온보딩 중에는 숨김
  const isOnboarding = pathname === '/' &&
    typeof window !== 'undefined' && window.location.search.includes('reset=1')
  if (isOnboarding) return null

  const items = navItems(role)

  const showToast = () => {
    setToast(true)
    setTimeout(() => setToast(false), 2000)
  }

  // 색 매핑 — 다크/라이트 모두에서 active는 accent로 명확히, inactive는 textTertiary로 절제
  const activeIconColor   = tok.accentColor
  const inactiveIconColor = tok.textTertiary

  const itemStyle = (active: boolean, disabled?: boolean): React.CSSProperties => ({
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            3,
    padding:        '6px 12px',
    borderRadius:   999,
    textDecoration: 'none',
    background:     active ? tok.accentBg : 'transparent',
    transition:     'background .15s, transform .1s',
    flexShrink:     0,
    opacity:        disabled ? 0.4 : 1,
    cursor:         disabled ? 'default' : 'pointer',
  })

  const lblStyle = (active: boolean): React.CSSProperties => ({
    fontSize:   10,
    fontWeight: 600,
    color:      active ? tok.accentColor : tok.textTertiary,
    whiteSpace: 'nowrap',
  })

  return (
    <>
      <style>{`
        .nav-item:active { transform: scale(0.88); }
      `}</style>

      {/* 준비 중 토스트 — 항상 어두운 배경(알림 관행) */}
      {toast && (
        <div style={{
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

      <div style={{
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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', padding: '6px 8px' }}>
          {items.map((item, i) => {
            const active = item.match(pathname)
            const color  = active ? activeIconColor : inactiveIconColor
            return (
              <div key={item.href} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && (
                  <div style={{ width: 1, height: 20, background: tok.cardBorder, flexShrink: 0 }} />
                )}
                {item.disabled ? (
                  <button
                    className="nav-item"
                    onClick={showToast}
                    aria-label={`${item.label} (준비 중)`}
                    style={{ ...itemStyle(false, true), border: 'none', background: 'transparent' }}
                  >
                    {item.icon(inactiveIconColor)}
                    <span style={lblStyle(false)}>{item.label}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="nav-item"
                    aria-label={item.label}
                    aria-current={active ? 'page' : undefined}
                    style={itemStyle(active)}
                  >
                    {item.icon(color)}
                    <span style={lblStyle(active)}>{item.label}</span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
