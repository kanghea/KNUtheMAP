'use client'

import { useState } from 'react'

interface Request {
  id: string
  requested_role: 'owner' | 'agent'
  status: 'pending' | 'approved' | 'rejected'
  business_name: string | null
  address: string | null
  license_number: string | null
  phone: string | null
  memo: string | null
  created_at: string
  reviewed_at: string | null
  reject_reason: string | null
  users: { id: string; email: string; nickname: string | null; role: string }
}

const ROLE_LABEL: Record<string, string> = { owner: '건물주', agent: '공인중개사' }
const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#fef3c7', color: '#92400e', label: '대기 중' },
  approved: { bg: '#dcfce7', color: '#15803d', label: '승인됨' },
  rejected: { bg: '#fee2e2', color: '#dc2626', label: '거절됨' },
}

export default function ApprovalList({ requests }: { requests: Request[] }) {
  const [list,          setList]          = useState(requests)
  const [rejectId,      setRejectId]      = useState<string | null>(null)
  const [rejectReason,  setRejectReason]  = useState('')
  const [processing,    setProcessing]    = useState<string | null>(null)
  const [tab,           setTab]           = useState<'pending' | 'all'>('pending')

  const filtered = tab === 'pending' ? list.filter((r) => r.status === 'pending') : list

  const handleApprove = async (req: Request) => {
    setProcessing(req.id)
    const res = await fetch('/api/admin/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: req.id, action: 'approve' }),
    })
    setProcessing(null)
    if (res.ok) {
      setList((prev) => prev.map((r) => r.id === req.id ? { ...r, status: 'approved' } : r))
    }
  }

  const handleReject = async () => {
    if (!rejectId) return
    setProcessing(rejectId)
    const res = await fetch('/api/admin/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: rejectId, action: 'reject', reason: rejectReason }),
    })
    setProcessing(null)
    if (res.ok) {
      setList((prev) => prev.map((r) => r.id === rejectId ? { ...r, status: 'rejected', reject_reason: rejectReason } : r))
    }
    setRejectId(null)
    setRejectReason('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4 }}>
        {(['pending', 'all'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: tab === t ? 'var(--bg-elevated)' : 'transparent',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
            boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            {t === 'pending' ? `대기 중 (${list.filter((r) => r.status === 'pending').length})` : '전체'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
          {tab === 'pending' ? '대기 중인 신청이 없어요' : '신청 내역이 없어요'}
        </div>
      )}

      {filtered.map((req) => {
        const ss = STATUS_STYLE[req.status]
        return (
          <div key={req.id} style={{
            background: 'var(--bg-elevated)', borderRadius: 16, border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)', overflow: 'hidden',
          }}>
            <div style={{ padding: '16px 18px' }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: req.requested_role === 'owner' ? '#f0fdf4' : '#f5f3ff',
                      color: req.requested_role === 'owner' ? '#16a34a' : '#7c3aed',
                    }}>
                      {ROLE_LABEL[req.requested_role]}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: ss.bg, color: ss.color,
                    }}>
                      {ss.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {req.business_name ?? '(사업체명 없음)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    {req.users.nickname ?? req.users.email} · {req.users.email}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right', flexShrink: 0 }}>
                  {new Date(req.created_at).toLocaleDateString('ko-KR')}
                </div>
              </div>

              {/* 상세 정보 */}
              <div style={{
                background: 'var(--bg-secondary)', borderRadius: 10, padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 4, marginBottom: req.status === 'pending' ? 12 : 0,
              }}>
                {req.address && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>주소: </span>{req.address}
                  </div>
                )}
                {req.license_number && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>등록번호: </span>{req.license_number}
                  </div>
                )}
                {req.phone && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>연락처: </span>{req.phone}
                  </div>
                )}
                {req.memo && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>메모: </span>{req.memo}
                  </div>
                )}
                {req.reject_reason && (
                  <div style={{ fontSize: 12, color: '#dc2626' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>거절 사유: </span>{req.reject_reason}
                  </div>
                )}
              </div>

              {/* 승인/거절 버튼 */}
              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processing === req.id}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      background: processing === req.id ? '#86efac' : '#16a34a',
                      color: 'var(--text-inverse)', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    {processing === req.id ? '처리 중…' : '✓ 승인'}
                  </button>
                  <button
                    onClick={() => { setRejectId(req.id); setRejectReason('') }}
                    disabled={processing === req.id}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      background: '#fff0f0', color: '#dc2626',
                      border: '1px solid #fecaca', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    ✕ 거절
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* 거절 사유 모달 */}
      {rejectId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setRejectId(null) }}
        >
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 400,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 14px' }}>
              거절 사유 입력
            </h3>
            <textarea
              style={{
                width: '100%', height: 80, padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #e2e8f0', fontSize: 13, resize: 'none',
                boxSizing: 'border-box', outline: 'none',
              }}
              placeholder="거절 사유를 입력해주세요 (선택)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setRejectId(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                }}>
                취소
              </button>
              <button onClick={handleReject}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: '#dc2626', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700,
                }}>
                거절 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
