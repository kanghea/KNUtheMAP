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

const DEFAULT_TOK: Tok = {
  textPrimary:     '#ffffff',
  textSecondary:   'rgba(255,255,255,0.42)',
  cardBg:          'rgba(255,255,255,0.07)',
  cardActiveBg:    'rgba(129,140,248,0.16)',
  cardActiveBorder:'rgba(129,140,248,0.55)',
  cardAccent:      '#818cf8',
}

interface Props {
  selected: string | null
  onSelect: (v: string) => void
  tok?:     Tok
}

export default function StepGrade({ selected, onSelect, tok = DEFAULT_TOK }: Props) {
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
            <span style={{
              fontSize:    14,
              fontWeight:  700,
              color:       active ? tok.cardAccent : tok.textPrimary,
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
