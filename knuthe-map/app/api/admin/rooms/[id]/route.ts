import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

async function requireAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

// PATCH /api/admin/rooms/[id] — is_active 토글 or images 업데이트
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['is_active', 'images', 'unit_number'] as const
  const update: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: '변경할 항목 없음' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('rooms').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/rooms/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const service = createServiceClient()
  const { error } = await service.from('rooms').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
