'use client'

import { useState, useCallback } from 'react'
import { SWIPE_PAIRS, type SwipeWeights } from '@/lib/roommate-constants'

interface Tok {
  bg: string; surface: string; textPrimary: string; textSecondary: string; textTertiary: string
  border: string; accent: string; cardBg: string; cardBorder: string
  cardActiveBg: string; cardActiveBorder: string; cardActiveGlow: string
  btnGradient: string; btnPrimaryText: string; btnShadow: string
}

interface Props {
  onComplete: (weights: SwipeWeights) => void
  tok: Tok
}

export default function RoommateSwipe({ onComplete, tok }: Props) {
  const [pairIdx, setPairIdx] = useState(0)
  const [selections, setSelections] = useState<string[]>([])
  const [selected, setSelected] = useState<'left' | 'right' | null>(null)
  const [animating, setAnimating] = useState(false)

  const pair = SWIPE_PAIRS[pairIdx]

  const handleSelect = useCallback((side: 'left' | 'right') => {
    if (animating) return
    setSelected(side)
    setAnimating(true)

    const key = side === 'left' ? pair.left.key : pair.right.key
    const next = [...selections, key]

    setTimeout(() => {
      setSelections(next)
      setSelected(null)
      setAnimating(false)

      if (pairIdx < SWIPE_PAIRS.length - 1) {
        setPairIdx(pairIdx + 1)
      } else {
        // 가중치 계산: 선택 횟수에 비례한 배율 (기본 1.0, 선택될 때마다 +0.3)
        const counts: Record<string, number> = {}
        for (const k of next) {
          counts[k] = (counts[k] ?? 0) + 1
        }
        const weights: SwipeWeights = {}
        for (const [k, c] of Object.entries(counts)) {
          weights[k] = 1.0 + c * 0.3
        }
        onComplete(weights)
      }
    }, 400)
  }, [animating, pair, pairIdx, selections, onComplete])

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{
        fontSize: 14, color: tok.textSecondary, marginBottom: 8,
        transition: 'color .4s ease',
      }}>
        {pairIdx + 1} / {SWIPE_PAIRS.length}
      </p>

      {/* 진행 도트 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
        {SWIPE_PAIRS.map((_, i) => (
          <div key={i} style={{
            width: i === pairIdx ? 20 : 8, height: 8, borderRadius: 999,
            background: i < pairIdx ? tok.accent : i === pairIdx ? tok.accent : tok.border,
            opacity: i < pairIdx ? 0.4 : 1,
            transition: 'all .3s ease',
          }} />
        ))}
      </div>

      <p style={{
        fontSize: 16, fontWeight: 700, color: tok.textPrimary, marginBottom: 24,
        transition: 'color .4s ease',
      }}>
        룸메이트를 고를 때 어느 쪽이 더 중요한가요?
      </p>

      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'stretch',
      }}>
        {/* 왼쪽 카드 */}
        <SwipeCard
          label={pair.left.label}
          selected={selected === 'left'}
          onClick={() => handleSelect('left')}
          tok={tok}
        />

        <div style={{
          display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 800,
          color: tok.textTertiary,
        }}>
          vs
        </div>

        {/* 오른쪽 카드 */}
        <SwipeCard
          label={pair.right.label}
          selected={selected === 'right'}
          onClick={() => handleSelect('right')}
          tok={tok}
        />
      </div>
    </div>
  )
}

function SwipeCard({ label, selected, onClick, tok }: {
  label: string; selected: boolean; onClick: () => void; tok: Tok
}) {
  return (
    <button onClick={onClick} style={{
      flex: 1, maxWidth: 180, minHeight: 140,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px', borderRadius: 20,
      border: `2px solid ${selected ? tok.accent : tok.cardBorder}`,
      background: selected ? tok.cardActiveBg : tok.cardBg,
      boxShadow: selected ? tok.cardActiveGlow : 'none',
      cursor: 'pointer',
      transform: selected ? 'scale(1.05)' : 'scale(1)',
      transition: 'all .25s ease',
    }}>
      <span style={{
        fontSize: 15, fontWeight: 700, lineHeight: 1.5,
        color: selected ? tok.accent : tok.textPrimary,
        whiteSpace: 'pre-line', textAlign: 'center',
        transition: 'color .2s ease',
      }}>
        {label}
      </span>
    </button>
  )
}
