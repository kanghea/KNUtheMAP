'use client'

import { useState } from 'react'

export interface Unit {
  id: string
  floor: number
  unit_number: string
  area_m2: number | null
  room_type: string | null
  status: 'vacant' | 'occupied' | 'reserved'
  base_deposit: number | null
  base_rent: number | null
  // 현재 계약 (있으면)
  contract?: {
    id: string
    tenant_name: string | null
    deposit: number
    monthly_rent: number | null
    contract_start: string | null
    contract_end: string | null
    status: string
  } | null
}

interface Props {
  units: Unit[]
  onUnitClick: (unit: Unit) => void
  onAddUnit: (floor: number) => void
}

const STATUS_COLOR: Record<Unit['status'], { bg: string; border: string; text: string; label: string }> = {
  occupied: { bg: '#dcfce7', border: '#86efac', text: '#15803d', label: '입주' },
  vacant:   { bg: '#fee2e2', border: '#fca5a5', text: '#dc2626', label: '공실' },
  reserved: { bg: '#fef9c3', border: '#fde047', text: '#a16207', label: '예약' },
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function BuildingFloorMap({ units, onUnitClick, onAddUnit }: Props) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)

  // 층별 그룹핑
  const floors = Array.from(new Set(units.map((u) => u.floor))).sort((a, b) => b - a)
  const byFloor = (floor: number) => units.filter((u) => u.floor === floor)

  const totalUnits   = units.length
  const occupiedCnt  = units.filter((u) => u.status === 'occupied').length
  const vacantCnt    = units.filter((u) => u.status === 'vacant').length
  const expiringSoon = units.filter((u) => {
    const days = daysUntil(u.contract?.contract_end)
    return days !== null && days >= 0 && days <= 60
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 요약 통계 ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: '전체 호실', value: totalUnits,  color: '#2563eb', bg: '#eff6ff' },
          { label: '입주',      value: occupiedCnt, color: '#16a34a', bg: '#f0fdf4' },
          { label: '공실',      value: vacantCnt,   color: '#dc2626', bg: '#fef2f2' },
          { label: '만료임박',  value: expiringSoon,color: '#d97706', bg: '#fffbeb' },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: 12, padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── 범례 ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLOR).map(([key, s]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.bg, border: `1px solid ${s.border}` }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#fef9c3', border: '2px solid #f59e0b' }} />
          <span style={{ fontSize: 11, color: '#64748b' }}>만료 60일 이내</span>
        </div>
      </div>

      {/* ── 층별 시각화 ──────────────────────────────────────── */}
      <div style={{
        border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden',
        background: '#fff',
      }}>
        {floors.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏗️</div>
            <p style={{ fontSize: 13, margin: '0 0 4px' }}>등록된 호실이 없어요</p>
            <p style={{ fontSize: 11 }}>아래 버튼으로 호실을 추가해주세요</p>
          </div>
        ) : (
          floors.map((floor, fi) => {
            const floorUnits = byFloor(floor)
            const isSelected = selectedFloor === floor
            return (
              <div key={floor} style={{
                borderBottom: fi < floors.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                {/* 층 헤더 */}
                <button
                  onClick={() => setSelectedFloor(isSelected ? null : floor)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    padding: '10px 16px', background: isSelected ? '#f8fafc' : '#fff',
                    border: 'none', cursor: 'pointer', textAlign: 'left', gap: 10,
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, background: '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#374151', flexShrink: 0,
                  }}>
                    {floor}F
                  </span>
                  <div style={{ flex: 1, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {floorUnits.map((u) => {
                      const s = STATUS_COLOR[u.status]
                      const days = daysUntil(u.contract?.contract_end)
                      const isExpiring = days !== null && days >= 0 && days <= 60
                      return (
                        <span
                          key={u.id}
                          style={{
                            padding: '3px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            background: s.bg,
                            border: isExpiring ? '2px solid #f59e0b' : `1.5px solid ${s.border}`,
                            color: s.text,
                          }}
                        >
                          {u.unit_number}
                        </span>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {floorUnits.filter((u) => u.status === 'occupied').length}/{floorUnits.length}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: isSelected ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </button>

                {/* 펼쳐진 호실 목록 */}
                {isSelected && (
                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {floorUnits.map((u) => {
                      const s = STATUS_COLOR[u.status]
                      const days = daysUntil(u.contract?.contract_end)
                      const isExpiring = days !== null && days >= 0 && days <= 60
                      return (
                        <button
                          key={u.id}
                          onClick={() => onUnitClick(u)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                            border: isExpiring ? '2px solid #f59e0b' : `1.5px solid ${s.border}`,
                            background: s.bg, cursor: 'pointer', width: '100%',
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.text, flexShrink: 0 }}>
                            {u.unit_number}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, color: '#475569' }}>
                              {[u.room_type, u.area_m2 ? `${u.area_m2}㎡` : null].filter(Boolean).join(' · ') || '정보 없음'}
                            </div>
                            {u.contract && u.status === 'occupied' && (
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                {u.contract.monthly_rent
                                  ? `${u.contract.deposit}만 / 월 ${u.contract.monthly_rent}만`
                                  : `전세 ${u.contract.deposit}만`}
                                {u.contract.contract_end && (
                                  <span style={{ marginLeft: 6, color: isExpiring ? '#d97706' : '#94a3b8' }}>
                                    {isExpiring ? `⚠️ ${days}일 후 만료` : `~${u.contract.contract_end.slice(0, 7)}`}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                            background: s.bg, color: s.text, border: `1px solid ${s.border}`, flexShrink: 0,
                          }}>
                            {s.label}
                          </span>
                        </button>
                      )
                    })}
                    <button
                      onClick={() => onAddUnit(floor)}
                      style={{
                        padding: '8px', borderRadius: 10, border: '1.5px dashed #cbd5e1',
                        background: '#f8fafc', color: '#94a3b8',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      이 층에 호실 추가
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
