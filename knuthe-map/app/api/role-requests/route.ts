import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// POST /api/role-requests — 권한 신청
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { requested_role, business_name, address, license_number, phone, memo } = body

  if (!requested_role || !['owner', 'agent'].includes(requested_role)) {
    return NextResponse.json({ error: '잘못된 역할입니다' }, { status: 400 })
  }

  const service = createServiceClient()

  // 이미 pending/approved 신청이 있으면 중복 방지
  const { data: existing } = await service
    .from('role_requests')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('requested_role', requested_role)
    .in('status', ['pending', 'approved'])
    .single()

  if (existing) {
    if (existing.status === 'approved') {
      return NextResponse.json({ error: '이미 승인된 역할입니다' }, { status: 400 })
    }
    return NextResponse.json({ error: '이미 신청이 접수되어 있어요' }, { status: 400 })
  }

  const { data, error } = await service
    .from('role_requests')
    .insert({
      user_id:        user.id,
      requested_role,
      business_name:  business_name  ?? null,
      address:        address        ?? null,
      license_number: license_number ?? null,
      phone:          phone          ?? null,
      memo:           memo           ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// GET /api/role-requests — 내 신청 현황
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('role_requests')
    .select('id, requested_role, status, business_name, created_at, reviewed_at, reject_reason')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
