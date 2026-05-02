'use client'

import { useEffect, useRef, useState } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { createBrowserSupabase } from '@/lib/supabase-browser'

/**
 * 방봐요 — 비로그인 사용자에게 자동으로 Supabase 익명 세션을 부여.
 *
 * 흐름:
 *   1. 마운트 시점에 supabase.auth.getUser() 로 현재 세션 확인
 *   2. 사용자 없으면 supabase.auth.signInAnonymously() 호출
 *   3. 성공하면 window.location.reload() — router.refresh() 보다 쿠키 동기화가
 *      확실 (Next 16 App Router 의 일부 경로에서 refresh 가 인증 쿠키를 새로
 *      읽지 않을 수 있음)
 *   4. 실패하면 화면에 명확한 에러 표시 + 재시도 버튼
 *
 * 보안:
 *   · `is_anonymous=true` 인 사용자도 RLS 통과 — 본인 데이터(자기 셋)만 접근
 *   · Supabase 대시보드 "Enable anonymous sign-ins" ON 필요
 *   · 마이그레이션 020 적용 필요 (handle_new_user 가 NULL email 처리)
 */
export default function EnsureAnonymousSession({ tok }: { tok?: ThemeTokens } = {}) {
  const tried   = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(true)

  const start = async () => {
    setError(null)
    setPending(true)

    const supabase = createBrowserSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // 이미 세션 있는데 서버가 인식 못 한 거면 reload 한 번이면 끝.
      window.location.reload()
      return
    }

    const { error: signErr } = await supabase.auth.signInAnonymously()
    if (signErr) {
      setError(signErr.message || '익명 사인업이 실패했어요')
      setPending(false)
      return
    }

    // 새 익명 세션 쿠키가 서버에 정상 전달되도록 강제 새로고침.
    window.location.reload()
  }

  useEffect(() => {
    if (tried.current) return
    tried.current = true
    // start 는 비동기로 setState 호출 — 정상 패턴이라 ESLint 룰만 비활성.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start()
  }, [])

  if (!error || !tok) {
    // 오류 없거나 토큰 없으면 UI 출력 X — page.tsx 가 EmptyState 로 받아줌
    return null
  }

  return (
    <div role="alert" style={{
      marginTop: 12,
      padding: '12px 14px',
      borderRadius: 12,
      background: tok.dangerBg,
      color:      tok.dangerColor,
      fontSize: 13, fontWeight: 600,
      textAlign: 'center',
    }}>
      <div>익명 세션을 만들지 못했어요</div>
      <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginTop: 4 }}>
        {error}
      </div>
      <button
        type="button"
        onClick={() => { tried.current = false; start() }}
        disabled={pending}
        className="knu-press"
        style={{
          marginTop: 10,
          padding: '6px 14px', borderRadius: 999,
          border: 'none',
          background: tok.dangerColor, color: '#fff',
          fontSize: 12, fontWeight: 700,
          cursor: pending ? 'default' : 'pointer',
          opacity: pending ? 0.6 : 1,
        }}
      >
        {pending ? '시도 중…' : '다시 시도'}
      </button>
    </div>
  )
}
