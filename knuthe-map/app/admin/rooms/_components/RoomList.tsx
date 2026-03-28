'use client'

import { useState } from 'react'
import RoomAddModal from './RoomAddModal'
import ImageManager from '../../_components/ImageManager'

interface Room {
  id: string
  contract_type: string
  deposit: number
  monthly_rent: number | null
  area_m2: number | null
  floor: number | null
  room_type: string | null
  is_active: boolean
  created_at: string
  images: string[]
  buildings: { name: string | null; address: string | null; zone: string | null } | null
  users: { email: string; nickname: string | null } | null
}

const CONTRACT_COLOR: Record<string, { bg: string; color: string }> = {
  월세: { bg: '#eff6ff', color: 'var(--color-primary)' },
  전세: { bg: '#f0fdf4', color: 'var(--color-green)' },
  매매: { bg: '#fef3c7', color: '#92400e' },
}

export default function RoomList({ rooms }: { rooms: Room[] }) {
  const [list,          setList]          = useState(rooms)
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState<'active' | 'all'>('active')
  const [acting,        setActing]        = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showAdd,       setShowAdd]       = useState(false)
  const [imageId,       setImageId]       = useState<string | null>(null)

  const filtered = list.filter((r) => {
    const b = r.buildings
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (b?.name ?? '').toLowerCase().includes(q) ||
      (b?.address ?? '').toLowerCase().includes(q) ||
      (r.room_type ?? '').includes(q)
    const matchTab = tab === 'all' || r.is_active
    return matchSearch && matchTab
  })

  const toggle = async (r: Room) => {
    setActing(r.id)
    const res = await fetch(`/api/admin/rooms/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !r.is_active }),
    })
    setActing(null)
    if (res.ok) setList((prev) => prev.map((x) => x.id === r.id ? { ...x, is_active: !r.is_active } : x))
  }

  const deleteRoom = async (id: string) => {
    setActing(id)
    const res = await fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' })
    setActing(null); setConfirmDelete(null)
    if (res.ok) setList((prev) => prev.filter((x) => x.id !== id))
  }

  const saveImages = async (newImages: string[]) => {
    if (!imageId) return
    const res = await fetch(`/api/admin/rooms/${imageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: newImages }),
    })
    if (res.ok) setList((prev) => prev.map((x) => x.id === imageId ? { ...x, images: newImages } : x))
  }

  const fmt = (n: number) => n >= 10000 ? `${(n / 10000).toFixed(1)}억` : `${n}만`
  const imageRoom = list.find((r) => r.id === imageId)

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* 추가 버튼 */}
        <button onClick={() => setShowAdd(true)} style={{
          width: '100%', padding: '12px', borderRadius: 12, border: '2px dashed #93c5fd',
          background: 'var(--color-primary-bg)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          + 방(매물) 추가
        </button>

        <input
          placeholder="건물명, 주소, 방 유형 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 6, background: 'var(--bg-tertiary)', borderRadius: 10, padding: 4 }}>
          {(['active', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: tab === t ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
              {t === 'active' ? `활성 (${list.filter((r) => r.is_active).length})` : `전체 (${list.length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            해당하는 방이 없어요
          </div>
        )}

        {filtered.map((r) => {
          const b = r.buildings
          const cc = CONTRACT_COLOR[r.contract_type] ?? CONTRACT_COLOR['월세']
          return (
            <div key={r.id} style={{
              background: r.is_active ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
              borderRadius: 14, border: '1px solid var(--border-primary)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.03)', padding: '14px 16px',
              opacity: r.is_active ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {b?.name ?? '(건물 없음)'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                      background: cc.bg, color: cc.color, fontWeight: 700 }}>
                      {r.contract_type}
                    </span>
                    {r.room_type && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{r.room_type}</span>
                    )}
                    {!r.is_active && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: '#fee2e2', color: '#dc2626' }}>비활성</span>
                    )}
                    {r.images?.length > 0 && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'var(--color-amber-bg)', color: '#92400e' }}>이미지 {r.images.length}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b?.address ?? '주소 없음'}
                    {r.floor ? ` · ${r.floor}층` : ''}
                    {r.area_m2 ? ` · ${r.area_m2}㎡` : ''}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: cc.color }}>
                    {r.contract_type === '월세'
                      ? `${fmt(r.deposit)} / ${r.monthly_rent ? fmt(r.monthly_rent) : '-'}만`
                      : `전세 ${fmt(r.deposit)}`}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                    등록: {r.users?.nickname ?? r.users?.email ?? '알 수 없음'} ·{' '}
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => setImageId(r.id)} style={{
                    padding: '5px 8px', borderRadius: 8, border: '1.5px solid #e2e8f0',
                    background: 'var(--bg-elevated)', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>이미지</button>
                  <button onClick={() => toggle(r)} disabled={acting === r.id} style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600,
                    background: r.is_active ? '#fef3c7' : '#dcfce7',
                    color: r.is_active ? '#92400e' : '#16a34a',
                    cursor: 'pointer', opacity: acting === r.id ? 0.5 : 1,
                  }}>
                    {r.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => setConfirmDelete(r.id)} style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none', fontSize: 11,
                    background: '#fee2e2', color: '#dc2626', cursor: 'pointer',
                  }}>삭제</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <RoomAddModal
          onCreated={(room) => setList((prev) => [{ ...room, images: [] } as Room, ...prev])}
          onClose={() => setShowAdd(false)}
        />
      )}

      {imageId && imageRoom && (
        <ImageManager
          bucket="room-images"
          entityId={imageId}
          images={imageRoom.images ?? []}
          onSave={saveImages}
          onClose={() => setImageId(null)}
        />
      )}

      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px',
        }} onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null) }}>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>매물 삭제</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
              이 매물을 완전히 삭제합니다.<br/>되돌릴 수 없어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: 13,
              }}>취소</button>
              <button onClick={() => deleteRoom(confirmDelete)} disabled={acting === confirmDelete} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: '#dc2626', color: 'var(--text-inverse)', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
