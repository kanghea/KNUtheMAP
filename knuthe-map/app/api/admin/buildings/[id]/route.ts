import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

async function requireAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? supabase : null
}

// PATCH /api/admin/buildings/[id] — 이름·주소·is_active 수정
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const allowed = ['name', 'address', 'is_active', 'images'] as const
  const update: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) update[k] = body[k]
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: '변경할 항목 없음' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('buildings').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
