/**
 * 공용 아이콘 세트 — `currentColor` 기본 사용으로 부모 텍스트 색상을 상속.
 * 색상을 강제하려면 `color` prop으로 덮어쓴다.
 *
 * ⚠️ 이 파일은 헤더/메뉴/리스트/모달 등 광범위한 곳에서 import 된다.
 *    아이콘 추가는 자유롭게, 기존 시그니처 변경은 신중히.
 */

interface IconProps {
  size?:  number
  color?: string
}

const STROKE  = '2'
const STROKE_LINECAP = 'round' as const
const STROKE_LINEJOIN = 'round' as const

// ── 네비게이션 ────────────────────────────────────────────────

export function IconChevronLeft({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

export function IconChevronRight({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

export function IconClose({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M18 6L6 18"/>
      <path d="M6 6l12 12"/>
    </svg>
  )
}

// ── 사용자/계정 ───────────────────────────────────────────────

export function IconUser({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export function IconUsers({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

// ── 매물/건물 ─────────────────────────────────────────────────

export function IconHome({ size = 28, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    </svg>
  )
}

export function IconHeart({ size = 14, color = 'currentColor', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? color : 'none'} stroke={color}
      strokeWidth={STROKE} strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

// ── 검색/탐색 ─────────────────────────────────────────────────

export function IconSearch({ size = 48, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.6" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

// ── 상태/피드백 ───────────────────────────────────────────────

export function IconAlert({ size = 26, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  )
}

// ── 액션 (편집/삭제) ─────────────────────────────────────────

export function IconPencil({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

export function IconTrash({ size = 14, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/>
      <path d="M14 11v6"/>
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

// ── 입력/전송 ─────────────────────────────────────────────────

export function IconArrowUp({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M12 19V5"/>
      <path d="M5 12l7-7 7 7"/>
    </svg>
  )
}

export function IconCamera({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3.5"/>
    </svg>
  )
}

export function IconImage({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="m21 15-5-5L5 21"/>
    </svg>
  )
}

export function IconMapPin({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

export function IconPhone({ size = 16, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

export function IconCheck({ size = 22, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <path d="M5 12l5 5L20 7"/>
    </svg>
  )
}

export function IconInbox({ size = 32, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.8" strokeLinecap={STROKE_LINECAP} strokeLinejoin={STROKE_LINEJOIN}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
    </svg>
  )
}

export function IconSpinner({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap={STROKE_LINECAP}
      style={{ animation: 'knu-spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
