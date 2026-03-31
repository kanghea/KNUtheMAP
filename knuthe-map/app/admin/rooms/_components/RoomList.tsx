'use client'

import { useState } from 'react'
import RoomAddModal from './RoomAddModal'
import ImageManager from '../../_components/ImageManager'
import AreaToggle from '@/components/shared/AreaToggle'
import { THEME_TOKENS } from '@/lib/theme-tokens'

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
  월세: { bg: 'rgba(37,99,235,0.15)', color: '#2563eb' },
  전세: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  매매: { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
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
          width: '100%', padding: '12px', borderRadius: 12, border: '2px dashed rgba(37,99,235,0.5)',
          background: 'rgba(37,99,235,0.15)', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>
          + 방(매물) 추가
        </button>

        <input
          placeholder="건물명, 주소, 방 유형 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.15)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
            background: '#1a1a1a', color: '#ffffff',
          }}
        />

        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
          {(['active', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#ffffff' : 'rgba(255,255,255,0.35)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
            }}>
              {t === 'active' ? `활성 (${list.filter((r) => r.is_active).length})` : `전체 (${list.length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
            해당하는 방이 없어요
          </div>
        )}

        {filtered.map((r) => {
          const b = r.buildings
          const cc = CONTRACT_COLOR[r.contract_type] ?? CONTRACT_COLOR['월세']
          return (
            <div key={r.id} style={{
              background: r.is_active ? '#111111' : '#0d0d0d',
              borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.4)', padding: '14px 16px',
              opacity: r.is_active ? 1 : 0.65,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      {b?.name ?? '(건물 없음)'}
                    </span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                      background: cc.bg, color: cc.color, fontWeight: 700 }}>
                      {r.contract_type}
                    </span>
                    {r.room_type && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>{r.room_type}</span>
                    )}
                    {!r.is_active && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>비활성</span>
                    )}
                    {r.images?.length > 0 && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(249,115,22,0.15)', color: '#fb923c' }}>이미지 {r.images.length}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b?.address ?? '주소 없음'}
                      {r.floor ? ` · ${r.floor}층` : ''}
                    </span>
                    {r.area_m2 ? <><span>·</span><AreaToggle areaM2={r.area_m2} tok={THEME_TOKENS.dark} fontSize={10} /></> : null}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: cc.color }}>
                    {r.contract_type === '월세'
                      ? `${fmt(r.deposit)} / ${r.monthly_rent ? fmt(r.monthly_rent) : '-'}만`
                      : `전세 ${fmt(r.deposit)}`}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                    등록: {r.users?.nickname ?? r.users?.email ?? '알 수 없음'} ·{' '}
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => setImageId(r.id)} style={{
                    padding: '5px 8px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                  }}>이미지</button>
                  <button onClick={() => toggle(r)} disabled={acting === r.id} style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 600,
                    background: r.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                    color: r.is_active ? '#f87171' : '#4ade80',
                    cursor: 'pointer', opacity: acting === r.id ? 0.5 : 1,
                  }}>
                    {r.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => setConfirmDelete(r.id)} style={{
                    padding: '5px 8px', borderRadius: 8, border: 'none', fontSize: 11,
                    background: 'rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer',
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
          <div style={{ background: '#111111', borderRadius: 20, padding: '24px 20px', width: '100%', maxWidth: 360, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>매물 삭제</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 18px', lineHeight: 1.6 }}>
              이 매물을 완전히 삭제합니다.<br/>되돌릴 수 없어요.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmDelete(null)} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', fontSize: 13,
              }}>취소</button>
              <button onClick={() => deleteRoom(confirmDelete)} disabled={acting === confirmDelete} style={{
                flex: 1, padding: '11px', borderRadius: 10,
                background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
