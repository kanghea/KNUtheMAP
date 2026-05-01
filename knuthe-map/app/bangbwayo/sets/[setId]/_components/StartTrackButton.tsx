'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import type { TimeOption, TimeOptionMeta } from '@/lib/bangbwayo-checklist'
import { tapHaptic } from '@/lib/hooks/useHaptic'

interface Props {
  tok:         ThemeTokens
  setId:       string
  timeOptions: readonly TimeOptionMeta[]
}

/**
 * "새 트랙 시작" — 시간 옵션을 인라인으로 노출.
 *
 * 기획서 §5.2: 같은 시간 옵션을 고른 사용자끼리는 항상 같은 항목을 본다.
 * MVP 는 5분 1개만 활성. 미래 확장 시 같은 컴포넌트가 그대로 동작.
 *
 * 흐름의 결: 가벼움 (§9.4). 옵션 한 번 탭 → 즉시 트랙 생성 → 카드 흐름으로 진입.
 */
export default function StartTrackButton({ tok, setId, timeOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pending, setPending] = useState<TimeOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStart = (option: TimeOption) => {
    tapHaptic()
    setError(null)
    setPending(option)
    startTransition(async () => {
      const res = await fetch(`/api/bangbwayo/sets/${setId}/tracks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ time_option: option }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? '트랙을 시작하지 못했어요')
        setPending(null)
        return
      }
      router.push(`/bangbwayo/sets/${setId}/tracks/${json.track.id}`)
    })
  }

  return (
    <div>
      <p style={{
        fontSize: 12, fontWeight: 700, color: tok.textTertiary,
        margin: '0 0 8px 4px', letterSpacing: '0.04em',
      }}>
        새 방 보러 갈게요
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {timeOptions.map((opt) => {
          const isLoading = isPending && pending === opt.value
          const disabled  = !opt.available || isPending
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => handleStart(opt.value)}
              className={opt.available ? 'knu-press' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 14,
                border: `1px solid ${tok.cardBorder}`,
                background: opt.available ? tok.cardBg : tok.inputBg,
                color: opt.available ? tok.textPrimary : tok.textTertiary,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled && !isLoading ? 0.6 : 1,
                fontSize: 14, fontWeight: 600,
                textAlign: 'left',
                transition: 'opacity .15s, transform .1s',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>{opt.label}</span>
                <span style={{ fontSize: 11, color: tok.textSecondary, fontWeight: 500 }}>
                  {opt.description}
                  {opt.available ? ` · ${opt.itemCount}항목` : ''}
                </span>
              </span>
              {isLoading && (
                <span style={{ fontSize: 11, color: tok.accentColor }}>시작하는 중…</span>
              )}
            </button>
          )
        })}
      </div>
      {error && (
        <p role="alert" style={{
          marginTop: 8, fontSize: 12, color: tok.dangerColor, textAlign: 'center',
        }}>{error}</p>
      )}
    </div>
  )
}
