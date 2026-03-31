import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

// PATCH /api/admin/buildings/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

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
