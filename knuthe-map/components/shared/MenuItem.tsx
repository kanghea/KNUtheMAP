import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { IconChevronRight } from './icons'

interface MenuItemProps {
  tok: ThemeTokens
  href: string
  /** 이모지 또는 아이콘 컴포넌트 */
  icon: ReactNode
  label: string
  description?: string
  /** 행 사이 구분선 — 마지막 행은 false. 기본 true */
  divider?: boolean
  /** 우측 슬롯을 chevron 대신 다른 것으로 교체 (예: 카운트 뱃지) */
  trailing?: ReactNode
  style?: CSSProperties
}

/**
 * Card 안에 들어가는 메뉴 행.
 * "아이콘 박스 + 제목/설명 + 화살표" 패턴을 통일한다.
 *
 * 사용 예:
 * <Card tok={tok} overflow="hidden" padding={0}>
 *   {menus.map((m, i) => (
 *     <MenuItem key={m.href} tok={tok} divider={i < menus.length-1} {...m} />
 *   ))}
 * </Card>
 */
export function MenuItem({
  tok, href, icon, label, description, divider = true, trailing, style,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 18px', textDecoration: 'none',
        borderBottom: divider ? `1px solid ${tok.cardBorder}` : 'none',
        ...style,
      }}
    >
      <span style={{
        width: 40, height: 40, borderRadius: 12, background: tok.inputBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: tok.textTertiary, marginTop: 1 }}>{description}</div>
        )}
      </div>
      {trailing ?? <IconChevronRight color={tok.textTertiary} />}
    </Link>
  )
}
