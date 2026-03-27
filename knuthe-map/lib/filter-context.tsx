'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { MapFilters, DEFAULT_FILTERS } from '@/components/map/DynamicFilter'

const STORAGE_KEY = 'knu_map_filters'

function load(): MapFilters {
  if (typeof window === 'undefined') return DEFAULT_FILTERS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_FILTERS
}

interface FilterCtx {
  filters:    MapFilters
  setFilters: (f: MapFilters) => void
}

const Ctx = createContext<FilterCtx>({ filters: DEFAULT_FILTERS, setFilters: () => {} })

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<MapFilters>(DEFAULT_FILTERS)

  // hydrate from localStorage after mount
  useEffect(() => { setFiltersState(load()) }, [])

  const setFilters = useCallback((f: MapFilters) => {
    setFiltersState(f)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(f)) } catch { /* ignore */ }
  }, [])

  return <Ctx.Provider value={{ filters, setFilters }}>{children}</Ctx.Provider>
}

export function useFilters() {
  return useContext(Ctx)
}
