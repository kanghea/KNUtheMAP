import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return NextResponse.json({ user: null })

  const { data: profile } = await supabase
    .from('users')
    .select('id, nickname, avatar_url, role')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: profile ?? null })
}
