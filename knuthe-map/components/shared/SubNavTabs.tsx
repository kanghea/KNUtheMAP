'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

export interface SubNavTab {
  href:  string
  label: string
  /** 작은 leading 아이콘 (선택) */
  icon?: ReactNode
  /** href 와 정확히 일치하지 않더라도 prefix 면 활성으로 간주 (서브라우트 포함) */
  matchPrefix?: boolean
}

interface SubNavTabsProps {
  tok:    ThemeTokens
  tabs:   SubNavTab[]
  /** 현재 활성 탭 강조에 쓸 액센트 색. 미지정 시 tok.accentColor */
  accent?: string
}

/**
 * 페이지 내 서브 내비 탭바. DashboardHeader 바로 아래에 sticky 로 깔아 쓴다.
 * 한 페이지 안에서 N 개의 자식 라우트를 동급으로 전환할 때 사용 — 예) 방봐요의
 * "새로 시작 / 지난 투어 / 투어 지도 / 마이" 4탭.
 *
 * 활성 판정은 클라이언트 pathname 기준이라 'use client'. SSR 첫 페인트에는
 * 어떤 탭도 강조되지 않을 수 있으나 hydration 후 즉시 강조된다 (모바일 한정
 * 깜빡임은 미미).
 */
export function SubNavTabs({ tok, tabs, accent }: SubNavTabsProps) {
  const pathname = usePathname() ?? ''
  const accentColor = accent ?? tok.accentColor

  return (
    <nav
      aria-label="서브 내비"
      style={{
        position: 'sticky',
        top: 56,                  // DashboardHeader 의 sticky top 바로 아래
        zIndex: 9,
        // 테마 토글 즉각 반영을 위해 CSS 변수 사용 — globals.css 의
        // --header-bg/--header-border 가 [data-theme] 에 따라 자동 전환된다.
        background: 'var(--header-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--header-border)',
        transition: 'background 180ms ease, border-color 180ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
          padding: '8px 12px',
          scrollbarWidth: 'none',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {tabs.map((t) => {
          const active = t.matchPrefix
            ? pathname === t.href || pathname.startsWith(`${t.href}/`)
            : pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch={false}
              aria-current={active ? 'page' : undefined}
              style={{
                flex:        '0 0 auto',
                display:     'inline-flex',
                alignItems:  'center',
                gap:         6,
                padding:     '8px 14px',
                borderRadius: 999,
                fontSize:    13,
                fontWeight:  active ? 700 : 600,
                textDecoration: 'none',
                color:       active ? '#fff' : tok.textSecondary,
                background:  active ? accentColor : tok.inputBg,
                border:      `1px solid ${active ? accentColor : tok.inputBorder}`,
                whiteSpace:  'nowrap',
                transition:  'background .15s ease, color .15s ease',
              }}
            >
              {t.icon && <span aria-hidden style={{ display: 'inline-flex' }}>{t.icon}</span>}
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
