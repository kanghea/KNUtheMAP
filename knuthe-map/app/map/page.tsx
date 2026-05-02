import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { parsePrefs } from '@/lib/prefs'
import MapClient from './_client'

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams

  // URL에 scoring 파라미터가 없으면 쿠키에서 읽어 자동 주입
  if (!sp.p && !sp.gate) {
    const jar = await cookies()
    const raw = jar.get('knu_prefs')?.value
    if (raw) {
      const prefs = parsePrefs(raw)
      if (prefs) {
        const p = new URLSearchParams(sp as Record<string, string>)
        let changed = false
        if (prefs.priorities?.length) { p.set('p',    prefs.priorities.join(',')); changed = true }
        if (prefs.gate)               { p.set('gate', prefs.gate);                 changed = true }
        if (prefs.zone && !sp.zone)   { p.set('zone', prefs.zone);                 changed = true }
        if (changed) redirect(`/map?${p.toString()}`)
      }
    }
  }

  const themeJar = await cookies()
  const themeRaw = themeJar.get('knu_prefs')?.value
  const themePrefs = themeRaw ? parsePrefs(themeRaw) : null
  const theme = (themePrefs?.theme ?? 'light') as 'dark' | 'light'

  return (
    <Suspense>
      <MapClient theme={theme} />
    </Suspense>
  )
}
