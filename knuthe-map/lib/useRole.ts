'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export type Role = 'tenant' | 'owner' | 'agent' | 'admin'

/**
 * 클라이언트에서 현재 사용자의 role을 반환합니다.
 *
 * 보안 설계:
 *  - knu_role 쿠키는 HttpOnly이므로 document.cookie로 읽기 불가.
 *    → XSS로 role 쿠키를 탈취할 수 없습니다.
 *  - role은 항상 Supabase DB에서 직접 조회 (권위적인 출처).
 *  - 서버가 렌더한 initialRole(PrefsIsland prop)이 DB 조회 완료 전
 *    네비게이션 바에 표시되므로 깜빡임이 없습니다.
 */
export function useRole(): Role | null {
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabase()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRole('tenant'); return }

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      setRole((data?.role as Role) ?? 'tenant')
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => sub.subscription.unsubscribe()
  }, [])

  return role
}
