'use client'

import OptionCard from './OptionCard'

/**
 * 온보딩에서 선택하는 "주 모드".
 * - rooms     : 방보기 — 매물 추천·지도
 * - bangbwayo : 방봐요 — 방 보러 갈 때 함께 가는 도구 (체크리스트·사진·비교)
 * - roommate  : 룸메이트 — 생활 습관 매칭
 *
 * 방 내놓기·공인중개사 신청은 일반 사용자 흐름에서 분리(숨김). 별도 페이지로
 * 진입할 때 권한 신청을 진행한다.
 *
 * `prefs.mode` 와 1:1 매핑된다 — `lib/prefs.ts` 의 OnboardingMode 와 같은 값.
 */
export type UserRole = 'rooms' | 'bangbwayo' | 'roommate'

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

const ClipboardIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <rect x="8" y="2" width="8" height="4" rx="1" pathLength="100" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" pathLength="100" />
    <path d="M9 12h6" pathLength="100" />
    <path d="M9 16h6" pathLength="100" />
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
}[] = [
  {
    key: 'rooms',
    icon: SearchIcon,
    title: '방 보기',
    desc: '경북대 주변 매물을\n지도와 선배 리뷰로 둘러봐요',
  },
  {
    key: 'bangbwayo',
    icon: ClipboardIcon,
    title: '방봐요',
    desc: '방 보러 갈 때\n체크리스트·사진으로 함께 가요',
  },
  {
    key: 'roommate',
    icon: UsersIcon,
    title: '룸메이트 구하기',
    desc: '생활 습관을 비교해서\n나와 맞는 룸메이트를 찾아요',
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
          selected={selected === r.key}
          onClick={() => onSelect(r.key)}
          tok={tok}
        />
      ))}
    </div>
  )
}
