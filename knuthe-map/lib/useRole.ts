'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export type Role = 'tenant' | 'owner' | 'agent' | 'admin'

/** document.cookie에서 knu_role 값을 읽는 헬퍼 */
function readRoleCookie(): Role | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)knu_role=([^;]+)/)
  return (match?.[1] as Role) ?? null
}

/** knu_role 쿠키를 갱신하는 헬퍼 (30일) */
function writeRoleCookie(role: Role) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 30
  document.cookie = `knu_role=${role}; path=/; max-age=${maxAge}; samesite=lax`
}

export function useRole(): Role | null {
  // 쿠키에 role이 있으면 즉시 반환 → 초기 렌더에서 깜빡임 없음
  const [role, setRole] = useState<Role | null>(() => readRoleCookie())

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

      const freshRole = (data?.role as Role) ?? 'tenant'
      setRole(freshRole)

      // DB 값이 쿠키와 다르면(role 변경 반영) 쿠키 동기화
      if (freshRole !== readRoleCookie()) {
        writeRoleCookie(freshRole)
      }
    }

    load()

    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => sub.subscription.unsubscribe()
  }, [])

  return role
}
