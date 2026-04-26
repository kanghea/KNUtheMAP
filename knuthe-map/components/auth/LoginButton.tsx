'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createBrowserSupabase } from '@/lib/supabase-browser'

interface UserProfile {
  id: string
  nickname: string | null
  avatar_url: string | null
  role: string
}

export default function LoginButton() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserSupabase()

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const res = await fetch('/api/auth/me')
        const json = await res.json()
        setUser(json.user)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const res = await fetch('/api/auth/me')
        const json = await res.json()
        setUser(json.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (loading) return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />

  if (!user) {
    return (
      <button
        onClick={() => router.push('/login')}
        className="text-sm font-semibold text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
      >
        로그인
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.nickname ?? '프로필 사진'}
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
          {(user.nickname ?? '?')[0]}
        </div>
      )}
      <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600">
        로그아웃
      </button>
    </div>
  )
}
