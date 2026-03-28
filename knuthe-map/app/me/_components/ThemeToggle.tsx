'use client'

import { useTheme } from '@/lib/theme'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options: { value: 'system' | 'light' | 'dark'; label: string; icon: string }[] = [
    { value: 'system', label: '시스템 설정', icon: '💻' },
    { value: 'light',  label: '라이트',     icon: '☀️' },
    { value: 'dark',   label: '다크',       icon: '🌙' },
  ]

  return (
    <div style={{
      background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-xs)', padding: 20, marginBottom: 16,
    }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>
        화면 테마
      </h2>
      <div style={{ display: 'flex', gap: 8 }}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            style={{
              flex: 1,
              padding: '12px 8px',
              borderRadius: 12,
              border: theme === opt.value ? '2px solid var(--color-primary)' : '1px solid var(--border-secondary)',
              background: theme === opt.value ? 'var(--color-primary-bg)' : 'var(--bg-tertiary)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 20 }}>{opt.icon}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: theme === opt.value ? 'var(--color-primary-text)' : 'var(--text-secondary)',
            }}>
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
