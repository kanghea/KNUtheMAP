'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import {
  IconArrowUp, IconCamera, IconImage, IconMapPin, IconPhone,
  IconCheck, IconClose, IconSpinner,
} from '@/components/shared/icons'

// ─────────────────────────────────────────────────────────────────────────────
// /minwon — "민원 대신 처리해드립니다"
//
// 디자인 톤: ChatGPT empty-state. 헤더는 sticky 그대로, 본문은 빈 화면 거의
// 중앙으로 프롬프트 박스를 끌어올리고 다른 잡음을 모두 제거. 모바일 우선.
//
// 플로우:
//   intro    → 프롬프트 박스 (탭/입력 → compose)
//   compose  → 본문·사진·건물주소·건물주연락처 입력
//   auth     → 미로그인 시 로그인 안내
//   onboard  → 학교/학과/학번/나이/연락처 (학번·나이 2-col)
//   submit   → 인라인 spinner — 카드 교체 X, 버튼 안에 표시
//   done     → 완료 + 답변은 문자 안내
//
// 로그인 왕복 후 폼 데이터 보존: sessionStorage('knu_minwon_draft').
// ─────────────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'compose' | 'auth' | 'onboard' | 'done'

interface MinwonClientProps {
  tok:           ThemeTokens
  isAuthed:      boolean
  prefillDept:   string | null
  prefillGrade:  string | null
}

interface DraftState {
  complaintText:   string
  buildingAddress: string
  buildingPhone:   string
  hadImage:        boolean
}

const DRAFT_KEY = 'knu_minwon_draft'

export default function MinwonClient({
  tok, isAuthed, prefillDept, prefillGrade,
}: MinwonClientProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('intro')
  const [submitting, setSubmitting] = useState(false)

  const [complaintText,   setComplaintText]   = useState('')
  const [imageFile,       setImageFile]       = useState<File | null>(null)
  const [imagePreview,    setImagePreview]    = useState<string | null>(null)
  const [buildingAddress, setBuildingAddress] = useState('')
  const [buildingPhone,   setBuildingPhone]   = useState('')

  const [school,    setSchool]    = useState('경북대학교')
  const [dept,      setDept]      = useState(prefillDept ?? '')
  const [grade,     setGrade]     = useState(prefillGrade ?? '')
  const [age,       setAge]       = useState('')
  const [userPhone, setUserPhone] = useState('')

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // ── sessionStorage 복구 (로그인 왕복 후) ────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as DraftState
      setComplaintText(draft.complaintText ?? '')
      setBuildingAddress(draft.buildingAddress ?? '')
      setBuildingPhone(draft.buildingPhone ?? '')
      if (isAuthed && (draft.complaintText || draft.buildingAddress)) {
        // 사진은 File 보존 불가 → 있던 경우 compose 로 보내 재첨부 유도
        setPhase(draft.hadImage ? 'compose' : 'onboard')
      }
    } catch {}
  }, [isAuthed])

  // 이미지 미리보기 URL — 메모리 누수 방지를 위해 cleanup
  useEffect(() => {
    if (!imageFile) { setImagePreview(null); return }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  function saveDraft() {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
      complaintText, buildingAddress, buildingPhone, hadImage: !!imageFile,
    } satisfies DraftState))
  }

  function clearDraft() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(DRAFT_KEY)
  }

  function goLogin() {
    saveDraft()
    router.push(`/login?next=${encodeURIComponent('/minwon')}`)
  }

  function validateCompose(): Record<string, string> {
    const e: Record<string, string> = {}
    if (complaintText.trim().length < 5) e.complaint = '5자 이상 입력해주세요.'
    if (!buildingAddress.trim())          e.address   = '건물 주소를 입력해주세요.'
    if (!buildingPhone.trim())            e.phone     = '건물주 연락처를 입력해주세요.'
    return e
  }

  function validateOnboard(): Record<string, string> {
    const e: Record<string, string> = {}
    if (!school.trim()) e.school = '학교를 입력해주세요.'
    if (!dept.trim())   e.dept   = '학과를 입력해주세요.'
    if (!grade.trim())  e.grade  = '학번을 입력해주세요.'
    const ageNum = Number(age)
    if (!ageNum || ageNum < 1 || ageNum > 120) e.age = '올바른 나이를 입력해주세요.'
    if (!userPhone.trim()) e.userPhone = '연락처를 입력해주세요.'
    return e
  }

  async function submit() {
    setSubmitError(null)
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('complaint_text',   complaintText.trim())
      fd.append('building_address', buildingAddress.trim())
      fd.append('building_phone',   buildingPhone.trim())
      fd.append('user_school',      school.trim())
      fd.append('user_dept',        dept.trim())
      fd.append('user_grade',       grade.trim())
      fd.append('user_age',         String(Number(age)))
      fd.append('user_phone',       userPhone.trim())
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch('/api/minwon', { method: 'POST', body: fd })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error ?? '접수 중 오류가 발생했습니다.')
      }
      clearDraft()
      setPhase('done')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '접수 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader tok={tok} title="민원 대신 처리해드립니다" backHref="/" />

      <div style={containerStyle(phase)}>
        {phase === 'intro' && (
          <IntroSection
            tok={tok}
            value={complaintText}
            onChange={setComplaintText}
            onStart={() => setPhase('compose')}
          />
        )}

        {phase === 'compose' && (
          <ComposeSection
            tok={tok}
            complaintText={complaintText} setComplaintText={setComplaintText}
            imageFile={imageFile} setImageFile={setImageFile} imagePreview={imagePreview}
            buildingAddress={buildingAddress} setBuildingAddress={setBuildingAddress}
            buildingPhone={buildingPhone} setBuildingPhone={setBuildingPhone}
            errors={fieldErrors}
            onBack={() => setPhase('intro')}
            onNext={() => {
              const err = validateCompose()
              if (Object.keys(err).length) { setFieldErrors(err); return }
              setFieldErrors({})
              setPhase(isAuthed ? 'onboard' : 'auth')
            }}
          />
        )}

        {phase === 'auth' && (
          <AuthSection tok={tok} onBack={() => setPhase('compose')} onLogin={goLogin} />
        )}

        {phase === 'onboard' && (
          <OnboardSection
            tok={tok}
            school={school}     setSchool={setSchool}
            dept={dept}         setDept={setDept}
            grade={grade}       setGrade={setGrade}
            age={age}           setAge={setAge}
            userPhone={userPhone} setUserPhone={setUserPhone}
            errors={fieldErrors}
            submitError={submitError}
            submitting={submitting}
            onBack={() => setPhase('compose')}
            onSubmit={() => {
              const err = validateOnboard()
              if (Object.keys(err).length) { setFieldErrors(err); return }
              setFieldErrors({})
              submit()
            }}
          />
        )}

        {phase === 'done' && (
          <DoneSection tok={tok} onHome={() => router.push('/')} />
        )}
      </div>
    </PageWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 섹션
// ─────────────────────────────────────────────────────────────────────────────

function IntroSection({
  tok, value, onChange, onStart,
}: {
  tok: ThemeTokens
  value: string
  onChange: (v: string) => void
  onStart: () => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useAutoResize(ref, value, 220)

  // 모바일에서 textarea 가 1줄에서 시작해 입력에 따라 자라도록.
  const canStart = value.trim().length >= 5

  function handleSubmit() { if (canStart) onStart() }

  return (
    <div style={heroWrapperStyle}>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: tok.textPrimary,
        margin: 0, textAlign: 'center', letterSpacing: '-0.01em',
      }}>
        오늘 어떤 민원이세요?
      </h2>

      <div style={{
        background: tok.cardBg,
        border: `1px solid ${tok.cardBorder}`,
        borderRadius: 24,
        padding: '12px 12px 12px 16px',
        display: 'flex', alignItems: 'flex-end', gap: 8,
        boxShadow: tok.shadow,
        transition: 'border-color 120ms ease',
      }}>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // 모바일에선 Enter = 줄바꿈이 자연스럽지만, 데스크탑 Cmd/Ctrl+Enter 로
            // 보내기. 일반 Enter 는 줄바꿈 유지 (실수 전송 방지).
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="예) 보일러가 이틀째 안 켜져요. 건물주에게 말해도 답이 없어요…"
          rows={1}
          style={{
            flex: 1, resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: tok.inputColor,
            fontSize: 16, lineHeight: 1.5, padding: '8px 0',
            fontFamily: 'inherit', minHeight: 24, maxHeight: 220,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!canStart}
          aria-label="민원 작성 시작"
          style={{
            width: 36, height: 36, flexShrink: 0,
            borderRadius: 999,
            border: 'none',
            background: canStart ? tok.textPrimary : tok.inputBorder,
            color: canStart ? tok.cardBg : tok.textTertiary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canStart ? 'pointer' : 'not-allowed',
            transition: 'background 120ms ease, color 120ms ease',
          }}
        >
          <IconArrowUp size={18} />
        </button>
      </div>

      {/* 입력 박스 아래 미니 가이드 — 한 줄, SVG only */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap',
        marginTop: 14,
      }}>
        <HintChip tok={tok} icon={<IconImage   size={13} />} label="사진" />
        <HintChip tok={tok} icon={<IconMapPin  size={13} />} label="건물 주소" />
        <HintChip tok={tok} icon={<IconPhone   size={13} />} label="건물주 연락처" />
      </div>

      <p style={{
        fontSize: 11, color: tok.textTertiary, margin: '6px 0 0',
        textAlign: 'center', lineHeight: 1.6,
      }}>
        접수 후 처리 결과는 입력하신 연락처로 문자 안내드려요.
      </p>
    </div>
  )
}

function HintChip({ tok, icon, label }: { tok: ThemeTokens; icon: ReactNode; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, color: tok.textSecondary, fontWeight: 500,
    }}>
      <span style={{ display: 'inline-flex', color: tok.textTertiary }}>{icon}</span>
      {label}
    </span>
  )
}

function ComposeSection({
  tok,
  complaintText, setComplaintText,
  imageFile, setImageFile, imagePreview,
  buildingAddress, setBuildingAddress,
  buildingPhone,   setBuildingPhone,
  errors, onBack, onNext,
}: {
  tok: ThemeTokens
  complaintText:   string;  setComplaintText:   (v: string) => void
  imageFile:       File | null
  setImageFile:    (f: File | null) => void
  imagePreview:    string | null
  buildingAddress: string;  setBuildingAddress: (v: string) => void
  buildingPhone:   string;  setBuildingPhone:   (v: string) => void
  errors:          Record<string, string>
  onBack:          () => void
  onNext:          () => void
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  useAutoResize(taRef, complaintText, 360)

  return (
    <Card tok={tok} padding={20} radius={16}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Field tok={tok} label="민원 내용" required error={errors.complaint}>
        <textarea
          ref={taRef}
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          placeholder="구체적으로 어떤 민원인지 적어주세요."
          rows={3}
          style={{ ...inputStyle(tok, !!errors.complaint), resize: 'none', minHeight: 96, maxHeight: 360, lineHeight: 1.6 }}
        />
      </Field>

      <Field tok={tok} label="현장 사진" hint="선택 · 10MB 이하">
        <ImageUploader tok={tok} file={imageFile} preview={imagePreview} onChange={setImageFile} />
      </Field>

      <Field tok={tok} label="건물 주소" required error={errors.address}>
        <input
          value={buildingAddress}
          onChange={(e) => setBuildingAddress(e.target.value)}
          placeholder="예) 대구 북구 대학로 80"
          style={inputStyle(tok, !!errors.address)}
          autoComplete="street-address"
        />
      </Field>

      <Field tok={tok} label="건물주 연락처" required error={errors.phone}>
        <input
          value={buildingPhone}
          onChange={(e) => setBuildingPhone(e.target.value)}
          placeholder="010-1234-5678"
          inputMode="tel"
          autoComplete="tel"
          style={inputStyle(tok, !!errors.phone)}
        />
      </Field>

      <ActionRow tok={tok} onBack={onBack} primaryLabel="다음" onPrimary={onNext} />
    </Card>
  )
}

function AuthSection({
  tok, onBack, onLogin,
}: {
  tok: ThemeTokens
  onBack:  () => void
  onLogin: () => void
}) {
  return (
    <Card tok={tok} padding={24} radius={16}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
        접수를 위해 로그인이 필요해요
      </h3>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
        처리 결과를 안전하게 안내드리고 중복 접수를 방지하기 위해 Google 계정으로 본인 확인을 진행할게요.
        작성하신 민원 내용은 그대로 유지됩니다 (사진은 로그인 후 다시 첨부해주세요).
      </p>
      <ActionRow tok={tok} onBack={onBack} primaryLabel="Google로 로그인" onPrimary={onLogin} />
    </Card>
  )
}

function OnboardSection({
  tok,
  school, setSchool, dept, setDept,
  grade, setGrade, age, setAge, userPhone, setUserPhone,
  errors, submitError, submitting, onBack, onSubmit,
}: {
  tok: ThemeTokens
  school:    string;  setSchool:    (v: string) => void
  dept:      string;  setDept:      (v: string) => void
  grade:     string;  setGrade:     (v: string) => void
  age:       string;  setAge:       (v: string) => void
  userPhone: string;  setUserPhone: (v: string) => void
  errors:    Record<string, string>
  submitError: string | null
  submitting:  boolean
  onBack:    () => void
  onSubmit:  () => void
}) {
  return (
    <Card tok={tok} padding={20} radius={16}
          style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
          접수자 정보
        </h3>
        <p style={{ fontSize: 12, color: tok.textTertiary, margin: '6px 0 0', lineHeight: 1.5 }}>
          처리 결과를 문자로 안내드리기 위해 필요해요.
        </p>
      </div>

      <Field tok={tok} label="학교" required error={errors.school}>
        <input
          value={school}
          onChange={(e) => setSchool(e.target.value)}
          style={inputStyle(tok, !!errors.school)}
          autoComplete="organization"
        />
      </Field>

      <Field tok={tok} label="학과" required error={errors.dept}>
        <input
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          placeholder="예) 경영학부"
          style={inputStyle(tok, !!errors.dept)}
        />
      </Field>

      {/* 학번 + 나이 — 모바일에서도 같은 행 (좁은 폭에서도 무리 없음) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field tok={tok} label="학번" required error={errors.grade}>
          <input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="21학번"
            style={inputStyle(tok, !!errors.grade)}
          />
        </Field>
        <Field tok={tok} label="나이" required error={errors.age}>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="24"
            inputMode="numeric"
            style={inputStyle(tok, !!errors.age)}
          />
        </Field>
      </div>

      <Field tok={tok} label="연락처" required error={errors.userPhone}
             hint="처리 결과를 이 번호로 문자 안내해드려요">
        <input
          value={userPhone}
          onChange={(e) => setUserPhone(e.target.value)}
          placeholder="010-1234-5678"
          inputMode="tel"
          autoComplete="tel"
          style={inputStyle(tok, !!errors.userPhone)}
        />
      </Field>

      {submitError && <ErrorText tok={tok} text={submitError} />}

      <ActionRow
        tok={tok}
        onBack={onBack}
        primaryLabel="접수하기"
        onPrimary={onSubmit}
        primaryLoading={submitting}
      />
    </Card>
  )
}

function DoneSection({ tok, onHome }: { tok: ThemeTokens; onHome: () => void }) {
  return (
    <Card tok={tok} padding={32} radius={16} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32,
        background: tok.successBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: tok.successColor,
      }}>
        <IconCheck size={28} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
        민원이 접수되었습니다
      </h3>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6, maxWidth: 360 }}>
        처리 결과는 입력하신 연락처로 문자 메시지로 안내드릴게요.
      </p>
      <button onClick={onHome} style={{ ...primaryButtonStyle(tok, false, false), marginTop: 6, width: '100%', maxWidth: 240 }}>
        홈으로
      </button>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 공용 폼 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

function Field({
  tok, label, required, error, hint, children,
}: {
  tok: ThemeTokens
  label: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: tok.textSecondary }}>
        {label}{required && <span style={{ color: tok.dangerColor, marginLeft: 3 }}>*</span>}
      </span>
      {children}
      {error
        ? <span style={{ fontSize: 11, color: tok.dangerColor, lineHeight: 1.4 }}>{error}</span>
        : hint
          ? <span style={{ fontSize: 11, color: tok.textTertiary, lineHeight: 1.4 }}>{hint}</span>
          : null
      }
    </label>
  )
}

function ImageUploader({
  tok, file, preview, onChange,
}: {
  tok: ThemeTokens
  file: File | null
  preview: string | null
  onChange: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        // 모바일에서 카메라 즉시 호출되지 않도록 capture 미지정 — 갤러리/카메라 선택 가능
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="선택한 사진"
               style={{ display: 'block', width: '100%', maxHeight: 280, objectFit: 'cover' }} />
          <button
            type="button"
            onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = '' }}
            aria-label="사진 제거"
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 28, height: 28, borderRadius: 999,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
            }}
          >
            <IconClose size={14} color="#ffffff" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            padding: '20px 16px',
            border: `1px dashed ${tok.inputBorder}`,
            borderRadius: 12,
            background: tok.inputBg,
            color: tok.textSecondary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            minHeight: 64,
          }}
        >
          <IconCamera size={18} color={tok.textSecondary} />
          사진 첨부
        </button>
      )}
      {file && (
        <p style={{ fontSize: 11, color: tok.textTertiary, margin: '6px 0 0' }}>
          {file.name} · {(file.size / 1024).toFixed(0)}KB
        </p>
      )}
    </div>
  )
}

function ErrorText({ tok, text }: { tok: ThemeTokens; text: string }) {
  return (
    <p style={{
      fontSize: 12, color: tok.dangerColor, margin: 0,
      padding: '8px 12px', background: tok.dangerBg, borderRadius: 8,
    }}>{text}</p>
  )
}

function ActionRow({
  tok, onBack, primaryLabel, onPrimary, primaryLoading,
}: {
  tok: ThemeTokens
  onBack: () => void
  primaryLabel: string
  onPrimary: () => void
  primaryLoading?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
      <button
        type="button"
        onClick={onBack}
        disabled={primaryLoading}
        style={{
          padding: '0 18px', height: 48,
          borderRadius: 12,
          background: tok.inputBg, color: tok.textSecondary,
          border: `1px solid ${tok.inputBorder}`,
          fontSize: 14, fontWeight: 600,
          cursor: primaryLoading ? 'not-allowed' : 'pointer',
          opacity: primaryLoading ? 0.6 : 1,
        }}
      >이전</button>
      <button
        type="button"
        onClick={onPrimary}
        disabled={primaryLoading}
        style={{ ...primaryButtonStyle(tok, false, !!primaryLoading), flex: 1, height: 48 }}
      >
        {primaryLoading
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <IconSpinner size={16} color="#fff" /> 접수 중…
            </span>
          : primaryLabel}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 스타일 / 훅
// ─────────────────────────────────────────────────────────────────────────────

function containerStyle(phase: Phase): CSSProperties {
  // intro 는 viewport 중앙 부근으로 프롬프트 박스 들어올림 — ChatGPT empty-state.
  // 헤더(약 60px) + 하단 paddingBottom(100px) 감안한 dvh 계산.
  if (phase === 'intro') {
    return {
      maxWidth: 560,
      margin: '0 auto',
      padding: '24px 16px 32px',
      minHeight: 'calc(100dvh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 16,
    }
  }
  return {
    maxWidth: 560,
    margin: '0 auto',
    padding: '20px 16px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  }
}

const heroWrapperStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 18,
  width: '100%',
}

function inputStyle(tok: ThemeTokens, hasError: boolean): CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${hasError ? tok.dangerColor : tok.inputBorder}`,
    borderRadius: 12,
    background: tok.inputBg,
    color: tok.inputColor,
    // iOS Safari 가 16px 미만 input 에 자동 zoom-in 하므로 16px.
    fontSize: 16,
    lineHeight: 1.4,
    outline: 'none',
    fontFamily: 'inherit',
  }
}

function primaryButtonStyle(tok: ThemeTokens, _disabled: boolean, loading: boolean): CSSProperties {
  return {
    padding: '0 20px', height: 48,
    borderRadius: 12,
    background: tok.accentColor,
    color: '#ffffff',
    border: 'none',
    fontSize: 15,
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.85 : 1,
    transition: 'opacity 120ms ease',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }
}

// 한 줄 시작 → 입력에 따라 자라는 textarea (max 까지)
function useAutoResize(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  max: number,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
  }, [ref, value, max])
}
