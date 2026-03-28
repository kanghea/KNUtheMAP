import { createSupabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = await createSupabaseServer()

  // 서버 세션 무효화 (setAll 콜백으로 auth 쿠키를 만료 처리)
  await supabase.auth.signOut()

  const origin = request.headers.get('origin') ?? request.nextUrl.origin
  const response = NextResponse.redirect(new URL('/', origin), { status: 302 })

  // 남아있는 sb-* 쿠키를 redirect 응답에서 명시적으로 삭제
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    }
  }

  return response
}
