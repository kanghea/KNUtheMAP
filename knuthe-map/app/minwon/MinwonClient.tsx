'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'

// ─────────────────────────────────────────────────────────────────────────────
// /minwon — "민원 대신 처리해드립니다"
//
// 플로우:
//   intro    → ChatGPT 스타일 프롬프트 박스 (탭/포커스로 compose 진입)
//   compose  → 본문·사진·건물주소·건물주연락처 입력
//   auth     → 미로그인 시 로그인 안내 (Google OAuth /login 리다이렉트)
//   onboard  → 학교/학과/학번/나이/연락처 온보딩 (접수자 본인 정보)
//   submit   → POST /api/minwon (multipart) 진행 중
//   done     → 접수 완료 + 답변은 문자로 안내
//
// 로그인 왕복 후 폼 데이터 보존: sessionStorage('knu_minwon_draft') 사용.
// ─────────────────────────────────────────────────────────────────────────────

type Phase = 'intro' | 'compose' | 'auth' | 'onboard' | 'submit' | 'done'

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
  // 이미지 자체는 sessionStorage 에 못 담는다 → File 은 보존하지 않고,
  // 로그인 왕복이 끝나면 사용자가 다시 첨부하도록 한다.
  hadImage:        boolean
}

const DRAFT_KEY = 'knu_minwon_draft'

export default function MinwonClient({
  tok,
  isAuthed,
  prefillDept,
  prefillGrade,
}: MinwonClientProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('intro')

  // ── 민원 본문 입력 ─────────────────────────────────────────────
  const [complaintText,   setComplaintText]   = useState('')
  const [imageFile,       setImageFile]       = useState<File | null>(null)
  const [imagePreview,    setImagePreview]    = useState<string | null>(null)
  const [buildingAddress, setBuildingAddress] = useState('')
  const [buildingPhone,   setBuildingPhone]   = useState('')

  // ── 접수자 본인 온보딩 ────────────────────────────────────────
  const [school,    setSchool]    = useState('경북대학교')
  const [dept,      setDept]      = useState(prefillDept ?? '')
  const [grade,     setGrade]     = useState(prefillGrade ?? '')
  const [age,       setAge]       = useState('')
  const [userPhone, setUserPhone] = useState('')

  const [error,     setError]     = useState<string | null>(null)

  // sessionStorage 복구 — 로그인 왕복 후 돌아왔을 때
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as DraftState
      setComplaintText(draft.complaintText ?? '')
      setBuildingAddress(draft.buildingAddress ?? '')
      setBuildingPhone(draft.buildingPhone ?? '')
      // 이미지가 있었으면 사용자에게 다시 첨부 안내 위해 compose 단계로
      if (isAuthed && (draft.complaintText || draft.buildingAddress)) {
        setPhase(draft.hadImage ? 'compose' : 'onboard')
      }
    } catch {}
  }, [isAuthed])

  // 이미지 선택 시 미리보기 생성·해제
  useEffect(() => {
    if (!imageFile) { setImagePreview(null); return }
    const url = URL.createObjectURL(imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

  // ── 헬퍼 ───────────────────────────────────────────────────────
  function saveDraft() {
    if (typeof window === 'undefined') return
    const draft: DraftState = {
      complaintText, buildingAddress, buildingPhone,
      hadImage: !!imageFile,
    }
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }

  function clearDraft() {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(DRAFT_KEY)
  }

  function goLogin() {
    saveDraft()
    router.push(`/login?next=${encodeURIComponent('/minwon')}`)
  }

  function validateCompose(): string | null {
    if (complaintText.trim().length < 5) return '민원 내용을 5자 이상 입력해주세요.'
    if (!buildingAddress.trim())          return '건물 주소를 입력해주세요.'
    if (!buildingPhone.trim())            return '건물주 연락처를 입력해주세요.'
    return null
  }

  function validateOnboard(): string | null {
    if (!school.trim())     return '학교를 입력해주세요.'
    if (!dept.trim())       return '학과를 입력해주세요.'
    if (!grade.trim())      return '학번을 입력해주세요.'
    const ageNum = Number(age)
    if (!ageNum || ageNum < 1 || ageNum > 120) return '올바른 나이를 입력해주세요.'
    if (!userPhone.trim())  return '연락처를 입력해주세요.'
    return null
  }

  async function submit() {
    setError(null)
    setPhase('submit')
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
      setError(e instanceof Error ? e.message : '접수 중 오류가 발생했습니다.')
      setPhase('onboard')
    }
  }

  // ── 렌더링 ─────────────────────────────────────────────────────
  return (
    <PageWrapper tok={tok}>
      <DashboardHeader tok={tok} title="민원 대신 처리해드립니다" backHref="/" />

      <div style={containerStyle}>
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
            imageFile={imageFile}         setImageFile={setImageFile}
            imagePreview={imagePreview}
            buildingAddress={buildingAddress} setBuildingAddress={setBuildingAddress}
            buildingPhone={buildingPhone}     setBuildingPhone={setBuildingPhone}
            error={error}
            onBack={() => setPhase('intro')}
            onNext={() => {
              const err = validateCompose()
              if (err) { setError(err); return }
              setError(null)
              if (!isAuthed) { setPhase('auth'); return }
              setPhase('onboard')
            }}
          />
        )}

        {phase === 'auth' && (
          <AuthSection
            tok={tok}
            onBack={() => setPhase('compose')}
            onLogin={goLogin}
          />
        )}

        {phase === 'onboard' && (
          <OnboardSection
            tok={tok}
            school={school}       setSchool={setSchool}
            dept={dept}           setDept={setDept}
            grade={grade}         setGrade={setGrade}
            age={age}             setAge={setAge}
            userPhone={userPhone} setUserPhone={setUserPhone}
            error={error}
            onBack={() => setPhase('compose')}
            onSubmit={() => {
              const err = validateOnboard()
              if (err) { setError(err); return }
              setError(null)
              submit()
            }}
          />
        )}

        {phase === 'submit' && (
          <DoneSection tok={tok} title="접수 중…" subtitle="잠시만 기다려주세요." />
        )}

        {phase === 'done' && (
          <DoneSection
            tok={tok}
            title="민원이 접수되었습니다"
            subtitle="처리 결과는 입력하신 연락처로 문자 메시지로 안내드릴게요."
            onHome={() => router.push('/')}
          />
        )}
      </div>
    </PageWrapper>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 섹션별 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
  maxWidth: 560,
  margin:   '0 auto',
  padding:  '24px 16px',
  display:  'flex',
  flexDirection: 'column',
  gap: 16,
}

function IntroSection({
  tok, value, onChange, onStart,
}: {
  tok: ThemeTokens
  value: string
  onChange: (v: string) => void
  onStart: () => void
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  return (
    <>
      <div style={{ padding: '20px 4px 8px', textAlign: 'center' }}>
        <h2 style={{
          fontSize: 24, fontWeight: 800, color: tok.textPrimary,
          margin: '0 0 8px', lineHeight: 1.3,
        }}>
          민원 대신 처리해드립니다
        </h2>
        <p style={{ fontSize: 14, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
          자취방 보일러·누수·소음·결로 등<br />
          건물주에게 직접 말하기 곤란한 민원, 저희가 대신 전달할게요.
        </p>
      </div>

      <div
        onClick={() => { taRef.current?.focus() }}
        style={{
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
          borderRadius: 24,
          padding: 16,
          boxShadow: tok.shadow,
          cursor: 'text',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="어떤 민원이세요?  예) 보일러가 며칠째 안 켜져요…"
          rows={3}
          style={{
            width: '100%', resize: 'none', border: 'none', outline: 'none',
            background: 'transparent', color: tok.inputColor,
            fontSize: 15, lineHeight: 1.6,
            fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onStart}
            disabled={value.trim().length === 0}
            style={primaryButtonStyle(tok, value.trim().length === 0)}
          >
            민원 작성 시작 →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <BulletRow tok={tok} icon="🧾" label="민원 내용을 자세히 적어주세요" />
        <BulletRow tok={tok} icon="📷" label="현장 사진 1장을 첨부해주세요" />
        <BulletRow tok={tok} icon="🏠" label="건물 주소와 건물주 연락처가 필요해요" />
      </div>
    </>
  )
}

function BulletRow({ tok, icon, label }: { tok: ThemeTokens; icon: string; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px',
      background: tok.cardBg,
      border: `1px solid ${tok.cardBorder}`,
      borderRadius: 12,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, color: tok.textSecondary }}>{label}</span>
    </div>
  )
}

function ComposeSection({
  tok,
  complaintText, setComplaintText,
  imageFile, setImageFile, imagePreview,
  buildingAddress, setBuildingAddress,
  buildingPhone,   setBuildingPhone,
  error, onBack, onNext,
}: {
  tok: ThemeTokens
  complaintText:   string;  setComplaintText:   (v: string) => void
  imageFile:       File | null
  setImageFile:    (f: File | null) => void
  imagePreview:    string | null
  buildingAddress: string;  setBuildingAddress: (v: string) => void
  buildingPhone:   string;  setBuildingPhone:   (v: string) => void
  error:           string | null
  onBack:          () => void
  onNext:          () => void
}) {
  return (
    <Card tok={tok} padding={20} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <FieldLabel tok={tok} label="민원 내용" required>
        <textarea
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          placeholder="구체적으로 어떤 민원인지 적어주세요."
          rows={5}
          style={textareaStyle(tok)}
        />
      </FieldLabel>

      <FieldLabel tok={tok} label="현장 사진">
        <ImageUploader
          tok={tok}
          file={imageFile}
          preview={imagePreview}
          onChange={setImageFile}
        />
      </FieldLabel>

      <FieldLabel tok={tok} label="건물 주소" required>
        <input
          value={buildingAddress}
          onChange={(e) => setBuildingAddress(e.target.value)}
          placeholder="예) 대구 북구 대학로 80"
          style={inputStyle(tok)}
        />
      </FieldLabel>

      <FieldLabel tok={tok} label="건물주 연락처" required>
        <input
          value={buildingPhone}
          onChange={(e) => setBuildingPhone(e.target.value)}
          placeholder="예) 010-1234-5678"
          inputMode="tel"
          style={inputStyle(tok)}
        />
      </FieldLabel>

      {error && <ErrorText tok={tok} text={error} />}

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
    <Card tok={tok} padding={24} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
        접수를 위해 로그인이 필요해요
      </h3>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
        처리 결과를 안전하게 안내드리고 중복 접수를 방지하기 위해
        Google 계정으로 본인 확인을 진행할게요.
        <br />작성 중인 민원 내용은 그대로 유지됩니다.
        <br />
        <span style={{ fontSize: 12, color: tok.textTertiary }}>
          ※ 사진은 로그인 후 다시 첨부가 필요합니다.
        </span>
      </p>
      <ActionRow tok={tok} onBack={onBack} primaryLabel="Google로 로그인" onPrimary={onLogin} />
    </Card>
  )
}

function OnboardSection({
  tok,
  school, setSchool,
  dept, setDept,
  grade, setGrade,
  age, setAge,
  userPhone, setUserPhone,
  error, onBack, onSubmit,
}: {
  tok: ThemeTokens
  school:    string;  setSchool:    (v: string) => void
  dept:      string;  setDept:      (v: string) => void
  grade:     string;  setGrade:     (v: string) => void
  age:       string;  setAge:       (v: string) => void
  userPhone: string;  setUserPhone: (v: string) => void
  error:     string | null
  onBack:    () => void
  onSubmit:  () => void
}) {
  return (
    <Card tok={tok} padding={20} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
          접수자 정보
        </h3>
        <p style={{ fontSize: 12, color: tok.textTertiary, margin: '6px 0 0', lineHeight: 1.5 }}>
          민원 처리 결과를 문자로 안내드리기 위해 필요한 정보예요.
        </p>
      </div>

      <FieldLabel tok={tok} label="학교" required>
        <input value={school} onChange={(e) => setSchool(e.target.value)}
               placeholder="예) 경북대학교" style={inputStyle(tok)} />
      </FieldLabel>

      <FieldLabel tok={tok} label="학과" required>
        <input value={dept} onChange={(e) => setDept(e.target.value)}
               placeholder="예) 경영학부" style={inputStyle(tok)} />
      </FieldLabel>

      <FieldLabel tok={tok} label="학번" required>
        <input value={grade} onChange={(e) => setGrade(e.target.value)}
               placeholder="예) 21학번" style={inputStyle(tok)} />
      </FieldLabel>

      <FieldLabel tok={tok} label="나이" required>
        <input value={age} onChange={(e) => setAge(e.target.value)}
               placeholder="예) 24"
               inputMode="numeric"
               style={inputStyle(tok)} />
      </FieldLabel>

      <FieldLabel tok={tok} label="연락처" required>
        <input value={userPhone} onChange={(e) => setUserPhone(e.target.value)}
               placeholder="예) 010-1234-5678"
               inputMode="tel"
               style={inputStyle(tok)} />
      </FieldLabel>

      {error && <ErrorText tok={tok} text={error} />}

      <ActionRow tok={tok} onBack={onBack} primaryLabel="접수하기" onPrimary={onSubmit} />
    </Card>
  )
}

function DoneSection({
  tok, title, subtitle, onHome,
}: {
  tok: ThemeTokens
  title: string
  subtitle: string
  onHome?: () => void
}) {
  return (
    <Card tok={tok} padding={32} radius={16} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 32,
        background: tok.successBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>
        {onHome ? '✅' : '⏳'}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
        {subtitle}
      </p>
      {onHome && (
        <button onClick={onHome} style={{ ...primaryButtonStyle(tok, false), marginTop: 8 }}>
          홈으로
        </button>
      )}
    </Card>
  )
}

// ── 공용 폼 헬퍼 ─────────────────────────────────────────────────────────────

function FieldLabel({
  tok, label, required, children,
}: { tok: ThemeTokens; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: tok.textSecondary }}>
        {label}{required && <span style={{ color: tok.dangerColor, marginLeft: 4 }}>*</span>}
      </span>
      {children}
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
            style={{
              position: 'absolute', top: 8, right: 8,
              padding: '6px 10px', borderRadius: 999,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
            }}
          >사진 제거</button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: '100%',
            padding: '24px 16px',
            border: `1px dashed ${tok.inputBorder}`,
            borderRadius: 12,
            background: tok.inputBg,
            color: tok.textSecondary,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          📷 사진 첨부 (선택, 최대 10MB)
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
  tok, onBack, primaryLabel, onPrimary,
}: {
  tok: ThemeTokens
  onBack: () => void
  primaryLabel: string
  onPrimary: () => void
}) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
      <button
        onClick={onBack}
        style={{
          flex: '0 0 auto', padding: '12px 18px', borderRadius: 12,
          background: tok.inputBg, color: tok.textSecondary,
          border: `1px solid ${tok.inputBorder}`,
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}
      >이전</button>
      <button
        onClick={onPrimary}
        style={{ ...primaryButtonStyle(tok, false), flex: 1 }}
      >{primaryLabel}</button>
    </div>
  )
}

// ── 스타일 ───────────────────────────────────────────────────────────────────

function inputStyle(tok: ThemeTokens): CSSProperties {
  return {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${tok.inputBorder}`,
    borderRadius: 10,
    background: tok.inputBg,
    color: tok.inputColor,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
  }
}

function textareaStyle(tok: ThemeTokens): CSSProperties {
  return {
    ...inputStyle(tok),
    resize: 'vertical',
    lineHeight: 1.6,
  }
}

function primaryButtonStyle(tok: ThemeTokens, disabled: boolean): CSSProperties {
  return {
    padding: '12px 20px',
    borderRadius: 12,
    background: disabled ? tok.inputBg : tok.accentColor,
    color: disabled ? tok.textTertiary : '#ffffff',
    border: disabled ? `1px solid ${tok.inputBorder}` : 'none',
    fontSize: 14,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 120ms ease',
  }
}
