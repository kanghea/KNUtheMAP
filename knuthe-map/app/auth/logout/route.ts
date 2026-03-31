import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { ROLE_COOKIE_NAME } from '@/lib/role-cookie'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(`${origin}/`, { status: 303 })
  // 암호화된 role 쿠키 삭제 (공용 기기 role 노출 방지)
  response.cookies.set(ROLE_COOKIE_NAME, '', { maxAge: 0, path: '/', httpOnly: true })
  return response
}
