import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireRole } from '@/lib/auth-guard'

const VALID_ROLES = ['tenant', 'owner', 'agent', 'admin'] as const

// PATCH /api/admin/users — 역할 변경
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireRole(supabase, 'admin')
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { user_id, role } = body ?? {}

  if (!user_id || !VALID_ROLES.includes(role))
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('users')
    .update({ role })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
