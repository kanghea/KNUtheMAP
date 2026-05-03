'use client'

// 마이페이지 — 보기 모드 토글 (방보기 / 방봐요 / 룸메이트).
//
// 분기:
//   · 방보기   → viewMode='rooms', prefs.mode='rooms', router.refresh
//   · 룸메이트 → viewMode='roommate', prefs.mode='roommate', router.refresh
//                (프로필 없으면 /onboarding/roommate 로 이동)
//   · 방봐요   → prefs.mode='bangbwayo', /bangbwayo 로 이동
//
// 활성 버튼 우선순위: prefs.mode='bangbwayo' > viewMode='roommate' > 방보기
// 즉 방봐요 mode 가 가장 권위적 (PR #69 의 PrefsIsland nav 분기와 일치).
//
// viewMode 쿠키와 prefs.mode 의 의미:
//   · viewMode 쿠키 (HttpOnly) — 룸메이트 nav 분기에 사용 (PrefsIsland role+viewMode AND)
//   · prefs.mode (일반 쿠키)   — 방봐요 nav 분기 + 사용자 주 모드 의도
//   둘 다 갱신해 화면 일관성 유지.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import { loadPrefs, savePrefs, type OnboardingMode } from '@/lib/prefs'

type Mode = 'rooms' | 'bangbwayo' | 'roommate'

interface Props {
  /** SSR 시점 viewMode 쿠키 값 — 룸메이트 토글 초기 표시에 사용 */
  initialViewMode: 'rooms' | 'roommate'
  /** SSR 시점 prefs.mode — 방봐요 토글 초기 표시에 사용 */
  initialMode: OnboardingMode | null
  theme: ThemeMode
  /** 룸메이트 프로필 행이 있는지 — 없는데 룸메이트로 바꾸려 하면 온보딩으로 안내 */
  hasRoommateProfile: boolean
}

export default function ModeToggle({ initialViewMode, initialMode, theme, hasRoommateProfile }: Props) {
  const tok = THEME_TOKENS[theme]
  const router = useRouter()

  const initialActive: Mode =
    initialMode === 'bangbwayo' ? 'bangbwayo' :
    initialViewMode === 'roommate' ? 'roommate' : 'rooms'

  const [active, setActive] = useState<Mode>(initialActive)
  const [, startTransition] = useTransition()
  const [error, setError]   = useState<string | null>(null)

  const switchTo = (mode: Mode) => {
    if (mode === active) return

    // 룸메이트 모드 진입 시 프로필 없으면 룸메이트 전용 온보딩으로
    if (mode === 'roommate' && !hasRoommateProfile) {
      router.push('/onboarding/roommate')
      return
    }

    const previous = active
    setError(null)
    setActive(mode) // 낙관적 즉시 반영

    // prefs 쿠키의 mode 갱신 — PrefsIsland 가 즉시 새 nav 로 전환할 수 있도록.
    const cur = loadPrefs() ?? {
      grade: null, dept: null, zone: null, priorities: [], gate: null,
      theme: theme, gender: null, mode: null,
    }
    const prefsMode: OnboardingMode = mode  // type narrowing for prefs
    savePrefs({ ...cur, mode: prefsMode })

    // PrefsIsland 에 즉시 반영 신호 — router.refresh() 의 SSR 왕복 대기 없이
    // 하단 다이나믹 아일랜드가 새 nav 구성으로 바로 전환된다.
    if (typeof window !== 'undefined') {
      const nextViewMode: 'rooms' | 'roommate' = mode === 'roommate' ? 'roommate' : 'rooms'
      window.dispatchEvent(new CustomEvent('knu:nav-change', {
        detail: { mode: prefsMode, viewMode: nextViewMode },
      }))
    }

    if (mode === 'bangbwayo') {
      // 방봐요 모드는 자체 진입 페이지로 이동. role 갱신은 /bangbwayo 가
      // EnsureAnonymousSession (익명) 또는 OAuth callback (정식 로그인)
      // 통해 처리 — 정식 사용자가 처음 토글 시에는 role 미갱신이지만
      // PrefsIsland 가 mode 폴백으로 nav 정확하게 노출 (PR #71).
      router.push('/bangbwayo')
      return
    }

    // 방보기 / 룸메이트는 viewMode 쿠키 갱신 후 SSR 트리 재요청.
    void (async () => {
      try {
        const res = await fetch('/api/me/view-mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setActive(previous)
          // prefs.mode 도 롤백
          savePrefs({ ...cur })
          setError(json.error ?? '모드 전환에 실패했어요')
          return
        }
        startTransition(() => { router.refresh() })
      } catch {
        setActive(previous)
        savePrefs({ ...cur })
        setError('네트워크 오류가 발생했어요')
      }
    })()
  }

  const segStyle = (selected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '11px 8px',
    borderRadius: 10,
    border: 'none',
    cursor: selected ? 'default' : 'pointer',
    fontSize: 12,
    fontWeight: 700,
    background: selected ? tok.accentColor : 'transparent',
    color:      selected ? '#fff'           : tok.textSecondary,
    transition: 'background .15s, color .15s',
    whiteSpace: 'nowrap',
  })

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 6px' }}>
        보기 모드
      </h2>
      <p style={{ fontSize: 12, color: tok.textTertiary, margin: '0 0 14px', lineHeight: 1.5 }}>
        방보기·방봐요·룸메이트 화면을 자유롭게 바꿀 수 있어요.
      </p>

      <div style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: tok.inputBg,
        border: `1px solid ${tok.inputBorder}`,
      }}>
        <button
          type="button"
          onClick={() => switchTo('rooms')}
          style={segStyle(active === 'rooms')}
          aria-pressed={active === 'rooms'}
        >
          방보기
        </button>
        <button
          type="button"
          onClick={() => switchTo('bangbwayo')}
          style={segStyle(active === 'bangbwayo')}
          aria-pressed={active === 'bangbwayo'}
        >
          방봐요
        </button>
        <button
          type="button"
          onClick={() => switchTo('roommate')}
          style={segStyle(active === 'roommate')}
          aria-pressed={active === 'roommate'}
        >
          룸메이트{!hasRoommateProfile && active !== 'roommate' ? ' (등록 필요)' : ''}
        </button>
      </div>

      {error && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: tok.dangerColor }}>{error}</p>
      )}
    </div>
  )
}
