import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return NextResponse.json({ user: null })

  const service = createServiceClient()
  const { data: profile } = await service
    .from('users')
    .select('id, nickname, avatar_url, role')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: profile ?? null })
}
