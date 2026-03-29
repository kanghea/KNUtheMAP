/**
 * lib/auth-guard.ts
 *
 * API Route 공통 인가 헬퍼.
 * 모든 서버 엔드포인트에서 일관된 패턴으로 인증/인가를 처리합니다.
 *
 * 사용 예:
 *   const guard = await requireRole(supabase, 'admin')
 *   if (!guard.ok) return guard.response
 *   const { user } = guard   // 타입 narrowing 완료
 *
 *   const guard = await requireRole(supabase, ['owner', 'admin'])
 *   if (!guard.ok) return guard.response
 */

import { NextResponse }  from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from './useRole'

type AuthOk    = { ok: true;  user: { id: string }; role: Role }
type AuthFail  = { ok: false; response: NextResponse }
type AuthGuard = AuthOk | AuthFail

/**
 * 로그인 여부 + 역할(role) 동시 검증.
 * DB에서 role을 직접 조회하므로 쿠키 조작과 무관하게 항상 신뢰할 수 있습니다.
 */
export async function requireRole(
  supabase: SupabaseClient,
  allowed: Role | Role[],
): Promise<AuthGuard> {
  // 1. Supabase Auth 서버 검증 (JWT 위조 불가)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // 2. DB에서 role 조회 (쿠키/헤더의 role 값을 신뢰하지 않음)
  const { data: profile, error: dbErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (dbErr || !profile) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const role       = profile.role as Role
  const allowedArr = Array.isArray(allowed) ? allowed : [allowed]

  if (!allowedArr.includes(role)) {
    return { ok: false, response: NextResponse.json({ error: '권한 없음' }, { status: 403 }) }
  }

  return { ok: true, user, role }
}

/**
 * 로그인 여부만 확인 (role 무관).
 * role 검증이 필요 없는 엔드포인트(예: 자기 자신 데이터 CRUD)에 사용합니다.
 */
export async function requireAuth(
  supabase: SupabaseClient,
): Promise<{ ok: true; user: { id: string } } | { ok: false; response: NextResponse }> {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true, user }
}
