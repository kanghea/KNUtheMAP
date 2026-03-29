'use client'

import { loadPrefs, savePrefs } from '@/lib/prefs'

export default function ThemeToggle({ currentTheme }: { currentTheme: 'light' | 'dark' }) {
  const isDark = currentTheme === 'dark'

  const toggle = () => {
    const prefs = loadPrefs()
    if (!prefs) return
    savePrefs({ ...prefs, theme: isDark ? 'light' : 'dark' })
    window.location.reload()
  }

  return (
    <button
      onClick={toggle}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{
        width: 34, height: 34, borderRadius: 10,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`,
        background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
        cursor: 'pointer', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
