'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { type Role } from '@/lib/useRole'

// ── 아이콘 ───────────────────────────────────────────────────────────────────

function Ic({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <>{children}</>
}

function IconHome({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

function IconMap({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  )
}

function IconRooms({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  )
}

function IconReview({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconBuilding({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22V12h6v10"/><path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M8 10h.01"/><path d="M16 10h.01"/>
    </svg>
  )
}

function IconList({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function IconChart({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

function IconCheck({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}

function IconMe({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function NavDivider() {
  return <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
}

// ── nav 설정 ─────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: (active: boolean) => React.ReactNode
  match: (pathname: string) => boolean
}

function navItems(role: Role): NavItem[] {
  const me: NavItem = {
    href: '/me', label: '마이', icon: (a) => <IconMe active={a} />,
    match: (p) => p.startsWith('/me'),
  }

  if (role === 'owner') return [
    { href: '/owner',          label: '대시보드', icon: (a) => <IconBuilding active={a} />, match: (p) => p === '/owner' },
    { href: '/owner/units',    label: '호실관리', icon: (a) => <IconRooms active={a} />,    match: (p) => p.startsWith('/owner/units') },
    { href: '/owner/contracts',label: '계약관리', icon: (a) => <IconList active={a} />,     match: (p) => p.startsWith('/owner/contracts') },
    me,
  ]

  if (role === 'agent') return [
    { href: '/agent',           label: '대시보드', icon: (a) => <IconHome active={a} />,    match: (p) => p === '/agent' },
    { href: '/agent/buildings', label: '건물관리', icon: (a) => <IconBuilding active={a} />, match: (p) => p.startsWith('/agent/buildings') },
    { href: '/agent/listings',  label: '매물관리', icon: (a) => <IconRooms active={a} />,   match: (p) => p.startsWith('/agent/listings') },
    { href: '/agent/stats',     label: '통계',     icon: (a) => <IconChart active={a} />,   match: (p) => p.startsWith('/agent/stats') },
    me,
  ]

  if (role === 'admin') return [
    { href: '/admin',           label: '대시보드', icon: (a) => <IconHome active={a} />,  match: (p) => p === '/admin' },
    { href: '/admin/approvals', label: '승인관리', icon: (a) => <IconCheck active={a} />, match: (p) => p.startsWith('/admin/approvals') },
    { href: '/admin/users',     label: '사용자',   icon: (a) => <IconMe active={a} />,    match: (p) => p.startsWith('/admin/users') },
    me,
  ]

  // tenant (default)
  return [
    { href: '/',      label: '홈',      icon: (a) => <IconHome active={a} />,   match: (p) => p === '/' },
    { href: '/rooms', label: '방보기',  icon: (a) => <IconRooms active={a} />,  match: (p) => p.startsWith('/rooms') },
    { href: '/map',   label: '건물리뷰',icon: (a) => <IconReview active={a} />, match: (p) => p.startsWith('/map') },
    me,
  ]
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function PrefsIsland({ initialRole = 'tenant' }: { initialRole?: Role }) {
  const pathname = usePathname()
  const role     = initialRole

  // 온보딩 중에는 숨김 (클라이언트에서 search param 직접 확인)
  const isOnboarding = pathname === '/' &&
    typeof window !== 'undefined' && window.location.search.includes('reset=1')
  if (isOnboarding) return null

  const items = navItems(role)

  const itemStyle = (active: boolean): React.CSSProperties => ({
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            3,
    padding:        '6px 12px',
    borderRadius:   999,
    textDecoration: 'none',
    background:     active ? 'rgba(255,255,255,0.12)' : 'transparent',
    transition:     'background .15s',
    flexShrink:     0,
  })

  const lblStyle = (active: boolean): React.CSSProperties => ({
    fontSize:   10,
    fontWeight: 600,
    color:      active ? '#fff' : 'rgba(255,255,255,0.4)',
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{
      position:     'fixed',
      bottom:       28,
      left:         '50%',
      transform:    'translateX(-50%)',
      zIndex:       30,
      width:        'max-content',
      background:   '#0a0a0a',
      border:       '1px solid rgba(255,255,255,0.13)',
      boxShadow:    '0 8px 32px rgba(0,0,0,.55)',
      borderRadius: 999,
      overflow:     'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', padding: '6px 8px' }}>
        {items.map((item, i) => {
          const active = item.match(pathname)
          return (
            <div key={item.href} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <NavDivider />}
              <Link href={item.href} style={itemStyle(active)}>
                {item.icon(active)}
                <span style={lblStyle(active)}>{item.label}</span>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
