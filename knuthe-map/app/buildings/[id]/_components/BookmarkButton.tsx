'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type Status = 'loading' | 'unauthenticated' | 'bookmarked' | 'not-bookmarked'

interface Props {
  buildingId: string
  theme: 'dark' | 'light'
}

const TOK = {
  dark: {
    cardBg:        'transparent',
    cardBorder:    'rgba(255,255,255,0.08)',
    titleColor:    'rgba(255,255,255,0.80)',
    subColor:      'rgba(255,255,255,0.35)',
    btnBorder:     'rgba(255,255,255,0.10)',
    btnBg:         'transparent',
    btnColor:      'rgba(255,255,255,0.35)',
    btnActiveBg:   'rgba(129,140,248,0.18)',
    btnActiveBorder:'#818cf8',
    btnActiveColor: '#818cf8',
    tooltipBg:     '#1e1e2e',
    tooltipBorder: 'rgba(255,255,255,0.12)',
    tooltipText:   'rgba(255,255,255,0.82)',
    tooltipSub:    'rgba(255,255,255,0.45)',
    loginBtn:      '#818cf8',
    loginBtnText:  '#ffffff',
  },
  light: {
    cardBg:        'transparent',
    cardBorder:    'rgba(0,0,0,0.08)',
    titleColor:    '#1e293b',
    subColor:      '#94a3b8',
    btnBorder:     'rgba(0,0,0,0.10)',
    btnBg:         'transparent',
    btnColor:      '#94a3b8',
    btnActiveBg:   '#eff6ff',
    btnActiveBorder:'#2563eb',
    btnActiveColor: '#2563eb',
    tooltipBg:     '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText:   '#1e293b',
    tooltipSub:    '#64748b',
    loginBtn:      '#2563eb',
    loginBtnText:  '#ffffff',
  },
} as const

export default function BookmarkButton({ buildingId, theme }: Props) {
  const tok = TOK[theme]
  const [status, setStatus]           = useState<Status>('loading')
  const [showTooltip, setShowTooltip] = useState(false)
  const [animating, setAnimating]     = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/bookmarks/${buildingId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.unauthenticated) setStatus('unauthenticated')
        else setStatus(d.bookmarked ? 'bookmarked' : 'not-bookmarked')
      })
      .catch(() => setStatus('not-bookmarked'))
  }, [buildingId])

  const handleClick = async () => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setShowTooltip(true)
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      tooltipTimer.current = setTimeout(() => setShowTooltip(false), 3000)
      return
    }

    // 낙관적 업데이트
    const next = status === 'bookmarked' ? 'not-bookmarked' : 'bookmarked'
    setStatus(next)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)

    const method = next === 'bookmarked' ? 'POST' : 'DELETE'
    const res = await fetch(`/api/bookmarks/${buildingId}`, { method })
    if (!res.ok) setStatus(status) // 실패 시 롤백
  }

  const isActive = status === 'bookmarked'

  return (
    <div style={{ position: 'relative' }}>
      {/* 관심등록 카드 */}
      <div
        style={{
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          background: tok.cardBg,
          border: `1px solid ${isActive ? tok.btnActiveBorder : tok.cardBorder}`,
          transition: 'border-color .3s ease',
        }}
      >
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: tok.titleColor, margin: 0 }}>
            이 건물에 관심 있으신가요?
          </p>
          <p style={{ fontSize: 12, marginTop: 3, color: tok.subColor, lineHeight: 1.4 }}>
            {isActive ? '관심 건물로 등록됐어요!' : '관심등록 하면 새로운 리뷰를 알려드려요!'}
          </p>
        </div>

        <button
          onClick={handleClick}
          disabled={status === 'loading'}
          aria-label="관심 건물 등록"
          style={{
            width: 42, height: 42,
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            cursor: status === 'loading' ? 'default' : 'pointer',
            background: isActive ? tok.btnActiveBg : tok.btnBg,
            border: `1px solid ${isActive ? tok.btnActiveBorder : tok.btnBorder}`,
            color: isActive ? tok.btnActiveColor : tok.btnColor,
            transform: animating ? 'scale(1.22)' : 'scale(1)',
            transition: 'transform .25s cubic-bezier(.34,1.56,.64,1), background .25s ease, border-color .25s ease, color .25s ease',
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill={isActive ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        </button>
      </div>

      {/* 로그인 필요 토스트 */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: -16,
            zIndex: 50,
            background: tok.tooltipBg,
            border: `1px solid ${tok.tooltipBorder}`,
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            minWidth: 220,
            animation: 'fadeSlideUp .2s ease',
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: tok.tooltipText, margin: '0 0 4px' }}>
            로그인이 필요해요
          </p>
          <p style={{ fontSize: 12, color: tok.tooltipSub, margin: '0 0 12px', lineHeight: 1.5 }}>
            관심 건물 등록은 로그인 후 이용할 수 있어요
          </p>
          <Link
            href="/login"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '9px',
              borderRadius: 10,
              background: tok.loginBtn,
              color: tok.loginBtnText,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            로그인하기
          </Link>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  )
}
