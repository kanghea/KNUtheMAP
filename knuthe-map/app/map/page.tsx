'use client'

import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

export default function MapPage() {
  return (
    <div className="w-screen h-screen">
      <MapView />
    </div>
  )
}
