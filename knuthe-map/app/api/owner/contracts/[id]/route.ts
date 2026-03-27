import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// PATCH /api/owner/contracts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  // Verify contract belongs to this owner
  const { data: existing } = await supabase
    .from('owner_contracts')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '계약 없음' }, { status: 404 })
  if (existing.owner_id !== user.id && profile.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const allowedFields = [
    'contract_type', 'deposit', 'monthly_rent', 'maintenance',
    'tenant_name', 'tenant_phone', 'contract_start', 'contract_end',
    'is_auto_renew', 'memo', 'status',
  ]

  const updates: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '수정할 항목 없음' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('owner_contracts')
    .update(updates)
    .eq('id', id)
    .select(`
      id, unit_id, contract_type, deposit, monthly_rent, maintenance,
      contract_start, contract_end, status, tenant_name, tenant_phone,
      memo, is_auto_renew, created_at,
      building_units ( floor, unit_number, room_type, area_m2 )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

// DELETE /api/owner/contracts/[id] — soft delete (status = 'terminated')
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { data: existing } = await supabase
    .from('owner_contracts')
    .select('id, owner_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '계약 없음' }, { status: 404 })
  if (existing.owner_id !== user.id && profile.role !== 'admin') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { error } = await supabase
    .from('owner_contracts')
    .update({ status: 'terminated' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
