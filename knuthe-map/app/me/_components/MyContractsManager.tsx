'use client'

import { useState, useEffect, useCallback } from 'react'
import ContractForm from './ContractForm'
import ContractCard from './ContractCard'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'

export interface HistoryEntry {
  id: string
  action: 'created' | 'updated' | 'renewed' | 'ended'
  changed_fields: Record<string, [unknown, unknown]> | null
  snapshot: Record<string, unknown>
  created_at: string
}

export interface UserContract {
  id: string
  contract_type: '월세' | '전세'
  deposit: number
  monthly_rent: number | null
  maintenance: number | null
  unit_number: string | null
  floor: number | null
  area_m2: number | null
  room_type: string | null
  contract_start: string | null
  contract_end: string | null
  is_renewal: boolean
  previous_contract_id: string | null
  address_text: string | null
  memo: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  building_id: string | null
  buildings: { id: string; name: string | null; address: string | null } | null
  user_contract_history: HistoryEntry[]
}

export default function MyContractsManager({ theme = 'dark' as ThemeMode }: { theme?: ThemeMode }) {
  const tok = THEME_TOKENS[theme]
  const [contracts, setContracts] = useState<UserContract[]>([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [renewing,  setRenewing]  = useState<UserContract | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/user-contracts')
    if (res.ok) setContracts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaved = () => {
    setShowForm(false)
    setRenewing(null)
    load()
  }

  const handleEnd = async (id: string) => {
    await fetch(`/api/user-contracts/${id}`, { method: 'DELETE' })
    load()
  }

  const handleEdit = async (id: string, patch: Partial<UserContract>) => {
    await fetch(`/api/user-contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── 헤더 ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
            내 계약 관리
          </h2>
          <p style={{ fontSize: 11, color: tok.textTertiary, margin: '3px 0 0' }}>
            실거래 데이터로 건물 시세에 반영됩니다
          </p>
        </div>
        {!showForm && !renewing && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 14px', borderRadius: 10,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            계약 추가
          </button>
        )}
      </div>

      {/* ── 추가 / 연장 폼 ───────────────────────────────────── */}
      {(showForm || renewing) && (
        <ContractForm
          renewal={renewing ?? undefined}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setRenewing(null) }}
        />
      )}

      {/* ── 계약 목록 ────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: tok.textTertiary, fontSize: 13 }}>
          불러오는 중…
        </div>
      ) : contracts.length === 0 && !showForm ? (
        <div style={{
          background: tok.inputBg, borderRadius: 16, padding: '28px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>🏠</span>
          <p style={{ margin: 0, fontSize: 13, color: tok.textSecondary, textAlign: 'center', lineHeight: 1.6 }}>
            등록된 계약이 없어요<br />
            <span style={{ color: tok.textTertiary, fontSize: 12 }}>
              계약 추가 시 건물 실거래 시세에 반영됩니다
            </span>
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              onEdit={(patch) => handleEdit(c.id, patch)}
              onEnd={() => handleEnd(c.id)}
              onRenew={() => setRenewing(c)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
