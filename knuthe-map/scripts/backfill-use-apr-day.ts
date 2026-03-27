/**
 * scripts/backfill-use-apr-day.ts
 *
 * use_apr_day(사용승인일)가 없는 524개 건물을 두 단계로 채웁니다.
 *
 * Phase 1 (385건 — bd_mgt_sn 있음, getBrTitleInfo 호출됐으나 날짜 없음)
 *   getBrRecapTitleInfo (총괄표제부) 로 재시도
 *
 * Phase 2 (139건 — bd_mgt_sn 없음, vworld_enriched=true 이나 bd_mgt_sn 미확보)
 *   V-World 좌표 조회를 buffer=25m 로 재시도 → bd_mgt_sn 확보
 *   → getBrTitleInfo → getBrRecapTitleInfo 순서로 use_apr_day 조회
 *
 * 실행:
 *   npx tsx scripts/backfill-use-apr-day.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const BLDRGST_API_KEY = process.env.BLDRGST_API_KEY!
const VWORLD_KEY      = process.env.VWORLD_KEY!
const DELAY_MS        = 250   // ~4 req/s
const BATCH_SIZE      = 50

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ── 건축물대장 공통 ───────────────────────────────────────────────

interface BldrgstItem {
  useAprDay: string | null
  bldNm?:    string | null
}

interface BldrgstResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body?: { items?: { item?: BldrgstItem | BldrgstItem[] }; totalCount?: number }
  }
}

function parseBdMgtSn(bdMgtSn: string) {
  return {
    sigunguCd: bdMgtSn.slice(0, 5),
    bjdongCd:  bdMgtSn.slice(5, 10),
    bun:       bdMgtSn.slice(11, 15),
    ji:        bdMgtSn.slice(15, 19),
  }
}

async function callBldrgstEndpoint(
  endpoint: string,
  sigunguCd: string, bjdongCd: string, platGbCd: string, bun: string, ji: string,
): Promise<{ useAprDay: string | null; totalCount: number }> {
  const params = `serviceKey=${BLDRGST_API_KEY}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=${platGbCd}&bun=${bun}&ji=${ji}&numOfRows=1&pageNo=1&_type=json`
  try {
    const res = await fetch(`https://apis.data.go.kr/1613000/BldRgstHubService/${endpoint}?${params}`)
    if (!res.ok) return { useAprDay: null, totalCount: 0 }
    const data: BldrgstResponse = await res.json()
    if (data.response.header.resultCode !== '00') return { useAprDay: null, totalCount: 0 }
    const totalCount = Number(data.response.body?.totalCount ?? 0)
    if (totalCount === 0) return { useAprDay: null, totalCount: 0 }
    const rawItem = data.response.body?.items?.item
    const item = rawItem ? (Array.isArray(rawItem) ? rawItem[0] : rawItem) : null
    return { useAprDay: item?.useAprDay?.trim() || null, totalCount }
  } catch {
    return { useAprDay: null, totalCount: 0 }
  }
}

// getBrTitleInfo(기본개요) 또는 getBrRecapTitleInfo(총괄표제부) 순서로 시도
async function fetchUseAprDay(bdMgtSn: string): Promise<string | null> {
  const { sigunguCd, bjdongCd, bun, ji } = parseBdMgtSn(bdMgtSn)

  for (const endpoint of ['getBrTitleInfo', 'getBrRecapTitleInfo']) {
    for (const platGbCd of ['0', '1', '2']) {
      const { useAprDay, totalCount } = await callBldrgstEndpoint(
        endpoint, sigunguCd, bjdongCd, platGbCd, bun, ji,
      )
      if (totalCount > 0) {
        await sleep(100)
        return useAprDay
      }
      await sleep(100)
    }
  }
  return null
}

// ── V-World ───────────────────────────────────────────────────────

interface VworldResponse {
  response: {
    status: string
    result?: { featureCollection?: { features: { properties: { bd_mgt_sn: string | null } }[] } }
    error?: { code: string; text: string }
  }
}

async function fetchVworldBdMgtSn(lat: number, lng: number, buffer = 25): Promise<string | null> {
  const params = new URLSearchParams({
    service:    'data',
    request:    'GetFeature',
    data:       'LT_C_SPBD',
    key:        VWORLD_KEY,
    geomFilter: `POINT(${lng} ${lat})`,
    buffer:     String(buffer),
    size:       '1',
    format:     'json',
    crs:        'EPSG:4326',
    columns:    'bd_mgt_sn',
    geometry:   'false',
    domain:     '*',
  })
  try {
    const res = await fetch(`https://api.vworld.kr/req/data?${params}`)
    if (!res.ok) return null
    const data: VworldResponse = await res.json()
    if (data.response.status !== 'OK') return null
    const feature = data.response.result?.featureCollection?.features?.[0]
    return feature?.properties?.bd_mgt_sn ?? null
  } catch {
    return null
  }
}

// ── Phase 1: bd_mgt_sn 있음, use_apr_day 없음 ─────────────────────

async function phase1() {
  const { count } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .or('use_apr_day.is.null,use_apr_day.eq.')
    .not('bd_mgt_sn', 'is', null)

  const total = count ?? 0
  console.log(`\n[Phase 1] bd_mgt_sn 있음 → 건축물대장 재시도: ${total}건`)
  if (total === 0) return

  let filled = 0, notFound = 0, processed = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('buildings')
      .select('id, bd_mgt_sn, name')
      .or('use_apr_day.is.null,use_apr_day.eq.')
      .not('bd_mgt_sn', 'is', null)
      .limit(BATCH_SIZE)

    if (error) { console.error('\nSupabase 오류:', error.message); break }
    if (rows.length === 0) break

    for (const row of rows) {
      processed++
      const useAprDay = await fetchUseAprDay(row.bd_mgt_sn!)

      if (useAprDay) {
        const { error: e } = await supabase
          .from('buildings')
          .update({ use_apr_day: useAprDay })
          .eq('id', row.id)
        if (!e) filled++
        else console.error(`\n  업데이트 실패: ${e.message}`)
        process.stdout.write(`\r✓ ${useAprDay}  ${(row.name ?? row.bd_mgt_sn ?? '').padEnd(28)} [${processed}/${total}] 성공: ${filled}`)
      } else {
        notFound++
        // 날짜 없다는 사실을 다시 찾지 않도록 임시 마커: 빈 문자열 대신 null 그대로
        process.stdout.write(`\r- 날짜 없음 ${notFound}건  [${processed}/${total}] 성공: ${filled}`)
      }

      await sleep(DELAY_MS)
    }

    // 무한루프 방지: 남은 건이 줄어들지 않으면 중단
    if (notFound + filled >= total) break
  }

  console.log(`\n  완료 → 날짜 채움: ${filled}건  / 여전히 없음: ${notFound}건`)
}

// ── Phase 2: bd_mgt_sn 없음 → V-World 재시도 ─────────────────────

async function phase2() {
  const { count } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .or('use_apr_day.is.null,use_apr_day.eq.')
    .is('bd_mgt_sn', null)

  const total = count ?? 0
  console.log(`\n[Phase 2] bd_mgt_sn 없음 → V-World(25m) 재시도: ${total}건`)
  if (total === 0) return

  let mgtFound = 0, filled = 0, notFound = 0, processed = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('buildings')
      .select('id, lat, lng, name')
      .or('use_apr_day.is.null,use_apr_day.eq.')
      .is('bd_mgt_sn', null)
      .limit(BATCH_SIZE)

    if (error) { console.error('\nSupabase 오류:', error.message); break }
    if (rows.length === 0) break

    for (const row of rows) {
      processed++
      const bdMgtSn = await fetchVworldBdMgtSn(row.lat, row.lng, 25)

      if (bdMgtSn) {
        mgtFound++
        // bd_mgt_sn 확보 → 건축물대장 조회
        const useAprDay = await fetchUseAprDay(bdMgtSn)

        if (useAprDay) {
          const { error: e } = await supabase
            .from('buildings')
            .update({ bd_mgt_sn: bdMgtSn, use_apr_day: useAprDay })
            .eq('id', row.id)
          if (!e) filled++
          else console.error(`\n  업데이트 실패: ${e.message}`)
          process.stdout.write(`\r✓ ${useAprDay}  ${(row.name ?? '').padEnd(28)} [${processed}/${total}] 성공: ${filled}`)
        } else {
          // bd_mgt_sn만 저장
          await supabase.from('buildings').update({ bd_mgt_sn: bdMgtSn }).eq('id', row.id)
          notFound++
          process.stdout.write(`\r~ bd_mgt_sn만 확보  [${processed}/${total}] 성공: ${filled}`)
        }
      } else {
        notFound++
        process.stdout.write(`\r- V-World 미확인 ${notFound}건  [${processed}/${total}] 성공: ${filled}`)
      }

      await sleep(DELAY_MS)
    }

    if (processed >= total) break
  }

  console.log(`\n  완료 → bd_mgt_sn 확보: ${mgtFound}건  날짜 채움: ${filled}건  미확인: ${notFound}건`)
}

// ── 메인 ──────────────────────────────────────────────────────────

async function main() {
  if (!BLDRGST_API_KEY) { console.error('BLDRGST_API_KEY 없음'); process.exit(1) }
  if (!VWORLD_KEY)      { console.error('VWORLD_KEY 없음');      process.exit(1) }

  console.log('use_apr_day 채우기 시작...')

  await phase1()
  await phase2()

  // 최종 현황
  const { count: remaining } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .or('use_apr_day.is.null,use_apr_day.eq.')

  console.log(`\n최종 미확보: ${remaining ?? '?'}건`)
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
