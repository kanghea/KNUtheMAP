/**
 * 탭 햅틱 — 짧은 진동으로 "버튼이 눌렸다"는 즉각적 피드백.
 *
 * `navigator.vibrate` 미지원 환경(iOS Safari 등)은 자동으로 noop.
 * `prefers-reduced-motion: reduce` 사용자에 대해서도 자동 비활성.
 *
 * `PrefsIsland.tsx` 에 인라인으로 있던 동일 로직을 공용 모듈로 추출.
 */

const isReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * 짧은 탭 진동. 인자 없이 `tapHaptic()` 만 호출하면 8ms.
 *
 * @param ms 진동 시간(밀리초). 기본 8 — 라이트한 탭 피드백.
 */
export function tapHaptic(ms = 8): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (isReducedMotion()) return
  try { navigator.vibrate(ms) } catch { /* noop */ }
}

/** 성공·완료 시 약간 더 명확한 피드백 (두 번 진동). */
export function successHaptic(): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  if (isReducedMotion()) return
  try { navigator.vibrate([10, 30, 10]) } catch { /* noop */ }
}
