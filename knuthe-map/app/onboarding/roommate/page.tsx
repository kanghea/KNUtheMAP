// 룸메이트 전용 온보딩 라우트.
//
// 기존 `app/_onboarding.tsx` 의 7-섹션 체크리스트 + 5-비교 스와이프 단계를
// 그대로 재사용하지만, 학생 온보딩(테마/역할/학번/학과/우선순위/문)은 건너뛴다.
//
// 동작 시나리오:
//  1) 랜딩의 룸메이트 CTA(`/roommate` 링크) → 프로필 없으면 여기로 redirect
//  2) /me 의 모드 토글에서 "룸메이트" 누름 → 프로필 없으면 여기로 redirect
//  3) 직접 진입 → 동일하게 동작
//
// 이미 프로필이 있으면 곧장 `/roommate` 로 보내준다 (이중 등록 방지).

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { parsePrefs } from '@/lib/prefs'
import RoommateOnboardingClient from './_client'

export default async function RoommateOnboardingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // 이미 프로필이 있으면 매칭 페이지로 곧장
  if (user) {
    const { data: profile } = await supabase
      .from('roommate_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (profile) redirect('/roommate')
  }

  // SSR에서 테마 결정 — 학생 온보딩과 동일한 테마 토큰 적용
  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const theme    = prefsRaw ? (parsePrefs(prefsRaw)?.theme ?? 'dark') : 'dark'

  return <RoommateOnboardingClient initialTheme={theme} isLoggedIn={!!user} />
}
