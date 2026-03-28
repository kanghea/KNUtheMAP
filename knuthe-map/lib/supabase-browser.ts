import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // During build-time prerender, env vars may be absent.
    // Return a dummy client that won't make real requests.
    return createBrowserClient('https://placeholder.supabase.co', 'placeholder')
  }
  return createBrowserClient(url, key)
}
