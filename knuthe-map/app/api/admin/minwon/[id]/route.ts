import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

const ALLOWED_STATUS = ['pending', 'in_progress', 'resolved', 'rejected'] as const
type Status = typeof ALLOWED_STATUS[number]

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/admin/minwon/[id] — 관리자 민원 처리 상태/메모 갱신
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const { id } = await ctx.params
  if (!UUID_RE.test(id))
    return NextResponse.json({ error: '잘못된 ID 형식' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const status     = body?.status as string | undefined
  const adminNote  = typeof body?.admin_note === 'string' ? body.admin_note : null

  if (!status || !ALLOWED_STATUS.includes(status as Status))
    return NextResponse.json({ error: '잘못된 status' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('minwons')
    .update({
      status,
      admin_note: adminNote && adminNote.length > 0 ? adminNote : null,
    })
    .eq('id', id)

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
