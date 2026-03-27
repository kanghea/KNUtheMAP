'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

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

function IconRooms({ active }: { active: boolean }) {
  const c = active ? '#fff' : 'rgba(255,255,255,0.45)'
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
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

export default function PrefsIsland() {
  const pathname = usePathname()

  const isHome   = pathname === '/'
  const isRooms  = pathname.startsWith('/rooms')
  const isReview = pathname.startsWith('/map')
  const isMe     = pathname.startsWith('/me')

  const item = (active: boolean) => ({
    display:        'flex'        as const,
    flexDirection:  'column'      as const,
    alignItems:     'center'      as const,
    gap:            3,
    padding:        '6px 12px',
    borderRadius:   999,
    textDecoration: 'none'        as const,
    background:     active ? 'rgba(255,255,255,0.12)' : 'transparent',
    transition:     'background .15s',
    flexShrink:     0,
  })

  const lbl = (active: boolean) => ({
    fontSize:   10,
    fontWeight: 600,
    color:      active ? '#fff' : 'rgba(255,255,255,0.4)',
    whiteSpace: 'nowrap' as const,
  } as const)

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

        <Link href="/" style={item(isHome)}>
          <IconHome active={isHome} />
          <span style={lbl(isHome)}>홈</span>
        </Link>

        <NavDivider />

        <Link href="/rooms" style={item(isRooms)}>
          <IconRooms active={isRooms} />
          <span style={lbl(isRooms)}>방보기</span>
        </Link>

        <NavDivider />

        <Link href="/map" style={item(isReview)}>
          <IconReview active={isReview} />
          <span style={lbl(isReview)}>건물리뷰</span>
        </Link>

        <NavDivider />

        <Link href="/me" style={item(isMe)}>
          <IconMe active={isMe} />
          <span style={lbl(isMe)}>마이</span>
        </Link>

      </div>
    </div>
  )
}
