import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

// POST /api/admin/approvals — 역할 신청 승인 or 거절
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { request_id, action, reason } = body ?? {}

  if (!request_id || !['approve', 'reject'].includes(action))
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const service = createServiceClient()

  const { data: rr } = await service
    .from('role_requests')
    .select('id, user_id, requested_role, status')
    .eq('id', request_id)
    .single()

  if (!rr) return NextResponse.json({ error: '신청 없음' }, { status: 404 })
  if (rr.status !== 'pending')
    return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 400 })

  if (action === 'approve') {
    const { error: roleErr } = await service
      .from('users')
      .update({ role: rr.requested_role })
      .eq('id', rr.user_id)
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })

    await service
      .from('role_requests')
      .update({ status: 'approved', reviewed_by: guard.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', request_id)
  } else {
    await service
      .from('role_requests')
      .update({
        status: 'rejected',
        reviewed_by: guard.user.id,
        reviewed_at: new Date().toISOString(),
        reject_reason: reason ?? null,
      })
      .eq('id', request_id)
  }

  return NextResponse.json({ ok: true })
}
