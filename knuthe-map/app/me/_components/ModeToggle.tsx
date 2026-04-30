'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

type Mode = 'rooms' | 'roommate'

interface Props {
  /** SSR 시점 viewMode 쿠키 값 — 토글 초기 표시에만 사용 */
  initialViewMode: Mode
  theme: ThemeMode
  /** 룸메이트 프로필 행이 있는지 — 없는데 룸메이트로 바꾸려 하면 온보딩으로 안내 */
  hasRoommateProfile: boolean
}

export default function ModeToggle({ initialViewMode, theme, hasRoommateProfile }: Props) {
  const tok = THEME_TOKENS[theme]
  const router = useRouter()

  const [active, setActive] = useState<Mode>(initialViewMode)
  const [busy,   setBusy]   = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // 토글은 viewMode 쿠키만 갱신한다. DB의 users.role 은 건드리지 않는다.
  // - role 은 룸메이트 프로필 최초 생성 시점(/api/roommate POST)에 1회만 'roommate'로 세팅되며,
  //   이후 사용자 토글로는 절대 바뀌지 않는다(RLS는 그 1회 세팅으로 충분).
  // - 사용자가 보는 화면(nav/redirect)은 viewMode 쿠키만으로 결정된다.
  const switchTo = async (mode: Mode) => {
    if (mode === active || busy) return
    setError(null)

    // 룸메이트 모드 진입 시 프로필 없으면 룸메이트 전용 온보딩으로
    if (mode === 'roommate' && !hasRoommateProfile) {
      router.push('/onboarding/roommate')
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/me/view-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? '모드 전환에 실패했어요')
        return
      }
      setActive(mode)
      // viewMode 쿠키가 갱신됐으니 SSR 트리를 다시 받아온다 (PrefsIsland nav 갱신)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const segStyle = (selected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '11px 12px',
    borderRadius: 10,
    border: 'none',
    cursor: busy ? 'wait' : (selected ? 'default' : 'pointer'),
    fontSize: 13,
    fontWeight: 700,
    background: selected ? tok.accentColor : 'transparent',
    color:      selected ? '#fff'           : tok.textSecondary,
    transition: 'background .15s, color .15s',
  })

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 6px' }}>
        보기 모드
      </h2>
      <p style={{ fontSize: 12, color: tok.textTertiary, margin: '0 0 14px', lineHeight: 1.5 }}>
        방을 구할 때와 룸메이트를 찾을 때 화면을 자유롭게 바꿀 수 있어요.
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
          disabled={busy}
          style={segStyle(active === 'rooms')}
          aria-pressed={active === 'rooms'}
        >
          방보기
        </button>
        <button
          type="button"
          onClick={() => switchTo('roommate')}
          disabled={busy}
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
