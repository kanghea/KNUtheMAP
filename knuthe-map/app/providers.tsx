'use client'

import { FilterProvider } from '@/lib/filter-context'

export default function Providers({ children }: { children: React.ReactNode }) {
  return <FilterProvider>{children}</FilterProvider>
}
