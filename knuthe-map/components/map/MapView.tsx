'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_DEFAULTS } from '@/lib/mapbox'
import { GATES_GEOJSON } from '@/lib/gates'
import { MapFilters, featureMatchesFilters } from '@/components/map/DynamicFilter'

mapboxgl.accessToken = MAPBOX_TOKEN

const GATE_MODEL_URL       = '/models/chinese_gate.glb'
const GATE_HEIGHT_METERS   = 1
const GATE_ALTITUDE_METERS = 2

type ZoneMeta = { name: string; lat: number; lng: number; footprint: [number, number][] | null }

function pointInPolygon(lng: number, lat: number, poly: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function buildZoneClustersGeoJSON(
  features: GeoJSON.Feature[],
  zonesMap: Map<number, ZoneMeta>,
): GeoJSON.FeatureCollection {
  const counts = new Map<number, number>()
  features.forEach((f) => {
    const zid = f.properties?.zone_id as number | null
    if (zid) counts.set(zid, (counts.get(zid) ?? 0) + 1)
  })
  return {
    type: 'FeatureCollection',
    features: [...counts.entries()].flatMap(([zid, count]) => {
      const z = zonesMap.get(zid)
      if (!z) return []
      return [{
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [z.lng, z.lat] },
        properties: { zone_id: zid, zone_name: z.name, count },
      }]
    }),
  }
}

interface MapViewProps {
  filters: MapFilters
}

export default function MapView({ filters }: MapViewProps) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<mapboxgl.Map | null>(null)
  const allFeaturesRef = useRef<GeoJSON.Feature[]>([])
  const zonesMapRef    = useRef<Map<number, ZoneMeta>>(new Map())
  const router         = useRouter()
  const routerRef      = useRef(router)
  useEffect(() => { routerRef.current = router }, [router])

  // ── 필터 변경 시 소스 데이터 업데이트 (재조회 없음)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const bSource = map.getSource('buildings')    as mapboxgl.GeoJSONSource | undefined
    const zSource = map.getSource('zone-clusters') as mapboxgl.GeoJSONSource | undefined
    if (!bSource) return

    const matcher = featureMatchesFilters(filters)
    const filtered = allFeaturesRef.current.filter(matcher)

    bSource.setData({ type: 'FeatureCollection', features: filtered })
    zSource?.setData(buildZoneClustersGeoJSON(filtered, zonesMapRef.current))
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
      // ── Three.js 게이트 레이어 ─────────────────────────────────
      let camera: THREE.Camera
      let scene: THREE.Scene
      let renderer: THREE.WebGLRenderer

      const gateLayer: mapboxgl.CustomLayerInterface = {
        id: 'gates-3d',
        type: 'custom',
        renderingMode: '3d',

        onAdd(_, gl) {
          camera = new THREE.Camera()
          scene  = new THREE.Scene()
          scene.add(new THREE.AmbientLight(0xffffff, 3.0))
          scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2.0))
          const dl1 = new THREE.DirectionalLight(0xffffff, 3.0)
          dl1.position.set(1, 1, 2).normalize()
          scene.add(dl1)
          const dl2 = new THREE.DirectionalLight(0xffffff, 1.5)
          dl2.position.set(-1, -1, 1).normalize()
          scene.add(dl2)

          const loader = new GLTFLoader()
          loader.load(GATE_MODEL_URL, (gltf) => {
            gltf.scene.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.geometry.computeVertexNormals()
                const mats = Array.isArray(node.material) ? node.material : [node.material]
                for (const mat of mats) { mat.flatShading = false; mat.needsUpdate = true }
              }
            })
            for (const feature of GATES_GEOJSON.features) {
              const coords = (feature.geometry as GeoJSON.Point).coordinates
              const mc = mapboxgl.MercatorCoordinate.fromLngLat([coords[0], coords[1]], GATE_ALTITUDE_METERS)
              const scale = mc.meterInMercatorCoordinateUnits() * GATE_HEIGHT_METERS
              const model = gltf.scene.clone(true)
              model.scale.setScalar(scale)
              model.position.set(mc.x, mc.y, mc.z ?? 0)
              model.rotation.x = Math.PI / 2
              scene.add(model)
            }
            map.triggerRepaint()
          })

          renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
          renderer.autoClear = false
          renderer.outputColorSpace = THREE.SRGBColorSpace
          renderer.toneMapping = THREE.NoToneMapping
        },

        render(_, matrix) {
          camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix)
          renderer.resetState()
          renderer.render(scene, camera)
          map.triggerRepaint()
        },
      }

      map.addLayer(gateLayer)

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

      allFeaturesRef.current = geojson.features

      // ── 구역 클러스터 소스 ──────────────────────────────────────
      map.addSource('zone-clusters', {
        type: 'geojson',
        data: buildZoneClustersGeoJSON(geojson.features, zonesMapRef.current),
        generateId: true,
      })

      // ── 구역 클러스터 원 ─────────────────────────────────────────
      map.addLayer({
        id: 'zone-clusters-circle',
        type: 'circle',
        source: 'zone-clusters',
        maxzoom: 13,
        paint: {
          'circle-color': [
            'interpolate', ['linear'], ['get', 'count'],
            1, '#93c5fd', 50, '#3b82f6', 200, '#1d4ed8',
          ],
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'count'],
            1, 22, 100, 32, 300, 42,
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': 'rgba(255,255,255,0.85)',
          'circle-opacity': 0.9,
        },
      })

      // ── 구역 클러스터 건물 수 ────────────────────────────────────
      map.addLayer({
        id: 'zone-clusters-count',
        type: 'symbol',
        source: 'zone-clusters',
        maxzoom: 13,
        layout: {
          'text-field': ['get', 'count'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#fff' },
      })

      // ── 구역명 라벨 ──────────────────────────────────────────────
      map.addLayer({
        id: 'zone-clusters-name',
        type: 'symbol',
        source: 'zone-clusters',
        maxzoom: 13,
        layout: {
          'text-field': ['get', 'zone_name'],
          'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
          'text-size': 11,
          'text-offset': [0, 2.4],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': 'rgba(255,255,255,0.9)',
          'text-halo-width': 1.5,
        },
      })

      // ── 건물 소스 (클러스터링 없음) ──────────────────────────────
      map.addSource('buildings', {
        type: 'geojson',
        data: geojson,
        generateId: true,
      })

      // ── 개별 건물 도트 (줌 ≥ 13에서 표시) ──────────────────────
      map.addLayer({
        id: 'buildings-dot',
        type: 'circle',
        source: 'buildings',
        minzoom: 13,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            12, 3.5,
            16, 6,
          ],
          'circle-color': '#fff',
          'circle-stroke-color': [
            'case',
            ['==', ['get', 'main_purps_nm'], '단독주택'], '#6b7280',
            ['==', ['get', 'main_purps_nm'], '공동주택'], '#2563eb',
            ['any',
              ['in', '근린생활', ['get', 'main_purps_nm']],
            ], '#f59e0b',
            '#9ca3af',
          ],
          'circle-stroke-width': [
            'interpolate', ['linear'], ['zoom'],
            12, 1.5,
            16, 2.5,
          ],
          'circle-opacity': 0.95,
        },
      })

      // ── 건물명 레이블 (zoom ≥ 15) ────────────────────────────────
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

      // ── 클릭: 건물 세부 페이지 이동 ─────────────────────────────
      map.on('click', 'buildings-dot', (e) => {
        const id = e.features?.[0]?.properties?.id
        if (id) routerRef.current.push(`/buildings/${id}`)
      })

      // ── 구역 클러스터 클릭: 해당 구역 건물들에 fitBounds ────────
      map.on('click', 'zone-clusters-circle', (e) => {
        const zid = e.features?.[0]?.properties?.zone_id as number | undefined
        if (zid == null) return
        const bldgs = allFeaturesRef.current.filter((f) => f.properties?.zone_id === zid)
        if (bldgs.length === 0) return
        const lngs = bldgs.map((f) => (f.geometry as GeoJSON.Point).coordinates[0])
        const lats = bldgs.map((f) => (f.geometry as GeoJSON.Point).coordinates[1])
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 80, maxZoom: 15, duration: 600 },
        )
      })

      map.on('mouseenter', 'zone-clusters-circle', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'zone-clusters-circle', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'buildings-dot',         () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'buildings-dot',         () => { map.getCanvas().style.cursor = '' })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
