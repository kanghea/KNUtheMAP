'use client'

// 투어 지도 클라이언트.
//
// MapView.tsx 의 풀스크린 매물 지도와는 목적이 달라(N개 트랙만 마커 표시) 별도
// 인스턴스로 둔다. mapbox-gl 토큰·스타일·기본 좌표는 lib/mapbox.ts 단일 출처를
// 공유한다. KNU_CENTER / MAP_DEFAULTS 와 동일한 시각 언어로 보임.

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  /** 좌표 부족으로 지도에 못 띄운 트랙 수 (있을 때만 안내 노출) */
  untrackedCount: number
}

const ACTIVE_COLOR = '#2563eb'   // 활성 셋 — 파랑
const ENDED_COLOR  = '#94a3b8'   // 종료 셋 — 회색

export default function TourMapClient({ tok, markers, untrackedCount }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<mapboxgl.Map | null>(null)
  const router       = useRouter()
  const routerRef    = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // 마커들의 bbox 로 초기 뷰포트 산출 — 모든 트랙이 한 화면에 보이도록.
    const lats = markers.map((m) => m.lat)
    const lngs = markers.map((m) => m.lng)
    const bbox: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ]

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    MAP_DEFAULTS.center,
      zoom:      MAP_DEFAULTS.zoom,
      pitch:     0,                  // 투어 지도는 평면 — 마커 가독성 우선
      bearing:   MAP_DEFAULTS.bearing,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      // 마커 1개면 그 위치로 fly, 여러개면 fitBounds.
      if (markers.length === 1) {
        map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 17, duration: 800 })
      } else {
        map.fitBounds(bbox, { padding: 60, duration: 0, maxZoom: 17 })
      }

      for (const m of markers) {
        const el = document.createElement('div')
        const isActive = m.setStatus === 'active'
        const color = isActive ? ACTIVE_COLOR : ENDED_COLOR
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${color}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        `
        el.textContent = String(m.orderIndex + 1)
        el.setAttribute('aria-label', m.label)

        const popupHtml = `
          <div style="font-family: inherit; font-size: 12px; min-width: 180px;">
            <div style="font-size: 11px; font-weight: 600; color: ${color}; margin-bottom: 2px;">
              ${isActive ? '진행 중인 투어' : '지난 투어'}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
              ${escapeHtml(m.label)}
            </div>
            ${m.unit ? `<div style="font-size: 11px; color: #64748b;">${escapeHtml(m.unit)}호</div>` : ''}
            ${m.address ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${escapeHtml(m.address)}</div>` : ''}
          </div>
        `
        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, className: 'building-popup' })
          .setHTML(popupHtml)

        new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map)

        el.addEventListener('click', () => {
          // 트랙 페이지로 진입 — 셋 종료 여부와 무관하게 동일한 라우트 패턴.
          routerRef.current.push(`/bangbwayo/sets/${m.setId}/tracks/${m.trackId}`)
        })
      }
    })

    return () => { map.remove(); mapRef.current = null }
  }, [markers])

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 16px 20px' }}>
      <div style={{
        position: 'relative',
        height: '60vh', minHeight: 360, maxHeight: 600,
        borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${tok.cardBorder}`,
        boxShadow: tok.shadow,
      }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </div>

      {/* ── 범례 ───────────────────────────────────────────────── */}
      <div style={{
        marginTop: 12,
        display: 'flex', alignItems: 'center', gap: 14,
        fontSize: 11, color: tok.textTertiary,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: ACTIVE_COLOR, display: 'inline-block' }} />
          진행 중
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: ENDED_COLOR, display: 'inline-block' }} />
          지난 투어
        </span>
      </div>

      {untrackedCount > 0 && (
        <p style={{
          marginTop: 8, fontSize: 11, color: tok.textTertiary, lineHeight: 1.5,
        }}>
          좌표가 없는 트랙 <strong style={{ color: tok.textSecondary }}>{untrackedCount}개</strong> 는 지도에 표시되지 않아요.
          트랙에 주소를 입력하거나 위치 정보가 있는 사진을 추가하면 자동으로 표시됩니다.
        </p>
      )}
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
