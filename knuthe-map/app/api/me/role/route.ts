import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sealRole, ROLE_COOKIE_NAME, ROLE_COOKIE_OPTIONS } from '@/lib/role-cookie'
import {
  sealViewMode,
  VIEW_MODE_COOKIE_NAME,
  VIEW_MODE_COOKIE_OPTIONS,
  type ViewMode,
} from '@/lib/view-mode-cookie'
import type { Role } from '@/lib/useRole'

// PATCH /api/me/role — body: { role: 'tenant' | 'roommate' }
// 두 역할 사이에서만 토글한다. owner/agent/admin은 이 엔드포인트로 변경 불가
// (별도 승인 플로우 존재). DB 스키마 변경 없이 users.role 값만 갱신하므로
// RLS 정책(016_roommate.sql의 role='roommate' 검사)과 100% 호환된다.
//
// 응답: 새 role 쿠키와 view-mode 쿠키를 함께 재발급해 SSR 즉시 반영.
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null) as { role?: unknown } | null
  const next = body?.role

  if (next !== 'tenant' && next !== 'roommate') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // 현재 role 조회 — owner/agent/admin은 보호한다.
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const current = (profile?.role ?? 'tenant') as Role
  if (current !== 'tenant' && current !== 'roommate') {
    return NextResponse.json({ error: 'Forbidden for this role' }, { status: 403 })
  }

  // 룸메이트로 전환하려면 프로필이 반드시 있어야 한다 (없으면 온보딩 권장).
  if (next === 'roommate') {
    const { data: rm } = await supabase
      .from('roommate_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!rm) {
      return NextResponse.json(
        { error: 'Roommate profile required', needsOnboarding: true },
        { status: 409 },
      )
    }
  }

  const { error } = await supabase
    .from('users')
    .update({ role: next })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const viewMode: ViewMode = next === 'roommate' ? 'roommate' : 'rooms'

  const response = NextResponse.json({ role: next, viewMode })
  response.cookies.set(ROLE_COOKIE_NAME, sealRole(next as Role), ROLE_COOKIE_OPTIONS)
  response.cookies.set(VIEW_MODE_COOKIE_NAME, sealViewMode(viewMode), VIEW_MODE_COOKIE_OPTIONS)
  return response
}
