'use client'

import OptionCard from './OptionCard'

export type Gender = 'male' | 'female'

interface Props {
  selected: Gender | null
  onSelect: (g: Gender) => void
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

// 인라인 SVG 아이콘 (StepRole 와 동일한 stroke 1.6 톤)

const MaleIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <circle cx="10" cy="14" r="6" pathLength="100" />
    <path d="M14 10 21 3" pathLength="100" />
    <path d="M21 8V3h-5" pathLength="100" />
  </svg>
)

const FemaleIcon = (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="none"
    strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}>
    <circle cx="12" cy="9" r="6" pathLength="100" />
    <path d="M12 15v7" pathLength="100" />
    <path d="M9 19h6" pathLength="100" />
  </svg>
)

const OPTIONS: { key: Gender; icon: React.ReactNode; title: string; desc: string }[] = [
  { key: 'male',   icon: MaleIcon,   title: '남성', desc: '룸메이트 매칭에서 동성 우선 표시에 활용해요' },
  { key: 'female', icon: FemaleIcon, title: '여성', desc: '룸메이트 매칭에서 동성 우선 표시에 활용해요' },
]

export default function StepGender({ selected, onSelect, tok }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {OPTIONS.map((o) => (
        <OptionCard
          key={o.key}
          icon={o.icon}
          title={o.title}
          description={o.desc}
          selected={selected === o.key}
          onClick={() => onSelect(o.key)}
          tok={tok}
        />
      ))}
    </div>
  )
}
