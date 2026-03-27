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

// PATCH /api/owner/buildings — 전담 중개사 변경
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dedicated_agent_id } = await req.json()

  const { data, error } = await supabase
    .from('owner_buildings')
    .update({ dedicated_agent_id: dedicated_agent_id ?? null })
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
