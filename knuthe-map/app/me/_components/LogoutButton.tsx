'use client'

import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

export default function LogoutButton({ theme = 'light' as ThemeMode }: { theme?: ThemeMode }) {
  const tok = THEME_TOKENS[theme]
  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: tok.textTertiary, fontWeight: 500, padding: '8px',
          }}
        >
          로그아웃
        </button>
      </form>
    </div>
  )
}
