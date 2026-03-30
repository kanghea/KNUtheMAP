import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'

// GET /api/bookmarks/[buildingId] — 현재 북마크 여부 확인
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  const { buildingId } = await params
  const supabase = await createSupabaseServer()

  const auth = await requireAuth(supabase)
  if (!auth.ok) return NextResponse.json({ bookmarked: false, unauthenticated: true }, { status: 200 })

  const { data } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('building_id', buildingId)
    .maybeSingle()

  return NextResponse.json({ bookmarked: !!data })
}

// POST /api/bookmarks/[buildingId] — 북마크 추가
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  const { buildingId } = await params
  const supabase = await createSupabaseServer()

  const auth = await requireAuth(supabase)
  if (!auth.ok) return auth.response

  const { error } = await supabase
    .from('bookmarks')
    .upsert({ user_id: auth.user.id, building_id: buildingId }, { onConflict: 'user_id,building_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmarked: true })
}

// DELETE /api/bookmarks/[buildingId] — 북마크 제거
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ buildingId: string }> }
) {
  const { buildingId } = await params
  const supabase = await createSupabaseServer()

  const auth = await requireAuth(supabase)
  if (!auth.ok) return auth.response

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('building_id', buildingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bookmarked: false })
}
