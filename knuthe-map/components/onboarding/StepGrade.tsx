'use client'

const GRADES = [
  { label: '27학번', sub: '2027년 입학' },
  { label: '26학번', sub: '2026년 입학' },
  { label: '25학번', sub: '2025년 입학' },
  { label: '24학번', sub: '2024년 입학' },
  { label: '23학번', sub: '2023년 입학' },
  { label: '22학번 이상', sub: '재학 · 휴학' },
  { label: '대학원생', sub: '석사 · 박사' },
]

interface Tok {
  textPrimary:     string
  textSecondary:   string
  cardBg:          string
  cardActiveBg:    string
  cardActiveBorder:string
  cardAccent:      string
}

interface Props {
  selected: string | null
  onSelect: (v: string) => void
  tok:      Tok
}

export default function StepGrade({ selected, onSelect, tok }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
      {GRADES.map(({ label, sub }) => {
        const active = selected === label
        return (
          <button
            key={label}
            onClick={() => onSelect(label)}
            style={{
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'flex-start',
              padding:       '14px 16px',
              borderRadius:  16,
              border:        active
                ? `1.5px solid ${tok.cardActiveBorder}`
                : '1.5px solid transparent',
              background:    active ? tok.cardActiveBg : tok.cardBg,
              cursor:        'pointer',
              textAlign:     'left',
              position:      'relative',
              transition:    'background .2s ease, border-color .2s ease',
            }}
          >
            {/* 체크 배지 */}
            <span style={{
              position:        'absolute',
              top:             10,
              right:           12,
              width:           20,
              height:          20,
              borderRadius:    '50%',
              background:      active ? tok.cardAccent : 'rgba(128,128,128,0.18)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              transition:      'background .2s ease',
              flexShrink:      0,
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M2.5 5l2 2 3-3.5"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={active ? 1 : 0.35}
                />
              </svg>
            </span>

            <span style={{
              fontSize:    14,
              fontWeight:  700,
              color:       active ? tok.cardAccent : tok.textPrimary,
              marginRight: 24,
              transition:  'color .2s ease',
            }}>
              {label}
            </span>
            <span style={{
              fontSize:   12,
              color:      tok.textSecondary,
              marginTop:  3,
              transition: 'color .2s ease',
            }}>
              {sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}
