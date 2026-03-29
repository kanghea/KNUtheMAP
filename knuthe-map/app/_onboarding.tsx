'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getZoneByDept } from '@/lib/department-zones'
import { savePrefs } from '@/lib/prefs'
import StepRole, { type UserRole } from '@/components/onboarding/StepRole'
import StepRoleRequest        from '@/components/onboarding/StepRoleRequest'
import StepGrade              from '@/components/onboarding/StepGrade'
import StepDepartment         from '@/components/onboarding/StepDepartment'
import StepPriority           from '@/components/onboarding/StepPriority'
import StepGate               from '@/components/onboarding/StepGate'
import StepTheme              from '@/components/onboarding/StepTheme'

// ── 세입자 전용 스텝 ──────────────────────────────────────────────────────────
const TENANT_STEPS = [
  { id: 'grade',    title: '학번이 어떻게 되세요?',           sub: '맞춤 건물 정보를 보여드릴게요' },
  { id: 'dept',     title: '학과는요?',                       sub: '학과 위치에 가까운 구역부터 보여드릴게요' },
  { id: 'priority', title: '방 구할 때 뭐가 제일 중요해요?',  sub: '중요한 순서대로 하나씩 탭해 주세요' },
  { id: 'gate',     title: '학교 올 때 주로 어느 문 쓰세요?', sub: '가장 가까운 건물부터 순위를 매겨드릴게요' },
  { id: 'theme',    title: '화면 테마를 선택해주세요',         sub: '언제든지 메인 화면에서 바꿀 수 있어요' },
]

type Phase = 'role' | 'role-request' | 'role-pending' | 'tenant-steps'

export default function OnboardingClient() {
  const router = useRouter()

  // ── 공통 상태 ──────────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<Phase>('role')
  const [userRole,   setUserRole]   = useState<UserRole | null>(null)

  // ── 세입자 스텝 상태 ───────────────────────────────────────────────────────
  const [step,       setStep]       = useState(0)
  const [grade,      setGrade]      = useState('')
  const [dept,       setDept]       = useState('')
  const [priorities, setPriorities] = useState<string[]>([])
  const [gate,       setGate]       = useState<{ gate: string | null; minutes: number | null }>({ gate: null, minutes: null })
  const [theme,      setTheme]      = useState<'light' | 'dark' | null>(null)

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
    savePrefs({ grade: grade || null, dept: dept || null, zone: zone ?? null, priorities, gate: gate.gate, theme: theme ?? 'dark' })

    const params = new URLSearchParams()
    if (zone)              params.set('zone', zone)
    if (priorities.length) params.set('p',    priorities.join(','))
    if (gate.gate)         params.set('gate', gate.gate)
    router.push(`/map?${params.toString()}`)
  }

  const handleTenantNext = () => {
    if (step < TENANT_STEPS.length - 1) { setStep(step + 1) } else { handleTenantComplete() }
  }

  const handleSkip = () => router.push('/map')

  // ── 역할 선택 화면 ─────────────────────────────────────────────────────────
  if (phase === 'role') {
    return (
      <OnboardingShell
        title="KNUtheMAP에서 뭘 하실 건가요?"
        sub="용도에 맞게 맞춤 서비스를 제공해드려요"
        progress={null}
        onSkip={handleSkip}
      >
        <StepRole selected={userRole} onSelect={setUserRole} />
        <BottomBar canNext={!!userRole} onNext={handleRoleNext} label="다음" showBack={false} />
      </OnboardingShell>
    )
  }

  // ── 건물주/중개사 신청 ─────────────────────────────────────────────────────
  if (phase === 'role-request') {
    return (
      <OnboardingShell
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
      <OnboardingShell title="" sub="" progress={null} onSkip={null}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '20px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>⏳</div>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              신청이 완료됐어요!
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
              관리자 검토 후 승인 알림을 드려요<br />
              승인 전에도 방 구하기는 이용할 수 있어요
            </p>
          </div>
          <div style={{
            background: '#f8fafc', borderRadius: 14, padding: '14px 16px',
            width: '100%', border: '1px solid #f1f5f9',
          }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 4px', fontWeight: 600 }}>승인 완료 시</p>
            <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.6 }}>
              {userRole === 'owner'
                ? '건물 등록 및 호실·계약 관리 기능을 이용할 수 있어요'
                : '건물 매물 등록 및 계약 통계 기능을 이용할 수 있어요'}
            </p>
          </div>
          <button
            onClick={handleSkip}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            }}
          >
            지도 둘러보기
          </button>
        </div>
      </OnboardingShell>
    )
  }

  // ── 세입자 온보딩 스텝 ────────────────────────────────────────────────────
  const canNext = step === 1 ? !!dept : true
  const progress = ((step + 1) / TENANT_STEPS.length) * 100

  return (
    <OnboardingShell
      title={TENANT_STEPS[step].title}
      sub={TENANT_STEPS[step].sub}
      progress={progress}
      stepLabel={`${step + 1} / ${TENANT_STEPS.length}`}
      dots={{ total: TENANT_STEPS.length, current: step }}
      onSkip={handleSkip}
    >
      {step === 0 && <StepGrade      selected={grade || null}  onSelect={setGrade} />}
      {step === 1 && <StepDepartment selected={dept  || null}  onSelect={setDept} />}
      {step === 2 && <StepPriority   value={priorities}        onChange={setPriorities} />}
      {step === 3 && <StepGate       value={gate}              onChange={setGate} />}
      {step === 4 && <StepTheme      selected={theme}          onSelect={setTheme} />}
      <BottomBar
        canNext={canNext}
        onNext={handleTenantNext}
        onBack={step > 0 ? () => setStep(step - 1) : undefined}
        label={step === TENANT_STEPS.length - 1 ? '지도 보기' : '다음'}
        showBack={step > 0}
      />
    </OnboardingShell>
  )
}

// ── 공통 쉘 ───────────────────────────────────────────────────────────────────
function OnboardingShell({
  title, sub, progress, stepLabel, dots, onSkip, children,
}: {
  title: string; sub: string; progress: number | null
  stepLabel?: string
  dots?: { total: number; current: number }
  onSkip: (() => void) | null
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col"
      style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>

      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image src="/images/경북대 로고(현).png" alt="경북대학교" width={28} height={28}
            style={{ objectFit: 'contain' }} />
          <span className="text-sm font-bold text-gray-900">KNUtheMAP</span>
        </div>
        {onSkip && (
          <button onClick={onSkip} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            건너뛰기
          </button>
        )}
      </header>

      {/* 진행 바 */}
      {progress !== null && (
        <>
          <div className="h-1 bg-gray-100">
            <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {dots && (
            <div className="flex justify-center gap-2 pt-5 pb-2">
              {Array.from({ length: dots.total }).map((_, i) => (
                <div key={i} className={[
                  'h-2 rounded-full transition-all duration-300',
                  i === dots.current ? 'bg-blue-600 w-6' : i < dots.current ? 'bg-blue-300 w-2' : 'bg-gray-200 w-2',
                ].join(' ')} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 본문 */}
      <main className="flex-1 flex flex-col items-center justify-start px-5 pt-6 pb-28 max-w-lg mx-auto w-full overflow-y-auto">
        {(title || sub) && (
          <div className="mb-6 text-center w-full">
            {stepLabel && <p className="text-xs font-semibold text-blue-600 mb-1">{stepLabel}</p>}
            {title && <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>}
            {sub && <p className="text-sm text-gray-400">{sub}</p>}
          </div>
        )}
        <div className="w-full">{children}</div>
      </main>
    </div>
  )
}

// ── 하단 버튼 바 ──────────────────────────────────────────────────────────────
function BottomBar({
  canNext, onNext, onBack, label, showBack,
}: {
  canNext: boolean; onNext: () => void; onBack?: () => void
  label: string; showBack: boolean
}) {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4">
      <div className="flex gap-3 max-w-lg mx-auto">
        {showBack && onBack && (
          <button onClick={onBack}
            className="flex-none w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <button onClick={onNext} disabled={!canNext} className={[
          'flex-1 h-12 rounded-xl font-semibold text-sm transition-colors',
          canNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed',
        ].join(' ')}>
          {label}
        </button>
      </div>
    </div>
  )
}
