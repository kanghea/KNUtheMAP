import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// POST /api/admin/approvals — 승인 or 거절
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 관리자 확인
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { request_id, action, reason } = await req.json()
  if (!request_id || !['approve', 'reject'].includes(action))
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const service = createServiceClient()

  // 신청 조회
  const { data: rr } = await service
    .from('role_requests')
    .select('id, user_id, requested_role, status')
    .eq('id', request_id)
    .single()

  if (!rr) return NextResponse.json({ error: '신청 없음' }, { status: 404 })
  if (rr.status !== 'pending')
    return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 400 })

  if (action === 'approve') {
    // 1. users.role 변경
    const { error: roleErr } = await service
      .from('users')
      .update({ role: rr.requested_role })
      .eq('id', rr.user_id)
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })

    // 2. role_requests status 변경
    await service
      .from('role_requests')
      .update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', request_id)

  } else {
    await service
      .from('role_requests')
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason ?? null,
      })
      .eq('id', request_id)
  }

  return NextResponse.json({ ok: true })
}
