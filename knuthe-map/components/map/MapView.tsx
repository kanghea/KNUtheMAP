'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_DEFAULTS } from '@/lib/mapbox'
import { GATES_GEOJSON } from '@/lib/gates'
import { MapFilters, featureMatchesFilters } from '@/components/map/DynamicFilter'

mapboxgl.accessToken = MAPBOX_TOKEN

type ZoneMeta = { name: string; lat: number; lng: number; footprint: [number, number][] | null }

function pointInPolygon(lng: number, lat: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}


interface MapViewProps {
  filters:      MapFilters
  initialZone?: string | null
  flyTo?:       { lat: number; lng: number } | null
}

export default function MapView({ filters, initialZone, flyTo }: MapViewProps) {
  const containerRef       = useRef<HTMLDivElement>(null)
  const mapRef             = useRef<mapboxgl.Map | null>(null)
  const allFeaturesRef     = useRef<GeoJSON.Feature[]>([])
  const zonesMapRef        = useRef<Map<number, ZoneMeta>>(new Map())
  const filtersRef         = useRef(filters)
  const zonePillMarkersRef = useRef<mapboxgl.Marker[]>([])
  const router             = useRouter()
  const routerRef          = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])
  useEffect(() => { filtersRef.current = filters }, [filters])

  // ── 검색으로 선택된 건물로 이동
  useEffect(() => {
    if (!flyTo || !mapRef.current) return
    mapRef.current.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 18, duration: 1000 })
  }, [flyTo])

  // ── 필터 변경 시 소스 데이터 업데이트
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const bSource = map.getSource('buildings') as mapboxgl.GeoJSONSource | undefined
    if (!bSource) return

    const matcher = featureMatchesFilters(filters)
    const filtered = allFeaturesRef.current.filter(matcher)
    bSource.setData({ type: 'FeatureCollection', features: filtered })
  }, [filters])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    MAP_DEFAULTS.center,
      zoom:      MAP_DEFAULTS.zoom,
      pitch:     MAP_DEFAULTS.pitch,
      bearing:   MAP_DEFAULTS.bearing,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('style.load', async () => {
      // ── 출입문 레이어 ─────────────────────────────────────────────
      map.addSource('gates', { type: 'geojson', data: GATES_GEOJSON })

      // 출입문 원형 마커
      map.addLayer({
        id: 'gates-circle',
        type: 'circle',
        source: 'gates',
        paint: {
          'circle-radius': 7,
          'circle-color': '#1e40af',
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.92,
        },
      })

      // 출입문 이름 라벨 (커스텀 스타일에 glyphs 미설정 시 무시)
      try {
        map.addLayer({
          id: 'gates-label',
          type: 'symbol',
          source: 'gates',
          layout: {
            'text-field': ['concat', ['get', 'name'], ' ⓘ'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.4],
            'text-anchor': 'top',
            'text-allow-overlap': false,
          },
          paint: {
            'text-color': '#1e3a8a',
            'text-halo-color': 'rgba(255,255,255,0.95)',
            'text-halo-width': 2,
          },
        })
      } catch { /* glyphs not available in custom style */ }

      // 출입문 클릭 → 팝업
      map.on('click', 'gates-circle', (e) => {
        const feat = e.features?.[0]
        if (!feat || !e.lngLat) return
        const name = feat.properties?.name as string
        new mapboxgl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding:12px 14px;font-family:inherit">
              <p style="margin:0 0 4px;font-size:11px;color:#6b7280;letter-spacing:.06em">경북대학교 출입문</p>
              <h3 style="margin:0 0 10px;font-size:16px;font-weight:800;color:#0f172a">${name}</h3>
              <div style="height:80px;background:#f1f5f9;border-radius:8px;display:flex;align-items:center;justify-content:center">
                <span style="font-size:12px;color:#94a3b8">사진 준비 중</span>
              </div>
            </div>
          `)
          .addTo(map)
      })
      map.on('mouseenter', 'gates-circle', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'gates-circle', () => { map.getCanvas().style.cursor = '' })

      // ── 건물 GeoJSON + 구역 데이터 로드 ──────────────────────────
      let geojson: GeoJSON.FeatureCollection
      let zonesData: { osm_id: number; name: string; lat: number; lng: number; footprint: [number, number][] | null }[] = []
      try {
        const [bRes, zRes] = await Promise.all([fetch('/api/buildings'), fetch('/api/zones')])
        const bJson = await bRes.json()
        const zJson = await zRes.json()
        if (!bRes.ok || !bJson.features) { console.error('건물 데이터 로드 실패', bJson); return }
        geojson   = bJson
        zonesData = Array.isArray(zJson) ? zJson : []
      } catch {
        console.error('데이터 로드 실패')
        return
      }

      // async 대기 중 컴포넌트가 언마운트됐으면 중단 (소스 중복·appendChild 오류 방지)
      if (map !== mapRef.current) return

      zonesMapRef.current = new Map(
        zonesData.map((z) => [z.osm_id, { name: z.name, lat: z.lat, lng: z.lng, footprint: z.footprint ?? null }])
      )

      // ── 클라이언트 PIP: 건물마다 구역 id 부여 ──────────────────
      for (const feature of geojson.features) {
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates
        for (const [zid, zone] of zonesMapRef.current) {
          if (zone.footprint && pointInPolygon(lng, lat, zone.footprint)) {
            feature.properties = { ...feature.properties, zone_id: zid }
            break
          }
        }
      }

      // ── 구역별 건물 수 집계 ──────────────────────────────────────
      const zoneCounts = new Map<number, number>()
      for (const f of geojson.features) {
        const zid = f.properties?.zone_id as number | undefined
        if (zid != null) zoneCounts.set(zid, (zoneCounts.get(zid) ?? 0) + 1)
      }

      allFeaturesRef.current = geojson.features

      // ── initialZone fitBounds ────────────────────────────────────
      if (initialZone) {
        const zoneEntry = [...zonesMapRef.current.entries()].find(([, z]) => z.name === initialZone)
        if (zoneEntry) {
          const [zid] = zoneEntry
          const bldgs = geojson.features.filter((f) => f.properties?.zone_id === zid)
          if (bldgs.length > 0) {
            const lngs = bldgs.map((f) => (f.geometry as GeoJSON.Point).coordinates[0])
            const lats = bldgs.map((f) => (f.geometry as GeoJSON.Point).coordinates[1])
            map.fitBounds(
              [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
              { padding: 80, maxZoom: 15, duration: 800 },
            )
          }
        }
      }

      // ── 건물 소스 (클러스터링 없음, 초기 필터 적용) ─────────────
      const initialMatcher = featureMatchesFilters(filtersRef.current)
      const initialFiltered = geojson.features.filter(initialMatcher)

      map.addSource('buildings', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: initialFiltered },
        generateId: true,
      })

      // ── 구역 Pill 마커 (HTML Marker) ────────────────────────────
      const HIDE_ZONE_ZOOM = 15

      const updateZonePillVisibility = () => {
        const visible = map.getZoom() < HIDE_ZONE_ZOOM
        zonePillMarkersRef.current.forEach((m) => {
          ;(m.getElement() as HTMLDivElement).style.display = visible ? 'flex' : 'none'
        })
      }

      for (const [osm_id, zone] of zonesMapRef.current) {
        if (!zone.lat || !zone.lng) continue

        const displayName = zone.name
        const count = zoneCounts.get(osm_id) ?? 0

        const el = document.createElement('div')
        el.style.cssText = [
          'display:flex', 'align-items:center', 'gap:0',
          'background:#2563eb', 'color:#fff',
          'border-radius:999px',
          'box-shadow:0 3px 10px rgba(37,99,235,0.45)',
          'cursor:pointer', 'pointer-events:auto',
          'white-space:nowrap', 'user-select:none',
          'overflow:hidden',
          'border:2px solid rgba(255,255,255,0.3)',
        ].join(';')

        // 이름 섹션
        const nameSpan = document.createElement('span')
        nameSpan.style.cssText = 'padding:7px 8px 7px 12px;font-size:13px;font-weight:700;letter-spacing:-0.02em'
        nameSpan.textContent = `${displayName} ›`

        // 건물 수 뱃지
        const badge = document.createElement('span')
        badge.style.cssText = [
          'background:rgba(255,255,255,0.18)',
          'padding:7px 10px',
          'font-size:11px', 'font-weight:700',
        ].join(';')
        badge.textContent = `${count}개`

        el.appendChild(nameSpan)
        if (count > 0) el.appendChild(badge)

        el.addEventListener('click', (e) => {
          e.stopPropagation()
          routerRef.current.push(`/zones/${encodeURIComponent(zone.name)}`)
        })

        // hover effect
        el.addEventListener('mouseenter', () => { el.style.background = '#1d4ed8'; map.getCanvas().style.cursor = 'pointer' })
        el.addEventListener('mouseleave', () => { el.style.background = '#2563eb'; map.getCanvas().style.cursor = '' })

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([zone.lng, zone.lat])
          .addTo(map)

        zonePillMarkersRef.current.push(marker)
      }

      map.on('zoom', updateZonePillVisibility)
      updateZonePillVisibility()

      // ── 개별 건물 도트 (zoom 14+, 구역 Pill 숨김 기준과 동일) ─────
      map.addLayer({
        id: 'buildings-dot',
        type: 'circle',
        source: 'buildings',
        minzoom: HIDE_ZONE_ZOOM,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 4, 16, 6],
          'circle-color': [
            'case',
            ['==', ['get', 'main_purps_nm'], '단독주택'],          '#6b7280',
            ['==', ['get', 'main_purps_nm'], '공동주택'],          '#2563eb',
            ['in', '근린생활', ['get', 'main_purps_nm']],          '#f59e0b',
            '#9ca3af',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.95,
        },
      })

      // ── 건물명 레이블 (zoom ≥ 15, 커스텀 스타일에 glyphs 미설정 시 무시)
      try {
        map.addLayer({
          id: 'buildings-label',
          type: 'symbol',
          source: 'buildings',
          minzoom: 15,
          layout: {
            'text-field': ['coalesce', ['get', 'name'], ['get', 'address']],
            'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
            'text-size': 11,
            'text-offset': [0, 1.1],
            'text-anchor': 'top',
            'text-max-width': 8,
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': 'rgba(255,255,255,0.92)',
            'text-halo-width': 1.5,
          },
        })
      } catch { /* glyphs not available in custom style */ }

      // ── 클릭: 건물 세부 페이지 이동 ─────────────────────────────
      map.on('click', 'buildings-dot', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id) routerRef.current.push(`/buildings/${id}`)
      })

      map.on('mouseenter', 'buildings-dot', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'buildings-dot', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      zonePillMarkersRef.current.forEach((m) => m.remove())
      zonePillMarkersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
