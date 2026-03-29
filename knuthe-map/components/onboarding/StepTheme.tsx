'use client'

interface Props {
  selected: 'light' | 'dark' | null
  onSelect: (theme: 'light' | 'dark') => void
}

const THEMES = [
  {
    key: 'dark' as const,
    icon: '🌙',
    title: '다크 모드',
    desc: '어두운 배경, 눈이 편안해요',
    preview: {
      bg: '#111111',
      card: '#1a1a1a',
      text: '#ffffff',
      sub: 'rgba(255,255,255,0.4)',
      accent: '#3b82f6',
      border: 'rgba(255,255,255,0.08)',
    },
    activeColor: '#3b82f6',
    activeBg: 'rgba(37,99,235,0.08)',
    activeBorder: '#2563eb',
  },
  {
    key: 'light' as const,
    icon: '☀️',
    title: '라이트 모드',
    desc: '밝은 배경, 낮에 보기 편해요',
    preview: {
      bg: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      sub: '#94a3b8',
      accent: '#2563eb',
      border: '#e2e8f0',
    },
    activeColor: '#0891b2',
    activeBg: '#ecfeff',
    activeBorder: '#0891b2',
  },
]

export default function StepTheme({ selected, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {THEMES.map((t) => {
        const active = selected === t.key
        const p = t.preview
        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 16, textAlign: 'left',
              border: active ? `2px solid ${t.activeBorder}` : '2px solid #e2e8f0',
              background: active ? t.activeBg : '#fff',
              cursor: 'pointer', width: '100%',
            }}
          >
            {/* 미리보기 */}
            <div style={{
              width: 54, height: 46, borderRadius: 10, flexShrink: 0,
              background: p.bg, border: `1.5px solid ${p.border}`,
              overflow: 'hidden', padding: '6px 7px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ height: 4, borderRadius: 2, background: p.accent, width: '60%' }} />
              <div style={{ height: 3, borderRadius: 2, background: p.sub, width: '80%' }} />
              <div style={{
                flex: 1, borderRadius: 4, background: p.card,
                border: `1px solid ${p.border}`,
                display: 'flex', alignItems: 'center', padding: '0 4px', gap: 3,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.accent, flexShrink: 0 }} />
                <div style={{ height: 2, borderRadius: 1, background: p.sub, flex: 1 }} />
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: active ? t.activeColor : '#0f172a' }}>
                  {t.title}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>{t.desc}</span>
            </div>

            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: active ? `2px solid ${t.activeColor}` : '2px solid #cbd5e1',
              background: active ? t.activeColor : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {active && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
