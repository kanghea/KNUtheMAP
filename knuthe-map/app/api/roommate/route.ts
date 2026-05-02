import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { sealRole, ROLE_COOKIE_NAME, ROLE_COOKIE_OPTIONS } from '@/lib/role-cookie'
import {
  sealViewMode,
  VIEW_MODE_COOKIE_NAME,
  VIEW_MODE_COOKIE_OPTIONS,
} from '@/lib/view-mode-cookie'

// POST /api/roommate — 룸메이트 프로필 생성/업데이트
//
// 설계 메모:
//  - users.role 은 여기 한 곳에서만 'roommate' 로 갱신된다(RLS 정책이 요구).
//    이후의 사용자 모드 토글은 viewMode 쿠키만 갱신하고 DB는 건드리지 않는다.
//  - role 쿠키와 viewMode 쿠키도 함께 발행해 SSR이 즉시 새 상태로 렌더되도록 한다.
export async function POST(request: Request) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { profile, weights } = body

  if (!profile || !weights) {
    return NextResponse.json({ error: 'Missing profile or weights' }, { status: 400 })
  }

  // dept 는 roommate_profiles 컬럼이 아니라 users.dept 로 동기화 — 분리.
  // student_id 는 roommate_profiles 컬럼이지만 users.grade(text) 에도 동시에
  // 채워둬 마이페이지·랜딩에서 일관되게 표시한다.
  const { dept, ...profileForRoommate } = profile as Record<string, unknown> & { dept?: unknown }
  const studentIdNum = typeof profileForRoommate.student_id === 'number'
    ? profileForRoommate.student_id
    : null

  // 프로필 upsert (user_id가 unique이므로 conflict 시 업데이트)
  const { data, error } = await supabase
    .from('roommate_profiles')
    .upsert({
      user_id: user.id,
      ...profileForRoommate,
      swipe_weights: weights,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 현재 role 확인 — 이미 roommate면 굳이 다시 쓰지 않는다(불필요한 DB write 방지)
  const { data: u } = await supabase
    .from('users')
    .select('role, dept, grade')
    .eq('id', user.id)
    .single()

  // role · dept · grade 동기화 — 변경된 필드만 업데이트
  const userUpdate: Record<string, string> = {}
  if (u?.role !== 'roommate')                 userUpdate.role  = 'roommate'
  if (typeof dept === 'string' && dept && u?.dept !== dept) userUpdate.dept  = dept
  if (studentIdNum) {
    const gradeStr = `${studentIdNum}학번`
    if (u?.grade !== gradeStr) userUpdate.grade = gradeStr
  }
  if (Object.keys(userUpdate).length > 0) {
    await supabase
      .from('users')
      .update(userUpdate)
      .eq('id', user.id)
  }

  // 응답에 role / viewMode 쿠키 동봉 — 이후 SSR 패스에서 즉시 'roommate' 모드로 표시
  const response = NextResponse.json({ profile: data })
  response.cookies.set(ROLE_COOKIE_NAME, sealRole('roommate'), ROLE_COOKIE_OPTIONS)
  response.cookies.set(VIEW_MODE_COOKIE_NAME, sealViewMode('roommate'), VIEW_MODE_COOKIE_OPTIONS)
  return response
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
      bedtime_start: p.bedtime_start,
      bedtime_end: p.bedtime_end,
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
