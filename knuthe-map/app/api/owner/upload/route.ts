import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// POST /api/owner/upload
// multipart/form-data: file, id (unit uuid)
// owner 또는 agent만 사용 가능
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'agent', 'admin'].includes(profile.role))
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const id   = form.get('id')   as string | null

  if (!file || !id)
    return NextResponse.json({ error: 'file, id 필수' }, { status: 400 })

  // UUID 형식 검증 (path traversal 방지)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return NextResponse.json({ error: '잘못된 ID 형식' }, { status: 400 })

  // IDOR 방지: admin이 아닌 경우 unit 소유권 확인
  if (profile.role !== 'admin') {
    const { data: unit } = await supabase
      .from('building_units')
      .select('building_id')
      .eq('id', id)
      .single()
    if (!unit)
      return NextResponse.json({ error: '호실을 찾을 수 없어요' }, { status: 404 })

    const { data: ownership } = await supabase
      .from('owner_buildings')
      .select('id')
      .eq('building_id', unit.building_id)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!ownership) {
      // agent인 경우 agent_buildings 확인
      const { data: agentLink } = await supabase
        .from('agent_buildings')
        .select('id')
        .eq('building_id', unit.building_id)
        .eq('agent_id', user.id)
        .maybeSingle()
      if (!agentLink)
        return NextResponse.json({ error: '권한 없음' }, { status: 403 })
    }
  }

  const ext    = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path   = `${id}/${crypto.randomUUID()}.${ext}`
  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const service = createServiceClient()
  const { error: uploadErr } = await service.storage
    .from('unit-images')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from('unit-images').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
