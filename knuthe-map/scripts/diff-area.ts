/**
 * scripts/diff-area.ts
 *
 * collect-area.ts 로 수집한 JSON과 기존 DB를 비교해
 * 신규 / 기존 존재 / 충돌(bd_mgt_sn 같지만 좌표 차이 큼) 로 분류합니다.
 * DB에는 아무것도 쓰지 않습니다.
 *
 * 실행:
 *   npx tsx scripts/diff-area.ts \
 *     --in  "scripts/output/tekmon-raw.json" \
 *     --out "scripts/output/tekmon-diff.json"
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

const inFile  = arg('in')
const outFile = arg('out') ?? 'scripts/output/area-diff.json'

if (!inFile) {
  console.error('사용법: npx tsx scripts/diff-area.ts --in <raw.json> [--out <diff.json>]')
  process.exit(1)
}

// 두 좌표 사이 거리 (미터, 근사값)
function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// 충돌 기준: 같은 bd_mgt_sn인데 좌표 차이가 50m 이상
const CONFLICT_THRESHOLD_M = 50

type DiffBuilding = CollectedBuilding & {
  conflict_reason?: string
  db_lat?: number
  db_lng?: number
  db_name?: string | null
  distance_m?: number
}

async function main() {
  // ── 수집 JSON 로드 ─────────────────────────────────────────
  const raw = JSON.parse(fs.readFileSync(path.resolve(inFile!), 'utf-8'))
  const collected: CollectedBuilding[] = raw.buildings
  console.log(`수집 건물: ${collected.length}개`)

  // ── DB 기존 데이터 로드 (bd_mgt_sn 있는 건물 전체) ─────────
  process.stdout.write('DB에서 기존 건물 로드 중...')
  const dbMap = new Map<string, { id: string; lat: number; lng: number; name: string | null }>()
  let page = 0
  const PAGE = 1000

  for (;;) {
    const { data, error } = await supabase
      .from('buildings')
      .select('id, bd_mgt_sn, lat, lng, name')
      .not('bd_mgt_sn', 'is', null)
      .range(page * PAGE, (page + 1) * PAGE - 1)

    if (error) { console.error('\nDB 오류:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    for (const row of data) {
      if (row.bd_mgt_sn) dbMap.set(row.bd_mgt_sn, { id: row.id, lat: row.lat, lng: row.lng, name: row.name })
    }
    if (data.length < PAGE) break
    page++
  }
  console.log(` ${dbMap.size}개 로드 완료\n`)

  // ── 분류 ──────────────────────────────────────────────────
  const results = {
    new:       [] as DiffBuilding[],
    existing:  [] as DiffBuilding[],
    conflicts: [] as DiffBuilding[],
  }

  for (const b of collected) {
    const dbRow = dbMap.get(b.bd_mgt_sn)

    if (!dbRow) {
      // 완전 신규
      results.new.push(b)
      continue
    }

    // 이미 존재 — 좌표 차이 확인
    const dist = distanceM(b.lat, b.lng, dbRow.lat, dbRow.lng)

    if (dist > CONFLICT_THRESHOLD_M) {
      results.conflicts.push({
        ...b,
        conflict_reason: `좌표 차이 ${Math.round(dist)}m (DB: ${dbRow.lat},${dbRow.lng})`,
        db_lat:  dbRow.lat,
        db_lng:  dbRow.lng,
        db_name: dbRow.name,
        distance_m: Math.round(dist),
      })
    } else {
      results.existing.push({
        ...b,
        db_lat:  dbRow.lat,
        db_lng:  dbRow.lng,
        db_name: dbRow.name,
        distance_m: Math.round(dist),
      })
    }
  }

  // ── 저장 ──────────────────────────────────────────────────
  const dir = path.dirname(path.resolve(outFile))
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const output = {
    meta: {
      source_file:      inFile,
      compared_at:      new Date().toISOString(),
      total_collected:  collected.length,
      new_count:        results.new.length,
      existing_count:   results.existing.length,
      conflict_count:   results.conflicts.length,
      conflict_threshold_m: CONFLICT_THRESHOLD_M,
    },
    new:       results.new,
    existing:  results.existing,
    conflicts: results.conflicts,
  }

  fs.writeFileSync(path.resolve(outFile), JSON.stringify(output, null, 2), 'utf-8')

  console.log('분류 결과:')
  console.log(`  신규       ${results.new.length}개  ← import-area.ts 로 추가 가능`)
  console.log(`  이미 존재  ${results.existing.length}개  ← 건너뜀`)
  console.log(`  충돌       ${results.conflicts.length}개  ← 수동 확인 필요`)
  if (results.conflicts.length > 0) {
    console.log('\n충돌 목록:')
    results.conflicts.forEach((c) =>
      console.log(`  ${c.bd_mgt_sn}  ${c.conflict_reason}`)
    )
  }
  console.log(`\n저장: ${outFile}`)
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
