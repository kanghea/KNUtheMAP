'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export type Role = 'tenant' | 'owner' | 'agent' | 'admin'

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
