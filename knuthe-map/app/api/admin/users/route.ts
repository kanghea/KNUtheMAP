import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// PATCH /api/admin/users — 역할 변경
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const { user_id, role } = await req.json()
  if (!user_id || !['tenant', 'owner', 'agent', 'admin'].includes(role))
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service
    .from('users')
    .update({ role })
    .eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
