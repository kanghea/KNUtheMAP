'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoommateChecklist, { isSectionComplete } from '@/components/onboarding/RoommateChecklist'
import RoommateSwipe from '@/components/onboarding/RoommateSwipe'
import {
  OnboardingShell,
  OnboardingBottomBar,
  ONBOARDING_TOKENS,
  type OnboardingTheme,
} from '@/components/onboarding/OnboardingShell'
import {
  type RoommateProfile,
  type SwipeWeights,
  saveRoommateDraft,
} from '@/lib/roommate-constants'
import { savePrefs } from '@/lib/prefs'
import { createBrowserSupabase } from '@/lib/supabase-browser'

const ROOMMATE_SECTIONS = [
  { title: '기본 정보를 알려주세요',     sub: '학과·학번·성별·거주 유형을 알려주세요' },
  { title: '수면 패턴은 어떤가요?',      sub: '잠드는 시간, 잠버릇 등을 알려주세요' },
  { title: '위생·청결 습관이에요',       sub: '샤워·청소 습관을 알려주세요' },
  { title: '생활 환경 선호가 궁금해요',  sub: '온도, 소리, 흡연 습관을 알려주세요' },
  { title: '생활 습관을 알려주세요',     sub: '음주, 게임, 운동 등의 습관이에요' },
  { title: '사회·관계 성향이에요',       sub: '물건 공유, 친구 초대 등을 알려주세요' },
  { title: '마지막이에요!',              sub: 'MBTI, 한 줄 소개를 남겨주세요' },
]

type Phase = 'checklist' | 'swipe' | 'saving' | 'login-required'

export default function RoommateOnboardingClient({
  initialTheme,
  isLoggedIn,
}: {
  initialTheme: OnboardingTheme
  isLoggedIn:   boolean
}) {
  const router = useRouter()
  const tok    = ONBOARDING_TOKENS[initialTheme]

  const [phase,        setPhase]        = useState<Phase>('checklist')
  const [section,      setSection]      = useState(0)
  const [profile,      setProfile]      = useState<Partial<RoommateProfile>>({
    sleep_habits:     ['없음'],
    light_sleep:      2,
    cleanliness:      2,
    cold_sensitivity: 2,
    heat_sensitivity: 2,
    relationship:     2,
  })
  const [weights,      setWeights]      = useState<SwipeWeights>({})
  const [loginLoading, setLoginLoading] = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  // ── 체크리스트 진행 ─────────────────────────────────────────────────────
  const handleChecklistNext = () => {
    if (section < ROOMMATE_SECTIONS.length - 1) {
      setSection(section + 1)
    } else {
      setPhase('swipe')
    }
  }

  // ── 스와이프 완료 → 저장 분기 ────────────────────────────────────────────
  const handleSwipeComplete = async (w: SwipeWeights) => {
    setWeights(w)

    // 비로그인: 로컬스토리지에 임시 저장하고 Google OAuth 로 진입.
    // /auth/callback?next=/roommate 가 role 을 roommate 로 세팅하고
    // /roommate 페이지가 save_draft 쿼리로 draft 를 picks-up 한다.
    if (!isLoggedIn) {
      saveRoommateDraft(profile, w)
      // 온보딩 완료 표시 — 비로그인으로 종료해도 다음 방문 시 온보딩으로 되돌아가지 않도록 prefs 쿠키 저장.
      // 학과·학번도 같이 저장: OAuth callback 의 prefs 동기화 분기가 users.dept/grade 를
      // 채워주는 백업 경로로 동작 (메인 동기화는 /api/roommate POST 에서 한다).
      savePrefs({
        grade: profile.student_id ? `${profile.student_id}학번` : null,
        dept:  profile.dept ?? null,
        zone:  null, priorities: [], gate: null, theme: initialTheme,
      })
      setPhase('login-required')
      return
    }

    // 로그인 상태: 곧장 서버 저장
    setPhase('saving')
    setError(null)
    try {
      const res = await fetch('/api/roommate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ profile, weights: w }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? '저장에 실패했어요')
      }
      // /api/roommate 가 users.role 을 roommate 로 갱신했으므로
      // role 쿠키를 새로 받아오기 위해 router.refresh() 후 이동
      router.refresh()
      router.push('/roommate')
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했어요')
      setPhase('swipe')
    }
  }

  const handleGoogleLogin = async () => {
    saveRoommateDraft(profile, weights)
    setLoginLoading(true)
    const supabase = createBrowserSupabase()
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/auth/callback?next=/roommate` },
    })
    if (err) setLoginLoading(false)
  }

  // ── 체크리스트 화면 ──────────────────────────────────────────────────────
  if (phase === 'checklist') {
    const canNext  = isSectionComplete(section, profile)
    const progress = ((section + 1) / ROOMMATE_SECTIONS.length) * 100
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title={ROOMMATE_SECTIONS[section].title}
        sub={ROOMMATE_SECTIONS[section].sub}
        progress={progress}
        stepLabel={`${section + 1} / ${ROOMMATE_SECTIONS.length}`}
        dots={{ total: ROOMMATE_SECTIONS.length, current: section }}
        onSkip={null}
        scrollKey={`checklist:${section}`}
      >
        <RoommateChecklist
          section={section}
          profile={profile}
          onChange={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
          tok={tok}
        />
        <OnboardingBottomBar
          tok={tok}
          canNext={canNext}
          onNext={handleChecklistNext}
          onBack={section > 0 ? () => setSection(section - 1) : () => router.back()}
          label="다음"
          showBack
        />
      </OnboardingShell>
    )
  }

  // ── 스와이프 화면 ─────────────────────────────────────────────────────────
  if (phase === 'swipe') {
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title="원하는 룸메이트 조건"
        sub="두 가지 중 더 중요한 조건을 골라주세요"
        progress={null}
        onSkip={null}
        scrollKey="swipe"
      >
        {error && (
          <p style={{ marginBottom: 12, fontSize: 13, color: '#ef4444', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <RoommateSwipe onComplete={handleSwipeComplete} tok={tok} />
      </OnboardingShell>
    )
  }

  // ── 저장 중 ──────────────────────────────────────────────────────────────
  if (phase === 'saving') {
    return (
      <OnboardingShell
        tok={tok}
        theme={initialTheme}
        title=""
        sub=""
        progress={null}
        onSkip={null}
        scrollKey="saving"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '40px 0' }}>
          <p style={{ fontSize: 14, color: tok.textSecondary }}>프로필을 저장하는 중이에요…</p>
        </div>
      </OnboardingShell>
    )
  }

  // ── 로그인 필요 (비로그인 사용자가 스와이프까지 끝낸 경우) ──────────────
  return (
    <OnboardingShell tok={tok} theme={initialTheme} title="" sub="" progress={null} onSkip={null} scrollKey="login-required">
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
          onClick={handleGoogleLogin}
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
          onClick={() => setPhase('swipe')}
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
