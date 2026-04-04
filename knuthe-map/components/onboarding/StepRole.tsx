'use client'

import OptionCard from './OptionCard'

export type UserRole = 'tenant' | 'owner' | 'agent'

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
    title: '방 구하기 (학생)',
    desc: '경북대 주변 매물을 찾고\n건물 정보·리뷰를 확인해요',
  },
  {
    key: 'owner',
    icon: HomeIcon,
    title: '방 내놓기',
    desc: '내 건물 호실을 직접 관리하고\n임대 계약을 등록해요',
    badge: '관리자 승인 필요',
  },
  {
    key: 'agent',
    icon: Building2Icon,
    title: '공인중개사',
    desc: '여러 건물 매물을 등록·관리하고\n통계와 계약을 한 곳에서 확인해요',
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
