'use client'

import { useState } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'

interface Profile {
  id:         string
  email:      string
  nickname:   string | null
  avatar_url: string | null
  grade:      string | null
  dept:       string | null
}

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const [nickname, setNickname] = useState(profile.nickname ?? '')
  const [grade,    setGrade]    = useState(profile.grade    ?? '')
  const [dept,     setDept]     = useState(profile.dept     ?? '')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true); setError(null)
    const supabase = createBrowserSupabase()
    const { error: err } = await supabase
      .from('users')
      .update({ nickname: nickname.trim() || null, grade: grade.trim() || null, dept: dept.trim() || null })
      .eq('id', profile.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'block',
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
            width: 52, height: 52, borderRadius: '50%', background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            👤
          </div>
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{nickname || '이름 없음'}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{profile.email}</div>
        </div>
      </div>

      {/* 닉네임 */}
      <div>
        <label style={labelStyle}>닉네임</label>
        <input
          style={inputStyle} value={nickname} placeholder="닉네임을 입력하세요"
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>

      {/* 학번 */}
      <div>
        <label style={labelStyle}>학번</label>
        <input
          style={inputStyle} value={grade} placeholder="예: 27학번"
          onChange={(e) => setGrade(e.target.value)}
        />
      </div>

      {/* 학과 */}
      <div>
        <label style={labelStyle}>학과</label>
        <input
          style={inputStyle} value={dept} placeholder="예: 경영학부"
          onChange={(e) => setDept(e.target.value)}
        />
      </div>

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
