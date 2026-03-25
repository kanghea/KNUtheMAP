/**
 * scripts/backfill-bldrgst.ts
 *
 * 공공데이터포털 건축물대장 정보서비스 (getBrTitleInfo) 로
 * buildings 의 name(건물명), use_apr_day(사용승인일), ugrnd_flr_cnt(지하층수),
 * tot_area(연면적), main_purps_nm(주용도), strct_cd_nm(구조), hhld_cnt(세대수),
 * ride_use_elvt_cnt(승강기수), has_elevator 를 채웁니다.
 *
 * 실행 (005 마이그레이션 적용 후):
 *   npm run backfill:bldrgst
 *
 * 환경 변수 (.env.local):
 *   BLDRGST_API_KEY=...   (공공데이터포털 건축물대장 서비스 키, URL-encoded)
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const BLDRGST_API_KEY = process.env.BLDRGST_API_KEY!
const DELAY_MS   = 200   // ~5 req/s (공공데이터포털 제한)
const BATCH_SIZE = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── 건축물대장 응답 타입 (getBrTitleInfo item)
interface BldrgstItem {
  bldNm:          string | null   // 건물명
  useAprDay:      string | null   // 사용승인일 (YYYYMMDD)
  grndFlrCnt:     string | null   // 지상층수
  ugrndFlrCnt:    string | null   // 지하층수
  totArea:        string | null   // 연면적
  mainPurpsCdNm:  string | null   // 주용도명
  strctCdNm:      string | null   // 구조명
  hhldCnt:        string | null   // 세대수
  rideUseElvtCnt: string | null   // 승용승강기수
}

interface BldrgstResponse {
  response: {
    header: { resultCode: string; resultMsg: string }
    body?: {
      items?: { item?: BldrgstItem | BldrgstItem[] }
      totalCount?: number
    }
  }
}

// bd_mgt_sn → 건축물대장 API 파라미터 분해
// 주의: V-world bd_mgt_sn의 position 10은 건축물대장 platGbCd와 다를 수 있음
// → platGbCd=0(대지) 우선 시도, 결과 없으면 1(산) 재시도
function parseBdMgtSn(bdMgtSn: string) {
  return {
    sigunguCd: bdMgtSn.slice(0, 5),
    bjdongCd:  bdMgtSn.slice(5, 10),
    bun:       bdMgtSn.slice(11, 15),
    ji:        bdMgtSn.slice(15, 19),
  }
}

async function fetchBldrgstWithPlatGb(
  sigunguCd: string, bjdongCd: string, platGbCd: string, bun: string, ji: string,
): Promise<{ item: BldrgstItem | null; totalCount: number }> {
  // serviceKey must be passed as-is (URL-encoded form); build URL manually to avoid double-encoding
  const params = `serviceKey=${BLDRGST_API_KEY}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=${platGbCd}&bun=${bun}&ji=${ji}&numOfRows=1&pageNo=1&_type=json`
  const res = await fetch(`https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?${params}`)
  if (!res.ok) return { item: null, totalCount: 0 }
  const data: BldrgstResponse = await res.json()
  if (data.response.header.resultCode !== '00') return { item: null, totalCount: 0 }
  const totalCount = Number(data.response.body?.totalCount ?? 0)
  const rawItem = data.response.body?.items?.item
  const item = rawItem ? (Array.isArray(rawItem) ? rawItem[0] : rawItem) : null
  return { item, totalCount }
}

async function fetchBldrgst(bdMgtSn: string): Promise<BldrgstItem | null> {
  const { sigunguCd, bjdongCd, bun, ji } = parseBdMgtSn(bdMgtSn)

  // V-world bd_mgt_sn position 10 != 건축물대장 platGbCd → try 0(대지), 1(산), 2(블록)
  for (const platGbCd of ['0', '1', '2']) {
    const { item, totalCount } = await fetchBldrgstWithPlatGb(sigunguCd, bjdongCd, platGbCd, bun, ji)
    if (totalCount > 0) return item
    if (platGbCd !== '2') await sleep(100)
  }
  return null
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!BLDRGST_API_KEY) {
    console.error('BLDRGST_API_KEY 환경 변수가 없습니다.')
    process.exit(1)
  }

  const { count, error: countError } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .eq('bldrgst_enriched', false)
    .not('bd_mgt_sn', 'is', null)

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

  let named     = 0
  let dated     = 0
  let notFound  = 0
  let processed = 0

  while (true) {
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('id, name, bd_mgt_sn')
      .eq('bldrgst_enriched', false)
      .not('bd_mgt_sn', 'is', null)
      .limit(BATCH_SIZE)

    if (error) {
      console.error('Supabase fetch 오류:', error.message)
      process.exit(1)
    }
    if (buildings.length === 0) break

    for (const building of buildings) {
      processed++
      const item = await fetchBldrgst(building.bd_mgt_sn!)

      const update: Record<string, unknown> = { bldrgst_enriched: true }

      if (item) {
        // 건물명: 기존 name 이 없을 때만 채움
        if (!building.name && item.bldNm?.trim()) {
          update.name = item.bldNm.trim()
          named++
        }
        if (item.useAprDay?.trim())      { update.use_apr_day      = item.useAprDay.trim();           dated++ }
        if (item.grndFlrCnt)             { update.total_floors     = parseInt(item.grndFlrCnt, 10) }
        if (item.ugrndFlrCnt)            { update.ugrnd_flr_cnt    = parseInt(item.ugrndFlrCnt, 10) }
        if (item.totArea)                { update.tot_area         = parseFloat(item.totArea) }
        if (item.mainPurpsCdNm?.trim())  { update.main_purps_nm    = item.mainPurpsCdNm.trim() }
        if (item.strctCdNm?.trim())      { update.strct_cd_nm      = item.strctCdNm.trim() }
        if (item.hhldCnt)                { update.hhld_cnt         = parseInt(item.hhldCnt, 10) }
        if (item.rideUseElvtCnt) {
          const cnt = parseInt(item.rideUseElvtCnt, 10)
          update.ride_use_elvt_cnt = cnt
          update.has_elevator      = cnt > 0
        }

        const label = update.name ?? building.name ?? building.bd_mgt_sn
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
  console.log(`  날짜 채움    ${dated}건`)
  console.log(`  결과 없음    ${notFound}건`)
}

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})
