import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'

// POST /api/roommate — 룸메이트 프로필 생성/업데이트
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { profile, weights } = body as { profile: Record<string, unknown>; weights: Record<string, unknown> }

  if (!profile || !weights) {
    return NextResponse.json({ error: 'Missing profile or weights' }, { status: 400 })
  }

  // service role 클라이언트 사용 (RLS 우회) — 프로필 upsert + role 업데이트
  const admin = createServiceClient()

  // 프로필 upsert (user_id가 unique이므로 conflict 시 업데이트)
  const { data, error } = await admin
    .from('roommate_profiles')
    .upsert({
      user_id: user.id,
      ...profile,
      swipe_weights: weights,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    console.error('[roommate POST] upsert error:', error)
    return NextResponse.json({ error: error.message, details: error.details }, { status: 500 })
  }

  // role을 roommate로 업데이트 (service role로 RLS 우회)
  const { error: roleError } = await admin
    .from('users')
    .update({ role: 'roommate' })
    .eq('id', user.id)

  if (roleError) {
    console.error('[roommate POST] role update error:', roleError)
    // 프로필은 저장됐으므로 에러를 무시하지 않고 경고만
  }

  return NextResponse.json({ profile: data })
}

// GET /api/roommate — 매칭 목록 조회
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const livingType = searchParams.get('living_type')
  const dormitory = searchParams.get('dormitory')

  // service role로 조회 (RLS 없이 모든 프로필 접근)
  const admin = createServiceClient()

  // 내 프로필 먼저 확인
  const { data: myProfile } = await admin
    .from('roommate_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) {
    return NextResponse.json({ error: 'Profile not found', needsOnboarding: true }, { status: 404 })
  }

  // 다른 프로필 조회
  let query = admin
    .from('roommate_profiles')
    .select('*, users!inner(nickname, avatar_url, dept, grade)')
    .neq('user_id', user.id)

  if (livingType) {
    query = query.eq('living_type', livingType)
  }
  if (dormitory) {
    query = query.eq('dormitory', dormitory)
  }

  const { data: profiles, error } = await query

  if (error) {
    console.error('[roommate GET] query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 각 프로필에 대해 호환도 점수 계산
  const results = []
  for (const p of profiles ?? []) {
    const { data: scoreData } = await admin
      .rpc('calculate_compatibility', {
        viewer_id: user.id,
        target_id: p.user_id,
      })

    const userInfo = (p as Record<string, unknown>).users as Record<string, unknown> | null

    results.push({
      user_id: p.user_id,
      compatibility: scoreData ?? 0,
      nickname: userInfo?.nickname ?? null,
      avatar_url: userInfo?.avatar_url ?? null,
      dept: userInfo?.dept ?? null,
      grade: userInfo?.grade ?? null,
      living_type: p.living_type,
      dormitory: p.dormitory,
      student_id: p.student_id,
      bedtime: p.bedtime,
      smoking: p.smoking,
      cleanliness: p.cleanliness,
      introduction: p.introduction,
    })
  }

  // 호환도 높은 순 정렬
  results.sort((a, b) => b.compatibility - a.compatibility)

  return NextResponse.json({ matches: results, myProfile })
}
