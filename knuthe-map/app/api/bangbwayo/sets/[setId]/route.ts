import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-guard'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET   /api/bangbwayo/sets/[setId]   — 셋 상세 + 트랙 목록 + 사진(signed URL)
// PATCH /api/bangbwayo/sets/[setId]   — 제목/상태 변경 (active → ended/results_generated)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params
  if (!UUID_RE.test(setId))
    return NextResponse.json({ error: '잘못된 setId' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const { data: set, error: setErr } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, ended_at, result_generated_at')
    .eq('id', setId)
    .maybeSingle()

  if (setErr) return NextResponse.json({ error: setErr.message }, { status: 500 })
  if (!set)   return NextResponse.json({ error: '셋을 찾을 수 없어요' }, { status: 404 })

  const { data: tracks } = await supabase
    .from('bangbwayo_tracks')
    .select(`
      id, order_index, building_id, building_address_text, unit_number,
      time_option, deposit, monthly_rent, maintenance, floor, contract_type,
      overall_rating, overall_memo, status, visited_at
    `)
    .eq('set_id', setId)
    .order('order_index', { ascending: true })

  // 사진 + 응답을 한 번에 조회 (트랙 ID 모음)
  const trackIds = (tracks ?? []).map((t) => t.id as string)

  let responses: Array<{ track_id: string; checklist_item_key: string; rating: string | null; memo: string | null }> = []
  let photos:    Array<{ id: string; track_id: string; checklist_item_key: string | null; storage_path: string }> = []

  if (trackIds.length > 0) {
    const [{ data: rData }, { data: pData }] = await Promise.all([
      supabase
        .from('bangbwayo_responses')
        .select('track_id, checklist_item_key, rating, memo')
        .in('track_id', trackIds),
      supabase
        .from('bangbwayo_photos')
        .select('id, track_id, checklist_item_key, storage_path')
        .in('track_id', trackIds),
    ])
    responses = (rData ?? []) as typeof responses
    photos    = (pData ?? []) as typeof photos
  }

  // signed URL 일괄 발급 (1시간 유효).
  // 비공개 버킷이라 service role 필요. anon 키로는 createSignedUrl 만 호출 가능하지만
  // 본인 photo 만 RLS 통과 — 일관성을 위해 service role 로 통일.
  const signed: Record<string, string> = {}
  if (photos.length > 0) {
    const service = createServiceClient()
    const paths = photos.map((p) => p.storage_path)
    const { data: signedList } = await service.storage
      .from('bangbwayo-photos')
      .createSignedUrls(paths, 60 * 60)  // 1시간
    for (let i = 0; i < paths.length; i++) {
      const url = signedList?.[i]?.signedUrl
      if (url) signed[paths[i]] = url
    }
  }

  return NextResponse.json({
    set,
    tracks: tracks ?? [],
    responses,
    photos: photos.map((p) => ({ ...p, url: signed[p.storage_path] ?? null })),
  })
}

export async function PATCH(
  req:  NextRequest,
  { params }: { params: Promise<{ setId: string }> },
) {
  const { setId } = await params
  if (!UUID_RE.test(setId))
    return NextResponse.json({ error: '잘못된 setId' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const body = (await req.json().catch(() => ({}))) as {
    title?:  string | null
    status?: 'active' | 'ended' | 'results_generated'
  }

  const update: Record<string, unknown> = {}
  if (typeof body.title === 'string' || body.title === null) update.title = body.title
  if (body.status) {
    update.status = body.status
    if (body.status === 'ended' || body.status === 'results_generated') {
      update.ended_at = new Date().toISOString()
    }
    if (body.status === 'results_generated') {
      update.result_generated_at = new Date().toISOString()
    }
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: '변경할 내용이 없어요' }, { status: 400 })

  const { data, error } = await supabase
    .from('bangbwayo_sets')
    .update(update)
    .eq('id', setId)
    .select('id, title, status, started_at, ended_at, result_generated_at')
    .single()

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? '수정 실패' }, { status: 500 })

  return NextResponse.json({ set: data })
}
