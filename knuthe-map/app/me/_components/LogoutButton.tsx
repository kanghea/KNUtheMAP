'use client'

import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <button
        onClick={handleLogout}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, color: '#94a3b8', fontWeight: 500, padding: '8px',
        }}
      >
        로그아웃
      </button>
    </div>
  )
}
