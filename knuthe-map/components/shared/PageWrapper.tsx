import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface PageWrapperProps {
  tok: ThemeTokens
  /** 하단 sticky bar/네비를 위한 여백. 기본 100px */
  paddingBottom?: number
  /** 페이지 외곽을 100vh fixed로 깔아야 하는 경우 (지도/필터 풀스크린 등) */
  fixed?: boolean
  style?: CSSProperties
  children: ReactNode
}

/**
 * 모든 대시보드/일반 페이지의 외곽 셸.
 * `tok.pageBg`를 깔고 sticky 바를 위한 하단 여백을 둔다.
 */
export function PageWrapper({
  tok,
  paddingBottom = 100,
  fixed = false,
  style,
  children,
}: PageWrapperProps) {
  const base: CSSProperties = fixed
    ? { position: 'fixed', inset: 0, background: tok.pageBg, zIndex: 0 }
    : { minHeight: '100vh', background: tok.pageBg, paddingBottom }

  return <div style={{ ...base, ...style }}>{children}</div>
}
