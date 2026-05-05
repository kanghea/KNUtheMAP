'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/hooks/useTheme'

type Status = 'pending' | 'in_progress' | 'resolved' | 'rejected'

const OPTIONS: { value: Status; label: string }[] = [
  { value: 'pending',     label: '대기' },
  { value: 'in_progress', label: '처리 중' },
  { value: 'resolved',    label: '완료' },
  { value: 'rejected',    label: '반려' },
]

export default function MinwonStatusSelect({
  id, status, adminNote,
}: {
  id: string
  status: Status
  adminNote: string
}) {
  const { tok } = useTheme()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState<Status>(status)
  const [localNote,   setLocalNote]   = useState<string>(adminNote)
  const [error,       setError]       = useState<string | null>(null)

  async function save() {
    setError(null)
    const res = await fetch(`/api/admin/minwon/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: localStatus, admin_note: localNote }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j?.error ?? '저장 실패')
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => setLocalStatus(o.value)}
            style={{
              padding: '6px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 600,
              border: `1px solid ${localStatus === o.value ? tok.accentColor : tok.inputBorder}`,
              background: localStatus === o.value ? tok.accentBg : tok.inputBg,
              color: localStatus === o.value ? tok.accentColor : tok.textSecondary,
              cursor: 'pointer',
            }}
          >{o.label}</button>
        ))}
      </div>
      <textarea
        value={localNote}
        onChange={(e) => setLocalNote(e.target.value)}
        placeholder="관리자 메모 (선택)"
        rows={2}
        style={{
          width: '100%',
          padding: '8px 10px',
          border: `1px solid ${tok.inputBorder}`,
          borderRadius: 8,
          background: tok.inputBg,
          color: tok.inputColor,
          fontSize: 12, lineHeight: 1.5,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
        }}
      />
      {error && (
        <p style={{ fontSize: 11, color: tok.dangerColor, margin: 0 }}>{error}</p>
      )}
      <button
        onClick={save}
        disabled={pending}
        style={{
          alignSelf: 'flex-end',
          padding: '8px 16px', borderRadius: 10,
          background: tok.accentColor, color: '#fff',
          border: 'none', fontSize: 12, fontWeight: 700,
          cursor: pending ? 'wait' : 'pointer',
          opacity: pending ? 0.7 : 1,
        }}
      >저장</button>
    </div>
  )
}
