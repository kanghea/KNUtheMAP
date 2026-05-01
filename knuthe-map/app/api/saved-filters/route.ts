import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import type { MapFilters } from '@/components/map/DynamicFilter'

// ── 입력 검증 ────────────────────────────────────────────────────────────────
// MapFilters JSON 을 그대로 저장하지만 DB 무결성을 위해 서버에서 한 번 더 검증.
// 타입 가드: 외부에서 받은 임의 객체 → MapFilters 로 좁히기.

const BUILDING_TYPES = ['단독주택', '공동주택', '상가', '기타'] as const
const ROOM_OPTIONS = new Set([
  '에어컨', '냉장고', '세탁기', '전자레인지',
  '주차장', '인터넷', '엘리베이터', 'CCTV',
  '가스레인지', '반려동물', '옷장', '신발장',
])

function isIntRange(v: unknown, min: number, max: number): v is [number, number] {
  return Array.isArray(v) && v.length === 2
    && typeof v[0] === 'number' && typeof v[1] === 'number'
    && v[0] >= min && v[1] <= max && v[0] <= v[1]
}

function validateFilters(input: unknown): MapFilters | { error: string } {
  if (!input || typeof input !== 'object') return { error: 'filters must be an object' }
  const f = input as Record<string, unknown>

  if (f.buildingType !== null
      && !(typeof f.buildingType === 'string' && (BUILDING_TYPES as readonly string[]).includes(f.buildingType)))
    return { error: 'invalid buildingType' }

  if (!isIntRange(f.rentRange,    0,   200))  return { error: 'invalid rentRange' }
  if (!isIntRange(f.depositRange, 0,  5000))  return { error: 'invalid depositRange' }
  if (!isIntRange(f.ageRange,     0,    60))  return { error: 'invalid ageRange' }

  if (!Array.isArray(f.options)
      || !f.options.every((o) => typeof o === 'string' && ROOM_OPTIONS.has(o)))
    return { error: 'invalid options' }

  if (f.gate !== null && typeof f.gate !== 'string') return { error: 'invalid gate' }
  if (f.gateMinutes !== null
      && !(typeof f.gateMinutes === 'number' && [5, 10, 15, 20].includes(f.gateMinutes)))
    return { error: 'invalid gateMinutes' }

  return {
    buildingType: f.buildingType as string | null,
    rentRange:    f.rentRange,
    depositRange: f.depositRange,
    ageRange:     f.ageRange,
    options:      f.options as string[],
    gate:         f.gate as string | null,
    gateMinutes:  f.gateMinutes as number | null,
  }
}

// ── GET /api/saved-filters — 본인 저장 조건 1행 ────────────────────────────
// 행이 없으면 { filters: null, notify: false } 를 반환해 클라이언트가 default 필터를 쓰게 함.
export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('saved_filters')
    .select('filters, notify, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    filters:    data?.filters ?? null,
    notify:     data?.notify  ?? false,
    updated_at: data?.updated_at ?? null,
  })
}

// ── PUT /api/saved-filters — upsert (본인 행) ──────────────────────────────
// body: { filters?: MapFilters, notify?: boolean }
// 둘 중 하나만 보내도 됨. 미전달 필드는 기존 값 유지.
export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }) }
  if (!body || typeof body !== 'object')
    return NextResponse.json({ error: 'body must be an object' }, { status: 400 })
  const b = body as Record<string, unknown>

  let validatedFilters: MapFilters | undefined
  if (b.filters !== undefined) {
    const result = validateFilters(b.filters)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 })
    validatedFilters = result
  }

  let notify: boolean | undefined
  if (b.notify !== undefined) {
    if (typeof b.notify !== 'boolean')
      return NextResponse.json({ error: 'notify must be a boolean' }, { status: 400 })
    notify = b.notify
  }

  if (validatedFilters === undefined && notify === undefined)
    return NextResponse.json({ error: 'at least one of filters or notify is required' }, { status: 400 })

  // 기존 행이 없으면 insert, 있으면 update — Postgres upsert 한 번으로 처리.
  // user_id PK 충돌 시 전달된 필드만 업데이트.
  const { data: existing } = await supabase
    .from('saved_filters')
    .select('filters, notify')
    .eq('user_id', user.id)
    .maybeSingle()

  const row = {
    user_id: user.id,
    filters: validatedFilters ?? existing?.filters ?? {},
    notify:  notify           ?? existing?.notify  ?? false,
  }

  const { data, error } = await supabase
    .from('saved_filters')
    .upsert(row, { onConflict: 'user_id' })
    .select('filters, notify, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── DELETE /api/saved-filters — 본인 행 삭제 ───────────────────────────────
export async function DELETE() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('saved_filters')
    .delete()
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
