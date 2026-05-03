import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parsePrefs } from '@/lib/prefs'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { unsealViewMode, VIEW_MODE_COOKIE_NAME } from '@/lib/view-mode-cookie'
import OnboardingClient from './_onboarding'
import LandingPage from './_landing'
import RoommateLanding from './_roommate-landing'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const sp = await searchParams

  // cache()로 래핑된 헬퍼 사용 → layout.tsx와 getUser()/role 쿼리 1회 공유
  const user = await getServerUser()

  if (user && !sp.reset) {
    const role = await getServerRole()
    if (role === 'admin')     redirect('/admin')
    if (role === 'owner')     redirect('/owner')
    if (role === 'agent')     redirect('/agent')
    // 방봐요 role 사용자는 자기 모드 홈으로 — 룸메이트와 동일 패턴.
    // 다른 모드를 보려면 마이페이지의 ModeToggle 또는 메인 CTA 카드 사용.
    if (role === 'bangbwayo') redirect('/bangbwayo')

    // 룸메이트 모드 사용자는 룸메이트 전용 홈을 본다.
    //  - role==='roommate' AND viewMode!=='rooms' (기본값 포함) → 룸메이트 홈
    //  - role==='roommate' AND viewMode==='rooms' (방보기 토글) → 기존 방보기 랜딩
    //  - 그 외 (tenant 등) → 기존 방보기 랜딩
    if (role === 'roommate') {
      const jar    = await cookies()
      const sealed = jar.get(VIEW_MODE_COOKIE_NAME)?.value
      const view   = sealed ? unsealViewMode(sealed) : null
      if (view !== 'rooms') return <RoommateLanding userId={user.id} />
    }
  }

  // ?reset=1 이면 온보딩 강제
  if (sp.reset) return <OnboardingClient />

  // 쿠키 있으면 랜딩 페이지, 없으면 온보딩
  const jar   = await cookies()
  const raw   = jar.get('knu_prefs')?.value
  const prefs = raw ? parsePrefs(raw) : null

  if (prefs) return <LandingPage prefs={prefs} />

  return <OnboardingClient />
}
