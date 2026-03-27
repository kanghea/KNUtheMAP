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
      // 온보딩 prefs(학번·학과)를 users 테이블에 동기화
      const jar    = await cookies()
      const raw    = jar.get('knu_prefs')?.value
      const prefs  = raw ? parsePrefs(raw) : null

      if (prefs?.grade || prefs?.dept) {
        await supabase
          .from('users')
          .update({
            ...(prefs.grade ? { grade: prefs.grade } : {}),
            ...(prefs.dept  ? { dept:  prefs.dept  } : {}),
          })
          .eq('id', data.user.id)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    // exchangeCodeForSession 실패 시 에러 내용을 에러 페이지로 전달
    const msg = error?.message ?? 'unknown_error'
    return NextResponse.redirect(`${origin}/auth/error?msg=${encodeURIComponent(msg)}`)
  }

  return NextResponse.redirect(`${origin}/auth/error?msg=no_code`)
}
