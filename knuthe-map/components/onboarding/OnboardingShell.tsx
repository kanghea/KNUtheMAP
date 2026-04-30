'use client'

import Image from 'next/image'

// ── 디자인 토큰 ─────────────────────────────────────────────────────────────
// 룸메이트 온보딩과 학생 온보딩 모두에서 공유하는 시각 토큰.
// 섀도/그라디언트/포커스 색상을 통일해야 하므로 단일 출처로 둔다.
export const ONBOARDING_TOKENS = {
  dark: {
    bg:              '#0a0a0a',
    surface:         '#141414',
    textPrimary:     '#ffffff',
    textSecondary:   'rgba(255,255,255,0.42)',
    textTertiary:    'rgba(255,255,255,0.25)',
    border:          'rgba(255,255,255,0.09)',
    progressBg:      'rgba(255,255,255,0.07)',
    progressFill:    '#6C63FF',
    dotActive:       '#6C63FF',
    dotDone:         'rgba(108,99,255,0.4)',
    dotIdle:         'rgba(255,255,255,0.12)',
    skipColor:       'rgba(255,255,255,0.32)',
    btnBack:         '#111111',
    btnBackBorder:   'rgba(255,255,255,0.12)',
    btnBackColor:    'rgba(255,255,255,0.5)',
    btnPrimary:      '#6C63FF',
    btnPrimaryText:  '#ffffff',
    btnGradient:     'linear-gradient(135deg, #6C63FF, #8B5CF6)',
    btnShadow:       '0 4px 20px rgba(108, 99, 255, 0.35)',
    btnDisabled:     'rgba(255,255,255,0.06)',
    btnDisabledText: 'rgba(255,255,255,0.18)',
    stepLabel:       '#6C63FF',
    logoFilter:      'brightness(0) invert(1)',
    cardBg:          '#111111',
    cardBorder:      'rgba(255,255,255,0.08)',
    cardActiveBg:    'rgba(108,99,255,0.10)',
    cardActiveBorder:'rgba(108,99,255,0.50)',
    cardActiveGlow:  '0 0 20px rgba(108,99,255,0.15)',
    cardAccent:      '#6C63FF',
    accent:          '#6C63FF',
  },
  light: {
    bg:              '#ffffff',
    surface:         '#f8fafc',
    textPrimary:     '#0f172a',
    textSecondary:   '#64748b',
    textTertiary:    '#94a3b8',
    border:          '#f1f5f9',
    progressBg:      '#f1f5f9',
    progressFill:    '#2563eb',
    dotActive:       '#2563eb',
    dotDone:         '#93c5fd',
    dotIdle:         '#e2e8f0',
    skipColor:       '#94a3b8',
    btnBack:         '#f8fafc',
    btnBackBorder:   '#e2e8f0',
    btnBackColor:    '#64748b',
    btnPrimary:      '#2563eb',
    btnPrimaryText:  '#ffffff',
    btnGradient:     'linear-gradient(135deg, #2563eb, #4f46e5)',
    btnShadow:       '0 4px 20px rgba(37, 99, 235, 0.25)',
    btnDisabled:     '#f1f5f9',
    btnDisabledText: '#cbd5e1',
    stepLabel:       '#2563eb',
    logoFilter:      'none',
    cardBg:          '#f2f2f7',
    cardBorder:      'rgba(0,0,0,0.06)',
    cardActiveBg:    'rgba(37,99,235,0.08)',
    cardActiveBorder:'rgba(37,99,235,0.40)',
    cardActiveGlow:  '0 0 16px rgba(37,99,235,0.12)',
    cardAccent:      '#2563eb',
    accent:          '#2563eb',
  },
} as const

export type OnboardingTok = typeof ONBOARDING_TOKENS[keyof typeof ONBOARDING_TOKENS]
export type OnboardingTheme = keyof typeof ONBOARDING_TOKENS

// ── 공통 쉘 ────────────────────────────────────────────────────────────────
export function OnboardingShell({
  tok, theme, title, sub, progress, stepLabel, dots, onSkip, children,
}: {
  tok:        OnboardingTok
  theme:      string
  title:      string
  sub:        string
  progress:   number | null
  stepLabel?: string
  dots?:      { total: number; current: number }
  onSkip:     (() => void) | null
  children:   React.ReactNode
}) {
  return (
    <div
      data-theme={theme}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     100,
        overflowY:  'auto',
        display:    'flex',
        flexDirection: 'column',
        background:  tok.bg,
        transition: 'background .45s ease',
      }}
    >
      <header style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '16px 20px',
        borderBottom:   `1px solid ${tok.border}`,
        transition:     'border-color .45s ease',
        flexShrink:     0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={28}
            height={28}
            style={{ objectFit: 'contain', filter: tok.logoFilter, transition: 'filter .45s ease' }}
          />
          <span style={{ fontSize: 14, fontWeight: 800, color: tok.textPrimary, transition: 'color .45s ease' }}>
            KNUtheMAP
          </span>
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              fontSize:   12,
              color:      tok.skipColor,
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              padding:    '4px 2px',
              transition: 'color .45s ease',
            }}
          >
            건너뛰기
          </button>
        )}
      </header>

      {progress !== null && (
        <>
          <div style={{
            height:     3,
            background: tok.progressBg,
            flexShrink: 0,
            transition: 'background .45s ease',
          }}>
            <div style={{
              height:     '100%',
              background: tok.progressFill,
              width:      `${progress}%`,
              transition: 'width .45s ease, background .45s ease',
            }} />
          </div>

          {dots && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 20, paddingBottom: 4 }}>
              {Array.from({ length: dots.total }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height:     8,
                    borderRadius: 999,
                    background: i === dots.current
                      ? tok.dotActive
                      : i < dots.current
                        ? tok.dotDone
                        : tok.dotIdle,
                    width: i === dots.current ? 24 : 8,
                    transition: 'width .3s ease, background .45s ease',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      <main style={{
        flex:       1,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding:    '24px 20px 120px',
        maxWidth:   480,
        width:      '100%',
        margin:     '0 auto',
        overflowY:  'auto',
      }}>
        {(title || sub) && (
          <div style={{ marginBottom: 24, textAlign: 'center', width: '100%' }}>
            {stepLabel && (
              <p style={{ fontSize: 12, fontWeight: 700, color: tok.stepLabel, marginBottom: 4, transition: 'color .45s ease' }}>
                {stepLabel}
              </p>
            )}
            {title && (
              <h1 style={{ fontSize: 21, fontWeight: 800, color: tok.textPrimary, margin: '0 0 6px', transition: 'color .45s ease', lineHeight: 1.3 }}>
                {title}
              </h1>
            )}
            {sub && (
              <p style={{ fontSize: 14, color: tok.textSecondary, margin: 0, transition: 'color .45s ease' }}>
                {sub}
              </p>
            )}
          </div>
        )}
        <div style={{ width: '100%' }}>{children}</div>
      </main>
    </div>
  )
}

// ── 하단 버튼 바 ────────────────────────────────────────────────────────────
export function OnboardingBottomBar({
  tok, canNext, onNext, onBack, label, showBack,
}: {
  tok:      OnboardingTok
  canNext:  boolean
  onNext:   () => void
  onBack?:  () => void
  label:    string
  showBack: boolean
}) {
  return (
    <div style={{
      position:   'fixed',
      bottom:     0,
      left:       0,
      right:      0,
      background: tok.bg,
      borderTop:  `1px solid ${tok.border}`,
      padding:    '14px 20px',
      paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
      transition: 'background .45s ease, border-color .45s ease',
      zIndex:     10,
    }}>
      <div style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto' }}>
        {showBack && onBack && (
          <button
            onClick={onBack}
            style={{
              flexShrink:     0,
              width:          52,
              height:         52,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              borderRadius:   14,
              border:         `1px solid ${tok.btnBackBorder}`,
              background:     tok.btnBack,
              cursor:         'pointer',
              color:          tok.btnBackColor,
              transition:     'background .45s ease, border-color .45s ease, color .45s ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!canNext}
          style={{
            flex:         1,
            height:       52,
            borderRadius: 14,
            border:       'none',
            cursor:       canNext ? 'pointer' : 'not-allowed',
            fontSize:     15,
            fontWeight:   700,
            background:   canNext ? tok.btnGradient : tok.btnDisabled,
            color:        canNext ? tok.btnPrimaryText : tok.btnDisabledText,
            boxShadow:    canNext ? tok.btnShadow : 'none',
            opacity:      canNext ? 1 : 0.35,
            transition:   'background .45s ease, color .45s ease, box-shadow .45s ease, opacity .45s ease',
          }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}
