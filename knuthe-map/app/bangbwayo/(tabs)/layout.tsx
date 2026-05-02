// 방봐요 셸 — 4탭 SubNav 와 헤더를 모든 /bangbwayo/* 자식 라우트에서 공유.
//
// 4탭: 새로 시작 / 지난 투어 / 투어 지도 / 마이페이지
//
// "마이페이지" 는 /bangbwayo 외부의 글로벌 /me 로 점프한다 — 사용자가 방봐요
// 셸을 떠나는 의미. 외부 라우트로 가더라도 탭바 자체는 같은 컴포넌트라 시각
// 일관성이 유지된다 (이 layout 가 적용되지 않는 /me 에서는 탭바가 사라짐).
//
// 셋 상세(/bangbwayo/sets/[setId]) 와 트랙 입력은 자식 라우트라 layout 가
// 적용되지만, 그 화면들은 자체 DashboardHeader 를 별도 노출하므로 탭바는
// 서브 라우트에서도 그대로 보인다.

import type { ReactNode } from 'react'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { SubNavTabs }           from '@/components/shared/SubNavTabs'

const TABS = [
  { href: '/bangbwayo',         label: '새로 시작' },
  { href: '/bangbwayo/history', label: '지난 투어', matchPrefix: true },
  { href: '/bangbwayo/map',     label: '투어 지도' },
  { href: '/me',                label: '마이' },
]

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
      <SubNavTabs tok={tok} tabs={TABS} />
      {children}
    </PageWrapper>
  )
}
