import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

const ALLOWED_BUCKETS = ['building-images', 'room-images'] as const
const ALLOWED_MIME    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_SIZE_BYTES  = 10 * 1024 * 1024  // 10MB

// POST /api/admin/upload — 이미지 업로드
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const form   = await req.formData()
  const file   = form.get('file')   as File | null
  const bucket = form.get('bucket') as string | null
  const id     = form.get('id')     as string | null

  if (!file || !bucket || !id)
    return NextResponse.json({ error: '파일, bucket, id 필수' }, { status: 400 })
  if (!ALLOWED_BUCKETS.includes(bucket as typeof ALLOWED_BUCKETS[number]))
    return NextResponse.json({ error: '잘못된 bucket' }, { status: 400 })
  if (!ALLOWED_MIME.includes(file.type as typeof ALLOWED_MIME[number]))
    return NextResponse.json({ error: '허용되지 않는 파일 형식 (jpeg/png/webp/gif)' }, { status: 400 })
  if (file.size > MAX_SIZE_BYTES)
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 })

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
