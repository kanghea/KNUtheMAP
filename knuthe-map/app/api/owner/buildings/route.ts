import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// POST /api/owner/buildings — 건물 등록
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'admin'].includes(profile.role))
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { building_id } = await req.json()
  if (!building_id) return NextResponse.json({ error: '건물 ID 필요' }, { status: 400 })

  const { data, error } = await supabase
    .from('owner_buildings')
    .insert({ owner_id: user.id, building_id })
    .select(`
      id, dedicated_agent_id,
      buildings ( id, name, address, total_floors ),
      dedicated_agent:users!owner_buildings_dedicated_agent_id_fkey ( id, nickname, email )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/owner/buildings — 전담 중개사 변경 또는 건물명 수정
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // 건물명 수정
  if ('building_name' in body) {
    const name = (body.building_name as string)?.trim()
    if (!name) return NextResponse.json({ error: '건물명을 입력해주세요' }, { status: 400 })

    // 이 사용자가 소유한 building_id 조회
    const { data: ob } = await supabase
      .from('owner_buildings')
      .select('building_id')
      .eq('owner_id', user.id)
      .single()
    if (!ob) return NextResponse.json({ error: '건물 정보 없음' }, { status: 404 })

    const { error } = await supabase
      .from('buildings')
      .update({ name })
      .eq('id', ob.building_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, name })
  }

  // 전담 중개사 변경
  const { dedicated_agent_id } = body
  const { data, error } = await supabase
    .from('owner_buildings')
    .update({ dedicated_agent_id: dedicated_agent_id ?? null })
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
