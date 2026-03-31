import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

// POST /api/admin/rooms — 매물 신규 등록 (관리자)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const {
    building_id, contract_type, deposit, monthly_rent, maintenance,
    area_m2, floor, total_floors, room_type, description,
    contact_phone, contact_name, available_from, unit_number,
  } = body ?? {}

  if (!building_id)     return NextResponse.json({ error: '건물을 선택해주세요' }, { status: 400 })
  if (!contract_type)   return NextResponse.json({ error: '계약 유형을 선택해주세요' }, { status: 400 })
  if (deposit == null)  return NextResponse.json({ error: '보증금을 입력해주세요' }, { status: 400 })
  if (contract_type === '월세' && monthly_rent == null)
    return NextResponse.json({ error: '월세를 입력해주세요' }, { status: 400 })

  const service = createServiceClient()
  const { data: building } = await service
    .from('buildings').select('id').eq('id', building_id).single()
  if (!building) return NextResponse.json({ error: '건물을 찾을 수 없어요' }, { status: 404 })

  const { data, error } = await service
    .from('rooms')
    .insert({
      building_id,
      listed_by:    guard.user.id,
      contract_type,
      deposit:      Number(deposit),
      monthly_rent: monthly_rent != null ? Number(monthly_rent) : null,
      maintenance:  maintenance  != null ? Number(maintenance)  : null,
      area_m2:      area_m2      != null ? Number(area_m2)      : null,
      floor:        floor        != null ? Number(floor)        : null,
      total_floors: total_floors != null ? Number(total_floors) : null,
      room_type:    room_type    ?? null,
      description:  description  ?? null,
      contact_phone: contact_phone ?? null,
      contact_name:  contact_name  ?? null,
      available_from: available_from ?? null,
      unit_number:  unit_number ?? null,
      images:       [],
      options:      {},
      characteristics: [],
      checklist:    {},
      is_active:    true,
    })
    .select(`
      id, contract_type, deposit, monthly_rent, area_m2, floor,
      room_type, is_active, created_at,
      buildings ( name, address, zone ),
      users!rooms_listed_by_fkey ( email, nickname )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
