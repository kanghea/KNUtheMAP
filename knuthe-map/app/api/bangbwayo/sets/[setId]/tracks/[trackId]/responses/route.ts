import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'
import { findChecklistItem } from '@/lib/bangbwayo-checklist'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RATINGS = ['good', 'fair', 'bad', 'unknown'] as const

// POST /api/bangbwayo/sets/[setId]/tracks/[trackId]/responses
//   카드 응답 upsert — 같은 (track_id, checklist_item_key) 조합에 한 행만 유지.
//   자동 저장 대상이라 클라이언트는 디바운스해서 호출.
export async function POST(
  req:  NextRequest,
  { params }: { params: Promise<{ setId: string; trackId: string }> },
) {
  const { setId, trackId } = await params
  if (!UUID_RE.test(setId) || !UUID_RE.test(trackId))
    return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => ({}))) as {
    checklist_item_key?: string
    rating?:             string | null
    memo?:               string | null
  }

  if (!body.checklist_item_key)
    return NextResponse.json({ error: 'checklist_item_key 필수' }, { status: 400 })

  // 트랙 조회로 time_option 확인 — 마스터 데이터에 있는 키인지 검증
  const { data: track } = await supabase
    .from('bangbwayo_tracks')
    .select('id, time_option, set_id')
    .eq('id', trackId)
    .eq('set_id', setId)
    .maybeSingle()
  if (!track)
    return NextResponse.json({ error: '트랙을 찾을 수 없어요' }, { status: 404 })

  const masterItem = findChecklistItem(
    track.time_option as '5min' | '15min' | '30min',
    body.checklist_item_key,
  )
  if (!masterItem)
    return NextResponse.json({ error: '알 수 없는 체크리스트 항목' }, { status: 400 })

  if (body.rating !== null && body.rating !== undefined &&
      !RATINGS.includes(body.rating as typeof RATINGS[number]))
    return NextResponse.json({ error: '잘못된 rating' }, { status: 400 })

  const { data, error } = await supabase
    .from('bangbwayo_responses')
    .upsert(
      {
        track_id:           trackId,
        checklist_item_key: body.checklist_item_key,
        rating:             body.rating ?? null,
        memo:               body.memo  ?? null,
      },
      { onConflict: 'track_id,checklist_item_key' },
    )
    .select('track_id, checklist_item_key, rating, memo')
    .single()

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? '저장 실패' }, { status: 500 })

  return NextResponse.json({ response: data })
}
