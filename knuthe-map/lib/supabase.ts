import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL!
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
}

let _supabase: SupabaseClient | undefined
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!_supabase) _supabase = createClient(getUrl(), getAnonKey())
    return Reflect.get(_supabase, prop, receiver)
  },
})

// 서버 전용 (Service Role) — API Route / Server Action에서만 사용
export function createServiceClient() {
  return createClient(getUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
