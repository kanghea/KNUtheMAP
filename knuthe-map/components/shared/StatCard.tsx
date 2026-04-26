import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'

interface StatCardProps {
  /** 클릭 가능한 KPI 타일은 `href` 지정. 정보성 타일은 생략 */
  href?: string
  /** 이모지 또는 아이콘 컴포넌트 */
  icon: ReactNode
  /** 큰 글자 — 보통 숫자, 문자열도 허용 */
  value: number | string
  label: string
  /** 텍스트 색 (값/라벨 공통) */
  color: string
  /** 카드 배경색 (보통 color의 12~15% 알파) */
  background: string
  style?: CSSProperties
}

const BASE: CSSProperties = {
  borderRadius: 16,
  padding: '18px 16px',
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

/**
 * 대시보드 상단 KPI/통계 타일.
 * 2-col grid 안에 배치되는 것을 가정.
 *
 * 색 시스템: `color`는 텍스트, `background`는 카드 배경.
 * 보더는 `${color}40` (25% 알파)로 자동 계산.
 */
export function StatCard({
  href, icon, value, label, color, background, style,
}: StatCardProps) {
  const inner = (
    <>
      <span style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>
      <span style={{ fontSize: 26, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>{label}</span>
    </>
  )
  const css: CSSProperties = {
    ...BASE,
    background,
    border: `1px solid ${color}40`,
    ...style,
  }
  return href
    ? <Link href={href} style={css}>{inner}</Link>
    : <div  style={css}>{inner}</div>
}
