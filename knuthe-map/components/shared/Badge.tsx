import type { CSSProperties } from 'react'

interface BadgeProps {
  label: string | number
  /** 글자색 */
  color: string
  /** 배경색 (보통 color의 8~15% 알파) */
  background: string
  /** 'sm' = 좁은 패딩(2/7), 'md' = 보통(4/10). 기본 'sm' */
  size?: 'sm' | 'md'
  style?: CSSProperties
}

/**
 * 둥근 알약 모양 라벨.
 * 계약유형(월세/전세/매매), 존(쪽문/북문), 상태(활성/대기) 등에 사용.
 */
export function Badge({ label, color, background, size = 'sm', style }: BadgeProps) {
  const padding = size === 'sm' ? '2px 7px' : '4px 10px'
  const fontSize = size === 'sm' ? 10 : 11
  return (
    <span style={{
      fontSize,
      padding,
      borderRadius: 999,
      background,
      color,
      fontWeight: 700,
      flexShrink: 0,
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {label}
    </span>
  )
}
