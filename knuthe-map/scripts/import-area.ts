/**
 * scripts/import-area.ts
 *
 * diff-area.ts 결과의 "new" 항목만 DB에 삽입합니다.
 * --conflicts 플래그를 주면 충돌 항목도 함께 삽입합니다 (주의).
 *
 * 실행:
 *   npx tsx scripts/import-area.ts \
 *     --in "scripts/output/tekmon-diff.json"
 *
 *   # 충돌 항목까지 강제 삽입:
 *   npx tsx scripts/import-area.ts \
 *     --in "scripts/output/tekmon-diff.json" --conflicts
 */

import fs   from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { CollectedBuilding } from './collect-area.ts'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`)

const inFile       = arg('in')
const withConflicts = hasFlag('conflicts')

if (!inFile) {
  console.error('사용법: npx tsx scripts/import-area.ts --in <diff.json> [--conflicts]')
  process.exit(1)
}

const CHUNK = 100

async function main() {
  const diff = JSON.parse(fs.readFileSync(path.resolve(inFile!), 'utf-8'))

  const toInsert: CollectedBuilding[] = [...diff.new]
  if (withConflicts && diff.conflicts.length > 0) {
    console.warn(`⚠  충돌 항목 ${diff.conflicts.length}개도 삽입합니다 (--conflicts 플래그)`)
    toInsert.push(...diff.conflicts)
  }

  console.log(`삽입 대상: ${toInsert.length}개`)
  if (diff.meta.conflict_count > 0 && !withConflicts) {
    console.log(`  (충돌 ${diff.meta.conflict_count}개는 --conflicts 없이 건너뜁니다)`)
  }
  if (toInsert.length === 0) { console.log('삽입할 항목이 없습니다.'); return }

  let inserted = 0
  let failed   = 0

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)

    const rows = chunk.map((b) => ({
      bd_mgt_sn:       b.bd_mgt_sn,
      lat:             b.lat,
      lng:             b.lng,
      name:            b.name ?? null,
      total_floors:    b.total_floors ?? null,
      ugrnd_flr_cnt:   b.ugrnd_floors ?? null,
      // 백필 플래그: V-world 좌표/이름/층수는 수집 완료, 나머지는 별도 스크립트로
      vworld_enriched:  true,
      bldrgst_enriched: false,
      // 아직 주소 없음 → backfill-addresses.ts 대상
    }))

    const { error } = await supabase.from('buildings').insert(rows)

    if (error) {
      console.error(`\n  청크 오류 (${i}~${i + chunk.length}): ${error.message}`)
      failed += chunk.length
    } else {
      inserted += chunk.length
    }

    process.stdout.write(`\r삽입 중... ${Math.min(i + CHUNK, toInsert.length)}/${toInsert.length}`)
  }

  console.log(`\n\n완료:`)
  console.log(`  성공  ${inserted}개`)
  if (failed > 0) console.log(`  실패  ${failed}개`)
  console.log()
  console.log('다음 단계:')
  console.log('  npm run backfill:addresses  ← 주소 채우기')
  console.log('  npm run backfill:bldrgst    ← 건축물대장 상세 채우기')
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
