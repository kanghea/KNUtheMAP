'use client'

import { useState, useCallback } from 'react'
import { IconPencil, IconClose } from '@/components/shared/icons'

export interface Contract {
  id: string
  unit_id: string
  contract_type: '월세' | '전세'
  deposit: number
  monthly_rent: number | null
  maintenance: number | null
  contract_start: string | null
  contract_end: string | null
  status: 'active' | 'expired' | 'terminated'
  tenant_name: string | null
  tenant_phone: string | null
  memo: string | null
  is_auto_renew: boolean
  created_at: string
  building_units: { floor: number; unit_number: string; room_type: string | null } | null
}

export interface UnitOption {
  id: string
  floor: number
  unit_number: string
}

interface Props {
  buildingId: string
  initialContracts: Contract[]
  units: UnitOption[]
}

type FilterTab = 'active' | 'closed' | 'all'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'active', label: '활성' },
  { key: 'closed', label: '만료·종료' },
  { key: 'all',    label: '전체' },
]

const STATUS_CONFIG = {
  active:     { bg: '#dcfce7', color: '#15803d', label: '활성' },
  expired:    { bg: '#f1f5f9', color: '#64748b', label: '만료' },
  terminated: { bg: '#fee2e2', color: '#dc2626', label: '종료' },
}

function formatMoney(v: number | null | undefined, suffix = '만') {
  if (v == null) return null
  return `${v.toLocaleString()}${suffix}`
}

function formatDateKo(iso: string | null) {
  if (!iso) return null
  return iso.slice(0, 7).replace('-', '.')
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// --- ContractModal ---
interface ModalProps {
  contract: Contract | null   // null = new
  units: UnitOption[]
  onClose: () => void
  onSaved: () => void
}

function ContractModal({ contract, units, onClose, onSaved }: ModalProps) {
  const isNew = !contract

  const [unitId,        setUnitId]        = useState(contract?.unit_id ?? (units[0]?.id ?? ''))
  const [contractType,  setContractType]  = useState<'월세' | '전세'>(contract?.contract_type ?? '월세')
  const [deposit,       setDeposit]       = useState(String(contract?.deposit ?? ''))
  const [monthlyRent,   setMonthlyRent]   = useState(String(contract?.monthly_rent ?? ''))
  const [maintenance,   setMaintenance]   = useState(String(contract?.maintenance ?? ''))
  const [tenantName,    setTenantName]    = useState(contract?.tenant_name ?? '')
  const [tenantPhone,   setTenantPhone]   = useState(contract?.tenant_phone ?? '')
  const [contractStart, setContractStart] = useState(contract?.contract_start?.slice(0, 10) ?? '')
  const [contractEnd,   setContractEnd]   = useState(contract?.contract_end?.slice(0, 10) ?? '')
  const [isAutoRenew,   setIsAutoRenew]   = useState(contract?.is_auto_renew ?? false)
  const [memo,          setMemo]          = useState(contract?.memo ?? '')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 16, color: '#0f172a',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  }

  const label = (txt: string, req = false) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', margin: '0 0 5px' }}>
      {txt}{req && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
    </p>
  )

  const handleSave = async () => {
    if (!unitId) { setError('호실을 선택해주세요'); return }
    if (!deposit) { setError('보증금을 입력해주세요'); return }
    setSaving(true); setError(null)

    const body = {
      unit_id:        unitId,
      contract_type:  contractType,
      deposit:        parseInt(deposit),
      monthly_rent:   monthlyRent  ? parseInt(monthlyRent)  : null,
      maintenance:    maintenance  ? parseInt(maintenance)  : null,
      tenant_name:    tenantName   || null,
      tenant_phone:   tenantPhone  || null,
      contract_start: contractStart || null,
      contract_end:   contractEnd   || null,
      is_auto_renew:  isAutoRenew,
      memo:           memo || null,
    }

    const res = await fetch(
      isNew ? '/api/owner/contracts' : `/api/owner/contracts/${contract!.id}`,
      {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    setSaving(false)
    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? '저장에 실패했어요')
      return
    }
    onSaved()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 520,
        padding: '20px 20px 40px',
        maxHeight: '92vh', overflowY: 'auto',
      }}>
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0', margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isNew ? '계약 추가' : '계약 수정'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#94a3b8' }}>
            닫기
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 호실 선택 */}
          <div>
            {label('호실', true)}
            <select
              style={{ ...inputStyle, cursor: 'pointer' }}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
            >
              {units.length === 0 && <option value="">등록된 호실 없음</option>}
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.floor}층 {u.unit_number}
                </option>
              ))}
            </select>
          </div>

          {/* 계약 유형 */}
          <div>
            {label('계약 유형', true)}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['월세', '전세'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setContractType(t)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    cursor: 'pointer',
                    border: contractType === t ? 'none' : '1.5px solid #e2e8f0',
                    background: contractType === t ? '#2563eb' : '#fff',
                    color: contractType === t ? '#fff' : '#64748b',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 보증금 / 월세 */}
          <div style={{ display: 'grid', gridTemplateColumns: contractType === '월세' ? '1fr 1fr' : '1fr', gap: 10 }}>
            <div>
              {label('보증금 (만원)', true)}
              <input
                style={inputStyle} type="number" placeholder="예) 500"
                value={deposit} onChange={(e) => setDeposit(e.target.value)}
              />
            </div>
            {contractType === '월세' && (
              <div>
                {label('월세 (만원)')}
                <input
                  style={inputStyle} type="number" placeholder="예) 40"
                  value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 관리비 */}
          <div>
            {label('관리비 (만원)')}
            <input
              style={inputStyle} type="number" placeholder="예) 5"
              value={maintenance} onChange={(e) => setMaintenance(e.target.value)}
            />
          </div>

          {/* 임차인 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('임차인 이름')}
              <input
                style={inputStyle} placeholder="홍길동"
                value={tenantName} onChange={(e) => setTenantName(e.target.value)}
              />
            </div>
            <div>
              {label('연락처')}
              <input
                style={inputStyle} placeholder="010-0000-0000"
                value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)}
              />
            </div>
          </div>

          {/* 계약 기간 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('계약 시작일')}
              <input
                style={inputStyle} type="date"
                value={contractStart} onChange={(e) => setContractStart(e.target.value)}
              />
            </div>
            <div>
              {label('계약 종료일')}
              <input
                style={inputStyle} type="date"
                value={contractEnd} onChange={(e) => setContractEnd(e.target.value)}
              />
            </div>
          </div>

          {/* 자동 갱신 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAutoRenew}
              onChange={(e) => setIsAutoRenew(e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#374151' }}>자동 갱신</span>
          </label>

          {/* 메모 */}
          <div>
            {label('메모')}
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              placeholder="계약 관련 메모..."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          {error && <p style={{ margin: 0, fontSize: 12, color: '#ef4444' }}>{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '13px', borderRadius: 12, border: 'none',
              background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              marginTop: 4,
            }}
          >
            {saving ? '저장 중…' : isNew ? '계약 추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main client component ---
export default function ContractsClient({ buildingId, initialContracts, units }: Props) {
  const [contracts, setContracts] = useState<Contract[]>(initialContracts)
  const [activeTab, setActiveTab] = useState<FilterTab>('active')
  const [modalContract, setModalContract] = useState<Contract | null | undefined>(undefined)
  const [terminating, setTerminating] = useState<string | null>(null)

  const reloadContracts = useCallback(async () => {
    const res = await fetch('/api/owner/contracts')
    if (res.ok) setContracts(await res.json())
  }, [])

  const handleTerminate = async (contract: Contract) => {
    const label = contract.building_units
      ? `${contract.building_units.floor}층 ${contract.building_units.unit_number}`
      : '해당 계약'
    if (!window.confirm(`"${label}" 계약을 종료 처리할까요?`)) return
    setTerminating(contract.id)
    const res = await fetch(`/api/owner/contracts/${contract.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'terminated' }),
    })
    if (res.ok) await reloadContracts()
    setTerminating(null)
  }

  const filteredContracts = contracts.filter((c) => {
    if (activeTab === 'active') return c.status === 'active'
    if (activeTab === 'closed') return c.status === 'expired' || c.status === 'terminated'
    return true
  })

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    padding: '16px 18px',
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#64748b', flexShrink: 0,
  }

  const emptyLabels: Record<FilterTab, string> = {
    active: '활성 계약이 없어요',
    closed: '만료·종료된 계약이 없어요',
    all:    '등록된 계약이 없어요',
  }

  return (
    <div>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer',
                  border: isActive ? 'none' : '1.5px solid #e2e8f0',
                  background: isActive ? '#2563eb' : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setModalContract(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 12,
            background: '#2563eb', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
          }}
        >
          + 계약 추가
        </button>
      </div>

      {/* Contract list */}
      {filteredContracts.length === 0 ? (
        <div style={{
          ...cardStyle,
          padding: '40px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 12px' }}>
            {emptyLabels[activeTab]}
          </p>
          <button
            onClick={() => setModalContract(null)}
            style={{
              padding: '8px 18px', borderRadius: 10,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
            }}
          >
            + 계약 추가
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredContracts.map((c) => {
            const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.expired
            const bu = c.building_units
            const days = daysUntil(c.contract_end)
            const showWarning = c.status === 'active' && days !== null && days >= 0 && days <= 60

            return (
              <div key={c.id} style={cardStyle}>
                {/* Row 1: unit + status badge + actions */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Unit title + contract type */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {bu ? `${bu.floor}층 ${bu.unit_number}` : '호실 정보 없음'}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: '#eff6ff', color: '#2563eb',
                        padding: '2px 7px', borderRadius: 6,
                      }}>
                        {c.contract_type}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: statusCfg.bg, color: statusCfg.color,
                        padding: '2px 7px', borderRadius: 6,
                      }}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Tenant */}
                    {c.tenant_name && (
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        {c.tenant_name}
                        {c.tenant_phone && (
                          <span style={{ color: '#94a3b8', marginLeft: 6 }}>{c.tenant_phone}</span>
                        )}
                      </div>
                    )}

                    {/* Deposit / rent */}
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span>보증금 {formatMoney(c.deposit)}만</span>
                      {c.monthly_rent != null && (
                        <span>월세 {formatMoney(c.monthly_rent)}만</span>
                      )}
                      {c.maintenance != null && (
                        <span style={{ color: '#94a3b8' }}>관리비 {formatMoney(c.maintenance)}만</span>
                      )}
                    </div>

                    {/* Period */}
                    {(c.contract_start || c.contract_end) && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                        {[formatDateKo(c.contract_start), formatDateKo(c.contract_end)]
                          .map((d) => d ?? '미정').join(' ~ ')}
                        {c.is_auto_renew && (
                          <span style={{ marginLeft: 6, color: '#2563eb' }}>자동갱신</span>
                        )}
                      </div>
                    )}

                    {/* Expiry warning */}
                    {showWarning && (
                      <div style={{
                        marginTop: 6, display: 'inline-block',
                        fontSize: 11, fontWeight: 700,
                        background: '#fff7ed', color: '#c2410c',
                        padding: '3px 8px', borderRadius: 6,
                      }}>
                        {days === 0 ? '오늘 만료' : `${days}일 후 만료`}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
                    <button
                      onClick={() => setModalContract(c)}
                      style={iconBtnStyle}
                      title="수정"
                    >
                      <IconPencil />
                    </button>
                    {c.status === 'active' && (
                      <button
                        onClick={() => handleTerminate(c)}
                        disabled={terminating === c.id}
                        style={{ ...iconBtnStyle, color: '#ef4444', borderColor: '#fecaca' }}
                        title="종료 처리"
                      >
                        <IconClose size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ContractModal */}
      {modalContract !== undefined && (
        <ContractModal
          contract={modalContract}
          units={units}
          onClose={() => setModalContract(undefined)}
          onSaved={async () => {
            setModalContract(undefined)
            await reloadContracts()
          }}
        />
      )}
    </div>
  )
}
