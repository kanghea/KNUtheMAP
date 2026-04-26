'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import { Room, formatPrice, formatArea } from '@/lib/types/room'
import { DEFAULT_FILTERS } from '@/components/map/DynamicFilter'
import { roomMatchesFilters } from '@/lib/room-filter'
import { useFilters } from '@/lib/filter-context'
import { useTheme } from '@/lib/hooks/useTheme'
import { THEME_TOKENS } from '@/lib/theme-tokens'
import { IconHome, IconHeart, IconSearch } from '@/components/shared/icons'
import { EmptyState } from '@/components/shared/EmptyState'

const DynamicFilter  = dynamic(() => import('@/components/map/DynamicFilter'), { ssr: false })
const RoomsMapView   = dynamic(() => import('@/components/map/RoomsMapView'),  { ssr: false })
const RoomFilterCard = dynamic(() => import('@/app/_room-filter'),             { ssr: false })

// ── 매물 카드 ────────────────────────────────────────────────────────

function RoomCard({ room, tok }: { room: Room; tok: typeof THEME_TOKENS.dark }) {
  const [liked, setLiked] = useState(false)
  const thumb  = room.images[0] ?? null
  const addr   = room.buildings?.address ?? '주소 없음'
  const area   = room.area_m2 ? formatArea(room.area_m2) : ''
  const floor  = room.floor ? `${room.floor}층` : ''
  const meta   = [room.room_type, floor, area].filter(Boolean).join(' · ')

  return (
    <div style={{ borderBottom: `1px solid ${tok.cardBorder}` }}>
      <Link href={`/rooms/${room.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', gap: 12, padding: '16px 16px 14px' }}>
          <div style={{
            width: 96, height: 96, borderRadius: 12, flexShrink: 0,
            background: tok.cardBorder, overflow: 'hidden', position: 'relative',
          }}>
            {thumb
              ? <img
                  src={thumb}
                  alt={`${room.buildings?.name ?? ''} 매물 사진`}
                  width={96}
                  height={96}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconHome size={32} color={tok.textTertiary} /></div>
            }
            <button
              onClick={(e) => { e.preventDefault(); setLiked(v => !v) }}
              aria-label={liked ? '찜 해제' : '찜하기'}
              aria-pressed={liked}
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconHeart filled={liked} size={14} color={liked ? '#ef4444' : '#94a3b8'} />
            </button>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: tok.textPrimary, marginBottom: 3 }}>
              {formatPrice(room)}
            </div>
            <div style={{ fontSize: 13, color: tok.textSecondary, marginBottom: 2 }}>{meta}</div>
            <div style={{ fontSize: 12, color: tok.textTertiary, marginBottom: 6 }}>{addr}</div>
            {room.description && (
              <p style={{
                fontSize: 12, color: tok.textSecondary, margin: 0,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {room.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const [rooms,      setRooms]      = useState<Room[]>([])
  const [loading,    setLoading]    = useState(true)
  const [viewMode,   setViewMode]   = useState<'list' | 'map'>('map')
  const [clusterIds, setClusterIds] = useState<string[] | null>(null)
  const { filters, setFilters }     = useFilters()
  const { theme, tok }              = useTheme()
  const supabaseRef = useRef(createBrowserSupabase())

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS)

  const handleClusterClick = useCallback((ids: string[]) => {
    setClusterIds(ids)
    setViewMode('list')
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabaseRef.current
        .from('rooms')
        .select('*, buildings(name, address, lat, lng, zone, use_apr_day, main_purps_nm)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (!error && data) setRooms(data as Room[])
    } catch { /* rooms 테이블 없으면 빈 배열 */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRooms()
    const channel = supabaseRef.current
      .channel('rooms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .subscribe()
    return () => { supabaseRef.current.removeChannel(channel) }
  }, [fetchRooms])

  const filtered = clusterIds
    ? rooms.filter(r => clusterIds.includes(r.id))
    : rooms.filter(r => roomMatchesFilters(r, filters))

  const activeCount = [
    filters.buildingType !== null,
    filters.rentRange[0]    !== DEFAULT_FILTERS.rentRange[0]    || filters.rentRange[1]    !== DEFAULT_FILTERS.rentRange[1],
    filters.depositRange[0] !== DEFAULT_FILTERS.depositRange[0] || filters.depositRange[1] !== DEFAULT_FILTERS.depositRange[1],
    filters.ageRange[0]     !== DEFAULT_FILTERS.ageRange[0]     || filters.ageRange[1]     !== DEFAULT_FILTERS.ageRange[1],
    filters.options.length > 0,
    filters.gate !== null && filters.gateMinutes !== null,
  ].filter(Boolean).length

  // ── 공통 상단 오버레이 ───────────────────────────────────────────

  const TopBar = (
    <div style={{
      position: 'absolute', top: 16, left: 16, right: 16,
      zIndex: 25,
      display: 'flex', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      {/* 매물 수 */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        borderRadius: 999, padding: '8px 14px',
        fontSize: 13, fontWeight: 700, color: '#0f172a',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.6)',
        whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {loading ? '불러오는 중…' : `매물 ${viewMode === 'list' ? filtered.length : rooms.length}개`}
        {isFiltered && activeCount > 0 && (
          <span style={{
            background: '#2563eb', color: '#fff',
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            padding: '1px 6px',
          }}>
            {activeCount}
          </span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* 목록/지도 토글 */}
      <div style={{
        pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        borderRadius: 999, padding: 4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.6)',
        display: 'flex', gap: 2,
      }}>
        {(['map', 'list'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => { if (mode === 'map') setClusterIds(null); setViewMode(mode) }}
            style={{
              padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: viewMode === mode ? '#0f172a' : 'transparent',
              color: viewMode === mode ? '#fff' : '#64748b',
              transition: 'all .15s',
              whiteSpace: 'nowrap',
            }}
          >
            {mode === 'map' ? '지도' : '목록'}
          </button>
        ))}
      </div>

      {/* 찜 */}
      <Link href="/rooms/liked" style={{
        pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
        borderRadius: 999, padding: '8px 14px',
        fontSize: 12, fontWeight: 700, color: '#374151', textDecoration: 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.6)',
        display: 'flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap',
      }}>
        <IconHeart size={13} color="#94a3b8" /> 찜
      </Link>
    </div>
  )

  // ── 지도 뷰 ───────────────────────────────────────────────────────

  if (viewMode === 'map') {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <RoomsMapView filters={filters} onClusterClick={handleClusterClick} />
        {TopBar}
        {/* 필터 — TopBar(top:16 + ~36px) 아래부터 시작 */}
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 20 }}>
          <div style={{ pointerEvents: 'auto' }}>
            <DynamicFilter filters={filters} onChange={setFilters} />
          </div>
        </div>
      </div>
    )
  }

  // ── 목록 뷰 ───────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', inset: 0, background: tok.pageBg, display: 'flex', flexDirection: 'column', zIndex: 0 }}>

      {/* 상단 오버레이 */}
      <div style={{
        position: 'relative',
        background: tok.pageBg,
        borderBottom: `1px solid ${tok.cardBorder}`,
        padding: '16px 16px 0',
        zIndex: 10,
      }}>
        {/* 클러스터 선택 시 뒤로가기 배너 */}
        {clusterIds && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => { setClusterIds(null); setViewMode('map') }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: tok.cardBg, fontSize: 13, fontWeight: 700, color: tok.textPrimary,
              }}
            >
              ← 지도로 돌아가기
            </button>
            <span style={{ fontSize: 13, color: tok.textSecondary }}>
              선택한 묶음 {clusterIds.length}개
            </span>
          </div>
        )}

        {/* 매물수 / 토글 / 찜 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary, flex: 1 }}>
            {loading ? '불러오는 중…' : `매물 ${filtered.length}개`}
            {isFiltered && activeCount > 0 && (
              <span style={{
                marginLeft: 6, background: tok.accentBg, color: tok.accentColor,
                borderRadius: 999, fontSize: 10, fontWeight: 700, padding: '2px 7px',
              }}>
                필터 {activeCount}
              </span>
            )}
          </span>

          <div style={{
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
            borderRadius: 999, padding: 4,
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.6)',
            display: 'flex', gap: 2,
          }}>
            {(['map', 'list'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { if (mode === 'map') setClusterIds(null); setViewMode(mode) }}
                style={{
                  padding: '5px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: viewMode === mode ? '#0f172a' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#64748b',
                  transition: 'all .15s', whiteSpace: 'nowrap',
                }}
              >
                {mode === 'map' ? '지도' : '목록'}
              </button>
            ))}
          </div>

          <Link href="/rooms/liked" style={{
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)',
            borderRadius: 999, padding: '8px 14px',
            fontSize: 12, fontWeight: 700, color: '#374151', textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
          }}>
            <IconHeart size={13} color="#94a3b8" /> 찜
          </Link>
        </div>

      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* 필터 카드 — 클러스터 선택 시 숨김 */}
        {!clusterIds && (
          <div style={{ padding: '12px 16px 0' }}>
            <RoomFilterCard theme={theme} />
          </div>
        )}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <span style={{ fontSize: 14, color: tok.textTertiary }}>불러오는 중…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            tok={tok}
            icon={isFiltered
              ? <IconSearch size={48} color={tok.textTertiary} />
              : <IconHome   size={48} color={tok.textTertiary} />}
            title={isFiltered ? '조건에 맞는 방이 없어요' : '아직 등록된 매물이 없어요'}
            action={isFiltered ? { label: '필터 초기화', onClick: () => setFilters(DEFAULT_FILTERS) } : undefined}
          />
        ) : (
          filtered.map(r => <RoomCard key={r.id} room={r} tok={tok} />)
        )}
      </div>
    </div>
  )
}
