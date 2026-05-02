import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface PageWrapperProps {
  /** 호출자 호환을 위해 받지만 배경색은 CSS 변수(`--background`)를 사용한다.
   *  테마 전환 시 서버 재렌더(`router.refresh()`) 가 끝나기 전에도 `<html data-theme>`
   *  변경만으로 배경이 즉시 바뀌도록. tok 자체는 다른 페이지 본문에서 그대로 활용. */
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
 *
 * 배경: CSS 변수 `--background` 를 사용한다. globals.css 가 `[data-theme="dark"]`
 * 에 따라 변수 값을 정의하므로 `<html data-theme>` 만 바뀌면 추가 리렌더 없이
 * 즉시 색이 전환된다 → 테마 토글의 시각 임팩트가 빠르다.
 * 토큰값(`tok.pageBg`)과 CSS 변수 값은 항상 동일해야 한다 — `lib/theme-tokens.ts`
 * 와 `app/globals.css` 의 라이트/다크 배경값이 서로 매칭되는지 변경 시 확인.
 */
export function PageWrapper({
  tok: _tok,
  paddingBottom = 100,
  fixed = false,
  style,
  children,
}: PageWrapperProps) {
  void _tok
  const base: CSSProperties = fixed
    ? {
        position: 'fixed', inset: 0, background: 'var(--background)',
        zIndex: 0, transition: 'background 180ms ease',
      }
    : {
        minHeight: '100vh', background: 'var(--background)', paddingBottom,
        transition: 'background 180ms ease',
      }

  return <div style={{ ...base, ...style }}>{children}</div>
}
