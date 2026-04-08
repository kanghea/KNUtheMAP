import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
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

      // 온보딩 prefs(학번·학과)를 users 테이블에 동기화
      if (prefs?.grade || prefs?.dept) {
        await supabase
          .from('users')
          .update({
            ...(prefs.grade ? { grade: prefs.grade } : {}),
            ...(prefs.dept  ? { dept:  prefs.dept  } : {}),
          })
          .eq('id', data.user.id)
      }

      // 룸메이트 온보딩에서 넘어온 경우:
      // - role을 service role로 업데이트 (RLS 우회)
      // - /roommate?save_draft=1로 리다이렉트 → 클라이언트에서 localStorage → DB 저장
      if (next === '/roommate') {
        const admin = createServiceClient()
        const { error: roleErr } = await admin
          .from('users')
          .update({ role: 'roommate' })
          .eq('id', data.user.id)

        if (roleErr) {
          console.error('[auth/callback] roommate role update failed:', roleErr)
        }

        const response = NextResponse.redirect(`${origin}/roommate?save_draft=1`)
        response.cookies.set(ROLE_COOKIE_NAME, sealRole('roommate'), ROLE_COOKIE_OPTIONS)
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
