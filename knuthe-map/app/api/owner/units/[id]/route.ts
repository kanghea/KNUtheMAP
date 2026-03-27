import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// PATCH /api/owner/units/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // 본인 건물 호실인지 확인
  const { data: unit } = await supabase
    .from('building_units')
    .select('id, building_id')
    .eq('id', id)
    .single()
  if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ob } = await supabase
    .from('owner_buildings')
    .select('id')
    .eq('owner_id', user.id)
    .eq('building_id', unit.building_id)
    .single()
  if (!ob) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const allowed = ['floor', 'unit_number', 'area_m2', 'room_type', 'base_deposit', 'base_rent', 'status', 'memo']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('building_units')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/owner/units/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data: unit } = await supabase
    .from('building_units').select('id, building_id').eq('id', id).single()
  if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: ob } = await supabase
    .from('owner_buildings').select('id')
    .eq('owner_id', user.id).eq('building_id', unit.building_id).single()
  if (!ob) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { error } = await supabase.from('building_units').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
