import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'

// GET  /api/bangbwayo/sets        — 활성 + 과거 셋 목록 (본인)
// POST /api/bangbwayo/sets        — 새 셋 시작 (active 1개만 허용)

export async function GET() {
  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  // RLS 가 본인 row 만 반환하므로 user_id 필터는 안전 차원에서만 추가.
  const { data, error } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, ended_at, result_generated_at')
    .order('started_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 셋별 트랙 수도 한 번에 — 추가 round-trip 없이 head/count.
  const ids = (data ?? []).map((s) => s.id as string)
  const counts: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: tracks } = await supabase
      .from('bangbwayo_tracks')
      .select('set_id')
      .in('set_id', ids)
    for (const t of tracks ?? []) {
      const k = t.set_id as string
      counts[k] = (counts[k] ?? 0) + 1
    }
  }

  return NextResponse.json({
    sets: (data ?? []).map((s) => ({ ...s, trackCount: counts[s.id as string] ?? 0 })),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => ({}))) as { title?: string }

  // 활성 셋 1개만 — 부분 unique 인덱스가 DB 차원 보장이지만 친절한 에러 응답을 위해 선조회.
  const { data: existing } = await supabase
    .from('bangbwayo_sets')
    .select('id')
    .eq('user_id', guard.user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      error:   '이미 진행 중인 셋이 있어요',
      setId:   existing.id,
    }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('bangbwayo_sets')
    .insert({
      user_id: guard.user.id,
      title:   body.title?.trim() || null,
    })
    .select('id, title, status, started_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? '셋 생성 실패' }, { status: 500 })
  }
  return NextResponse.json({ set: data })
}
