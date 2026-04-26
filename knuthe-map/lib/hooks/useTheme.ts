'use client'

import { useState } from 'react'
import { loadPrefs } from '@/lib/prefs'
import { THEME_TOKENS, type ThemeMode, type ThemeTokens } from '@/lib/theme-tokens'

/**
 * 클라이언트에서 사용자 테마(다크/라이트) 토큰을 즉시 가져오는 훅.
 *
 * - lazy initializer를 사용해 첫 렌더부터 사용자 설정을 적용한다.
 * - `loadPrefs()`는 SSR 환경에서 `null`을 반환하므로 hydration mismatch 위험이 있다.
 *   서버 컴포넌트에서는 `getServerThemeTokens()` (lib/theme-server.ts)를 사용할 것.
 * - 테마 변경(예: 설정 페이지)을 실시간 반영해야 하면 `setTheme`로 업데이트.
 *   쿠키 저장은 별도로 `savePrefs()`를 호출해야 한다.
 */
export function useTheme(): { theme: ThemeMode; tok: ThemeTokens; setTheme: (m: ThemeMode) => void } {
  const [theme, setTheme] = useState<ThemeMode>(() => loadPrefs()?.theme ?? 'dark')
  return { theme, tok: THEME_TOKENS[theme], setTheme }
}
