'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

const ITEM_H  = 44       // 아이템 높이 (px)
const VISIBLE = 5        // 한 번에 보이는 아이템 수 (홀수)
const PAD     = Math.floor(VISIBLE / 2) * ITEM_H  // 위아래 패딩 = 88px

interface Props {
  tok:      ThemeTokens
  values:   number[]
  value:    number
  onChange: (v: number) => void
  format?:  (v: number) => string
}

function defaultFormat(v: number): string {
  if (v === 0)                          return '없음'
  if (v >= 10000 && v % 10000 === 0)   return `${v / 10000}억`
  if (v >= 1000  && v % 1000  === 0)   return `${v / 1000}천만`
  return `${v}만원`
}

function nearestIdx(values: number[], v: number): number {
  let best = 0
  let bestDiff = Infinity
  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - v)
    if (d < bestDiff) { bestDiff = d; best = i }
  }
  return best
}

export default function MoneyDrumPicker({ tok, values, value, onChange, format }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const touching  = useRef(false)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const idx = values.indexOf(value) >= 0 ? values.indexOf(value) : nearestIdx(values, value)
  const fmt = format ?? defaultFormat

  const scrollTo = useCallback((i: number, smooth: boolean) => {
    scrollRef.current?.scrollTo({
      top: i * ITEM_H,
      behavior: smooth ? 'smooth' : 'instant' as ScrollBehavior,
    })
  }, [])

  // 마운트 시 초기 위치로 즉시 이동
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { scrollTo(idx, false) }, [])

  // 외부에서 value 변경 시 동기화
  useEffect(() => {
    if (!touching.current) scrollTo(idx, true)
  }, [idx, scrollTo])

  const handleScroll = useCallback(() => {
    if (snapTimer.current) clearTimeout(snapTimer.current)
    snapTimer.current = setTimeout(() => {
      const el = scrollRef.current
      if (!el) return
      const i = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)))
      scrollTo(i, true)
      onChange(values[i])
      touching.current = false
    }, 80)
  }, [values, scrollTo, onChange])

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: tok.inputBg }}>

      {/* 선택 구역 하이라이트 */}
      <div style={{
        position: 'absolute', top: PAD, left: 0, right: 0, height: ITEM_H,
        background: tok.dialActiveBg,
        borderTop:    `1.5px solid ${tok.accentColor}`,
        borderBottom: `1.5px solid ${tok.accentColor}`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* 위쪽 페이드 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: PAD,
        background: `linear-gradient(to bottom, ${tok.inputBg} 40%, transparent)`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* 아래쪽 페이드 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: PAD,
        background: `linear-gradient(to top, ${tok.inputBg} 40%, transparent)`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* 드럼 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={() => { touching.current = true }}
        className="drum-picker"
        style={{
          height: ITEM_H * VISIBLE,
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          WebkitOverflowScrolling: 'touch',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any}
      >
        <div style={{ height: PAD, flexShrink: 0 }} />
        {values.map((v, i) => (
          <div
            key={v}
            onClick={() => { scrollTo(i, true); onChange(v) }}
            style={{
              height: ITEM_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15,
              fontWeight: i === idx ? 700 : 400,
              color: i === idx ? tok.textPrimary : tok.textTertiary,
              scrollSnapAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'color 0.15s, font-weight 0.15s',
            }}
          >
            {fmt(v)}
          </div>
        ))}
        <div style={{ height: PAD, flexShrink: 0 }} />
      </div>
    </div>
  )
}

// ── 금액 유형별 값 배열 ────────────────────────────────────────────

/** 보증금: 0~3000만원 10만원 단위 + 고액 구간 */
export const DEPOSIT_VALUES: number[] = [
  0,
  ...Array.from({ length: 300 }, (_, i) => (i + 1) * 10),  // 10~3000
  3500, 4000, 4500, 5000, 6000, 7000, 8000, 10000,
]

/** 월세: 0~100만원 1만원 단위 + 고액 구간 */
export const MONTHLY_VALUES: number[] = [
  0,
  ...Array.from({ length: 100 }, (_, i) => i + 1),          // 1~100
  110, 120, 130, 140, 150, 180, 200,
]

/** 관리비: 0~30만원 1만원 단위 */
export const MAINTENANCE_VALUES: number[] = Array.from({ length: 31 }, (_, i) => i)
