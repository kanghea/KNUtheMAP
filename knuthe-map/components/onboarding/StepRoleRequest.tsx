'use client'

import { useState } from 'react'
import type { UserRole } from './StepRole'

interface Props {
  role: 'owner' | 'agent'
  onSubmitted: () => void
  onBack: () => void
}

export default function StepRoleRequest({ role, onSubmitted, onBack }: Props) {
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
    border: '1.5px solid #e2e8f0', fontSize: 13, color: 'var(--text-primary)',
    background: 'var(--bg-elevated)', outline: 'none', boxSizing: 'border-box',
  }

  const label = (txt: string, required = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px' }}>
      {txt}{required && <span style={{ color: 'var(--color-red)', marginLeft: 2 }}>*</span>}
    </p>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        background: isOwner ? '#f0fdf4' : '#f5f3ff',
        border: `1.5px solid ${isOwner ? '#bbf7d0' : '#ddd6fe'}`,
        borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>{isOwner ? '🏠' : '🏢'}</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isOwner ? '건물주 신청' : '공인중개사 신청'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
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
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-red)' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onBack}
          style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            border: '1.5px solid #e2e8f0', background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            flex: 1, height: 46, borderRadius: 12, border: 'none',
            background: submitting ? '#93c5fd' : '#2563eb', color: 'var(--text-inverse)',
            fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
          }}
        >
          {submitting ? '신청 중…' : '신청하기'}
        </button>
      </div>
    </div>
  )
}
