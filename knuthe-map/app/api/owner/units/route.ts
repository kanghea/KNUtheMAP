import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// GET /api/owner/units?building_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const buildingId = req.nextUrl.searchParams.get('building_id')
  if (!buildingId) return NextResponse.json({ error: 'building_id 필요' }, { status: 400 })

  // 권한 확인 (본인 건물인지)
  const { data: ob } = await supabase
    .from('owner_buildings')
    .select('id')
    .eq('owner_id', user.id)
    .eq('building_id', buildingId)
    .single()
  if (!ob) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  // 호실 + 활성 계약 조인
  const { data: units, error } = await supabase
    .from('building_units')
    .select('id, floor, unit_number, area_m2, room_type, status, base_deposit, base_rent')
    .eq('building_id', buildingId)
    .order('floor', { ascending: false })
    .order('unit_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 활성 계약 조회 (unit_id 기준)
  const unitIds = (units ?? []).map((u) => u.id)
  const { data: contracts } = await supabase
    .from('owner_contracts')
    .select('id, unit_id, tenant_name, deposit, monthly_rent, contract_start, contract_end, status')
    .in('unit_id', unitIds.length ? unitIds : [''])
    .eq('status', 'active')

  const contractByUnit = Object.fromEntries(
    (contracts ?? []).map((c) => [c.unit_id, c])
  )

  const result = (units ?? []).map((u) => ({
    ...u,
    contract: contractByUnit[u.id] ?? null,
  }))

  return NextResponse.json(result)
}

// POST /api/owner/units — 호실 추가
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { building_id, floor, unit_number, area_m2, room_type, base_deposit, base_rent } = body

  if (!building_id || !floor || !unit_number)
    return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })

  // 권한 확인
  const { data: ob } = await supabase
    .from('owner_buildings')
    .select('id')
    .eq('owner_id', user.id)
    .eq('building_id', building_id)
    .single()
  if (!ob) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { data, error } = await supabase
    .from('building_units')
    .insert({ building_id, floor, unit_number, area_m2: area_m2 ?? null,
              room_type: room_type ?? null, base_deposit: base_deposit ?? null,
              base_rent: base_rent ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
