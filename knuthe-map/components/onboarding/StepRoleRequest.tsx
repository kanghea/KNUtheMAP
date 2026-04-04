'use client'

import { useState } from 'react'

interface Props {
  role: 'owner' | 'agent'
  onSubmitted: () => void
  onBack: () => void
  tok: {
    bg: string
    surface: string
    textPrimary: string
    textSecondary: string
    textTertiary: string
    border: string
    cardBg: string
    cardBorder: string
    cardActiveBg: string
    cardActiveBorder: string
    accent: string
    btnBack: string
    btnBackBorder: string
    btnBackColor: string
    btnPrimary: string
    btnPrimaryText: string
  }
}

export default function StepRoleRequest({ role, onSubmitted, onBack, tok }: Props) {
  const [businessName,   setBusinessName]   = useState('')
  const [address,        setAddress]        = useState('')
  const [licenseNumber,  setLicenseNumber]  = useState('')
  const [phone,          setPhone]          = useState('')
  const [memo,           setMemo]           = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  const isOwner = role === 'owner'

  const handleSubmit = async () => {
    if (!businessName.trim()) {
      setError(isOwner ? '건물명을 입력해주세요' : '사무소명을 입력해주세요')
      return
    }
    if (!address.trim()) {
      setError(isOwner ? '건물 주소를 입력해주세요' : '사무소 주소를 입력해주세요')
      return
    }
    if (!isOwner && !licenseNumber.trim()) {
      setError('중개사 등록번호를 입력해주세요')
      return
    }

    setSubmitting(true); setError(null)
    const res = await fetch('/api/role-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requested_role: role,
        business_name:  businessName.trim(),
        address:        address.trim(),
        license_number: licenseNumber.trim() || null,
        phone:          phone.trim() || null,
        memo:           memo.trim() || null,
      }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? '신청에 실패했어요')
      return
    }
    onSubmitted()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${tok.cardBorder}`, fontSize: 13, color: tok.textPrimary,
    background: tok.cardBg, outline: 'none', boxSizing: 'border-box',
    transition: 'background .4s ease, border-color .4s ease, color .4s ease',
  }

  const label = (txt: string, required = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: tok.textSecondary, margin: '0 0 6px', transition: 'color .4s ease' }}>
      {txt}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: tok.cardActiveBg,
        border: `1.5px solid ${tok.cardActiveBorder}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background .4s ease, border-color .4s ease',
      }}>
        {/* 아이콘 */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: tok.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isOwner ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
              <line x1="9" y1="6" x2="9" y2="6.01"/>
              <line x1="15" y1="6" x2="15" y2="6.01"/>
              <line x1="9" y1="10" x2="9" y2="10.01"/>
              <line x1="15" y1="10" x2="15" y2="10.01"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
              <line x1="9" y1="18" x2="15" y2="18"/>
            </svg>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary, transition: 'color .4s ease' }}>
            {isOwner ? '방 내놓기 신청' : '공인중개사 신청'}
          </div>
          <div style={{ fontSize: 11, color: tok.textSecondary, marginTop: 2, transition: 'color .4s ease' }}>
            관리자 검토 후 승인 알림을 드려요 (보통 1~2일 소요)
          </div>
        </div>
      </div>

      <div>
        {label(isOwner ? '건물명' : '사무소명', true)}
        <input style={inputStyle}
          placeholder={isOwner ? '예) 복현빌라' : '예) 경북부동산 중개사무소'}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </div>

      <div>
        {label(isOwner ? '건물 주소' : '사무소 주소', true)}
        <input style={inputStyle}
          placeholder="예) 대구 북구 복현로 123"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {!isOwner && (
        <div>
          {label('중개사 등록번호', true)}
          <input style={inputStyle}
            placeholder="예) 대구-2024-00123"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>
      )}

      <div>
        {label('연락처')}
        <input style={inputStyle}
          placeholder="예) 010-1234-5678"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div>
        {label('추가 메모 (선택)')}
        <textarea
          style={{ ...inputStyle, height: 72, resize: 'none', lineHeight: 1.5 }}
          placeholder="기타 전달 사항"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            border: `1.5px solid ${tok.btnBackBorder}`, background: tok.btnBack,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background .4s ease, border-color .4s ease',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke={tok.btnBackColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1, height: 46, borderRadius: 12, border: 'none',
            background: submitting ? tok.textTertiary : tok.btnPrimary,
            color: tok.btnPrimaryText,
            fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
            transition: 'background .4s ease, color .4s ease',
          }}
        >
          {submitting ? '신청 중…' : '신청하기'}
        </button>
      </div>
    </div>
  )
}
