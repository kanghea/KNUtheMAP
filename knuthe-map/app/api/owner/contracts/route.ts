import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// GET /api/owner/contracts
// Query params: status (active|expired|terminated|all, default: all)
export async function GET(req: NextRequest) {
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

  const { data: ob } = await supabase
    .from('owner_buildings')
    .select('building_id')
    .eq('owner_id', user.id)
    .single()

  if (!ob) return NextResponse.json({ error: '등록된 건물 없음' }, { status: 404 })

  const buildingId = ob.building_id
  const statusParam = req.nextUrl.searchParams.get('status') ?? 'all'

  let query = supabase
    .from('owner_contracts')
    .select(`
      id, unit_id, contract_type, deposit, monthly_rent, maintenance,
      contract_start, contract_end, status, tenant_name, tenant_phone,
      memo, is_auto_renew, created_at,
      building_units ( floor, unit_number, room_type, area_m2 )
    `)
    .eq('building_id', buildingId)
    .order('contract_start', { ascending: false })

  if (statusParam !== 'all') {
    query = query.eq('status', statusParam)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

// POST /api/owner/contracts
export async function POST(req: NextRequest) {
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

  const { data: ob } = await supabase
    .from('owner_buildings')
    .select('building_id')
    .eq('owner_id', user.id)
    .single()

  if (!ob) return NextResponse.json({ error: '등록된 건물 없음' }, { status: 404 })

  const buildingId = ob.building_id

  const body = await req.json()
  const {
    unit_id, contract_type, deposit, monthly_rent, maintenance,
    tenant_name, tenant_phone, contract_start, contract_end,
    is_auto_renew, memo,
  } = body

  if (!unit_id || !contract_type || deposit === undefined) {
    return NextResponse.json({ error: '필수 항목 누락 (unit_id, contract_type, deposit)' }, { status: 400 })
  }

  // Verify unit belongs to owner's building
  const { data: unitCheck } = await supabase
    .from('building_units')
    .select('id')
    .eq('id', unit_id)
    .eq('building_id', buildingId)
    .single()

  if (!unitCheck) {
    return NextResponse.json({ error: '해당 호실에 대한 권한 없음' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('owner_contracts')
    .insert({
      owner_id: user.id,
      building_id: buildingId,
      unit_id,
      contract_type,
      deposit,
      monthly_rent: monthly_rent ?? null,
      maintenance: maintenance ?? null,
      tenant_name: tenant_name ?? null,
      tenant_phone: tenant_phone ?? null,
      contract_start: contract_start ?? null,
      contract_end: contract_end ?? null,
      is_auto_renew: is_auto_renew ?? false,
      memo: memo ?? null,
      status: 'active',
    })
    .select(`
      id, unit_id, contract_type, deposit, monthly_rent, maintenance,
      contract_start, contract_end, status, tenant_name, tenant_phone,
      memo, is_auto_renew, created_at,
      building_units ( floor, unit_number, room_type, area_m2 )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
