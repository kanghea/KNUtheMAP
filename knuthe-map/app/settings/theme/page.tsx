// 테마 설정 — 다크/라이트 전환 전용 페이지.
//
// 온보딩에서 분리된 후의 단일 진입점. 헤더 우측 "설정" 링크와 마이페이지의
// "테마 설정" 메뉴가 모두 이 페이지로 들어온다. StepTheme 컴포넌트를 그대로
// 재사용하고, 선택 즉시 prefs 쿠키에 저장 + <html data-theme> 갱신 + 서버 재렌더.

import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { Card }                 from '@/components/shared/Card'
import ThemeSettingsClient      from './_client'

export default async function SettingsThemePage() {
  const { theme, tok } = await getServerThemeTokens()
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
          <ThemeSettingsClient initialTheme={theme} />
        </Card>
      </div>
    </PageWrapper>
  )
}
