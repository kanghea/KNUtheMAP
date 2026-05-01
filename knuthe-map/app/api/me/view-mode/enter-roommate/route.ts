import { NextResponse } from 'next/server'
import {
  sealViewMode,
  VIEW_MODE_COOKIE_NAME,
  VIEW_MODE_COOKIE_OPTIONS,
} from '@/lib/view-mode-cookie'

// GET /api/me/view-mode/enter-roommate
//
// 메인 랜딩의 룸메이트 CTA(일러스트)에서 호출되는 "한 클릭 모드 전환" 진입점.
// JS 없이도 동작하도록 Link href 로 직접 가리키며, 쿠키를 봉인한 뒤 /roommate 로
// 302 리다이렉트한다. /roommate 페이지의 진입 가드는 그대로 유효(비로그인 →
// /onboarding/roommate, 프로필 없음 → /onboarding/roommate). 그 경우에도 쿠키는
// 미리 세팅되어, 온보딩 완료 후 첫 SSR 부터 룸메이트 홈으로 자연스럽게 안착된다.
//
// users.role 은 여기서 변경하지 않는다 — role 은 /api/roommate POST 의 단독 책임.
// 프로필이 없는 사용자에게 viewMode 쿠키만 미리 세팅해도 home(`/`) 분기에서는
// role==='roommate' 가 함께 만족되어야 RoommateLanding 으로 가므로 부수효과 없음.
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/roommate', request.url))
  response.cookies.set(
    VIEW_MODE_COOKIE_NAME,
    sealViewMode('roommate'),
    VIEW_MODE_COOKIE_OPTIONS,
  )
  return response
}
