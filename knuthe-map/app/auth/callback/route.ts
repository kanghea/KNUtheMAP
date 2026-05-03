import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { parsePrefs } from '@/lib/prefs'
import { sealRole, ROLE_COOKIE_NAME, ROLE_COOKIE_OPTIONS } from '@/lib/role-cookie'
import type { Role } from '@/lib/useRole'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Open Redirect 방지: 상대 경로만 허용, protocol-relative URL 차단
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/') || next.startsWith('//')) next = '/'

  if (code) {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const jar   = await cookies()
      const raw   = jar.get('knu_prefs')?.value
      const prefs = raw ? parsePrefs(raw) : null

      // 익명 사용자가 OAuth 로 정식 로그인 시 (Supabase 자동 linkIdentity 처리됨):
      //   · auth.users 의 email·user_metadata 가 OAuth 정보로 갱신됨
      //   · 그러나 public.users 의 email/nickname/avatar_url 은 트리거가 INSERT only 라
      //     초기 NULL/'손님' 그대로 → 여기서 명시적으로 동기화
      const userMeta = data.user.user_metadata as { full_name?: string; name?: string; avatar_url?: string; picture?: string } | null
      const oauthEmail    = data.user.email ?? null
      const oauthNickname = userMeta?.full_name ?? userMeta?.name ?? null
      const oauthAvatar   = userMeta?.avatar_url ?? userMeta?.picture ?? null

      const profileUpdate: Record<string, string> = {}
      if (oauthEmail)    profileUpdate.email      = oauthEmail
      if (oauthNickname) profileUpdate.nickname   = oauthNickname
      if (oauthAvatar)   profileUpdate.avatar_url = oauthAvatar
      if (Object.keys(profileUpdate).length > 0) {
        await supabase
          .from('users')
          .update(profileUpdate)
          .eq('id', data.user.id)
      }

      // 온보딩 prefs(학번·학과·성별)를 users 테이블에 동기화 (023 migration).
      // 성별은 별도 SQL CHECK 제약(male/female 만 허용)을 두어 잘못된 값이
      // 들어오지 않도록 한다 — prefs.gender 가 'male'|'female'|null 타입이라
      // 추가 검증은 불필요.
      if (prefs?.grade || prefs?.dept || prefs?.gender) {
        await supabase
          .from('users')
          .update({
            ...(prefs.grade  ? { grade:  prefs.grade  } : {}),
            ...(prefs.dept   ? { dept:   prefs.dept   } : {}),
            ...(prefs.gender ? { gender: prefs.gender } : {}),
          })
          .eq('id', data.user.id)
      }

      // 룸메이트 온보딩에서 넘어온 경우: 로컬스토리지 데이터는 클라이언트에서만 접근 가능
      // → /roommate 페이지로 리다이렉트 후 클라이언트에서 저장 처리
      // 룸메이트 경로인 경우 role을 roommate로 업데이트
      if (next === '/roommate') {
        await supabase
          .from('users')
          .update({ role: 'roommate' })
          .eq('id', data.user.id)

        const response = NextResponse.redirect(`${origin}/roommate?save_draft=1`)
        response.cookies.set(ROLE_COOKIE_NAME, sealRole('roommate'), ROLE_COOKIE_OPTIONS)
        return response
      }

      // 방봐요 온보딩에서 넘어온 경우 — role 을 'bangbwayo' 로 업데이트.
      // 룸메이트와 동일 패턴이라 일관성 유지. 이 사용자가 다른 모드로 전환하려면
      // 마이페이지의 ModeToggle 또는 메인 CTA 클릭 시 다시 role 갱신 (후속 PR).
      if (next === '/bangbwayo') {
        await supabase
          .from('users')
          .update({ role: 'bangbwayo' })
          .eq('id', data.user.id)

        const response = NextResponse.redirect(`${origin}/bangbwayo`)
        response.cookies.set(ROLE_COOKIE_NAME, sealRole('bangbwayo'), ROLE_COOKIE_OPTIONS)
        return response
      }

      // DB에서 role 조회 → AES-256-GCM 암호화 후 HttpOnly 쿠키에 저장
      // HttpOnly: JS에서 document.cookie로 읽기/쓰기 불가 → XSS로부터 보호
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()
      const role = (profile?.role ?? 'tenant') as Role

      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set(ROLE_COOKIE_NAME, sealRole(role), ROLE_COOKIE_OPTIONS)
      return response
    }

    const msg = error?.message ?? 'unknown_error'
    return NextResponse.redirect(`${origin}/auth/error?msg=${encodeURIComponent(msg)}`)
  }

  return NextResponse.redirect(`${origin}/auth/error?msg=no_code`)
}
