/**
 * scripts/backfill-vworld.ts
 *
 * V-world 도로명주소 건물 API (LT_C_SPBD) 로
 * buildings 의 buld_nm(건물명), gro_flo_co(층수), bd_mgt_sn(건물관리번호)를 채웁니다.
 *
 * 실행 (004 마이그레이션 적용 후):
 *   npm run backfill:vworld
 *
 * 환경 변수 (.env.local):
 *   VWORLD_KEY=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const VWORLD_KEY = process.env.VWORLD_KEY!
const DELAY_MS   = 120   // ~8 req/s
const BATCH_SIZE = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── V-world 응답 타입
interface VworldFeature {
  type: 'Feature'
  properties: {
    buld_nm:    string | null
    buld_nm_dc: string | null
    gro_flo_co: string | null
    bd_mgt_sn:  string | null
  }
}
interface VworldResponse {
  response: {
    status: string   // 'OK' | 'NOT_FOUND' | 'ERROR'
    result?: {
      featureCollection?: {
        features: VworldFeature[]
      }
    }
    error?: { code: string; text: string }
  }
}

async function fetchVworld(lat: number, lng: number): Promise<VworldFeature['properties'] | null> {
  const params = new URLSearchParams({
    service:    'data',
    request:    'GetFeature',
    data:       'LT_C_SPBD',
    key:        VWORLD_KEY,
    geomFilter: `POINT(${lng} ${lat})`,
    buffer:     '10',          // 10m 반경
    size:       '1',
    format:     'json',
    crs:        'EPSG:4326',
    columns:    'buld_nm,buld_nm_dc,gro_flo_co,bd_mgt_sn',
    geometry:   'false',
    domain:     '*',
  })

  const res = await fetch(`https://api.vworld.kr/req/data?${params}`)

  if (!res.ok) {
    console.error(`  V-world HTTP 오류 ${res.status}`)
    return null
  }

  const data: VworldResponse = await res.json()

  if (data.response.status === 'NOT_FOUND') return null

  if (data.response.status !== 'OK') {
    console.error(`  V-world 오류: ${data.response.error?.text ?? data.response.status}`)
    return null
  }

  const feature = data.response.result?.featureCollection?.features?.[0]
  return feature?.properties ?? null
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!VWORLD_KEY) {
    console.error('VWORLD_KEY 환경 변수가 없습니다.')
    process.exit(1)
  }

  const { count, error: countError } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .eq('vworld_enriched', false)

  if (countError) {
    console.error('Supabase count 오류:', countError.message)
    process.exit(1)
  }

  const total = count ?? 0
  console.log(`처리 대상: ${total}개 건물\n`)

  if (total === 0) {
    console.log('모든 건물이 이미 처리됐습니다.')
    return
  }

  let named    = 0
  let floored  = 0
  let notFound = 0
  let processed = 0

  while (true) {
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('id, name, lat, lng')
      .eq('vworld_enriched', false)
      .limit(BATCH_SIZE)

    if (error) {
      console.error('Supabase fetch 오류:', error.message)
      process.exit(1)
    }
    if (buildings.length === 0) break

    for (const building of buildings) {
      processed++
      const props = await fetchVworld(building.lat, building.lng)

      // 결과 유무와 관계없이 vworld_enriched = true 로 마킹 (무한루프 방지)
      const update: Record<string, unknown> = { vworld_enriched: true }

      if (props) {
        // 건물명: 기존 name 이 없을 때만 채움
        const buld_nm = props.buld_nm
          ? props.buld_nm_dc
            ? `${props.buld_nm} ${props.buld_nm_dc}`
            : props.buld_nm
          : null

        if (!building.name && buld_nm) {
          update.name = buld_nm
          named++
        }
        // 층수: V-world 값으로 항상 덮어씀
        if (props.gro_flo_co) {
          update.total_floors = parseInt(props.gro_flo_co, 10)
          floored++
        }
        // 건물관리번호: 항상 채움
        if (props.bd_mgt_sn) update.bd_mgt_sn = props.bd_mgt_sn

        const label = update.name ?? building.name ?? `(${building.lat}, ${building.lng})`
        process.stdout.write(`\r✓ ${String(label).padEnd(30)} [${processed}/${total}]`)
      } else {
        notFound++
        process.stdout.write(`\r- 결과 없음 ${notFound}건  [${processed}/${total}]`)
      }

      const { error: updateError } = await supabase
        .from('buildings')
        .update(update)
        .eq('id', building.id)

      if (updateError) console.error(`\n  업데이트 실패: ${updateError.message}`)

      await sleep(DELAY_MS)
    }
  }

  console.log(`\n\n완료:`)
  console.log(`  이름 채움    ${named}건`)
  console.log(`  층수 채움    ${floored}건`)
  console.log(`  결과 없음    ${notFound}건`)
}

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})
