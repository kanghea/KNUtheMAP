import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parsePrefs } from '@/lib/prefs'
import { createSupabaseServer } from '@/lib/supabase-server'
import OnboardingClient from './_onboarding'
import LandingPage from './_landing'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  const sp = await searchParams

  // 로그인된 경우 role 확인 → 대시보드 리다이렉트
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (user && !sp.reset) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    const role = profile?.role
    if (role === 'admin')  redirect('/admin')
    if (role === 'owner')  redirect('/owner')
    if (role === 'agent')  redirect('/agent')
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
