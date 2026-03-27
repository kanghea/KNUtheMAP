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
