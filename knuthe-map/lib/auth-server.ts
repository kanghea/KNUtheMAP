import { cache } from 'react'
import { createSupabaseServer } from './supabase-server'
import type { Role } from './useRole'

/**
 * React cache()로 RSC 렌더 패스 내에서 중복 호출 제거.
 * layout.tsx + page.tsx 가 각각 호출해도 getUser() 네트워크 왕복은 1번만 발생.
 */
export const getServerUser = cache(async () => {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getServerRole = cache(async (): Promise<Role> => {
  const user = await getServerUser()
  if (!user) return 'tenant'
  const supabase = await createSupabaseServer()
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  return (data?.role as Role) ?? 'tenant'
})
