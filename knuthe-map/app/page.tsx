import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parsePrefs } from '@/lib/prefs'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { unsealViewMode, VIEW_MODE_COOKIE_NAME } from '@/lib/view-mode-cookie'
import OnboardingClient from './_onboarding'
import LandingPage from './_landing'

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
    if (role === 'admin')    redirect('/admin')
    if (role === 'owner')    redirect('/owner')
    if (role === 'agent')    redirect('/agent')

    // role='roommate'이면 기본적으로 /roommate로 보내되,
    // 사용자가 viewMode='rooms'로 토글했다면 홈/랜딩에 머물도록 한다.
    if (role === 'roommate') {
      const jar     = await cookies()
      const sealed  = jar.get(VIEW_MODE_COOKIE_NAME)?.value
      const view    = sealed ? unsealViewMode(sealed) : null
      if (view !== 'rooms') redirect('/roommate')
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
