'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getZoneByDept } from '@/lib/department-zones'
import { savePrefs } from '@/lib/prefs'
import StepGrade      from '@/components/onboarding/StepGrade'
import StepDepartment from '@/components/onboarding/StepDepartment'
import StepPriority   from '@/components/onboarding/StepPriority'
import StepGate       from '@/components/onboarding/StepGate'

const STEPS = [
  { id: 'grade',    title: '학번이 어떻게 되세요?',           sub: '맞춤 건물 정보를 보여드릴게요' },
  { id: 'dept',     title: '학과는요?',                       sub: '학과 위치에 가까운 구역부터 보여드릴게요' },
  { id: 'priority', title: '방 구할 때 뭐가 제일 중요해요?',  sub: '중요한 순서대로 하나씩 탭해 주세요' },
  { id: 'gate',     title: '학교 올 때 주로 어느 문 쓰세요?', sub: '가장 가까운 건물부터 순위를 매겨드릴게요' },
]

export default function OnboardingClient() {
  const router = useRouter()
  const [step,       setStep]       = useState(0)
  const [grade,      setGrade]      = useState<string>('')
  const [dept,       setDept]       = useState<string>('')
  const [priorities, setPriorities] = useState<string[]>([])
  const [gate,       setGate]       = useState<{ gate: string | null; minutes: number | null }>({ gate: null, minutes: null })

  const canNext = step === 1 ? !!dept : true

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return }

    // 완료 → 쿠키 저장 후 /map 이동
    const zone = getZoneByDept(dept)
    savePrefs({ grade: grade || null, dept: dept || null, zone: zone ?? null, priorities, gate: gate.gate })

    const params = new URLSearchParams()
    if (zone)              params.set('zone', zone)
    if (priorities.length) params.set('p',    priorities.join(','))
    if (gate.gate)         params.set('gate', gate.gate)

    router.push(`/map?${params.toString()}`)
  }

  const handleSkip = () => router.push('/map')

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={28}
            height={28}
            style={{ objectFit: 'contain' }}
          />
          <span className="text-sm font-bold text-gray-900">KNUtheMAP</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          건너뛰기
        </button>
      </header>

      {/* 진행 바 */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* 단계 도트 */}
      <div className="flex justify-center gap-2 pt-5 pb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={[
              'h-2 rounded-full transition-all duration-300',
              i === step ? 'bg-blue-600 w-6' : i < step ? 'bg-blue-300 w-2' : 'bg-gray-200 w-2',
            ].join(' ')}
          />
        ))}
      </div>

      {/* 본문 */}
      <main className="flex-1 flex flex-col items-center justify-start px-5 pt-6 pb-28 max-w-lg mx-auto w-full overflow-y-auto">
        <div className="mb-6 text-center w-full">
          <p className="text-xs font-semibold text-blue-600 mb-1">{step + 1} / {STEPS.length}</p>
          <h1 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step].title}</h1>
          <p className="text-sm text-gray-400">{STEPS[step].sub}</p>
        </div>

        <div className="w-full">
          {step === 0 && <StepGrade      selected={grade || null}  onSelect={setGrade} />}
          {step === 1 && <StepDepartment selected={dept  || null}  onSelect={setDept} />}
          {step === 2 && <StepPriority   value={priorities}        onChange={setPriorities} />}
          {step === 3 && <StepGate       value={gate}              onChange={setGate} />}
        </div>
      </main>

      {/* 하단 버튼 */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-5 py-4">
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-none w-12 h-12 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={[
              'flex-1 h-12 rounded-xl font-semibold text-sm transition-colors',
              canNext ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed',
            ].join(' ')}
          >
            {step === STEPS.length - 1 ? '지도 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
