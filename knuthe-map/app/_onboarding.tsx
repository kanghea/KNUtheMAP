'use client'

// 온보딩 클라이언트.
//
// 새 플로우 (테마는 /settings/theme 로 분리, 방내놓기·중개사는 숨김):
//   1) 공통 — 학과 → 학번 → 성별 (모든 사용자 공통)
//   2) 모드 — 방보기 / 방봐요 / 룸메이트 3분기
//   3) 분기별
//      · rooms     : 우선순위 → 주로 쓰는 문 → /map
//      · bangbwayo : 즉시 /bangbwayo
//      · roommate  : 체크리스트(섹션0의 학과·학번·성별은 prefill·disabled) → 스와이프 → 로그인

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getZoneByDept } from '@/lib/department-zones'
import { savePrefs, type OnboardingMode } from '@/lib/prefs'
import StepRole                         from '@/components/onboarding/StepRole'
import StepGrade                        from '@/components/onboarding/StepGrade'
import StepDepartment                   from '@/components/onboarding/StepDepartment'
import StepGender, { type Gender }      from '@/components/onboarding/StepGender'
import StepPriority                     from '@/components/onboarding/StepPriority'
import StepGate                         from '@/components/onboarding/StepGate'
import RoommateChecklist, { isSectionComplete } from '@/components/onboarding/RoommateChecklist'
import RoommateSwipe                    from '@/components/onboarding/RoommateSwipe'
import {
  OnboardingShell,
  OnboardingBottomBar,
  ONBOARDING_TOKENS,
} from '@/components/onboarding/OnboardingShell'
import { type RoommateProfile, type SwipeWeights, saveRoommateDraft } from '@/lib/roommate-constants'
import { createBrowserSupabase }        from '@/lib/supabase-browser'
import { loadPrefs }                    from '@/lib/prefs'

// 토큰은 OnboardingShell 모듈에서 단일 출처로 관리한다.
const TOKENS = ONBOARDING_TOKENS

// ── 공통 스텝 — 모든 사용자가 받는 4문항(학교 KNU 고정 + 학과/학번/성별) ──
const COMMON_STEPS = [
  { id: 'dept',   title: '학과가 어디예요?',           sub: '학과 위치에 가까운 구역부터 보여드릴게요' },
  { id: 'grade',  title: '학번이 어떻게 되세요?',       sub: '비슷한 학번 선배들이 많이 사는 구역부터 보여드릴게요' },
  { id: 'gender', title: '성별을 알려주세요',           sub: '룸메이트 매칭 동성 우선 표시에 사용해요' },
]

// ── 방보기 모드 추가 스텝 (학과·학번은 공통에서 받았으므로 우선순위·문만) ──
const ROOMS_STEPS = [
  { id: 'priority', title: '방 구할 때 뭐가 제일 중요해요?',  sub: '중요한 순서대로 하나씩 탭해 주세요' },
  { id: 'gate',     title: '학교 올 때 주로 어느 문 쓰세요?', sub: '해당 문 가까운 매물을 먼저 보여드릴게요' },
]

type Phase =
  | 'common-steps'
  | 'role'
  | 'rooms-steps'
  | 'roommate-checklist'
  | 'roommate-swipe'
  | 'roommate-login'

const ROOMMATE_SECTIONS = [
  { title: '기본 정보를 알려주세요',      sub: '거주 유형·생년 등 추가 정보만 알려주세요' },
  { title: '수면 패턴은 어떤가요?',       sub: '잠드는 시간, 잠버릇 등을 알려주세요' },
  { title: '위생·청결 습관이에요',        sub: '샤워·청소 습관을 알려주세요' },
  { title: '생활 환경 선호가 궁금해요',    sub: '온도, 소리, 흡연 습관을 알려주세요' },
  { title: '생활 습관을 알려주세요',       sub: '음주, 게임, 운동 등의 습관이에요' },
  { title: '사회·관계 성향이에요',         sub: '물건 공유, 친구 초대 등을 알려주세요' },
  { title: '마지막이에요!',               sub: 'MBTI, 한 줄 소개를 남겨주세요' },
]

export default function OnboardingClient() {
  const router = useRouter()

  // 기존 prefs 가 있으면 테마는 보존(/settings/theme 에서 별도 변경 가능).
  // 라이트가 기본값이지만 사용자가 다크로 바꿔둔 경우 유지된다.
  const initialPrefs = typeof window !== 'undefined' ? loadPrefs() : null
  const initialTheme = (initialPrefs?.theme ?? 'light')

  // ── 공통 상태 ─────────────────────────────────────────────────────
  const [phase,    setPhase]    = useState<Phase>('common-steps')
  const [step,     setStep]     = useState(0)
  const [dept,     setDept]     = useState('')
  const [grade,    setGrade]    = useState('')
  const [gender,   setGender]   = useState<Gender | null>(null)
  const [mode,     setMode]     = useState<OnboardingMode | null>(null)

  // ── 방보기 모드 상태 ───────────────────────────────────────────────
  const [priorities, setPriorities] = useState<string[]>([])
  const [gate,       setGate]       = useState<{ gate: string | null; minutes: number | null }>({ gate: null, minutes: null })

  // ── 룸메이트 상태 ──────────────────────────────────────────────────
  const [rmSection,    setRmSection]    = useState(0)
  const [rmProfile,    setRmProfile]    = useState<Partial<RoommateProfile>>({
    sleep_habits: ['없음'], light_sleep: 2, cleanliness: 2,
    cold_sensitivity: 2, heat_sensitivity: 2, relationship: 2,
  })
  const [rmWeights,    setRmWeights]    = useState<SwipeWeights>({})
  const [loginLoading, setLoginLoading] = useState(false)

  const tok = TOKENS[initialTheme]

  // ── 공통 스텝 진행 / 완료 ──────────────────────────────────────────
  const commonCanNext =
    step === 0 ? !!dept :
    step === 1 ? !!grade :
    step === 2 ? !!gender :
    false

  const handleCommonNext = () => {
    if (step < COMMON_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      // 공통 완료 → 모드 선택. 학과·학번·성별을 prefs 에 즉시 저장(임시 — 모드 완료
      // 시 zone/priority/gate 까지 합쳐 다시 저장). 학과/학번은 RoommateChecklist 의
      // 섹션0 prefill 데이터로도 사용한다.
      savePrefs({
        grade: grade || null,
        dept:  dept  || null,
        zone:  getZoneByDept(dept) ?? null,
        priorities: [],
        gate:  null,
        theme: initialTheme,
        gender,
        mode:  null,
      })
      setPhase('role')
    }
  }

  // ── 모드 선택 → 분기 ───────────────────────────────────────────────
  const handleRoleNext = () => {
    if (!mode) return
    if (mode === 'rooms') {
      setPhase('rooms-steps')
      setStep(0)
    } else if (mode === 'bangbwayo') {
      // 방봐요는 추가 스텝 0개 — 즉시 진입.
      savePrefs({
        grade: grade || null,
        dept:  dept  || null,
        zone:  getZoneByDept(dept) ?? null,
        priorities: [],
        gate:  null,
        theme: initialTheme,
        gender,
        mode:  'bangbwayo',
      })
      router.push('/bangbwayo')
    } else {
      // 룸메이트 — 공통에서 받은 학과·학번·성별을 rmProfile 에 미리 채워 둠.
      // RoommateChecklist 의 섹션0 prefill 로직이 이 값을 보고 disabled 처리한다.
      const studentIdNum = grade ? parseInt(grade.replace(/\D/g, ''), 10) : NaN
      setRmProfile((prev) => ({
        ...prev,
        dept: dept || prev.dept,
        student_id: Number.isFinite(studentIdNum) ? studentIdNum : prev.student_id,
        gender: gender ?? prev.gender,
      }))
      setPhase('roommate-checklist')
      setRmSection(0)
    }
  }

  // ── 방보기 진행 / 완료 ─────────────────────────────────────────────
  const roomsCanNext = step === 0 ? priorities.length > 0 : !!gate.gate
  const handleRoomsNext = () => {
    if (step < ROOMS_STEPS.length - 1) {
      setStep(step + 1)
    } else {
      const zone = getZoneByDept(dept)
      savePrefs({
        grade: grade || null,
        dept:  dept  || null,
        zone:  zone  ?? null,
        priorities,
        gate:  gate.gate,
        theme: initialTheme,
        gender,
        mode:  'rooms',
      })
      const params = new URLSearchParams()
      if (zone)              params.set('zone', zone)
      if (priorities.length) params.set('p',    priorities.join(','))
      if (gate.gate)         params.set('gate', gate.gate)
      router.push(`/map?${params.toString()}`)
    }
  }

  // ── 룸메이트 진행 ──────────────────────────────────────────────────
  const handleRmNext = () => {
    if (rmSection < ROOMMATE_SECTIONS.length - 1) {
      setRmSection(rmSection + 1)
    } else {
      setPhase('roommate-swipe')
    }
  }

  const handleSwipeComplete = (weights: SwipeWeights) => {
    setRmWeights(weights)
    saveRoommateDraft(rmProfile, weights)
    savePrefs({
      grade: rmProfile.student_id ? `${rmProfile.student_id}학번` : (grade || null),
      dept:  rmProfile.dept ?? (dept || null),
      zone:  getZoneByDept(rmProfile.dept ?? dept) ?? null,
      priorities: [],
      gate:  null,
      theme: initialTheme,
      gender: (rmProfile.gender as Gender | undefined) ?? gender,
      mode:  'roommate',
    })
    setPhase('roommate-login')
  }

  const handleRoommateLogin = async () => {
    saveRoommateDraft(rmProfile, rmWeights)
    setLoginLoading(true)
    const supabase = createBrowserSupabase()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/roommate` },
    })
    if (error) setLoginLoading(false)
  }

  const handleSkip = () => {
    // 익명 세입자로 둘러보기 — prefs 비워두고 지도로 진입.
    savePrefs({
      grade: null, dept: null, zone: null,
      priorities: [], gate: null,
      theme: initialTheme, gender: null, mode: null,
    })
    router.push('/map')
  }

  // ── 공통 4문항 화면 ───────────────────────────────────────────────
  if (phase === 'common-steps') {
    const cur = COMMON_STEPS[step]
    const progress = ((step + 1) / COMMON_STEPS.length) * 100
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title={cur.title}
        sub={cur.sub}
        progress={progress}
        stepLabel={`${step + 1} / ${COMMON_STEPS.length}`}
        dots={{ total: COMMON_STEPS.length, current: step }}
        onSkip={handleSkip}
      >
        {cur.id === 'dept'   && <StepDepartment selected={dept || null}  onSelect={setDept}  tok={tok} />}
        {cur.id === 'grade'  && <StepGrade      selected={grade || null} onSelect={setGrade} tok={tok} />}
        {cur.id === 'gender' && <StepGender     selected={gender}        onSelect={setGender} tok={tok} />}
        <OnboardingBottomBar
          tok={tok}
          canNext={commonCanNext}
          onNext={handleCommonNext}
          onBack={step > 0 ? () => setStep(step - 1) : undefined}
          label="다음"
          showBack={step > 0}
        />
      </OnboardingShell>
    )
  }

  // ── 모드 선택 화면 ─────────────────────────────────────────────────
  if (phase === 'role') {
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title="어떤 목적으로 오셨어요?"
        sub="선택에 따라 딱 맞는 화면을 보여드릴게요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRole selected={mode} onSelect={setMode} tok={tok} />
        <OnboardingBottomBar
          tok={tok}
          canNext={!!mode}
          onNext={handleRoleNext}
          label="다음"
          showBack
          onBack={() => { setPhase('common-steps'); setStep(COMMON_STEPS.length - 1) }}
        />
      </OnboardingShell>
    )
  }

  // ── 방보기 추가 스텝 ───────────────────────────────────────────────
  if (phase === 'rooms-steps') {
    const cur = ROOMS_STEPS[step]
    const progress = ((step + 1) / ROOMS_STEPS.length) * 100
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title={cur.title}
        sub={cur.sub}
        progress={progress}
        stepLabel={`${step + 1} / ${ROOMS_STEPS.length}`}
        dots={{ total: ROOMS_STEPS.length, current: step }}
        onSkip={handleSkip}
      >
        {cur.id === 'priority' && <StepPriority value={priorities} onChange={setPriorities} tok={tok} />}
        {cur.id === 'gate'     && <StepGate     value={gate}        onChange={setGate} dept={dept || null} tok={tok} />}
        <OnboardingBottomBar
          tok={tok}
          canNext={roomsCanNext}
          onNext={handleRoomsNext}
          onBack={step > 0 ? () => setStep(step - 1) : () => setPhase('role')}
          label={step === ROOMS_STEPS.length - 1 ? '지도 보기' : '다음'}
          showBack
        />
      </OnboardingShell>
    )
  }

  // ── 룸메이트 체크리스트 ────────────────────────────────────────────
  if (phase === 'roommate-checklist') {
    const rmCanNext = isSectionComplete(rmSection, rmProfile)
    const rmProgress = ((rmSection + 1) / ROOMMATE_SECTIONS.length) * 100
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title={ROOMMATE_SECTIONS[rmSection].title}
        sub={ROOMMATE_SECTIONS[rmSection].sub}
        progress={rmProgress}
        stepLabel={`${rmSection + 1} / ${ROOMMATE_SECTIONS.length}`}
        dots={{ total: ROOMMATE_SECTIONS.length, current: rmSection }}
        onSkip={null}
        scrollKey={`roommate-checklist:${rmSection}`}
      >
        <RoommateChecklist
          section={rmSection}
          profile={rmProfile}
          onChange={(updates: Partial<RoommateProfile>) => setRmProfile((prev: Partial<RoommateProfile>) => ({ ...prev, ...updates }))}
          tok={tok}
          lockedFields={{
            dept:       !!dept,
            student_id: !!grade,
            gender:     !!gender,
          }}
        />
        <OnboardingBottomBar
          tok={tok}
          canNext={rmCanNext}
          onNext={handleRmNext}
          onBack={rmSection > 0 ? () => setRmSection(rmSection - 1) : () => setPhase('role')}
          label="다음"
          showBack
        />
      </OnboardingShell>
    )
  }

  // ── 룸메이트 스와이프 ──────────────────────────────────────────────
  if (phase === 'roommate-swipe') {
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title="원하는 룸메이트 조건"
        sub="두 가지 중 더 중요한 조건을 골라주세요"
        progress={null}
        onSkip={null}
        scrollKey="roommate-swipe"
      >
        <RoommateSwipe onComplete={handleSwipeComplete} tok={tok} />
      </OnboardingShell>
    )
  }

  // ── 룸메이트 로그인 화면 ───────────────────────────────────────────
  return (
    <OnboardingShell tok={tok} theme={initialTheme} title="" sub="" progress={null} onSkip={null} scrollKey="roommate-login">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: initialTheme === 'dark' ? 'rgba(108,99,255,0.15)' : 'rgba(37,99,235,0.08)',
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: tok.textPrimary, margin: '0 0 8px' }}>
            프로필 등록 준비 완료!
          </h2>
          <p style={{ fontSize: 13, color: tok.textSecondary, lineHeight: 1.7, margin: 0 }}>
            입력한 정보를 저장하려면<br />
            구글 로그인이 필요해요
          </p>
        </div>
        <div style={{
          background: tok.surface, borderRadius: 14, padding: '14px 16px',
          width: '100%', border: `1px solid ${tok.border}`,
        }}>
          <p style={{ fontSize: 12, color: tok.textTertiary, margin: '0 0 4px', fontWeight: 600 }}>로그인 후</p>
          <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
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
