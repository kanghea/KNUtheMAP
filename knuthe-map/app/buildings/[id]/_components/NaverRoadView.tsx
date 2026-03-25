'use client'

import { useEffect, useRef, useState } from 'react'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    naver?: { maps?: any }
    __naverMapsLoading?: boolean
    __naverMapsReady?: boolean
    __naverMapsCallbacks?: Array<() => void>
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function loadNaverMaps(clientId: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return

    if (window.__naverMapsReady && window.naver?.maps) {
      resolve()
      return
    }

    if (!window.__naverMapsCallbacks) window.__naverMapsCallbacks = []
    window.__naverMapsCallbacks.push(resolve)

    if (window.__naverMapsLoading) return
    window.__naverMapsLoading = true

    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=panorama`
    script.onload = () => {
      window.__naverMapsReady = true
      window.__naverMapsCallbacks?.forEach((cb) => cb())
      window.__naverMapsCallbacks = []
    }
    script.onerror = () => {
      window.__naverMapsLoading = false
      window.__naverMapsCallbacks?.forEach((cb) => cb())
    }
    document.head.appendChild(script)
  })
}

interface Props {
  lat: number
  lng: number
  clientId: string
  fallbackImg: string
}

export default function NaverRoadView({ lat, lng, clientId, fallbackImg }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    loadNaverMaps(clientId).then(() => {
      if (cancelled || !containerRef.current) return
      if (!window.naver?.maps?.Panorama) { setFailed(true); return }

      try {
        new window.naver.maps.Panorama(containerRef.current, {
          position: new window.naver.maps.LatLng(lat, lng),
          pov: { pan: 0, tilt: 0, fov: 100 },
        })
        setReady(true)
      } catch {
        setFailed(true)
      }
    })

    return () => { cancelled = true }
  }, [lat, lng, clientId])

  return (
    <div className="w-full h-full relative bg-gray-100">
      {/* 로드뷰 컨테이너 */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ display: failed ? 'none' : 'block' }}
      />

      {/* 폴백: 위성 지도 */}
      {(failed || !ready) && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={fallbackImg}
          alt="위치 지도"
          className="w-full h-full object-cover absolute inset-0"
        />
      )}

      {/* 로딩 shimmer (로드뷰 준비 전, 폴백 없을 때) */}
      {!ready && !failed && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
      )}
    </div>
  )
}
