import { cookies } from 'next/headers'
import { parsePrefs } from './prefs'
import { THEME_TOKENS, type ThemeMode, type ThemeTokens } from './theme-tokens'

export async function getServerTheme(): Promise<ThemeMode> {
  try {
    const jar = await cookies()
    const raw = jar.get('knu_prefs')?.value
    if (!raw) return 'dark'
    return parsePrefs(raw)?.theme ?? 'dark'
  } catch {
    return 'dark'
  }
}

export async function getServerThemeTokens(): Promise<{ theme: ThemeMode; tok: ThemeTokens }> {
  const theme = await getServerTheme()
  return { theme, tok: THEME_TOKENS[theme] }
}
