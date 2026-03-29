import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // 세션 리프레시 최적화:
  // getSession()은 쿠키 로컬 파싱(네트워크 없음)으로 만료 시각 확인.
  // 토큰이 5분 이상 남아 있으면 getUser() 네트워크 호출 생략 → ~300-500ms 절약.
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const expiresAt  = session.expires_at ?? 0
    const nowSec     = Math.floor(Date.now() / 1000)
    const secsLeft   = expiresAt - nowSec
    if (secsLeft < 300) {
      // 만료 임박 시에만 서버 검증 + 토큰 갱신
      await supabase.auth.getUser()
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
