import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase-server'
import { parsePrefs } from '@/lib/prefs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

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

      // knu_role 쿠키 설정 → layout.tsx가 DB 조회 없이 역할을 즉시 읽을 수 있게 함
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()
      const role = profile?.role ?? 'tenant'
      const response = NextResponse.redirect(`${origin}${next}`)
      response.cookies.set('knu_role', role, {
        path:     '/',
        maxAge:   60 * 60 * 24 * 30, // 30일
        sameSite: 'lax',
        secure:   process.env.NODE_ENV === 'production',
      })
      return response
    }

    // exchangeCodeForSession 실패 시 에러 내용을 에러 페이지로 전달
    const msg = error?.message ?? 'unknown_error'
    return NextResponse.redirect(`${origin}/auth/error?msg=${encodeURIComponent(msg)}`)
  }

  return NextResponse.redirect(`${origin}/auth/error?msg=no_code`)
}
