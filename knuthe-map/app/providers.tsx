'use client'

import { FilterProvider } from '@/lib/filter-context'
import { ThemeProvider } from '@/lib/theme'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <FilterProvider>{children}</FilterProvider>
    </ThemeProvider>
  )
}
