import { cookies } from 'next/headers'
import { parsePrefs } from '@/lib/prefs'
import OnboardingClient from './_onboarding'
import LandingPage from './_landing'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const sp = await searchParams

  // ?reset=1 이면 온보딩 강제
  if (sp.reset) return <OnboardingClient />

  // 쿠키 있으면 랜딩 페이지, 없으면 온보딩
  const jar   = await cookies()
  const raw   = jar.get('knu_prefs')?.value
  const prefs = raw ? parsePrefs(raw) : null

  if (prefs) return <LandingPage prefs={prefs} />

  return <OnboardingClient />
}
