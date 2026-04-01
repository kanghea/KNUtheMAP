'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getZoneByDept } from '@/lib/department-zones'
import { savePrefs } from '@/lib/prefs'
import StepRole,      { type UserRole } from '@/components/onboarding/StepRole'
import StepRoleRequest                  from '@/components/onboarding/StepRoleRequest'
import StepGrade                        from '@/components/onboarding/StepGrade'
import StepDepartment                   from '@/components/onboarding/StepDepartment'
import StepPriority                     from '@/components/onboarding/StepPriority'
import StepGate                         from '@/components/onboarding/StepGate'
import StepTheme,     { type Theme }    from '@/components/onboarding/StepTheme'

// ── 테마 디자인 토큰 ───────────────────────────────────────────────────────────
const TOKENS = {
  dark: {
    bg:             '#0a0a0a',
    surface:        '#141414',
    textPrimary:    '#ffffff',
    textSecondary:  'rgba(255,255,255,0.42)',
    textTertiary:   'rgba(255,255,255,0.25)',
    border:         'rgba(255,255,255,0.09)',
    progressBg:     'rgba(255,255,255,0.07)',
    progressFill:   '#818cf8',
    dotActive:      '#818cf8',
    dotDone:        'rgba(129,140,248,0.4)',
    dotIdle:        'rgba(255,255,255,0.12)',
    skipColor:      'rgba(255,255,255,0.32)',
    btnBack:        'rgba(255,255,255,0.07)',
    btnBackBorder:  'rgba(255,255,255,0.12)',
    btnBackColor:   'rgba(255,255,255,0.5)',
    btnPrimary:     '#818cf8',
    btnPrimaryText: '#ffffff',
    btnDisabled:    'rgba(255,255,255,0.06)',
    btnDisabledText:'rgba(255,255,255,0.18)',
    stepLabel:      '#818cf8',
    logoFilter:     'brightness(0) invert(1)',
  },
  light: {
    bg:             '#ffffff',
    surface:        '#f8fafc',
    textPrimary:    '#0f172a',
    textSecondary:  '#64748b',
    textTertiary:   '#94a3b8',
    border:         '#f1f5f9',
    progressBg:     '#f1f5f9',
    progressFill:   '#2563eb',
    dotActive:      '#2563eb',
    dotDone:        '#93c5fd',
    dotIdle:        '#e2e8f0',
    skipColor:      '#94a3b8',
    btnBack:        '#f8fafc',
    btnBackBorder:  '#e2e8f0',
    btnBackColor:   '#64748b',
    btnPrimary:     '#2563eb',
    btnPrimaryText: '#ffffff',
    btnDisabled:    '#f1f5f9',
    btnDisabledText:'#cbd5e1',
    stepLabel:      '#2563eb',
    logoFilter:     'none',
  },
} as const

// ── 세입자 스텝 ───────────────────────────────────────────────────────────────
const TENANT_STEPS = [
  { id: 'grade',    title: '학번이 어떻게 되세요?',           sub: '맞춤 건물 정보를 보여드릴게요' },
  { id: 'dept',     title: '학과는요?',                       sub: '학과 위치에 가까운 구역부터 보여드릴게요' },
  { id: 'priority', title: '방 구할 때 뭐가 제일 중요해요?',  sub: '중요한 순서대로 하나씩 탭해 주세요' },
  { id: 'gate',     title: '학교 올 때 주로 어느 문 쓰세요?', sub: '가장 가까운 건물부터 순위를 매겨드릴게요' },
]

type Phase = 'theme' | 'role' | 'role-request' | 'role-pending' | 'tenant-steps'

export default function OnboardingClient() {
  const router = useRouter()

  // ── 공통 상태 ──────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<Phase>('theme')
  const [theme,      setTheme]      = useState<Theme>('dark')
  const [userRole,   setUserRole]   = useState<UserRole | null>(null)

  // ── 세입자 스텝 상태 ───────────────────────────────────────────────────────
  const [step,       setStep]       = useState(0)
  const [grade,      setGrade]      = useState('')
  const [dept,       setDept]       = useState('')
  const [priorities, setPriorities] = useState<string[]>([])
  const [gate,       setGate]       = useState<{ gate: string | null; minutes: number | null }>({ gate: null, minutes: null })

  const tok = TOKENS[theme]

  // ── 역할 선택 → 다음 단계 분기 ────────────────────────────────────────────
  const handleRoleNext = () => {
    if (!userRole) return
    if (userRole === 'tenant') {
      setPhase('tenant-steps')
    } else {
      setPhase('role-request')
    }
  }

  // ── 세입자 온보딩 완료 ────────────────────────────────────────────────────
  const handleTenantComplete = () => {
    const zone = getZoneByDept(dept)
    savePrefs({ grade: grade || null, dept: dept || null, zone: zone ?? null, priorities, gate: gate.gate, theme })

    const params = new URLSearchParams()
    if (zone)              params.set('zone', zone)
    if (priorities.length) params.set('p',    priorities.join(','))
    if (gate.gate)         params.set('gate', gate.gate)
    router.push(`/map?${params.toString()}`)
  }

  const handleTenantNext = () => {
    if (step < TENANT_STEPS.length - 1) { setStep(step + 1) } else { handleTenantComplete() }
  }

  const handleSkip = () => {
    savePrefs({ grade: null, dept: null, zone: null, priorities: [], gate: null, theme })
    router.push('/map')
  }

  // ── 테마 선택 화면 ─────────────────────────────────────────────────────────
  if (phase === 'theme') {
    return (
      <OnboardingShell
        tok={tok}
        title="어떤 화면이 편하세요?"
        sub="언제든 설정에서 바꿀 수 있어요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepTheme selected={theme} onSelect={setTheme} />
        <BottomBar tok={tok} canNext onNext={() => setPhase('role')} label="다음" showBack={false} />
      </OnboardingShell>
    )
  }

  // ── 역할 선택 화면 ─────────────────────────────────────────────────────────
  if (phase === 'role') {
    return (
      <OnboardingShell
        tok={tok}
        title="KNUtheMAP에서 뭘 하실 건가요?"
        sub="용도에 맞게 맞춤 서비스를 제공해드려요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRole selected={userRole} onSelect={setUserRole} />
        <BottomBar tok={tok} canNext={!!userRole} onNext={handleRoleNext} label="다음" showBack
          onBack={() => setPhase('theme')} />
      </OnboardingShell>
    )
  }

  // ── 건물주/중개사 신청 ─────────────────────────────────────────────────────
  if (phase === 'role-request') {
    return (
      <OnboardingShell
        tok={tok}
        title={userRole === 'owner' ? '건물주 신청' : '공인중개사 신청'}
        sub="정보를 입력하면 관리자가 검토 후 승인해드려요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRoleRequest
          role={userRole as 'owner' | 'agent'}
          onSubmitted={() => setPhase('role-pending')}
          onBack={() => setPhase('role')}
        />
      </OnboardingShell>
    )
  }

  // ── 승인 대기 화면 ─────────────────────────────────────────────────────────
  if (phase === 'role-pending') {
    return (
      <OnboardingShell tok={tok} title="" sub="" progress={null} onSkip={null}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(251,191,36,0.15)' : '#fef3c7',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>⏳</div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: tok.textPrimary, margin: '0 0 8px', transition: 'color .4s ease' }}>
              신청이 완료됐어요!
            </h2>
            <p style={{ fontSize: 13, color: tok.textSecondary, lineHeight: 1.7, margin: 0, transition: 'color .4s ease' }}>
              관리자 검토 후 승인 알림을 드려요<br />
              승인 전에도 방 구하기는 이용할 수 있어요
            </p>
          </div>
          <div style={{
            background: tok.surface, borderRadius: 14, padding: '14px 16px',
            width: '100%', border: `1px solid ${tok.border}`,
            transition: 'background .4s ease, border-color .4s ease',
          }}>
            <p style={{ fontSize: 12, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600, transition: 'color .4s ease' }}>승인 완료 시</p>
            <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6, transition: 'color .4s ease' }}>
              {userRole === 'owner'
                ? '건물 등록 및 호실·계약 관리 기능을 이용할 수 있어요'
                : '건물 매물 등록 및 계약 통계 기능을 이용할 수 있어요'}
            </p>
          </div>
          <button
            onClick={handleSkip}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: tok.btnPrimary, color: tok.btnPrimaryText,
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
              transition: 'background .4s ease',
            }}
          >
            지도 둘러보기
          </button>
        </div>
      </OnboardingShell>
    )
  }

  // ── 세입자 온보딩 스텝 ────────────────────────────────────────────────────
  const canNext  = step === 1 ? !!dept : true
  const progress = ((step + 1) / TENANT_STEPS.length) * 100

  return (
    <OnboardingShell
      tok={tok}
      title={TENANT_STEPS[step].title}
      sub={TENANT_STEPS[step].sub}
      progress={progress}
      stepLabel={`${step + 1} / ${TENANT_STEPS.length}`}
      dots={{ total: TENANT_STEPS.length, current: step }}
      onSkip={handleSkip}
    >
      {step === 0 && <StepGrade      selected={grade || null}  onSelect={setGrade} tok={tok} />}
      {step === 1 && <StepDepartment selected={dept  || null}  onSelect={setDept} tok={tok} />}
      {step === 2 && <StepPriority   value={priorities}        onChange={setPriorities} />}
      {step === 3 && <StepGate       value={gate}              onChange={setGate} />}
      <BottomBar
        tok={tok}
        canNext={canNext}
        onNext={handleTenantNext}
        onBack={step > 0 ? () => setStep(step - 1) : () => setPhase('role')}
        label={step === TENANT_STEPS.length - 1 ? '지도 보기' : '다음'}
        showBack
      />
    </OnboardingShell>
  )
}

// ── 공통 쉘 ───────────────────────────────────────────────────────────────────
type Tok = typeof TOKENS[keyof typeof TOKENS]

function OnboardingShell({
  tok, title, sub, progress, stepLabel, dots, onSkip, children,
}: {
  tok:       Tok
  title:     string
  sub:       string
  progress:  number | null
  stepLabel?: string
  dots?:     { total: number; current: number }
  onSkip:    (() => void) | null
  children:  React.ReactNode
}) {
  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     100,
        overflowY:  'auto',
        display:    'flex',
        flexDirection: 'column',
        // 핵심: 테마 전환 시 배경색이 부드럽게 바뀜
        background:  tok.bg,
        transition: 'background .45s ease',
      }}
    >
      {/* 헤더 */}
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

      {/* 진행 바 */}
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

      {/* 본문 */}
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

// ── 하단 버튼 바 ──────────────────────────────────────────────────────────────
function BottomBar({
  tok, canNext, onNext, onBack, label, showBack,
}: {
  tok:      Tok
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
      // safe area for iOS
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
              width:          48,
              height:         48,
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
            height:       48,
            borderRadius: 14,
            border:       'none',
            cursor:       canNext ? 'pointer' : 'not-allowed',
            fontSize:     15,
            fontWeight:   700,
            background:   canNext ? tok.btnPrimary : tok.btnDisabled,
            color:        canNext ? tok.btnPrimaryText : tok.btnDisabledText,
            transition:   'background .45s ease, color .45s ease',
          }}
        >
          {label}
        </button>
      </div>
    </div>
  )
}
