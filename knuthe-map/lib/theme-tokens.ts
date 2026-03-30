/**
 * 공통 테마 토큰 — 다크/라이트 모드 전역에서 재사용
 */

export type ThemeMode = 'dark' | 'light'

export interface ThemeTokens {
  pageBg:         string
  cardBg:         string
  cardBorder:     string
  textPrimary:    string
  textSecondary:  string
  textTertiary:   string
  headerBg:       string
  headerBorder:   string
  inputBg:        string
  inputBorder:    string
  inputColor:     string
  accentBg:       string
  accentColor:    string
  dangerBg:       string
  dangerColor:    string
  successBg:      string
  successColor:   string
  shadow:         string
  dialTrack:      string
  dialThumb:      string
  dialActiveBg:   string
}

export const THEME_TOKENS: Record<ThemeMode, ThemeTokens> = {
  dark: {
    pageBg:         '#0a0a0a',
    cardBg:         '#111111',
    cardBorder:     'rgba(255,255,255,0.07)',
    textPrimary:    '#ffffff',
    textSecondary:  'rgba(255,255,255,0.5)',
    textTertiary:   'rgba(255,255,255,0.25)',
    headerBg:       'rgba(10,10,10,0.92)',
    headerBorder:   'rgba(255,255,255,0.07)',
    inputBg:        '#1a1a1a',
    inputBorder:    'rgba(255,255,255,0.15)',
    inputColor:     '#ffffff',
    accentBg:       'rgba(37,99,235,0.15)',
    accentColor:    '#2563eb',
    dangerBg:       'rgba(239,68,68,0.15)',
    dangerColor:    '#f87171',
    successBg:      'rgba(34,197,94,0.15)',
    successColor:   '#4ade80',
    shadow:         '0 2px 12px rgba(0,0,0,0.4)',
    dialTrack:      'rgba(255,255,255,0.1)',
    dialThumb:      '#2563eb',
    dialActiveBg:   'rgba(37,99,235,0.12)',
  },
  light: {
    pageBg:         '#f8fafc',
    cardBg:         '#ffffff',
    cardBorder:     '#e2e8f0',
    textPrimary:    '#0f172a',
    textSecondary:  '#64748b',
    textTertiary:   '#94a3b8',
    headerBg:       'rgba(248,250,252,0.92)',
    headerBorder:   '#e2e8f0',
    inputBg:        '#ffffff',
    inputBorder:    '#e2e8f0',
    inputColor:     '#0f172a',
    accentBg:       'rgba(37,99,235,0.08)',
    accentColor:    '#2563eb',
    dangerBg:       'rgba(239,68,68,0.08)',
    dangerColor:    '#ef4444',
    successBg:      'rgba(34,197,94,0.08)',
    successColor:   '#16a34a',
    shadow:         '0 2px 12px rgba(0,0,0,0.06)',
    dialTrack:      '#e2e8f0',
    dialThumb:      '#2563eb',
    dialActiveBg:   'rgba(37,99,235,0.06)',
  },
}
