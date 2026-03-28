import { createClient } from '@supabase/supabase-js'

// 모듈 로드 시 즉시 createClient를 호출하지 않고 함수로 감싸
// 빌드 타임(env 미설정)에 throw되지 않도록 lazy 초기화
let _supabase: ReturnType<typeof createClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop: string | symbol) {
    if (!_supabase) {
      _supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// 서버 전용 (Service Role) — API Route / Server Action에서만 사용
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
