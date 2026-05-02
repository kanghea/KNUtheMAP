// 방봐요 셸 — 모든 /bangbwayo/* 자식 라우트가 공유하는 PageWrapper + 헤더.
//
// 모드별 nav 는 하단 PrefsIsland 가 prefs.mode === 'bangbwayo' 분기로 표시
// (새로 시작 / 지난 투어 / 투어 지도 / 마이). 상단에는 별도의 SubNav 를 두지 않는다.
//
// 셋 상세(/bangbwayo/sets/[setId]) 와 트랙 입력은 자식 라우트라 layout 가
// 적용되지만, 그 화면들은 자체 DashboardHeader 를 별도 노출한다.

import type { ReactNode } from 'react'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'

export default async function BangbwayoLayout({ children }: { children: ReactNode }) {
  const { tok } = await getServerThemeTokens()
  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="방봐요"
        subtitle="방 보러 갈 때 함께 가는 도구"
        backHref="/"
      />
      {children}
    </PageWrapper>
  )
}
