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
import RoommateChecklist, { isSectionComplete } from '@/components/onboarding/RoommateChecklist'
import RoommateSwipe                    from '@/components/onboarding/RoommateSwipe'
import { type RoommateProfile, type SwipeWeights, saveRoommateDraft } from '@/lib/roommate-constants'
import { createBrowserSupabase }        from '@/lib/supabase-browser'

// ── 테마 디자인 토큰 ───────────────────────────────────────────────────────────
const TOKENS = {
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

// ── 세입자 스텝 ───────────────────────────────────────────────────────────────
const TENANT_STEPS = [
  { id: 'dept',     title: '학과가 어디예요?',                 sub: '학과 위치에 가까운 구역부터 보여드릴게요' },
  { id: 'grade',    title: '학번이 어떻게 되세요?',           sub: '맞춤 건물 정보를 보여드릴게요' },
  { id: 'priority', title: '방 구할 때 뭐가 제일 중요해요?',  sub: '중요한 순서대로 하나씩 탭해 주세요' },
  { id: 'gate',     title: '학교 올 때 주로 어느 문 쓰세요?', sub: '가장 가까운 건물부터 순위를 매겨드릴게요' },
]

type Phase = 'theme' | 'role' | 'role-request' | 'role-pending' | 'tenant-steps' | 'roommate-checklist' | 'roommate-swipe' | 'roommate-login'

const ROOMMATE_SECTIONS = [
  { title: '기본 정보를 알려주세요',      sub: '생년·학번·거주 유형을 선택해 주세요' },
  { title: '수면 패턴은 어떤가요?',       sub: '잠드는 시간, 잠버릇 등을 알려주세요' },
  { title: '위생·청결 습관이에요',        sub: '샤워·청소 습관을 알려주세요' },
  { title: '생활 환경 선호가 궁금해요',    sub: '온도, 소리, 흡연 습관을 알려주세요' },
  { title: '생활 습관을 알려주세요',       sub: '음주, 게임, 운동 등의 습관이에요' },
  { title: '사회·관계 성향이에요',         sub: '물건 공유, 친구 초대 등을 알려주세요' },
  { title: '마지막이에요!',               sub: 'MBTI, 한 줄 소개를 남겨주세요' },
]

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

  // ── 룸메이트 스텝 상태 ────────────────────────────────────────────────────
  const [rmSection,    setRmSection]    = useState(0)
  const [rmProfile,    setRmProfile]    = useState<Partial<RoommateProfile>>({ sleep_habits: ['없음'], light_sleep: 2, cleanliness: 2, cold_sensitivity: 2, heat_sensitivity: 2, relationship: 2 })
  const [rmWeights,    setRmWeights]    = useState<SwipeWeights>({})
  const [loginLoading, setLoginLoading] = useState(false)

  const tok = TOKENS[theme]

  // ── 역할 선택 → 다음 단계 분기 ────────────────────────────────────────────
  const handleRoleNext = () => {
    if (!userRole) return
    if (userRole === 'tenant') {
      setPhase('tenant-steps')
    } else if (userRole === 'roommate') {
      setPhase('roommate-checklist')
    } else {
      setPhase('role-request')
    }
  }

  // ── 룸메이트 체크리스트 진행 ────────────────────────────────────────────────
  const handleRmNext = () => {
    if (rmSection < ROOMMATE_SECTIONS.length - 1) {
      setRmSection(rmSection + 1)
    } else {
      // 체크리스트 완료 → 스와이프로 이동
      setPhase('roommate-swipe')
    }
  }

  const handleSwipeComplete = (weights: SwipeWeights) => {
    setRmWeights(weights)
    // 임시 저장
    saveRoommateDraft(rmProfile, weights)
    setPhase('roommate-login')
  }

  const handleRoommateLogin = async () => {
    // 로컬스토리지에 임시 저장 후 구글 로그인 진행
    saveRoommateDraft(rmProfile, rmWeights)
    setLoginLoading(true)
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/roommate` },
    })
    if (error) setLoginLoading(false)
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
        theme={theme}
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
        theme={theme}
        title="KNUtheMAP에서 뭘 하실 건가요?"
        sub="용도에 맞게 맞춤 서비스를 제공해드려요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRole selected={userRole} onSelect={setUserRole} tok={tok} />
        <BottomBar tok={tok} canNext={!!userRole} onNext={handleRoleNext} label="다음" showBack
          onBack={() => setPhase('theme')} />
      </OnboardingShell>
    )
  }

  // ── 방 내놓기/중개사 신청 ───────────────────────────────────────────────────
  if (phase === 'role-request') {
    return (
      <OnboardingShell
        tok={tok}
        theme={theme}
        title={userRole === 'owner' ? '방 내놓기 신청' : '공인중개사 신청'}
        sub="정보를 입력하면 관리자가 검토 후 승인해드려요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRoleRequest
          role={userRole as 'owner' | 'agent'}
          onSubmitted={() => setPhase('role-pending')}
          onBack={() => setPhase('role')}
          tok={tok}
        />
      </OnboardingShell>
    )
  }

  // ── 승인 대기 화면 ─────────────────────────────────────────────────────────
  if (phase === 'role-pending') {
    return (
      <OnboardingShell tok={tok} theme={theme} title="" sub="" progress={null} onSkip={null}>
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

  // ── 룸메이트 체크리스트 화면 ─────────────────────────────────────────────
  if (phase === 'roommate-checklist') {
    const rmCanNext = isSectionComplete(rmSection, rmProfile)
    const rmProgress = ((rmSection + 1) / ROOMMATE_SECTIONS.length) * 100

    return (
      <OnboardingShell
        tok={tok}
        theme={theme}
        title={ROOMMATE_SECTIONS[rmSection].title}
        sub={ROOMMATE_SECTIONS[rmSection].sub}
        progress={rmProgress}
        stepLabel={`${rmSection + 1} / ${ROOMMATE_SECTIONS.length}`}
        dots={{ total: ROOMMATE_SECTIONS.length, current: rmSection }}
        onSkip={null}
      >
        <RoommateChecklist
          section={rmSection}
          profile={rmProfile}
          onChange={(updates: Partial<RoommateProfile>) => setRmProfile((prev: Partial<RoommateProfile>) => ({ ...prev, ...updates }))}
          tok={tok}
        />
        <BottomBar
          tok={tok}
          canNext={rmCanNext}
          onNext={handleRmNext}
          onBack={rmSection > 0 ? () => setRmSection(rmSection - 1) : () => setPhase('role')}
          label={rmSection === ROOMMATE_SECTIONS.length - 1 ? '다음' : '다음'}
          showBack
        />
      </OnboardingShell>
    )
  }

  // ── 룸메이트 스와이프 화면 ─────────────────────────────────────────────────
  if (phase === 'roommate-swipe') {
    return (
      <OnboardingShell
        tok={tok}
        theme={theme}
        title="원하는 룸메이트 조건"
        sub="두 가지 중 더 중요한 조건을 골라주세요"
        progress={null}
        onSkip={null}
      >
        <RoommateSwipe onComplete={handleSwipeComplete} tok={tok} />
      </OnboardingShell>
    )
  }

  // ── 룸메이트 로그인 화면 ──────────────────────────────────────────────────
  if (phase === 'roommate-login') {
    return (
      <OnboardingShell tok={tok} theme={theme} title="" sub="" progress={null} onSkip={null}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: theme === 'dark' ? 'rgba(108,99,255,0.15)' : 'rgba(37,99,235,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" width={32} height={32} fill="none"
              stroke={tok.accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: tok.textPrimary, margin: '0 0 8px', transition: 'color .4s ease' }}>
              프로필 등록 준비 완료!
            </h2>
            <p style={{ fontSize: 13, color: tok.textSecondary, lineHeight: 1.7, margin: 0, transition: 'color .4s ease' }}>
              입력한 정보를 저장하려면<br />
              구글 로그인이 필요해요
            </p>
          </div>
          <div style={{
            background: tok.surface, borderRadius: 14, padding: '14px 16px',
            width: '100%', border: `1px solid ${tok.border}`,
            transition: 'background .4s ease, border-color .4s ease',
          }}>
            <p style={{ fontSize: 12, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600, transition: 'color .4s ease' }}>로그인 후</p>
            <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6, transition: 'color .4s ease' }}>
              나와 생활 습관이 맞는 룸메이트를 추천해드려요
            </p>
          </div>
          <button
            onClick={handleRoommateLogin}
            disabled={loginLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: tok.btnGradient, color: tok.btnPrimaryText,
              border: 'none', cursor: loginLoading ? 'wait' : 'pointer',
              fontSize: 14, fontWeight: 700, boxShadow: tok.btnShadow,
              opacity: loginLoading ? 0.6 : 1,
              transition: 'background .4s ease, opacity .3s ease',
            }}
          >
            {loginLoading ? '로그인 중...' : 'Google로 로그인'}
          </button>
          <button
            onClick={() => setPhase('roommate-swipe')}
            style={{
              fontSize: 12, color: tok.skipColor, background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 2px',
            }}
          >
            이전으로
          </button>
        </div>
      </OnboardingShell>
    )
  }

  // ── 세입자 온보딩 스텝 ────────────────────────────────────────────────────
  const canNext  = step === 0 ? !!dept : true
  const progress = ((step + 1) / TENANT_STEPS.length) * 100

  return (
    <OnboardingShell
      tok={tok}
      theme={theme}
      title={TENANT_STEPS[step].title}
      sub={TENANT_STEPS[step].sub}
      progress={progress}
      stepLabel={`${step + 1} / ${TENANT_STEPS.length}`}
      dots={{ total: TENANT_STEPS.length, current: step }}
      onSkip={handleSkip}
    >
      {step === 0 && <StepDepartment selected={dept  || null}  onSelect={setDept} tok={tok} />}
      {step === 1 && <StepGrade      selected={grade || null}  onSelect={setGrade} tok={tok} />}
      {step === 2 && <StepPriority   value={priorities}        onChange={setPriorities} tok={tok} />}
      {step === 3 && <StepGate       value={gate}              onChange={setGate} dept={dept || null} tok={tok} />}
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
  tok, theme, title, sub, progress, stepLabel, dots, onSkip, children,
}: {
  tok:       Tok
  theme:     string
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
      data-theme={theme}
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
