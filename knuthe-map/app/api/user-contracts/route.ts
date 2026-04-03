import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// GET /api/user-contracts — 내 계약 목록 (이력 포함)
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_contracts')
    .select(`
      id, contract_type, deposit, monthly_rent, maintenance,
      unit_number, floor, area_m2, room_type,
      contract_start, contract_end,
      is_renewal, previous_contract_id,
      address_text, memo, is_active, created_at, updated_at,
      building_id,
      buildings ( id, name, address ),
      user_contract_history (
        id, action, changed_fields, snapshot, created_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('contract_start', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/user-contracts — 새 계약 추가
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    building_id, address_text,
    unit_number, floor, area_m2, room_type,
    contract_type, deposit, monthly_rent, maintenance,
    contract_start, contract_end,
    is_renewal, previous_contract_id,
    memo,
  } = body

  if (!contract_type || deposit == null) {
    return NextResponse.json({ error: '계약 유형과 보증금은 필수입니다' }, { status: 400 })
  }
  if (!['월세', '전세'].includes(contract_type))
    return NextResponse.json({ error: '계약 유형은 월세 또는 전세여야 합니다' }, { status: 400 })
  if (typeof deposit !== 'number' || deposit < 0 || deposit > 500000)
    return NextResponse.json({ error: '보증금은 0~500000(만원) 범위여야 합니다' }, { status: 400 })
  if (monthly_rent != null && (typeof monthly_rent !== 'number' || monthly_rent < 0 || monthly_rent > 10000))
    return NextResponse.json({ error: '월세는 0~10000(만원) 범위여야 합니다' }, { status: 400 })
  if (maintenance != null && (typeof maintenance !== 'number' || maintenance < 0 || maintenance > 1000))
    return NextResponse.json({ error: '관리비는 0~1000(만원) 범위여야 합니다' }, { status: 400 })
  if (floor != null && (typeof floor !== 'number' || floor < -5 || floor > 100))
    return NextResponse.json({ error: '층수는 -5~100 범위여야 합니다' }, { status: 400 })

  const { data, error } = await supabase
    .from('user_contracts')
    .insert({
      user_id: user.id,
      building_id:          building_id          ?? null,
      address_text:         address_text         ?? null,
      unit_number:          unit_number          ?? null,
      floor:                floor                ?? null,
      area_m2:              area_m2              ?? null,
      room_type:            room_type            ?? null,
      contract_type,
      deposit,
      monthly_rent:         monthly_rent         ?? null,
      maintenance:          maintenance          ?? null,
      contract_start:       contract_start       ?? null,
      contract_end:         contract_end         ?? null,
      is_renewal:           is_renewal           ?? false,
      previous_contract_id: previous_contract_id ?? null,
      memo:                 memo                 ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
