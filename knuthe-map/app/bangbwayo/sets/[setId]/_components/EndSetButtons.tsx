'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { tapHaptic, successHaptic } from '@/lib/hooks/useHaptic'

interface Props {
  tok:   ThemeTokens
  setId: string
}

/**
 * 셋 종료 갈림길 — 모든 트랙이 마무리됐을 때 노출.
 *
 * 기획서 §6.4:
 *   · "다음 방 볼래요"는 새 트랙 추가니 아래 `StartTrackButton` 으로 이미 처리됨.
 *   · 여기서는 셋 자체를 닫는 두 갈래만:
 *      - "잠시 멈춰요"     → status: ended (다시 열어 이어 가능)
 *      - "오늘 다 봤어요"  → status: results_generated → 결과물 페이지
 */
export default function EndSetButtons({ tok, setId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pending, setPending] = useState<'ended' | 'results_generated' | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handleEnd = (status: 'ended' | 'results_generated') => {
    if (status === 'results_generated') successHaptic()
    else                                  tapHaptic()
    setError(null); setPending(status)
    startTransition(async () => {
      const res = await fetch(`/api/bangbwayo/sets/${setId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? '저장하지 못했어요')
        setPending(null)
        return
      }
      if (status === 'results_generated') {
        router.push(`/bangbwayo/sets/${setId}/results`)
      } else {
        router.push('/bangbwayo')
      }
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          disabled={isPending}
          className="knu-press"
          onClick={() => handleEnd('ended')}
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: 14,
            border: `1px solid ${tok.cardBorder}`,
            background: tok.cardBg,
            color: tok.textPrimary,
            fontSize: 14, fontWeight: 600,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending && pending !== 'ended' ? 0.5 : 1,
          }}
        >
          {isPending && pending === 'ended' ? '저장 중…' : '잠시 멈춰요'}
        </button>
        <button
          type="button"
          disabled={isPending}
          className="knu-press"
          onClick={() => handleEnd('results_generated')}
          style={{
            flex: 1,
            padding: '13px 16px',
            borderRadius: 14,
            border: 'none',
            background: tok.accentColor,
            color: '#fff',
            fontSize: 14, fontWeight: 700,
            cursor: isPending ? 'default' : 'pointer',
            opacity: isPending && pending !== 'results_generated' ? 0.5 : 1,
          }}
        >
          {isPending && pending === 'results_generated' ? '만드는 중…' : '오늘 다 봤어요'}
        </button>
      </div>
      {error && (
        <p role="alert" style={{
          marginTop: 8, fontSize: 12, color: tok.dangerColor, textAlign: 'center',
        }}>{error}</p>
      )}
    </div>
  )
}
