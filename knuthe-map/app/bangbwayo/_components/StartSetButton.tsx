'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { tapHaptic } from '@/lib/hooks/useHaptic'

interface Props { tok: ThemeTokens }

/**
 * "새 셋 시작" 버튼.
 * 활성 셋이 없는 사용자에게만 노출되어, POST /api/bangbwayo/sets 로 새 셋을
 * 만들고 곧바로 셋 페이지로 이동.
 *
 * 흐름의 결: 가벼움 (기획서 §9.4). 추가 확인 모달 없음, 즉시 이동.
 */
export default function StartSetButton({ tok }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleStart = () => {
    tapHaptic()
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/bangbwayo/sets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({}),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        // 409 (이미 active 셋 있음) — 그쪽으로 이동시켜 사용자가 잃는 게 없게.
        if (res.status === 409 && json.setId) {
          router.push(`/bangbwayo/sets/${json.setId}`)
          return
        }
        setError(json.error ?? '셋을 시작하지 못했어요')
        return
      }
      router.push(`/bangbwayo/sets/${json.set.id}`)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleStart}
        disabled={isPending}
        className="knu-press"
        style={{
          width: '100%',
          padding: '16px 20px',
          borderRadius: 16,
          border: 'none',
          background: tok.accentColor,
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          boxShadow: tok.shadow,
          transition: 'opacity .15s, transform .1s',
        }}
      >
        {isPending ? '시작하는 중…' : '오늘 새 셋 시작하기'}
      </button>
      {error && (
        <p role="alert" style={{
          marginTop: 8,
          fontSize: 12,
          color: tok.dangerColor,
          textAlign: 'center',
        }}>
          {error}
        </p>
      )}
    </>
  )
}
