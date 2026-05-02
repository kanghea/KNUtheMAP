'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { DEFAULT_FILTERS } from '@/components/map/DynamicFilter'
import SearchAndFilter, { SearchResult } from '@/components/map/SearchAndFilter'
import { useFilters } from '@/lib/filter-context'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

const STORAGE_KEY = 'knu_map_filters'

export default function MapClient({ theme = 'light' }: { theme?: 'dark' | 'light' }) {
  const params = useSearchParams()
  const { filters, setFilters } = useFilters()
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null)
  const initialZone = params.get('zone') ?? null
  const appliedRef = useRef(false)

  // URL params (from onboarding prefs) override stored filters only on first load
  // when no filters have been explicitly saved by the user
  useEffect(() => {
    if (appliedRef.current) return
    appliedRef.current = true
    const gate    = params.get('gate')
    const gateMin = params.get('gateMin')
    if (!gate && !gateMin) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return // user has saved filters — don't override
    setFilters({ ...DEFAULT_FILTERS, gate: gate ?? null, gateMinutes: gateMin ? +gateMin : null })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelect = (r: SearchResult) => {
    setFlyTo({ lat: r.lat, lng: r.lng })
    setTimeout(() => setFlyTo(null), 1500)
  }

  return (
    <div className="w-screen h-screen relative">
      <MapView filters={filters} initialZone={initialZone} flyTo={flyTo} />
      <SearchAndFilter filters={filters} onChange={setFilters} onSelect={handleSelect} theme={theme} />
    </div>
  )
}
