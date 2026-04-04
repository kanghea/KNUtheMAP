'use client'

import OptionCard from './OptionCard'

export type UserRole = 'tenant' | 'roommate' | 'owner'

interface Props {
  selected: UserRole | null
  onSelect: (role: UserRole) => void
  tok: {
    cardBg: string
    cardBorder: string
    cardActiveBg: string
    cardActiveBorder: string
    cardActiveGlow: string
    textPrimary: string
    textSecondary: string
    accent: string
  }
}

// ── 인라인 SVG 아이콘 (pathLength="100" 필수) ──

const SearchIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <circle cx="11" cy="11" r="8" pathLength="100" />
    <path d="m21 21-4.35-4.35" pathLength="100" />
  </svg>
)

const HomeIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" pathLength="100" />
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" pathLength="100" />
  </svg>
)

const Building2Icon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <rect x="4" y="2" width="16" height="20" rx="2" pathLength="100" />
    <path d="M9 22v-4h6v4" pathLength="100" />
    <path d="M8 6h.01" pathLength="100" />
    <path d="M16 6h.01" pathLength="100" />
    <path d="M12 6h.01" pathLength="100" />
    <path d="M12 10h.01" pathLength="100" />
    <path d="M12 14h.01" pathLength="100" />
    <path d="M16 10h.01" pathLength="100" />
    <path d="M16 14h.01" pathLength="100" />
    <path d="M8 10h.01" pathLength="100" />
    <path d="M8 14h.01" pathLength="100" />
  </svg>
)

const UsersIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" pathLength="100" />
    <circle cx="9" cy="7" r="4" pathLength="100" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" pathLength="100" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" pathLength="100" />
  </svg>
)

const ROLES: {
  key: UserRole
  icon: React.ReactNode
  title: string
  desc: string
  badge?: string
}[] = [
  {
    key: 'tenant',
    icon: SearchIcon,
    title: '방 구하기',
    desc: '경북대 주변 방을 둘러보고\n선배 리뷰까지 한번에 확인해요',
  },
  {
    key: 'roommate',
    icon: UsersIcon,
    title: '룸메이트 구하기',
    desc: '생활 습관을 비교해서\n나와 맞는 룸메이트를 찾아요',
  },
  {
    key: 'owner',
    icon: HomeIcon,
    title: '방 내놓기',
    desc: '내 건물 빈방을 직접 올리고\n계약 현황을 관리해요',
    badge: '관리자 승인 필요',
  },
]

export default function StepRole({ selected, onSelect, tok }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ROLES.map((r) => (
        <OptionCard
          key={r.key}
          icon={r.icon}
          title={r.title}
          description={r.desc}
          badge={r.badge}
          selected={selected === r.key}
          onClick={() => onSelect(r.key)}
          tok={tok}
        />
      ))}
    </div>
  )
}
