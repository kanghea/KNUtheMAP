'use client'

import { useState } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface Props {
  /** 면적 (m2) */
  areaM2: number | null
  /** 테마 토큰 */
  tok: ThemeTokens
  /** 기본 단위 — default: 'pyeong' */
  defaultUnit?: 'pyeong' | 'm2'
  /** 글자 크기 (px) — default: 12 */
  fontSize?: number
}

const M2_TO_PYEONG = 1 / 3.306

/** m2 표시를 클릭하면 평으로, 평을 클릭하면 m2로 토글 */
export default function AreaToggle({ areaM2, tok, defaultUnit = 'pyeong', fontSize = 12 }: Props) {
  const [unit, setUnit] = useState<'pyeong' | 'm2'>(defaultUnit)

  if (!areaM2) return null

  const pyeong = Math.round(areaM2 * M2_TO_PYEONG * 10) / 10
  const display = unit === 'pyeong'
    ? `${pyeong}평`
    : `${areaM2}m\u00B2`

  return (
    <button
      type="button"
      onClick={() => setUnit((u) => u === 'pyeong' ? 'm2' : 'pyeong')}
      title="클릭하면 단위 전환"
      style={{
        background: tok.dialActiveBg,
        border: `1px solid ${tok.inputBorder}`,
        borderRadius: 6, padding: '2px 8px',
        fontSize, fontWeight: 600,
        color: tok.accentColor,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      {display}
    </button>
  )
}

/** 면적 표시 헬퍼 (정적, 토글 없이) */
export function formatAreaPyeong(m2: number | null): string {
  if (!m2) return ''
  const pyeong = Math.round(m2 / 3.306 * 10) / 10
  return `${pyeong}평`
}

export function formatAreaM2(m2: number | null): string {
  if (!m2) return ''
  return `${m2}m\u00B2`
}
