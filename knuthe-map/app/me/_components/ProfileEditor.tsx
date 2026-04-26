'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { loadPrefs, savePrefs } from '@/lib/prefs'
import { getZoneByDept } from '@/lib/department-zones'
import { THEME_TOKENS, type ThemeMode, type ThemeTokens } from '@/lib/theme-tokens'
import StepGrade      from '@/components/onboarding/StepGrade'
import StepDepartment from '@/components/onboarding/StepDepartment'
import { IconPencil } from '@/components/shared/icons'

interface Profile {
  id:         string
  email:      string
  nickname:   string | null
  avatar_url: string | null
  grade:      string | null
  dept:       string | null
}

function AccordionRow({
  label, value, open, onToggle, children, theme,
}: {
  label: string; value: string | null; open: boolean; onToggle: () => void; children: React.ReactNode; theme: ThemeMode
}) {
  const tok = THEME_TOKENS[theme]
  return (
    <div style={{ borderRadius: 14, border: `1.5px solid ${tok.inputBorder}`, overflow: 'hidden', background: tok.inputBg }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 600, color: tok.textTertiary, display: 'block', marginBottom: 2 }}>
            {label}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: value ? tok.textPrimary : tok.textTertiary }}>
            {value || '선택 안 됨'}
          </span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={tok.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 600 : 0,
        transition: 'max-height .3s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ padding: '4px 16px 16px', borderTop: `1px solid ${tok.cardBorder}` }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, tok }: { label: string; value: string | null; tok: ThemeTokens }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 14px', borderRadius: 12, background: tok.inputBg,
      border: `1px solid ${tok.cardBorder}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: tok.textTertiary }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: value ? tok.textPrimary : tok.textTertiary }}>
        {value || '미입력'}
      </span>
    </div>
  )
}

export default function ProfileEditor({ profile, showStudentFields = true, theme = 'dark' as ThemeMode }: { profile: Profile; showStudentFields?: boolean; theme?: ThemeMode }) {
  const tok = THEME_TOKENS[theme]
  const [editing,     setEditing]     = useState(false)
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
    setEditing(false)
    setOpenSection(null)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCancel = () => {
    setNickname(profile.nickname ?? '')
    setGrade(profile.grade ?? '')
    setDept(profile.dept ?? '')
    setError(null)
    setOpenSection(null)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* 아바타 + 이름 + 이메일 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.nickname ?? '프로필 사진'}
            width={56}
            height={56}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: tok.accentBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, color: tok.accentColor,
          }}>
            {(profile.nickname?.trim()[0] ?? profile.email[0]).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16, fontWeight: 700, color: tok.textPrimary,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {profile.nickname || '이름 없음'}
          </div>
          <div style={{
            fontSize: 12, color: tok.textTertiary, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {profile.email}
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            aria-label="프로필 수정"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 11px', borderRadius: 10,
              background: tok.accentBg, color: tok.accentColor,
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}
          >
            <IconPencil size={12} />
            수정
          </button>
        )}
      </div>

      {saved && !editing && (
        <p style={{
          margin: 0, fontSize: 12, fontWeight: 600, color: tok.successColor,
          textAlign: 'center', padding: '6px 0',
        }}>
          ✓ 변경사항이 저장됐어요
        </p>
      )}

      {/* ── 읽기 모드 ──────────────────────────────────────── */}
      {!editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow label="닉네임" value={profile.nickname} tok={tok} />
          {showStudentFields && (
            <>
              <InfoRow label="학번" value={profile.grade} tok={tok} />
              <InfoRow label="학과" value={profile.dept} tok={tok} />
            </>
          )}
        </div>
      )}

      {/* ── 편집 모드 ──────────────────────────────────────── */}
      {editing && (
        <>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: tok.textTertiary, marginBottom: 6, display: 'block' }}>
              닉네임
            </label>
            <input
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 12,
                border: `1.5px solid ${tok.inputBorder}`, fontSize: 16, color: tok.inputColor,
                background: tok.inputBg, outline: 'none', boxSizing: 'border-box',
              }}
              value={nickname}
              placeholder="닉네임을 입력하세요"
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {showStudentFields && (
            <>
              <AccordionRow
                label="학번" value={grade || null}
                open={openSection === 'grade'}
                onToggle={() => toggle('grade')}
                theme={theme}
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
                theme={theme}
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
            <p style={{ margin: 0, fontSize: 12, color: tok.dangerColor }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCancel}
              disabled={saving}
              style={{
                flex: 1, padding: '13px', borderRadius: 14,
                border: `1.5px solid ${tok.inputBorder}`,
                background: 'transparent', color: tok.textSecondary,
                fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2, padding: '13px', borderRadius: 14, border: 'none',
                cursor: saving ? 'default' : 'pointer',
                background: tok.accentColor, color: '#fff',
                fontSize: 14, fontWeight: 700, transition: 'background .2s',
              }}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
