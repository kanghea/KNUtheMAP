/**
 * scripts/backfill-addresses.ts
 *
 * address 가 null 인 buildings 행을
 * 네이버 Maps Reverse Geocoding API 로 채웁니다.
 *
 * 실행:
 *   npm run backfill:addresses
 *
 * 환경 변수 (.env.local):
 *   NAVER_MAP_CLIENT_ID=...
 *   NAVER_MAP_CLIENT_SECRET=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const CLIENT_ID     = process.env.NAVER_MAP_CLIENT_ID!
const CLIENT_SECRET = process.env.NAVER_MAP_CLIENT_SECRET!
const DELAY_MS      = 110   // ~9 req/s
const BATCH_SIZE    = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── 네이버 Reverse Geocoding 응답 타입
interface NaverLand {
  name:    string
  number1: string
  number2: string
  addition0: { type: string; value: string }
}
interface NaverRegion {
  area1: { name: string }
  area2: { name: string }
  area3: { name: string }
  area4: { name: string }
}
interface NaverResult {
  name:   string   // 'roadaddr' | 'addr'
  region: NaverRegion
  land:   NaverLand
}
interface NaverResponse {
  status: { code: number; name: string; message: string }
  results?: NaverResult[]
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc`
    + `?coords=${lng},${lat}&output=json&orders=roadaddr,addr`

  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
      'X-NCP-APIGW-API-KEY':    CLIENT_SECRET,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    console.error(`  네이버 API 오류 ${res.status}: ${body}`)
    return null
  }

  const data: NaverResponse = await res.json()

  if (data.status.code !== 0 || !data.results?.length) return null

  // roadaddr 우선, 없으면 addr
  const result = data.results.find((r) => r.name === 'roadaddr')
    ?? data.results.find((r) => r.name === 'addr')

  if (!result) return null

  const { area1, area2, area3 } = result.region
  const land = result.land

  // 도로명 주소 조립: 시 구 동 도로명 번지
  const houseNumber = land.number2
    ? `${land.number1}-${land.number2}`
    : land.number1

  const parts = [area1.name, area2.name, area3.name, land.name, houseNumber]
    .filter(Boolean)

  return parts.join(' ') || null
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('NAVER_MAP_CLIENT_ID / NAVER_MAP_CLIENT_SECRET 환경 변수가 없습니다.')
    process.exit(1)
  }

  const { count, error: countError } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .is('address', null)

  if (countError) {
    console.error('Supabase count 오류:', countError.message)
    process.exit(1)
  }

  const total = count ?? 0
  console.log(`처리 대상: ${total}개 건물\n`)

  if (total === 0) {
    console.log('모든 건물에 주소가 채워져 있습니다.')
    return
  }

  let success = 0
  let fail    = 0

  while (true) {
    // 항상 offset 0 — 업데이트할수록 null 행이 줄어들므로 앞에서 계속 가져옴
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('id, name, lat, lng')
      .is('address', null)
      .limit(BATCH_SIZE)

    if (error) {
      console.error('Supabase fetch 오류:', error.message)
      process.exit(1)
    }

    if (buildings.length === 0) break

    for (const building of buildings) {
      const address = await reverseGeocode(building.lat, building.lng)
      const label   = building.name ?? `(${building.lat}, ${building.lng})`

      if (address) {
        const { error: updateError } = await supabase
          .from('buildings')
          .update({ address: address })
          .eq('id', building.id)

        if (updateError) {
          console.error(`✗ ${label} — 업데이트 실패: ${updateError.message}`)
          fail++
        } else {
          console.log(`✓ ${label} → ${address}  [${success + fail + 1}/${total}]`)
          success++
        }
      } else {
        // 주소 없는 행은 빈 문자열로 마킹해 무한루프 방지
        await supabase
          .from('buildings')
          .update({ address: '' })
          .eq('id', building.id)
        console.warn(`- ${label} — 주소 없음  [${success + fail + 1}/${total}]`)
        fail++
      }

      await sleep(DELAY_MS)
    }
  }

  console.log(`\n완료: 성공 ${success}건 / 실패·누락 ${fail}건`)
}

main()
