import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── 보안 응답 헤더 ────────────────────────────────────────────────────────────
// 모든 응답에 삽입해 클릭재킹·MIME 스니핑·정보 노출 등을 차단합니다.
const SECURITY_HEADERS: Record<string, string> = {
  // MIME 타입 스니핑 차단 (content injection 방지)
  'X-Content-Type-Options':  'nosniff',
  // 클릭재킹 방지: 이 앱을 다른 사이트의 iframe에 삽입 불가
  'X-Frame-Options':         'DENY',
  // Referrer 정보 최소화: 같은 origin은 full URL, 외부로는 origin만 전송
  'Referrer-Policy':         'strict-origin-when-cross-origin',
  // 불필요한 브라우저 기능 비활성화
  'Permissions-Policy':      'camera=(), microphone=(), geolocation=(self), payment=()',
  // HSTS: production에서 1년간 HTTPS 강제 (includeSubDomains 포함)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }),
}

// ── API 엔드포인트 CSRF 보호 ──────────────────────────────────────────────────
// POST/PATCH/DELETE/PUT 요청은 Origin 또는 Referer 헤더가 자기 origin과 일치해야 합니다.
// SameSite=Lax 쿠키가 1차 방어선, 여기서 2차 검증합니다.
function isCsrfSafe(request: NextRequest): boolean {
  const method = request.method.toUpperCase()
  if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) return true
  if (!request.nextUrl.pathname.startsWith('/api/')) return true

  const origin   = request.headers.get('origin')
  const referer  = request.headers.get('referer')
  const host     = request.headers.get('host') ?? request.nextUrl.host

  // Origin 헤더 우선 검사
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch { return false }
  }

  // Origin 없을 때 Referer 폴백
  if (referer) {
    try {
      return new URL(referer).host === host
    } catch { return false }
  }

  // 둘 다 없으면 거부 (브라우저 외 클라이언트는 Origin을 반드시 포함해야 함)
  return false
}

export async function proxy(request: NextRequest) {
  // ── CSRF 검사 ─────────────────────────────────────────────────────────────
  if (!isCsrfSafe(request)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

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

  // ── 세션 리프레시 (만료 임박 시에만 네트워크 호출) ──────────────────────────
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    const secsLeft = (session.expires_at ?? 0) - Math.floor(Date.now() / 1000)
    if (secsLeft < 300) {
      await supabase.auth.getUser()
    }
  }

  // ── 보안 헤더 삽입 ────────────────────────────────────────────────────────
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
