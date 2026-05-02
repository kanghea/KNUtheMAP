// 사용자 온보딩 설정 — 쿠키 저장/읽기

export type OnboardingMode = 'rooms' | 'bangbwayo' | 'roommate'

export interface UserPrefs {
  grade:      string | null   // e.g. '27학번'
  dept:       string | null   // e.g. '경영학부'
  zone:       string | null   // getZoneByDept 결과 e.g. '쪽문'
  priorities: string[]        // e.g. ['security','dist','size']
  gate:       string | null   // e.g. '쪽문'
  theme:      'dark' | 'light' // UI 테마
  /** 성별 — 공통 온보딩에서 받음. 룸메이트 매칭 동성 우선 정책에도 사용. */
  gender:     'male' | 'female' | null
  /** 온보딩에서 선택한 주 모드 — 진입 후 어디로 보낼지 결정. 메인 랜딩의 CTA
   *  자체는 모드와 무관하게 모두 노출. */
  mode:       OnboardingMode | null
}

// 우선순위 차원 메타데이터 (StepPriority와 공유)
export const FACTOR_META: Record<string, { label: string; icon: string; sub: string }> = {
  dist:     { icon: '🚶', label: '학교 거리',      sub: '출입문까지 도보' },
  age:      { icon: '✨', label: '건물 연식',      sub: '준공 후 경과 연수' },
  size:     { icon: '📐', label: '방 크기',        sub: '세대당 전용면적' },
  security: { icon: '🔒', label: '보안',           sub: '엘리베이터·관리' },
  nearby:   { icon: '🏪', label: '주변 편의시설',  sub: '300m 내 상점 수' },
}

// ── 쿠키 키 & 유효기간 ───────────────────────────────────────────
const KEY     = 'knu_prefs'
const MAX_AGE = 60 * 60 * 24 * 30   // 30일

// ── 직렬화 / 역직렬화 ────────────────────────────────────────────
export function encodePrefs(p: UserPrefs): string {
  return encodeURIComponent(JSON.stringify(p))
}

export function parsePrefs(raw: string): UserPrefs | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    // 이전 버전 쿠키 호환: 신규 필드(theme/gender/mode) 가 없으면 안전한 기본값.
    return { theme: 'light', gender: null, mode: null, ...parsed } as UserPrefs
  } catch {
    return null
  }
}

// ── 클라이언트 전용 ──────────────────────────────────────────────
export function savePrefs(p: UserPrefs): void {
  if (typeof document === 'undefined') return
  document.cookie = `${KEY}=${encodePrefs(p)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function loadPrefs(): UserPrefs | null {
  if (typeof document === 'undefined') return null
  const entry = document.cookie.split('; ').find((r) => r.startsWith(`${KEY}=`))
  if (!entry) return null
  return parsePrefs(entry.slice(KEY.length + 1))
}

export function clearPrefs(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${KEY}=; path=/; max-age=0`
}
