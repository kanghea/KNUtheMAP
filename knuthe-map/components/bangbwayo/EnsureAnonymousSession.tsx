'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

/**
 * 방봐요 — 비로그인 사용자에게 자동으로 Supabase 익명 세션을 부여.
 *
 * 흐름:
 *   1. 마운트 시점에 supabase.auth.getUser() 로 현재 세션 확인
 *   2. 사용자 없으면 supabase.auth.signInAnonymously() 호출
 *   3. 성공하면 router.refresh() 로 서버 컴포넌트가 새 사용자로 다시 페치
 *
 * 보안:
 *   · `is_anonymous=true` 인 사용자가 RLS 통과 — 본인 데이터(자기 셋)만 접근
 *   · 정식 로그인 시 별도 PR 에서 linkIdentity 로 데이터 인계
 *   · Supabase 대시보드에서 "Enable anonymous sign-ins" ON 필요
 *
 * 페이지 본문 어디에도 두기만 하면 됨 — visible UI 0.
 */
export default function EnsureAnonymousSession() {
  const router  = useRouter()
  const tried   = useRef(false)

  useEffect(() => {
    if (tried.current) return
    tried.current = true

    let cancelled = false

    ;(async () => {
      const supabase = createBrowserSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (user) return  // 이미 로그인(또는 익명) 됨

      const { error } = await supabase.auth.signInAnonymously()
      if (cancelled) return
      if (error) {
        // 가장 흔한 케이스: 대시보드에서 Anonymous Auth 가 OFF
        // 사용자에게 보일 메시지는 페이지 자체 EmptyState 가 처리.
        console.warn('[bangbwayo] anonymous sign-in failed:', error.message)
        return
      }

      // 새 익명 user_id 로 서버 컴포넌트가 다시 페치하도록.
      router.refresh()
    })()

    return () => { cancelled = true }
  }, [router])

  return null
}
