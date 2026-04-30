import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import {
  sealViewMode,
  VIEW_MODE_COOKIE_NAME,
  VIEW_MODE_COOKIE_OPTIONS,
  type ViewMode,
} from '@/lib/view-mode-cookie'

// POST /api/me/view-mode — body: { mode: 'rooms' | 'roommate' }
// 보기 모드 쿠키만 갱신한다. role은 변경하지 않는다 (그건 /api/me/role 책임).
// 로그인 없는 사용자도 호출 가능: 시작 시 쿠키만 세팅하면 됨.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { mode?: unknown } | null
  const mode = body?.mode

  if (mode !== 'rooms' && mode !== 'roommate') {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const response = NextResponse.json({ mode })
  response.cookies.set(VIEW_MODE_COOKIE_NAME, sealViewMode(mode as ViewMode), VIEW_MODE_COOKIE_OPTIONS)
  return response
}

// 룸메이트 모드를 요청했는데 프로필이 없으면 호출부가 온보딩으로 보내야 한다.
// 그 판단을 클라이언트에서 미리 할 수 있도록 GET을 제공한다.
// GET /api/me/view-mode → { mode, hasRoommateProfile }
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  let hasRoommateProfile = false
  if (user) {
    const { data } = await supabase
      .from('roommate_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasRoommateProfile = !!data
  }

  return NextResponse.json({ hasRoommateProfile })
}
