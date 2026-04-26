'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import BuildingFloorMap, { type Unit } from './BuildingFloorMap'
import UnitModal from './UnitModal'
import BuildingRegister from './BuildingRegister'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'

interface OwnerBuilding {
  id: string
  dedicated_agent_id: string | null
  buildings: { id: string; name: string | null; address: string | null; total_floors: number | null }
  dedicated_agent: { id: string; nickname: string | null; email: string } | null
}

interface Props {
  ownerBuilding: OwnerBuilding | null
  userId: string
}

export default function OwnerDashboardClient({ ownerBuilding: initial, userId }: Props) {
  const [building,      setBuilding]      = useState<OwnerBuilding | null>(initial)
  const [units,         setUnits]         = useState<Unit[]>([])
  const [loading,       setLoading]       = useState(false)
  const [selectedUnit,  setSelectedUnit]  = useState<Unit | null>(null)
  const [addFloor,      setAddFloor]      = useState<number | null>(null)

  // 건물명 편집
  const [editingName, setEditingName] = useState(false)
  const [nameInput,   setNameInput]   = useState('')
  const [nameSaving,  setNameSaving]  = useState(false)
  const [nameError,   setNameError]   = useState<string | null>(null)

  const loadUnits = useCallback(async (buildingId: string) => {
    setLoading(true)
    const res = await fetch(`/api/owner/units?building_id=${buildingId}`)
    if (res.ok) setUnits(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (building?.buildings?.id) loadUnits(building.buildings.id)
  }, [building, loadUnits])

  const startEditName = () => {
    setNameInput(building?.buildings?.name ?? '')
    setNameError(null)
    setEditingName(true)
  }

  const saveName = async () => {
    const name = nameInput.trim()
    if (!name) { setNameError('건물명을 입력해주세요'); return }
    setNameSaving(true); setNameError(null)
    const res = await fetch('/api/owner/buildings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building_name: name }),
    })
    const json = await res.json()
    setNameSaving(false)
    if (!res.ok) { setNameError(json.error ?? '저장 실패'); return }
    setBuilding((prev) => prev
      ? { ...prev, buildings: { ...prev.buildings, name: json.name } }
      : prev
    )
    setEditingName(false)
  }

  if (!building) {
    return (
      <BuildingRegister
        userId={userId}
        onRegistered={(b) => setBuilding(b as OwnerBuilding)}
      />
    )
  }

  const b = building.buildings

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 건물 정보 카드 */}
      <div style={{
        background: '#111111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)', padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>

          {/* 건물명 — 편집 모드 토글 */}
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div>
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  style={{
                    width: '100%', fontSize: 16, fontWeight: 800, color: '#ffffff',
                    border: 'none', borderBottom: '2px solid #2563eb',
                    outline: 'none', background: 'transparent',
                    padding: '2px 0', boxSizing: 'border-box',
                  }}
                />
                {nameError && (
                  <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{nameError}</p>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button
                    onClick={saveName}
                    disabled={nameSaving}
                    style={{
                      padding: '5px 12px', borderRadius: 8, border: 'none',
                      background: nameSaving ? 'rgba(147,197,253,0.5)' : '#2563eb',
                      color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {nameSaving ? '저장 중…' : '저장'}
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    style={{
                      padding: '5px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  {b.name ?? '이름 없는 건물'}
                </div>
                <button
                  onClick={startEditName}
                  title="건물명 수정"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px', display: 'flex', alignItems: 'center',
                    color: '#94a3b8',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            )}
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{b.address}</div>
            {b.total_floors && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{b.total_floors}층 건물</div>
            )}
          </div>

          <Link href="/owner/units" style={{
            fontSize: 12, fontWeight: 600, color: '#2563eb',
            background: '#eff6ff', padding: '6px 12px', borderRadius: 8,
            textDecoration: 'none', flexShrink: 0,
          }}>
            호실 관리
          </Link>
        </div>

        {/* 전담 중개사 */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>전담 중개사</span>
            <Link href="/owner/agent" style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none' }}>
              {building.dedicated_agent ? '변경' : '설정하기 →'}
            </Link>
          </div>
          {building.dedicated_agent ? (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>🏢</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                  {building.dedicated_agent.nickname ?? building.dedicated_agent.email}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{building.dedicated_agent.email}</div>
              </div>
            </div>
          ) : (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>
              설정된 전담 중개사가 없어요
            </p>
          )}
        </div>
      </div>

      {/* 호실 현황 */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #f1f5f9',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: '18px 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>호실 현황</h2>
            {b.total_floors && (
              <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                지상 {b.total_floors}층 건물
              </p>
            )}
          </div>
          <button
            onClick={() => setAddFloor(1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8,
              background: '#2563eb', color: '#fff',
              border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
            }}
          >
            + 호실 추가
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            불러오는 중…
          </div>
        ) : (
          <BuildingFloorMap
            units={units}
            totalFloors={b.total_floors}
            onUnitClick={setSelectedUnit}
            onAddUnit={setAddFloor}
          />
        )}
      </div>
      <LoadingRunnerOverlay show={loading} />

      {/* 빠른 링크 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { href: '/owner/contracts', label: '계약 관리', icon: '📋', desc: '임대 계약 등록·조회' },
          { href: '/owner/units',     label: '호실 관리', icon: '🏠', desc: '호실 정보 수정' },
        ].map((item) => (
          <Link key={item.href} href={item.href} style={{
            background: '#fff', borderRadius: 16, padding: '16px',
            border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* 호실 클릭 모달 */}
      {selectedUnit && (
        <UnitModal
          unit={selectedUnit}
          buildingId={b.id}
          onClose={() => setSelectedUnit(null)}
          onSaved={() => { setSelectedUnit(null); loadUnits(b.id) }}
        />
      )}

      {/* 호실 추가 모달 */}
      {addFloor !== null && (
        <UnitModal
          unit={null}
          defaultFloor={addFloor}
          buildingId={b.id}
          onClose={() => setAddFloor(null)}
          onSaved={() => { setAddFloor(null); loadUnits(b.id) }}
        />
      )}
    </div>
  )
}
