import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'
import type { TimeOption } from '@/lib/bangbwayo-checklist'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TIME_OPTIONS = ['5min', '15min', '30min'] as const satisfies readonly TimeOption[]

// POST /api/bangbwayo/sets/[setId]/tracks  — 새 트랙 시작
export async function POST(
  req:  NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params
  if (!UUID_RE.test(setId))
    return NextResponse.json({ error: '잘못된 setId' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => ({}))) as { time_option?: TimeOption }
  const timeOption: TimeOption = body.time_option && TIME_OPTIONS.includes(body.time_option)
    ? body.time_option
    : '5min'

  // 셋이 active 상태인지 + 본인 소유인지(RLS) 확인
  const { data: set } = await supabase
    .from('bangbwayo_sets')
    .select('id, status')
    .eq('id', setId)
    .maybeSingle()
  if (!set)
    return NextResponse.json({ error: '셋을 찾을 수 없어요' }, { status: 404 })
  if (set.status !== 'active')
    return NextResponse.json({ error: '종료된 셋에는 트랙을 추가할 수 없어요' }, { status: 409 })

  // order_index 계산 — 같은 셋에서 max+1
  const { data: maxRow } = await supabase
    .from('bangbwayo_tracks')
    .select('order_index')
    .eq('set_id', setId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextIndex = (maxRow?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('bangbwayo_tracks')
    .insert({
      set_id:      setId,
      order_index: nextIndex,
      time_option: timeOption,
    })
    .select('id, order_index, time_option, status, visited_at')
    .single()

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? '트랙 생성 실패' }, { status: 500 })

  return NextResponse.json({ track: data })
}
