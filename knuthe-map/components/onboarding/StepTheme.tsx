'use client'

export type Theme = 'dark' | 'light'

interface Props {
  selected: Theme
  onSelect: (theme: Theme) => void
}

// 미니 테마 프리뷰 — 앱 UI를 축소해서 보여주는 SVG 구성물
function ThemePreview({ theme }: { theme: Theme }) {
  const isDark = theme === 'dark'
  const bg       = isDark ? '#0a0a0a' : '#f8fafc'
  const surface  = isDark ? '#1a1a1a' : '#ffffff'
  const bar      = isDark ? '#141414' : '#f1f5f9'
  const line1    = isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'
  const line2    = isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9'
  const text1    = isDark ? 'rgba(255,255,255,0.85)' : '#1e293b'
  const text2    = isDark ? 'rgba(255,255,255,0.35)' : '#94a3b8'
  const accent   = isDark ? '#818cf8' : '#2563eb'
  const mapBg    = isDark ? '#111827' : '#dbeafe'
  const pin      = isDark ? '#818cf8' : '#2563eb'

  return (
    <div style={{
      width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
      background: bg, flexShrink: 0, position: 'relative',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
    }}>
      {/* 상단 헤더 바 */}
      <div style={{ height: 12, background: bar, display: 'flex', alignItems: 'center', padding: '0 5px', gap: 3 }}>
        <div style={{ width: 3, height: 3, borderRadius: '50%', background: accent }} />
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: text2, opacity: 0.5 }} />
      </div>
      {/* 지도 영역 */}
      <div style={{ height: 28, background: mapBg, position: 'relative', overflow: 'hidden' }}>
        {/* 도로 느낌 선들 */}
        <div style={{ position: 'absolute', top: 8, left: 0, right: 0, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)' }} />
        <div style={{ position: 'absolute', top: 18, left: 10, right: 0, height: 1, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 20, width: 1, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)' }} />
        {/* 핀 */}
        <div style={{
          position: 'absolute', top: 5, left: 30,
          width: 6, height: 6, borderRadius: '50%',
          background: pin, boxShadow: `0 0 4px ${pin}80`,
        }} />
      </div>
      {/* 카드 리스트 영역 */}
      <div style={{ padding: '4px 5px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[line1, line2].map((bg, i) => (
          <div key={i} style={{
            height: 5, borderRadius: 3,
            background: surface,
            border: `1px solid ${bg}`,
            display: 'flex', alignItems: 'center', padding: '0 3px', gap: 2,
          }}>
            <div style={{ width: 5, height: 3, borderRadius: 1, background: i === 0 ? accent : text2, opacity: i === 0 ? 0.8 : 0.4 }} />
            <div style={{ flex: 1, height: 2, borderRadius: 1, background: text1, opacity: 0.25 }} />
          </div>
        ))}
      </div>
      {/* 하단 바 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: bar, borderTop: `1px solid ${line2}` }} />
    </div>
  )
}

const OPTIONS: {
  value:       Theme
  label:       string
  sub:         string
  bg:          string
  ring:        string
  textPrimary: string
  textSub:     string
  checkBg:     string
}[] = [
  {
    value:       'dark',
    label:       '다크',
    sub:         '밤에도 눈이 편안한 화면',
    bg:          '#111111',
    ring:        '#818cf8',
    textPrimary: '#ffffff',
    textSub:     'rgba(255,255,255,0.42)',
    checkBg:     '#818cf8',
  },
  {
    value:       'light',
    label:       '라이트',
    sub:         '선명하고 깔끔한 밝은 화면',
    bg:          '#f8fafc',
    ring:        '#2563eb',
    textPrimary: '#0f172a',
    textSub:     '#64748b',
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
              padding:    '18px 18px',
              borderRadius: 20,
              border:     `2px solid ${isSelected ? opt.ring : 'transparent'}`,
              background: opt.bg,
              cursor:     'pointer',
              width:      '100%',
              textAlign:  'left',
              outline:    'none',
              boxShadow:  isSelected
                ? `0 0 0 4px ${opt.ring}28, 0 8px 28px rgba(0,0,0,0.18)`
                : '0 2px 14px rgba(0,0,0,0.10)',
              transform:  isSelected ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s ease, border-color .18s ease',
            }}
          >
            {/* 미니 프리뷰 */}
            <ThemePreview theme={opt.value} />

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
