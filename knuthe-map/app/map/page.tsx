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
        if (prefs.priorities?.length) p.set('p',    prefs.priorities.join(','))
        if (prefs.gate)               p.set('gate', prefs.gate)
        if (prefs.zone && !sp.zone)   p.set('zone', prefs.zone)
        redirect(`/map?${p.toString()}`)
      }
    }
  }

  return (
    <Suspense>
      <MapClient />
    </Suspense>
  )
}
