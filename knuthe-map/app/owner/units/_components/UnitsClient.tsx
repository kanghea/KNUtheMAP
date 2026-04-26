'use client'

import { useState, useCallback } from 'react'
import UnitModal from '../../_components/UnitModal'
import { IconPencil, IconTrash } from '@/components/shared/icons'

export interface Unit {
  id: string
  floor: number
  unit_number: string
  area_m2: number | null
  room_type: string | null
  status: 'vacant' | 'occupied' | 'reserved'
  base_deposit: number | null
  base_rent: number | null
  images: string[]
  main_image_idx: number
}

interface Props {
  buildingId: string
  totalFloors: number | null
  initialUnits: Unit[]
}

type FilterTab = 'all' | 'vacant' | 'occupied' | 'reserved'

const STATUS_CONFIG = {
  vacant:   { bg: '#fee2e2', color: '#dc2626', label: '공실' },
  occupied: { bg: '#dcfce7', color: '#15803d', label: '입주' },
  reserved: { bg: '#fef9c3', color: '#a16207', label: '예약' },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'vacant',   label: '공실' },
  { key: 'occupied', label: '입주' },
  { key: 'reserved', label: '예약' },
]

export default function UnitsClient({ buildingId, totalFloors, initialUnits }: Props) {
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [editUnit, setEditUnit] = useState<Unit | null | undefined>(undefined) // undefined = closed, null = new
  const [deleting, setDeleting] = useState<string | null>(null)

  const reloadUnits = useCallback(async () => {
    const res = await fetch(`/api/owner/units?building_id=${buildingId}`)
    if (res.ok) setUnits(await res.json())
  }, [buildingId])

  const handleDelete = async (unit: Unit) => {
    if (!window.confirm(`"${unit.floor}층 ${unit.unit_number}" 호실을 삭제할까요?`)) return
    setDeleting(unit.id)
    const res = await fetch(`/api/owner/units/${unit.id}`, { method: 'DELETE' })
    if (res.ok) {
      await reloadUnits()
    }
    setDeleting(null)
  }

  const filteredUnits = activeTab === 'all'
    ? units
    : units.filter((u) => u.status === activeTab)

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 20,
    border: '1px solid #f1f5f9',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  }

  const iconBtnStyle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
    flexShrink: 0,
  }

  return (
    <div>
      {/* Top row: filter tabs + add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        {/* Pill tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  border: isActive ? 'none' : '1.5px solid #e2e8f0',
                  background: isActive ? '#2563eb' : '#fff',
                  color: isActive ? '#fff' : '#64748b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Add button */}
        <button
          onClick={() => setEditUnit(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 12,
            background: '#2563eb', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700,
          }}
        >
          + 호실 추가
        </button>
      </div>

      {/* Unit list */}
      {filteredUnits.length === 0 ? (
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          padding: '40px 20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 12px' }}>
            등록된 호실이 없어요
          </p>
          <button
            onClick={() => setEditUnit(null)}
            style={{
              padding: '8px 18px', borderRadius: 10,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
            }}
          >
            + 호실 추가
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredUnits.map((unit) => {
            const statusCfg = STATUS_CONFIG[unit.status] ?? STATUS_CONFIG.vacant
            const mainImgUrl = unit.images?.[unit.main_image_idx] ?? unit.images?.[0] ?? null

            return (
              <div key={unit.id} style={cardStyle}>
                {/* Thumbnail */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: '#f1f5f9', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {mainImgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mainImgUrl}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                    {unit.floor}층 {unit.unit_number}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {[unit.room_type, unit.area_m2 != null ? `${unit.area_m2}㎡` : null]
                      .filter(Boolean).join(' · ') || '정보 없음'}
                  </div>
                </div>

                {/* Right: status badge + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    background: statusCfg.bg, color: statusCfg.color,
                    padding: '3px 8px', borderRadius: 8,
                  }}>
                    {statusCfg.label}
                  </span>

                  <button
                    onClick={() => setEditUnit(unit)}
                    style={iconBtnStyle}
                    title="수정"
                  >
                    <IconPencil />
                  </button>

                  <button
                    onClick={() => handleDelete(unit)}
                    disabled={deleting === unit.id}
                    style={{ ...iconBtnStyle, color: '#ef4444', borderColor: '#fecaca' }}
                    title="삭제"
                  >
                    <IconTrash />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* UnitModal — editUnit === undefined means closed */}
      {editUnit !== undefined && (
        <UnitModal
          unit={editUnit}
          buildingId={buildingId}
          onClose={() => setEditUnit(undefined)}
          onSaved={async () => {
            setEditUnit(undefined)
            await reloadUnits()
          }}
        />
      )}
    </div>
  )
}
