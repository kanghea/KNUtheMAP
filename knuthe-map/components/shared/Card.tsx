import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface CardProps {
  tok: ThemeTokens
  /** 단일 값(`16`)이거나 CSS 단축 문자열(`'18px 20px'`) */
  padding?: number | string
  /** 기본 20 */
  radius?: number
  /** 그림자 적용 여부. 기본 true. 리스트 셸 등 평면 카드는 false */
  shadow?: boolean
  /** 메뉴 리스트 등 자식이 카드 모서리를 침범하면 사용 */
  overflow?: 'hidden' | 'visible'
  style?: CSSProperties
  /** 비어 있어도 됨 — 스켈레톤 등 빈 카드를 그릴 때 활용 */
  children?: ReactNode
}

/**
 * 대시보드 섹션 카드 셸. 배경/테두리/그림자만 책임진다.
 * 클릭 가능한 카드는 `<Card>` 안에 `<Link>`를 넣거나 `style.cursor`를 직접 지정.
 */
export function Card({
  tok,
  padding,
  radius = 20,
  shadow = true,
  overflow,
  style,
  children,
}: CardProps) {
  return (
    <div
      style={{
        background: tok.cardBg,
        borderRadius: radius,
        border: `1px solid ${tok.cardBorder}`,
        boxShadow: shadow ? tok.shadow : undefined,
        padding,
        overflow,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
