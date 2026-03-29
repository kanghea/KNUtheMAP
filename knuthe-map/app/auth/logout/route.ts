import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createSupabaseServer()
  await supabase.auth.signOut()
  const response = NextResponse.redirect(`${origin}/`, { status: 303 })
  // role 캐시 쿠키 삭제 (다른 사용자가 같은 기기 사용 시 role 누출 방지)
  response.cookies.set('knu_role', '', { maxAge: 0, path: '/' })
  return response
}
