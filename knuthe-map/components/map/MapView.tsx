'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MAPBOX_TOKEN, MAPBOX_STYLE, MAP_DEFAULTS } from '@/lib/mapbox'
import { GATES_GEOJSON } from '@/lib/gates'

mapboxgl.accessToken = MAPBOX_TOKEN

const GATE_MODEL_URL = '/models/chinese_gate.glb'
const GATE_HEIGHT_METERS = 5   // 모델 크기 (미터 단위)
const GATE_ALTITUDE_METERS = 2  // 지면에서 띄우는 높이 — z-fighting 방지

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: MAPBOX_STYLE,
      center: MAP_DEFAULTS.center,
      zoom: MAP_DEFAULTS.zoom,
      pitch: MAP_DEFAULTS.pitch,
      bearing: MAP_DEFAULTS.bearing,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    mapRef.current.on('style.load', () => {
      const map = mapRef.current
      if (!map) return

      let camera: THREE.Camera
      let scene: THREE.Scene
      let renderer: THREE.WebGLRenderer

      const gateLayer: mapboxgl.CustomLayerInterface = {
        id: 'gates-3d',
        type: 'custom',
        renderingMode: '3d',

        onAdd(_, gl) {
          camera = new THREE.Camera()
          scene = new THREE.Scene()

          scene.add(new THREE.AmbientLight(0xffffff, 3.0))
          scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 2.0))
          const dirLight1 = new THREE.DirectionalLight(0xffffff, 3.0)
          dirLight1.position.set(1, 1, 2).normalize()
          scene.add(dirLight1)
          const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.5)
          dirLight2.position.set(-1, -1, 1).normalize()
          scene.add(dirLight2)

          const loader = new GLTFLoader()
          loader.load(GATE_MODEL_URL, (gltf) => {
            gltf.scene.traverse((node) => {
              if (node instanceof THREE.Mesh) {
                node.geometry.computeVertexNormals()
                const materials = Array.isArray(node.material) ? node.material : [node.material]
                for (const mat of materials) {
                  mat.flatShading = false
                  mat.needsUpdate = true
                }
              }
            })

            for (const feature of GATES_GEOJSON.features) {
              const coords = (feature.geometry as GeoJSON.Point).coordinates
              const mercator = mapboxgl.MercatorCoordinate.fromLngLat(
                [coords[0], coords[1]],
                GATE_ALTITUDE_METERS
              )
              const scale = mercator.meterInMercatorCoordinateUnits() * GATE_HEIGHT_METERS

              const model = gltf.scene.clone(true)
              model.scale.setScalar(scale)
              model.position.set(mercator.x, mercator.y, mercator.z ?? 0)
              model.rotation.x = Math.PI / 2
              scene.add(model)
            }
            map.triggerRepaint()
          })

          renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          })
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
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
