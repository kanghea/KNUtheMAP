// 테마 설정 — 다크/라이트 전환 전용 페이지.
//
// 페이지 전체를 클라이언트 컴포넌트로 위임한다. 이유: tok 을 React state 로
// 두면 setTheme(t) 한 번으로 surrounding (PageWrapper / Header / Card / 본문)
// 모두 한 프레임에 리렌더 → 원래 온보딩의 즉시성 회복.
//
// 서버 컴포넌트 출처는 초기 theme 1회만 받기 위해서 — hydration mismatch 방지
// 용도. 실제 그리기·토큰 계산은 모두 클라이언트.

import { getServerTheme } from '@/lib/theme-server'
import SettingsThemeClient from './_client'

export default async function SettingsThemePage() {
  const initialTheme = await getServerTheme()
  return <SettingsThemeClient initialTheme={initialTheme} />
}
