'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import type { TimeOption, TimeOptionMeta } from '@/lib/bangbwayo-checklist'
import { tapHaptic } from '@/lib/hooks/useHaptic'
import { IconChevronRight } from '@/components/shared/icons'

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
        fontSize: 12, fontWeight: 700, color: tok.textSecondary,
        margin: '0 0 8px 4px', letterSpacing: '0.04em',
      }}>
        어떻게 둘러볼까요? · 시간을 골라 시작
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {timeOptions.map((opt) => {
          const isLoading = isPending && pending === opt.value
          const disabled  = !opt.available || isPending
          const isCta     = opt.available
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => handleStart(opt.value)}
              className={isCta ? 'knu-press' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: isCta ? '16px 18px' : '12px 18px',
                borderRadius: 14,
                border: isCta
                  ? `1px solid ${tok.accentColor}`
                  : `1px solid ${tok.cardBorder}`,
                background: isCta ? tok.accentColor : tok.inputBg,
                color: isCta ? '#ffffff' : tok.textTertiary,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled && !isLoading ? 0.55 : 1,
                fontSize: 14, fontWeight: 700,
                textAlign: 'left',
                boxShadow: isCta ? tok.shadow : 'none',
                transition: 'opacity .15s, transform .1s',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span>{opt.label}</span>
                <span style={{
                  fontSize: 11, fontWeight: 500,
                  color: isCta ? 'rgba(255,255,255,0.85)' : tok.textSecondary,
                }}>
                  {opt.description}
                  {opt.available ? ` · ${opt.itemCount}항목` : ''}
                </span>
              </span>
              {isLoading ? (
                <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 700, flexShrink: 0 }}>
                  시작하는 중…
                </span>
              ) : isCta ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 13, fontWeight: 700, color: '#ffffff', flexShrink: 0,
                }}>
                  <span>시작</span>
                  <IconChevronRight size={14} color="#ffffff" />
                </span>
              ) : null}
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
