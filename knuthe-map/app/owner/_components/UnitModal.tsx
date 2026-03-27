'use client'

import { useState } from 'react'
import type { Unit } from './BuildingFloorMap'

interface Props {
  unit: Unit | null
  defaultFloor?: number
  buildingId: string
  onClose: () => void
  onSaved: () => void
}

const ROOM_TYPES = ['원룸', '투룸', '복층형원룸', '오피스텔', '아파트', '빌라', '단독주택']

export default function UnitModal({ unit, defaultFloor, buildingId, onClose, onSaved }: Props) {
  const isNew = !unit

  const [floor,       setFloor]       = useState(String(unit?.floor ?? defaultFloor ?? 1))
  const [unitNumber,  setUnitNumber]  = useState(unit?.unit_number ?? '')
  const [areaM2,      setAreaM2]      = useState(String(unit?.area_m2 ?? ''))
  const [roomType,    setRoomType]    = useState(unit?.room_type ?? '')
  const [baseDeposit, setBaseDeposit] = useState(String(unit?.base_deposit ?? ''))
  const [baseRent,    setBaseRent]    = useState(String(unit?.base_rent ?? ''))
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const handleSave = async () => {
    if (!unitNumber.trim()) { setError('호수를 입력해주세요'); return }
    if (!floor) { setError('층수를 입력해주세요'); return }

    setSaving(true); setError(null)
    const body = {
      building_id:  buildingId,
      floor:        parseInt(floor),
      unit_number:  unitNumber.trim(),
      area_m2:      areaM2      ? parseFloat(areaM2)    : null,
      room_type:    roomType    || null,
      base_deposit: baseDeposit ? parseInt(baseDeposit) : null,
      base_rent:    baseRent    ? parseInt(baseRent)    : null,
    }

    const res = await fetch(
      isNew ? '/api/owner/units' : `/api/owner/units/${unit!.id}`,
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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: '1.5px solid #e2e8f0', fontSize: 13, color: '#0f172a',
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  }

  const label = (txt: string) => (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', margin: '0 0 5px' }}>{txt}</p>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 520,
        padding: '20px 20px 36px',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0',
          margin: '0 auto 18px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            {isNew ? '호실 추가' : `${unit!.unit_number} 수정`}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: '#94a3b8' }}>닫기</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('층수')}
              <input style={inputStyle} type="number" placeholder="예) 3"
                value={floor} onChange={(e) => setFloor(e.target.value)} />
            </div>
            <div>
              {label('호수')}
              <input style={inputStyle} placeholder="예) 301"
                value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('방 유형')}
              <select style={{ ...inputStyle, cursor: 'pointer' }}
                value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                <option value="">선택</option>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              {label('면적 (㎡)')}
              <input style={inputStyle} type="number" step="0.1" placeholder="예) 23.5"
                value={areaM2} onChange={(e) => setAreaM2(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('기본 보증금 (만원)')}
              <input style={inputStyle} type="number" placeholder="예) 500"
                value={baseDeposit} onChange={(e) => setBaseDeposit(e.target.value)} />
            </div>
            <div>
              {label('기본 월세 (만원)')}
              <input style={inputStyle} type="number" placeholder="예) 40"
                value={baseRent} onChange={(e) => setBaseRent(e.target.value)} />
            </div>
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
            {saving ? '저장 중…' : isNew ? '호실 추가' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
