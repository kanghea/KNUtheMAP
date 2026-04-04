import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// POST /api/roommate — 룸메이트 프로필 생성/업데이트
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { profile, weights } = body

  if (!profile || !weights) {
    return NextResponse.json({ error: 'Missing profile or weights' }, { status: 400 })
  }

  // 프로필 upsert (user_id가 unique이므로 conflict 시 업데이트)
  const { data, error } = await supabase
    .from('roommate_profiles')
    .upsert({
      user_id: user.id,
      ...profile,
      swipe_weights: weights,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // role을 roommate로 업데이트
  await supabase
    .from('users')
    .update({ role: 'roommate' })
    .eq('id', user.id)

  return NextResponse.json({ profile: data })
}

// GET /api/roommate — 매칭 목록 조회
export async function GET(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const livingType = searchParams.get('living_type') // 'dormitory' | 'offcampus'
  const dormitory = searchParams.get('dormitory')

  // 내 프로필 먼저 확인
  const { data: myProfile } = await supabase
    .from('roommate_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) {
    return NextResponse.json({ error: 'Profile not found', needsOnboarding: true }, { status: 404 })
  }

  // 다른 프로필 조회
  let query = supabase
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 각 프로필에 대해 호환도 점수 계산
  const results = []
  for (const p of profiles ?? []) {
    const { data: scoreData } = await supabase
      .rpc('calculate_compatibility', {
        viewer_id: user.id,
        target_id: p.user_id,
      })

    results.push({
      user_id: p.user_id,
      compatibility: scoreData ?? 0,
      nickname: (p as Record<string, unknown>).users
        ? ((p as Record<string, unknown>).users as Record<string, unknown>).nickname
        : null,
      avatar_url: (p as Record<string, unknown>).users
        ? ((p as Record<string, unknown>).users as Record<string, unknown>).avatar_url
        : null,
      dept: (p as Record<string, unknown>).users
        ? ((p as Record<string, unknown>).users as Record<string, unknown>).dept
        : null,
      grade: (p as Record<string, unknown>).users
        ? ((p as Record<string, unknown>).users as Record<string, unknown>).grade
        : null,
      // 카드에 표시할 정보
      living_type: p.living_type,
      dormitory: p.dormitory,
      student_id: p.student_id,
      bedtime: p.bedtime,
      smoking: p.smoking,
      cleanliness: p.cleanliness,
      introduction: p.introduction,
      // 상세 페이지에서만 공개되는 정보는 제외
      // sleep_habits, drinking_freq, drinking_amount, sharing 등
    })
  }

  // 호환도 높은 순 정렬
  results.sort((a, b) => b.compatibility - a.compatibility)

  return NextResponse.json({ matches: results, myProfile })
}
