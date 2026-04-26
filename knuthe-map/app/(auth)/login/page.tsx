'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { useTheme } from '@/lib/hooks/useTheme'
import { Card } from '@/components/shared/Card'

// Open Redirect 방지: 같은 출처의 상대 경로만 허용 (//evil.com 차단)
function safeNext(raw: string | null): string {
  if (!raw) return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function LoginPage() {
  const { tok } = useTheme()
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (loading) return
    setLoading(true)
    const next = safeNext(new URLSearchParams(window.location.search).get('next'))
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback },
    })
    // OAuth가 즉시 redirect하므로 보통 여기 도달 X. 실패 시에만 버튼 복귀.
    if (error) setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: tok.pageBg, padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 384 }}>
        <Card tok={tok} radius={16} padding="40px 32px"
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: tok.textPrimary }}>KNUtheMAP</span>
            <span style={{ fontSize: 14, color: tok.textTertiary }}>경북대 주변 건물 정보 지도</span>
          </div>

          <div style={{ width: '100%', borderTop: `1px solid ${tok.cardBorder}` }} />

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            aria-label="Google로 로그인"
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              border: `1px solid ${tok.inputBorder}`,
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 14, fontWeight: 600,
              color: tok.textPrimary,
              background: tok.inputBg,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.15s, opacity 0.15s',
            }}
          >
            {loading ? (
              <span className="knu-spin" style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${tok.textTertiary}`,
                borderTopColor: tok.textPrimary,
              }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? '로그인 중…' : 'Google로 로그인'}
          </button>

          <p style={{ fontSize: 12, color: tok.textTertiary, textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            로그인하면 리뷰 작성과 거래 제보가 가능합니다
          </p>
        </Card>
      </div>
    </div>
  )
}
