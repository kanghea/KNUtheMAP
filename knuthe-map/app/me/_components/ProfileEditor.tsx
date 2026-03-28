'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { loadPrefs, savePrefs } from '@/lib/prefs'
import { getZoneByDept } from '@/lib/department-zones'
import StepGrade      from '@/components/onboarding/StepGrade'
import StepDepartment from '@/components/onboarding/StepDepartment'

interface Profile {
  id:         string
  email:      string
  nickname:   string | null
  avatar_url: string | null
  grade:      string | null
  dept:       string | null
}

function AccordionRow({
  label, value, open, onToggle, children,
}: {
  label: string; value: string | null; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div style={{ borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 2 }}>
            {label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: value ? '#ffffff' : 'rgba(255,255,255,0.35)' }}>
            {value || '선택 안 됨'}
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 600 : 0,
        transition: 'max-height .3s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function ProfileEditor({ profile, showStudentFields = true }: { profile: Profile; showStudentFields?: boolean }) {
  const [nickname,    setNickname]    = useState(profile.nickname ?? '')
  const [grade,       setGrade]       = useState(profile.grade    ?? '')
  const [dept,        setDept]        = useState(profile.dept     ?? '')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<'grade' | 'dept' | null>(null)

  const toggle = (s: 'grade' | 'dept') =>
    setOpenSection((prev) => prev === s ? null : s)

  const handleSave = async () => {
    setSaving(true); setError(null)
    const supabase = createBrowserSupabase()
    const { error: err } = await supabase
      .from('users')
      .update({ nickname: nickname.trim() || null, grade: grade || null, dept: dept || null })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }

    // 쿠키(knu_prefs)도 동기화
    const prefs = loadPrefs()
    if (prefs) {
      savePrefs({
        ...prefs,
        grade: grade || null,
        dept:  dept  || null,
        zone:  dept ? (getZoneByDept(dept) ?? prefs.zone) : prefs.zone,
      })
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 아바타 + 이메일 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 52, height: 52, borderRadius: '50%', background: 'rgba(37,99,235,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            👤
          </div>
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{nickname || '이름 없음'}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{profile.email}</div>
        </div>
      </div>

      {/* 닉네임 */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 6, display: 'block' }}>
          닉네임
        </label>
        <input
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.15)', fontSize: 14, color: '#ffffff',
            background: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
          }}
          value={nickname}
          placeholder="닉네임을 입력하세요"
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      {/* 학번·학과 — 학생 전용 */}
      {showStudentFields && (
        <>
          <AccordionRow
            label="학번" value={grade || null}
            open={openSection === 'grade'}
            onToggle={() => toggle('grade')}
          >
            <div style={{ paddingTop: 12 }}>
              <StepGrade
                selected={grade || null}
                onSelect={(v) => { setGrade(v); setOpenSection(null) }}
              />
            </div>
          </AccordionRow>

          <AccordionRow
            label="학과" value={dept || null}
            open={openSection === 'dept'}
            onToggle={() => toggle('dept')}
          >
            <div style={{ paddingTop: 12 }}>
              <StepDepartment
                selected={dept || null}
                onSelect={(v) => { setDept(v); if (v) setOpenSection(null) }}
              />
            </div>
          </AccordionRow>
        </>
      )}

      {error && (
        <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '13px', borderRadius: 14, border: 'none', cursor: saving ? 'default' : 'pointer',
          background: saved ? '#10b981' : '#2563eb', color: '#fff',
          fontSize: 14, fontWeight: 700, transition: 'background .2s',
        }}
      >
        {saving ? '저장 중…' : saved ? '✓ 저장됐어요!' : '변경사항 저장'}
      </button>
    </div>
  )
}
