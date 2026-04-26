import type { CSSProperties } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface SkeletonProps {
  /** 기본 100% */
  width?:  number | string
  /** 기본 16 */
  height?: number | string
  /** 기본 6 */
  radius?: number
  /** 색상을 직접 지정. 미지정 시 `tok.cardBorder` 사용 */
  bg?: string
  /** 토큰 — 색상 자동 결정용 (`bg`가 우선) */
  tok?: ThemeTokens
  /** pulse 애니메이션 적용 (기본 false) */
  pulse?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * 단일 직사각형 스켈레톤 블록.
 * 큰 카드 윤곽은 `<SkeletonCard>` 사용.
 *
 * 주의: 키프레임은 `app/globals.css`의 `@keyframes knu-pulse`로 통합되어 있다.
 * 따로 `<style>`을 inline 하지 말 것.
 */
export function Skeleton({
  width  = '100%',
  height = 16,
  radius = 6,
  bg,
  tok,
  pulse = false,
  className,
  style,
}: SkeletonProps) {
  return (
    <div
      className={[pulse ? 'knu-pulse' : '', className].filter(Boolean).join(' ')}
      style={{
        width, height,
        borderRadius: radius,
        background: bg ?? tok?.cardBorder ?? 'rgba(0,0,0,0.08)',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

interface SkeletonCardProps {
  tok: ThemeTokens
  height?: number | string
  radius?: number
  pulse?: boolean
  style?: CSSProperties
}

/**
 * 큰 카드 모양 스켈레톤. 배경/테두리는 `Card`와 동일한 시각 언어.
 */
export function SkeletonCard({
  tok,
  height = 100,
  radius = 16,
  pulse = true,
  style,
}: SkeletonCardProps) {
  return (
    <div
      className={pulse ? 'knu-pulse' : undefined}
      style={{
        height,
        borderRadius: radius,
        background: tok.cardBg,
        border: `1px solid ${tok.cardBorder}`,
        ...style,
      }}
    />
  )
}
