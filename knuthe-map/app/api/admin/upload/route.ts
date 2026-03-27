import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// POST /api/admin/upload
// multipart/form-data: file, bucket ('building-images'|'room-images'), id (entity uuid)
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const form   = await req.formData()
  const file   = form.get('file')   as File | null
  const bucket = form.get('bucket') as string | null
  const id     = form.get('id')     as string | null

  if (!file || !bucket || !id)
    return NextResponse.json({ error: '파일, bucket, id 필수' }, { status: 400 })
  if (!['building-images', 'room-images'].includes(bucket))
    return NextResponse.json({ error: '잘못된 bucket' }, { status: 400 })

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${id}/${crypto.randomUUID()}.${ext}`

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const service = createServiceClient()
  const { error: uploadErr } = await service.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
