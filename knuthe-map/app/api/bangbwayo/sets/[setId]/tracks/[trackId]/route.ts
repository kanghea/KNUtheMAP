import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CONTRACT_TYPES = ['월세', '전세', '매매'] as const
const STATUSES       = ['draft', 'saved', 'closed', 'included'] as const

// PATCH /api/bangbwayo/sets/[setId]/tracks/[trackId]
//   계약 조건·기본 정보·상태 수정 (자동 저장 대상)
export async function PATCH(
  req:  NextRequest,
  { params }: { params: Promise<{ setId: string; trackId: string }> },
) {
  const { setId, trackId } = await params
  if (!UUID_RE.test(setId) || !UUID_RE.test(trackId))
    return NextResponse.json({ error: '잘못된 ID' }, { status: 400 })

  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  type Body = {
    building_id?:           string | null
    building_address_text?: string | null
    unit_number?:           string | null
    deposit?:               number | null
    monthly_rent?:          number | null
    maintenance?:           number | null
    floor?:                 number | null
    contract_type?:         '월세' | '전세' | '매매' | null
    overall_rating?:        number | null
    overall_memo?:          string | null
    status?:                'draft' | 'saved' | 'closed' | 'included'
  }
  const body = (await req.json().catch(() => ({}))) as Body

  const update: Record<string, unknown> = {}

  // 명시적 키 화이트리스트 — 동의 컬럼 등은 절대 이 라우트로 못 바꾸게
  if ('building_id'           in body) update.building_id           = body.building_id
  if ('building_address_text' in body) update.building_address_text = body.building_address_text
  if ('unit_number'           in body) update.unit_number           = body.unit_number?.trim() || null
  if ('deposit'               in body) update.deposit               = body.deposit
  if ('monthly_rent'          in body) update.monthly_rent          = body.monthly_rent
  if ('maintenance'           in body) update.maintenance           = body.maintenance
  if ('floor'                 in body) update.floor                 = body.floor
  if ('overall_rating'        in body) {
    if (body.overall_rating !== null && body.overall_rating !== undefined) {
      const r = Number(body.overall_rating)
      if (!Number.isInteger(r) || r < 1 || r > 5)
        return NextResponse.json({ error: '별점은 1~5' }, { status: 400 })
    }
    update.overall_rating = body.overall_rating
  }
  if ('overall_memo'  in body) update.overall_memo = body.overall_memo
  if ('contract_type' in body) {
    if (body.contract_type !== null && body.contract_type !== undefined &&
        !CONTRACT_TYPES.includes(body.contract_type))
      return NextResponse.json({ error: '잘못된 계약 형태' }, { status: 400 })
    update.contract_type = body.contract_type
  }
  if ('status' in body) {
    if (body.status && !STATUSES.includes(body.status))
      return NextResponse.json({ error: '잘못된 상태' }, { status: 400 })
    update.status = body.status
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: '변경할 내용이 없어요' }, { status: 400 })

  const { data, error } = await supabase
    .from('bangbwayo_tracks')
    .update(update)
    .eq('id', trackId)
    .eq('set_id', setId)
    .select(`
      id, order_index, building_id, building_address_text, unit_number,
      time_option, deposit, monthly_rent, maintenance, floor, contract_type,
      overall_rating, overall_memo, status, visited_at
    `)
    .single()

  if (error || !data)
    return NextResponse.json({ error: error?.message ?? '수정 실패' }, { status: 500 })

  return NextResponse.json({ track: data })
}
