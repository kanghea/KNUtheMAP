import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

// POST /api/admin/buildings — 건물 신규 등록
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { name, address, lat, lng, zone, total_floors, main_purps_nm } = body ?? {}

  if (!name?.trim())    return NextResponse.json({ error: '건물명을 입력해주세요' }, { status: 400 })
  if (!address?.trim()) return NextResponse.json({ error: '주소를 입력해주세요' }, { status: 400 })
  if (lat == null || lng == null)
    return NextResponse.json({ error: '좌표가 없습니다 (주소 검색을 먼저 해주세요)' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('buildings')
    .insert({
      name:          name.trim(),
      address:       address.trim(),
      lat,
      lng,
      zone:          zone          ?? null,
      total_floors:  total_floors  ?? null,
      main_purps_nm: main_purps_nm ?? null,
      images:        [],
      is_active:     true,
      vworld_enriched:  false,
      bldrgst_enriched: false,
      juso_enriched:    false,
    })
    .select('id, name, address, zone, total_floors, main_purps_nm, is_active, images')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
