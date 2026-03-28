'use client'

import { useState } from 'react'
import BuildingAddModal from './BuildingAddModal'
import ImageManager from '../../_components/ImageManager'

interface Building {
  id: string
  name: string | null
  address: string | null
  zone: string | null
  total_floors: number | null
  main_purps_nm: string | null
  is_active: boolean
  images: string[]
}

const ZONES = ['전체', '북문', '텍문', '서문', '쪽문', '정문', '동문', '경북대학교']

export default function BuildingList({ buildings }: { buildings: Building[] }) {
  const [list,       setList]       = useState(buildings)
  const [search,     setSearch]     = useState('')
  const [zone,       setZone]       = useState('전체')
  const [editId,     setEditId]     = useState<string | null>(null)
  const [editName,   setEditName]   = useState('')
  const [editAddr,   setEditAddr]   = useState('')
  const [saving,     setSaving]     = useState<string | null>(null)
  const [showAdd,    setShowAdd]    = useState(false)
  const [imageId,    setImageId]    = useState<string | null>(null)

  const filtered = list.filter((b) => {
    const q = search.toLowerCase()
    const matchSearch = !q || (b.name ?? '').toLowerCase().includes(q) || (b.address ?? '').toLowerCase().includes(q)
    const matchZone   = zone === '전체' || b.zone === zone
    return matchSearch && matchZone
  })

  const toggleActive = async (b: Building) => {
    setSaving(b.id)
    const res = await fetch(`/api/admin/buildings/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !b.is_active }),
    })
    setSaving(null)
    if (res.ok) setList((prev) => prev.map((x) => x.id === b.id ? { ...x, is_active: !b.is_active } : x))
  }

  const startEdit = (b: Building) => { setEditId(b.id); setEditName(b.name ?? ''); setEditAddr(b.address ?? '') }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(editId)
    const res = await fetch(`/api/admin/buildings/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, address: editAddr }),
    })
    setSaving(null)
    if (res.ok) {
      setList((prev) => prev.map((x) => x.id === editId ? { ...x, name: editName, address: editAddr } : x))
      setEditId(null)
    }
  }

  const saveImages = async (newImages: string[]) => {
    if (!imageId) return
    const res = await fetch(`/api/admin/buildings/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: newImages }),
    })
    if (res.ok) setList((prev) => prev.map((x) => x.id === imageId ? { ...x, images: newImages } : x))
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  }

  const imageBuilding = list.find((b) => b.id === imageId)

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 추가 버튼 */}
        <button onClick={() => setShowAdd(true)} style={{
          width: '100%', padding: '12px', borderRadius: 12, border: '2px dashed #93c5fd',
          background: 'var(--color-primary-bg)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          + 건물 추가
        </button>

        {/* 검색 */}
        <input
          placeholder="건물명 또는 주소 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
          }}
        />

        {/* 구역 필터 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {ZONES.map((z) => (
            <button key={z} onClick={() => setZone(z)} style={{
              padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
              background: zone === z ? 'var(--text-primary)' : 'var(--border-primary)',
              color:      zone === z ? 'var(--bg-elevated)'    : 'var(--text-secondary)',
            }}>{z}</button>
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>{filtered.length}개 건물</p>

        {filtered.map((b) => (
          <div key={b.id} style={{
            background: b.is_active ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
            borderRadius: 14, border: '1px solid var(--border-primary)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.03)', padding: '14px 16px',
            opacity: b.is_active ? 1 : 0.6,
          }}>
            {editId === b.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input style={inp} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="건물명" />
                <input style={inp} value={editAddr} onChange={(e) => setEditAddr(e.target.value)} placeholder="주소" />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditId(null)} style={{
                    flex: 1, padding: '8px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                    background: 'var(--bg-elevated)', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)',
                  }}>취소</button>
                  <button onClick={saveEdit} disabled={saving === b.id} style={{
                    flex: 2, padding: '8px', borderRadius: 8, border: 'none',
                    background: saving === b.id ? '#93c5fd' : '#2563eb',
                    color: 'var(--text-inverse)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}>저장</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.name ?? '(이름 없음)'}
                    </span>
                    {b.zone && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999,
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', flexShrink: 0 }}>{b.zone}</span>
                    )}
                    {!b.is_active && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999,
                        background: '#fee2e2', color: '#dc2626', flexShrink: 0 }}>비활성</span>
                    )}
                    {b.images?.length > 0 && (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 999,
                        background: 'var(--color-amber-bg)', color: '#92400e', flexShrink: 0 }}>
                        이미지 {b.images.length}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.address ?? '주소 없음'}
                  </div>
                  {(b.total_floors || b.main_purps_nm) && (
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {[b.main_purps_nm, b.total_floors ? `${b.total_floors}층` : null].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => startEdit(b)} style={{
                      padding: '5px 8px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', background: 'var(--bg-elevated)',
                      fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>수정</button>
                    <button onClick={() => setImageId(b.id)} style={{
                      padding: '5px 8px', borderRadius: 8,
                      border: '1.5px solid #e2e8f0', background: 'var(--bg-elevated)',
                      fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                    }}>이미지</button>
                  </div>
                  <button onClick={() => toggleActive(b)} disabled={saving === b.id} style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none',
                    background: b.is_active ? '#fee2e2' : '#dcfce7',
                    color: b.is_active ? '#dc2626' : '#16a34a',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    opacity: saving === b.id ? 0.5 : 1,
                  }}>
                    {b.is_active ? '비활성화' : '활성화'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <BuildingAddModal
          onCreated={(b) => setList((prev) => [b as Building, ...prev])}
          onClose={() => setShowAdd(false)}
        />
      )}

      {imageId && imageBuilding && (
        <ImageManager
          bucket="building-images"
          entityId={imageId}
          images={imageBuilding.images ?? []}
          onSave={saveImages}
          onClose={() => setImageId(null)}
        />
      )}
    </>
  )
}
