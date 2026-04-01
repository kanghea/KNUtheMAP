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
  surface:       string
  border:        string
  textPrimary:   string
  textSecondary: string
  btnPrimary:    string
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
              border:        `1px solid ${active ? 'transparent' : tok.border}`,
              background:    active ? tok.btnPrimary : tok.surface,
              cursor:        'pointer',
              textAlign:     'left',
              position:      'relative',
              transition:    'background .25s ease, border-color .25s ease',
            }}
          >
            {active && (
              <span style={{
                position:       'absolute',
                top:            10,
                right:          12,
                width:          18,
                height:         18,
                borderRadius:   '50%',
                background:     'rgba(255,255,255,0.22)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5 3.5-4" stroke="white" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span style={{
              fontSize:   14,
              fontWeight: 700,
              color:      active ? '#ffffff' : tok.textPrimary,
              transition: 'color .25s ease',
            }}>
              {label}
            </span>
            <span style={{
              fontSize:   12,
              color:      active ? 'rgba(255,255,255,0.72)' : tok.textSecondary,
              marginTop:  2,
              transition: 'color .25s ease',
            }}>
              {sub}
            </span>
          </button>
        )
      })}
    </div>
  )
}
