'use client'

// 테마 설정 — 클라이언트 단일 컴포넌트.
//
// React state 기반 tok 으로 surrounding(Card·Header·문구) 까지 한 프레임에
// 리렌더 → 클릭 즉시 모든 surface 가 동시에 변경된다 (원래 온보딩과 동일한
// 즉시성). router.refresh() 는 다음 진입에서 SSR/CSR 일관성 보장 위해
// 백그라운드에서만 호출.
//
// hydration: page.tsx 가 서버 쿠키로 결정한 initialTheme 를 prop 으로 넘긴다.
// 첫 SSR 결과와 클라이언트 초기 state 가 동일 → mismatch 없음.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadPrefs, savePrefs } from '@/lib/prefs'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import { PageWrapper }     from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card }            from '@/components/shared/Card'
import StepTheme, { type Theme } from '@/components/onboarding/StepTheme'

export default function SettingsThemeClient({ initialTheme }: { initialTheme: ThemeMode }) {
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const tok = THEME_TOKENS[theme]

  function handleSelect(t: Theme) {
    // 1) 즉시 React 리렌더 — Card / Header / 본문 텍스트 색이 한 프레임에 갱신
    setTheme(t)
    // 2) 쿠키 저장 — 학과·학번 등 다른 필드는 보존
    const cur = loadPrefs() ?? {
      grade: null, dept: null, zone: null, priorities: [], gate: null, theme: t,
      gender: null, mode: null,
    }
    savePrefs({ ...cur, theme: t })
    // 3) <html data-theme> — body 와 sticky 헤더가 사용하는 CSS 변수 즉시 flip
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = t
    }
    // 4) 백그라운드 — 다음 SSR 일관성. 시각 갱신은 위 1~3 으로 이미 끝남.
    router.refresh()
  }

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="테마 설정"
        subtitle="다크 · 라이트"
        backHref="/"
      />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
        <Card tok={tok} padding={20}>
          <p style={{
            fontSize: 13, color: tok.textTertiary,
            margin: '0 0 16px', lineHeight: 1.6,
          }}>
            언제든지 변경할 수 있어요. 선택하면 바로 반영됩니다.
          </p>
          <StepTheme selected={theme} onSelect={handleSelect} />
        </Card>
      </div>
    </PageWrapper>
  )
}
