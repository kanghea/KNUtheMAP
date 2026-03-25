/**
 * scripts/backfill-names.ts
 *
 * name 이 null 인 buildings 를 Juso 검색 API 로 채웁니다.
 * address 컬럼을 검색 키워드로 사용합니다.
 *
 * 실행 (003 마이그레이션 적용 후):
 *   npm run backfill:names
 *
 * 환경 변수 (.env.local):
 *   JUSO_CONFIRM_KEY=...
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const JUSO_KEY  = process.env.JUSO_CONFIRM_KEY!
const DELAY_MS  = 250  // Juso API 과호출 방지 (E0007)
const BATCH_SIZE = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Juso 검색 API 응답 타입
interface JusoItem {
  bdNm:       string
  roadAddr:   string
  admCd:      string
  rnMgtSn:    string
  udrtYn:     string
  buldMnnm:   string
  buldSlno:   string
}
interface JusoResponse {
  results: {
    common: { totalCount: string; errorCode: string; errorMessage: string }
    juso:   JusoItem[] | null
  }
}

async function searchJuso(keyword: string): Promise<JusoItem | null> {
  const params = new URLSearchParams({
    confmKey:     JUSO_KEY,
    currentPage:  '1',
    countPerPage: '1',
    keyword,
    resultType:   'json',
  })

  const res = await fetch(
    `https://business.juso.go.kr/addrlink/addrLinkApi.do?${params}`,
  )

  if (!res.ok) {
    console.error(`  Juso API 오류 ${res.status}`)
    return null
  }

  const data: JusoResponse = await res.json()
  const { errorCode, errorMessage } = data.results.common

  if (errorCode !== '0') {
    console.error(`  Juso 오류 ${errorCode}: ${errorMessage}`)
    return null
  }

  return data.results.juso?.[0] ?? null
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function main() {
  if (!JUSO_KEY) {
    console.error('JUSO_CONFIRM_KEY 환경 변수가 없습니다.')
    process.exit(1)
  }

  const { count, error: countError } = await supabase
    .from('buildings')
    .select('*', { count: 'exact', head: true })
    .is('name', null)
    .not('address', 'is', null)
    .neq('address', '')

  if (countError) {
    console.error('Supabase count 오류:', countError.message)
    process.exit(1)
  }

  const total = count ?? 0
  console.log(`처리 대상: ${total}개 건물 (name=null, address 있음)\n`)

  if (total === 0) {
    console.log('처리할 건물이 없습니다.')
    return
  }

  let named   = 0   // bdNm 있음 → name 채움
  let unnamed = 0   // bdNm 없음 (일반 건물) → 스킵
  let fail    = 0
  let processed = 0

  while (true) {
    const { data: buildings, error } = await supabase
      .from('buildings')
      .select('id, address')
      .is('name', null)
      .not('address', 'is', null)
      .neq('address', '')
      .limit(BATCH_SIZE)

    if (error) {
      console.error('Supabase fetch 오류:', error.message)
      process.exit(1)
    }

    if (buildings.length === 0) break

    for (const building of buildings) {
      processed++
      const juso = await searchJuso(building.address)

      if (juso?.bdNm) {
        const { error: updateError } = await supabase
          .from('buildings')
          .update({
            name:                juso.bdNm,
            juso_enriched:       true,
            juso_official_name:  juso.roadAddr,
            juso_search_keyword: building.address,
          })
          .eq('id', building.id)

        if (updateError) {
          console.error(`✗ ${building.address} — 업데이트 실패: ${updateError.message}`)
          fail++
        } else {
          console.log(`✓ ${juso.bdNm}  [${processed}/${total}]`)
          named++
        }
      } else {
        // bdNm 없는 일반 건물 — name 을 빈 문자열로 마킹해 무한루프 방지
        await supabase
          .from('buildings')
          .update({ name: '' })
          .eq('id', building.id)
        unnamed++
        process.stdout.write(`\r  이름 없는 건물: ${unnamed}건 스킵  `)
      }

      await sleep(DELAY_MS)
    }
  }

  console.log(`\n\n완료: 이름 채움 ${named}건 / 이름 없음 ${unnamed}건 / 오류 ${fail}건`)
}

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})
