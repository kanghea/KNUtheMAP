'use client'

export type Theme = 'dark' | 'light'

interface Props {
  selected: Theme
  onSelect: (theme: Theme) => void
}

const OPTIONS: {
  value:   Theme
  icon:    string
  label:   string
  sub:     string
  bg:      string
  ring:    string
  textPrimary: string
  textSub: string
  iconBg:  string
  checkBg: string
}[] = [
  {
    value:       'dark',
    icon:        '🌙',
    label:       '다크',
    sub:         '밤에도 눈이 편안한 화면',
    bg:          '#111111',
    ring:        '#818cf8',
    textPrimary: '#ffffff',
    textSub:     'rgba(255,255,255,0.42)',
    iconBg:      'rgba(255,255,255,0.09)',
    checkBg:     '#818cf8',
  },
  {
    value:       'light',
    icon:        '☀️',
    label:       '라이트',
    sub:         '선명하고 깔끔한 밝은 화면',
    bg:          '#f8fafc',
    ring:        '#2563eb',
    textPrimary: '#0f172a',
    textSub:     '#64748b',
    iconBg:      'rgba(0,0,0,0.05)',
    checkBg:     '#2563eb',
  },
]

export default function StepTheme({ selected, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {OPTIONS.map((opt) => {
        const isSelected = selected === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        18,
              padding:    '20px 20px',
              borderRadius: 20,
              border:     `2px solid ${isSelected ? opt.ring : 'transparent'}`,
              background: opt.bg,
              cursor:     'pointer',
              width:      '100%',
              textAlign:  'left',
              outline:    'none',
              // 선택 시 살짝 부풀어오르는 효과 + 글로우
              boxShadow:  isSelected
                ? `0 0 0 4px ${opt.ring}28, 0 8px 28px rgba(0,0,0,0.18)`
                : '0 2px 14px rgba(0,0,0,0.10)',
              transform:  isSelected ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, border-color .18s ease',
            }}
          >
            {/* 테마 아이콘 */}
            <div style={{
              width:       54,
              height:      54,
              borderRadius: 15,
              background:  opt.iconBg,
              display:     'flex',
              alignItems:  'center',
              justifyContent: 'center',
              fontSize:    28,
              flexShrink:  0,
              transition:  'background .3s',
            }}>
              {opt.icon}
            </div>

            {/* 텍스트 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize:    17,
                fontWeight:  800,
                margin:      0,
                color:       opt.textPrimary,
                letterSpacing: '-0.3px',
              }}>
                {opt.label}
              </p>
              <p style={{
                fontSize: 13,
                margin:   '4px 0 0',
                color:    opt.textSub,
                lineHeight: 1.4,
              }}>
                {opt.sub}
              </p>
            </div>

            {/* 선택 표시 */}
            <div style={{
              width:    24,
              height:   24,
              borderRadius: '50%',
              background:  isSelected ? opt.checkBg : 'rgba(128,128,128,0.18)',
              display:  'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background .25s ease, transform .25s cubic-bezier(.34,1.56,.64,1)',
              transform:  isSelected ? 'scale(1)' : 'scale(0.85)',
            }}>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ opacity: isSelected ? 1 : 0, transition: 'opacity .2s' }}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </button>
        )
      })}
    </div>
  )
}
