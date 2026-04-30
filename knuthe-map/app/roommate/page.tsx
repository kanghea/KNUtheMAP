import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import RoommateClient from './_client'

// 룸메이트 매칭 페이지의 진입 가드.
//
// 분기 우선순위:
//  1) 비로그인 → 룸메이트 온보딩 라우트로 (CTA 클릭 후 로그인 안 한 경우 포함)
//  2) admin → 관리자는 그대로 매칭 화면 진입 (디버그/검수 용도)
//  3) 룸메이트 프로필이 없음 → 온보딩 라우트로 (관심을 표현한 사용자에게 입력 받기)
//  4) 프로필이 있음 → 매칭 화면 진입 (role 이 tenant 라도 OK; 016_roommate.sql RLS 는
//     role='roommate' 를 검사하지만, /api/roommate POST 가 role 을 자동으로 갱신해
//     준다. 그래도 일관성을 위해 여기서 role 도 함께 정렬한다.)

export default async function RoommatePage({
  searchParams,
}: {
  searchParams: Promise<{ save_draft?: string }>
}) {
  const user = await getServerUser()

  // 1) 비로그인 → 온보딩으로 (체크리스트 입력 후 Google OAuth 분기 처리)
  if (!user) redirect('/onboarding/roommate')

  const role = await getServerRole()

  // 2) admin 은 통과
  if (role !== 'admin') {
    // 3) 프로필 없으면 온보딩으로
    const supabase = await createSupabaseServer()
    const { data: profile } = await supabase
      .from('roommate_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile) redirect('/onboarding/roommate')
  }

  const sp = await searchParams
  return <RoommateClient saveDraft={sp.save_draft === '1'} />
}
