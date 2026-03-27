'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_DEFAULTS } from '@/lib/mapbox'
import { GATES_GEOJSON } from '@/lib/gates'
import { MapFilters } from '@/components/map/DynamicFilter'
import { roomFeatureMatchesFilters } from '@/lib/room-filter'

mapboxgl.accessToken = MAPBOX_TOKEN

interface Props {
  filters:        MapFilters
  onClusterClick: (roomIds: string[]) => void
}

export default function RoomsMapView({ filters, onClusterClick }: Props) {
  const containerRef      = useRef<HTMLDivElement>(null)
  const mapRef            = useRef<mapboxgl.Map | null>(null)
  const allFeaturesRef    = useRef<GeoJSON.Feature[]>([])
  const filtersRef        = useRef(filters)
  const router            = useRouter()
  const routerRef         = useRef(router)
  const onClusterClickRef = useRef(onClusterClick)

  useEffect(() => { routerRef.current = router },             [router])
  useEffect(() => { filtersRef.current = filters },           [filters])
  useEffect(() => { onClusterClickRef.current = onClusterClick }, [onClusterClick])

  // 필터 변경 시 소스 데이터 업데이트
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('rooms') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const filtered = allFeaturesRef.current.filter(roomFeatureMatchesFilters(filters))
    src.setData({ type: 'FeatureCollection', features: filtered })
  }, [filters])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style:     MAPBOX_STYLE,
      center:    MAP_DEFAULTS.center,
      zoom:      MAP_DEFAULTS.zoom,
      pitch:     0,
      bearing:   0,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

    map.on('style.load', async () => {
      // ── 출입문 ───────────────────────────────────────────────────
      map.addSource('gates', { type: 'geojson', data: GATES_GEOJSON })
      map.addLayer({
        id: 'gates-circle', type: 'circle', source: 'gates',
        paint: {
          'circle-radius': 7, 'circle-color': '#1e40af',
          'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-opacity': 0.92,
        },
      })
      try {
        map.addLayer({
          id: 'gates-label', type: 'symbol', source: 'gates',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 11, 'text-offset': [0, 1.4], 'text-anchor': 'top',
          },
          paint: { 'text-color': '#1e3a8a', 'text-halo-color': 'rgba(255,255,255,0.95)', 'text-halo-width': 2 },
        })
      } catch { /* glyphs not available */ }

      map.on('click', 'gates-circle', (e) => {
        const name = e.features?.[0]?.properties?.name as string
        if (!name || !e.lngLat) return
        new mapboxgl.Popup({ closeButton: true, maxWidth: '200px' })
          .setLngLat(e.lngLat)
          .setHTML(`<div style="padding:10px 12px;font-size:14px;font-weight:700">${name}</div>`)
          .addTo(map)
      })
      map.on('mouseenter', 'gates-circle', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'gates-circle', () => { map.getCanvas().style.cursor = '' })

      // ── 방 데이터 로드 ──────────────────────────────────────────
      let geojson: GeoJSON.FeatureCollection
      try {
        const res  = await fetch('/api/rooms')
        const json = await res.json()
        if (!res.ok || !json.features) { console.error('방 데이터 로드 실패'); return }
        geojson = json
      } catch {
        console.error('방 데이터 로드 실패'); return
      }

      if (map !== mapRef.current) return

      allFeaturesRef.current = geojson.features
      const initialFiltered  = geojson.features.filter(roomFeatureMatchesFilters(filtersRef.current))

      // 클러스터링 활성화
      map.addSource('rooms', {
        type:          'geojson',
        data:          { type: 'FeatureCollection', features: initialFiltered },
        cluster:       true,
        clusterMaxZoom: 15,
        clusterRadius:  50,
      })

      // ── 클러스터 원 ────────────────────────────────────────────
      map.addLayer({
        id: 'rooms-clusters',
        type: 'circle',
        source: 'rooms',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#3b82f6',  5,   // 1–4개: 파랑
            '#8b5cf6',  15,  // 5–14개: 보라
            '#ef4444',       // 15+개: 빨강
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            22,  5,
            30,  15,
            40,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.55)',
          'circle-opacity': 0.92,
        },
      })

      // 클러스터 개수 텍스트 (glyphs 없으면 무시)
      try {
        map.addLayer({
          id: 'rooms-cluster-count',
          type: 'symbol',
          source: 'rooms',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 13,
          },
          paint: { 'text-color': '#fff' },
        })
      } catch { /* glyphs not available */ }

      // ── 개별 방 마커 ───────────────────────────────────────────
      map.addLayer({
        id: 'rooms-unclustered',
        type: 'circle',
        source: 'rooms',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 7, 16, 10],
          'circle-color': [
            'case',
            ['==', ['get', 'contract_type'], '월세'], '#2563eb',
            ['==', ['get', 'contract_type'], '전세'], '#16a34a',
            '#f59e0b',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2.5,
          'circle-opacity': 0.95,
        },
      })

      // ── 클러스터 클릭 → 목록 표시 ─────────────────────────────
      map.on('click', 'rooms-clusters', async (e) => {
        const feature = e.features?.[0]
        if (!feature) return
        const clusterId = feature.properties?.cluster_id as number
        const src = map.getSource('rooms') as mapboxgl.GeoJSONSource

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const leaves = await (src as any).getClusterLeaves(clusterId, 500, 0) as GeoJSON.Feature[]
          const ids = leaves
            .map((f) => f.properties?.id as string)
            .filter(Boolean)
          if (ids.length > 0) onClusterClickRef.current(ids)
        } catch (err) {
          console.error('getClusterLeaves 실패', err)
        }
      })

      // 클러스터 hover → 줌인 커서
      map.on('mouseenter', 'rooms-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'rooms-clusters', () => { map.getCanvas().style.cursor = '' })

      // ── 개별 방 클릭 → 상세 페이지 ────────────────────────────
      map.on('click', 'rooms-unclustered', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id) routerRef.current.push(`/rooms/${id}`)
      })
      map.on('mouseenter', 'rooms-unclustered', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'rooms-unclustered', () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* 범례 */}
      <div style={{
        position: 'absolute', bottom: 110, left: 12,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '8px 12px',
        display: 'flex', flexDirection: 'column', gap: 5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        pointerEvents: 'none',
      }}>
        {[
          { color: '#2563eb', label: '월세' },
          { color: '#16a34a', label: '전세' },
          { color: '#f59e0b', label: '매매' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{label}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 2, paddingTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, border: '2px solid rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>묶음</span>
          </div>
        </div>
      </div>
    </div>
  )
}
