'use client'

// 투어 지도 — 방보기 /map 과 동일한 풀스크린 패턴.
//
// 레이아웃:
//   · 풀스크린 mapbox 캔버스 (w-screen h-screen)
//   · 좌상단 floating: 뒤로가기 버튼 + "투어 지도" 라벨
//   · 우상단 floating: 범례 chip (진행 중/지난 투어, 좌표 없음 N개)
//   · 하단: PrefsIsland (root layout 자동)
//
// MAPBOX_TOKEN/STYLE/MAP_DEFAULTS 는 lib/mapbox.ts 단일 출처 — 방보기와 동일.

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_DEFAULTS } from '@/lib/mapbox'
import type { ThemeTokens } from '@/lib/theme-tokens'

mapboxgl.accessToken = MAPBOX_TOKEN

export interface TourMarker {
  trackId:    string
  setId:      string
  label:      string
  address:    string | null
  unit:       string | null
  lat:        number
  lng:        number
  setStatus:  'active' | 'ended' | 'results_generated'
  orderIndex: number
}

interface Props {
  tok:            ThemeTokens
  markers:        TourMarker[]
  /** 총 트랙 수 — 마커 0 인 빈 상태에서 안내 카피 결정용 */
  totalTracks:    number
  /** 좌표 부족으로 지도에 못 띄운 트랙 수 (있을 때만 안내 노출) */
  untrackedCount: number
}

const ACTIVE_COLOR = '#2563eb'
const ENDED_COLOR  = '#94a3b8'

export default function TourMapClient({ tok, markers, totalTracks, untrackedCount }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const router       = useRouter()
  const routerRef    = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    MAP_DEFAULTS.center,
      zoom:      MAP_DEFAULTS.zoom,
      pitch:     0,                       // 평면 — 마커 가독성 우선
      bearing:   MAP_DEFAULTS.bearing,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      if (markers.length === 0) return  // 마커 없으면 KNU 중심 그대로

      // bbox 로 초기 뷰포트 잡음 — 모든 트랙 한 화면에
      const lats = markers.map((m) => m.lat)
      const lngs = markers.map((m) => m.lng)
      const bbox: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ]
      if (markers.length === 1) {
        map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 17, duration: 800 })
      } else {
        map.fitBounds(bbox, { padding: 80, duration: 0, maxZoom: 17 })
      }

      for (const m of markers) {
        const el = document.createElement('div')
        const isActive = m.setStatus === 'active'
        const color = isActive ? ACTIVE_COLOR : ENDED_COLOR
        el.style.cssText = `
          width: 30px; height: 30px; border-radius: 50%;
          background: ${color}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; cursor: pointer;
          border: 2.5px solid #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.25);
          transition: transform .15s;
        `
        el.textContent = String(m.orderIndex + 1)
        el.setAttribute('aria-label', m.label)
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.12)' })
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })

        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 200px;">
            <div style="font-size: 11px; font-weight: 700; color: ${color}; margin-bottom: 2px;">
              ${isActive ? '진행 중인 투어' : '지난 투어'}
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
              ${escapeHtml(m.label)}
            </div>
            ${m.unit ? `<div style="font-size: 12px; color: #475569;">${escapeHtml(m.unit)}호</div>` : ''}
            ${m.address ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${escapeHtml(m.address)}</div>` : ''}
          </div>
        `
        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false, className: 'building-popup' })
          .setHTML(popupHtml)

        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map)

        el.addEventListener('click', () => {
          routerRef.current.push(`/bangbwayo/sets/${m.setId}/tracks/${m.trackId}`)
        })
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, [markers])

  const isEmpty = markers.length === 0

  return (
    <div className="w-screen h-screen relative" style={{ background: 'var(--background)' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* ── 좌상단: 뒤로가기 + 라벨 ────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 'calc(12px + env(safe-area-inset-top))',
        left: 12,
        right: 56, // NavigationControl 영역 회피
        zIndex: 5,
        display: 'flex', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
      }}>
        <Link
          href="/bangbwayo"
          aria-label="방봐요로 돌아가기"
          style={{
            pointerEvents: 'auto',
            width: 36, height: 36, borderRadius: 999,
            background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
            boxShadow: tok.shadow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tok.textSecondary, textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{
          pointerEvents: 'auto',
          padding: '8px 14px',
          borderRadius: 999,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow,
          fontSize: 13, fontWeight: 700, color: tok.textPrimary,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          minWidth: 0,
        }}>
          <span aria-hidden style={{ fontSize: 14 }}>🗺️</span>
          <span>투어 지도</span>
          {!isEmpty && (
            <span style={{ fontSize: 11, fontWeight: 600, color: tok.textTertiary }}>
              · {markers.length}개
            </span>
          )}
        </div>
      </div>

      {/* ── 빈 상태 카드 ───────────────────────────────────────── */}
      {isEmpty && (
        <div style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 4,
          maxWidth: 320, width: 'calc(100% - 32px)',
          padding: '20px 22px',
          borderRadius: 18,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🗺️</div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary, margin: '0 0 6px' }}>
            {totalTracks === 0 ? '아직 본 방이 없어요' : '지도에 표시할 좌표가 없어요'}
          </h2>
          <p style={{ fontSize: 12, color: tok.textTertiary, margin: 0, lineHeight: 1.6 }}>
            {totalTracks === 0
              ? '투어를 시작하고 트랙을 추가하면 여기 지도에 표시돼요.'
              : `트랙 ${totalTracks}개가 있지만 건물·사진 좌표가 없어요. 새 트랙은 주소나 사진 EXIF 가 있으면 자동 표시됩니다.`}
          </p>
        </div>
      )}

      {/* ── 좌하단: 범례 ──────────────────────────────────────── */}
      {!isEmpty && (
        <div style={{
          position: 'fixed',
          left: 12,
          bottom: 'calc(110px + env(safe-area-inset-bottom))', // PrefsIsland 위
          zIndex: 5,
          padding: '8px 12px',
          borderRadius: 999,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow,
          display: 'inline-flex', alignItems: 'center', gap: 12,
          fontSize: 11, color: tok.textSecondary, fontWeight: 600,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: ACTIVE_COLOR }} />
            진행 중
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: ENDED_COLOR }} />
            지난 투어
          </span>
        </div>
      )}

      {/* ── 우하단: 좌표 없는 트랙 안내 ─────────────────────────── */}
      {!isEmpty && untrackedCount > 0 && (
        <div style={{
          position: 'fixed',
          right: 12,
          bottom: 'calc(110px + env(safe-area-inset-bottom))',
          zIndex: 5,
          maxWidth: 200,
          padding: '8px 12px',
          borderRadius: 14,
          background: tok.cardBg,
          border: `1px solid ${tok.cardBorder}`,
          boxShadow: tok.shadow,
          fontSize: 11, color: tok.textTertiary, lineHeight: 1.5,
        }}>
          좌표 없는 트랙 <strong style={{ color: tok.textSecondary }}>{untrackedCount}개</strong>는
          표시되지 않아요
        </div>
      )}
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
