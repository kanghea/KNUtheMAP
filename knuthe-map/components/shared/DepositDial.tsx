'use client'

import { useRef, useCallback } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface Props {
  /** 현재 값 (만원 단위) */
  value: number
  /** 값 변경 콜백 */
  onChange: (v: number) => void
  /** 최소값 (만원) */
  min?: number
  /** 최대값 (만원) */
  max?: number
  /** 슬라이더 단계 (만원) */
  step?: number
  /** 라벨 */
  label: string
  /** 필수 여부 */
  required?: boolean
  /** 테마 토큰 */
  tok: ThemeTokens
}

/** 보증금/월세 다이얼 입력 — 슬라이더 + 현재 값 표시 */
export default function DepositDial({
  value, onChange, min = 0, max = 10000, step = 10, label, required, tok,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const pct = Math.min(100, ((value - min) / (max - min)) * 100)

  const formatValue = (v: number) => {
    if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억`
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}천만`
    return `${v}만`
  }

  const snap = useCallback((raw: number) => {
    const clamped = Math.max(min, Math.min(max, raw))
    return Math.round(clamped / step) * step
  }, [min, max, step])

  const handlePointerMove = useCallback((clientX: number) => {
    const track = trackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onChange(snap(min + ratio * (max - min)))
  }, [min, max, snap, onChange])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    handlePointerMove(e.clientX)
  }, [handlePointerMove])

  const handlePointerMoveEvent = useCallback((e: React.PointerEvent) => {
    if (e.buttons === 0) return
    handlePointerMove(e.clientX)
  }, [handlePointerMove])

  // 프리셋 버튼 배열
  const presets = getPresets(min, max)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: tok.textSecondary, margin: 0 }}>
          {label}{required && <span style={{ color: tok.dangerColor, marginLeft: 2 }}>*</span>}
        </p>
        <span style={{
          fontSize: 16, fontWeight: 800, color: tok.accentColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatValue(value)}
        </span>
      </div>

      {/* 슬라이더 트랙 */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveEvent}
        style={{
          position: 'relative', height: 36, cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        {/* 배경 트랙 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 6,
          borderRadius: 999, background: tok.dialTrack,
        }} />
        {/* 활성 트랙 */}
        <div style={{
          position: 'absolute', left: 0, height: 6,
          borderRadius: 999, background: tok.dialThumb,
          width: `${pct}%`, transition: 'width 0.05s',
        }} />
        {/* 썸 */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 10px)`,
          width: 20, height: 20, borderRadius: '50%',
          background: tok.dialThumb,
          boxShadow: `0 2px 8px rgba(37,99,235,0.4)`,
          transition: 'left 0.05s',
        }} />
      </div>

      {/* 범위 표시 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: tok.textTertiary }}>{formatValue(min)}</span>
        <span style={{ fontSize: 10, color: tok.textTertiary }}>{formatValue(max)}</span>
      </div>

      {/* 프리셋 버튼 */}
      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
        {presets.map((p) => {
          const active = value === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              style={{
                padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${active ? tok.accentColor : tok.inputBorder}`,
                background: active ? tok.dialActiveBg : 'transparent',
                color: active ? tok.accentColor : tok.textSecondary,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {formatValue(p)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** max에 따라 적절한 프리셋을 생성 */
function getPresets(min: number, max: number): number[] {
  if (max <= 200) {
    // 월세용
    return [10, 20, 30, 40, 50, 70, 100]
  }
  if (max <= 2000) {
    // 관리비/소규모 보증금
    return [100, 200, 300, 500, 1000]
  }
  // 보증금
  return [100, 300, 500, 1000, 2000, 3000, 5000]
}
