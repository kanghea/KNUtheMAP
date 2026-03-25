'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import DynamicFilter, { MapFilters, DEFAULT_FILTERS } from '@/components/map/DynamicFilter'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

export default function MapPage() {
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS)

  return (
    <div className="w-screen h-screen relative">
      <MapView filters={filters} />
      <DynamicFilter filters={filters} onChange={setFilters} />
    </div>
  )
}
