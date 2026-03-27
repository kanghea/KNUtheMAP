/**
 * scripts/collect-area.ts
 *
 * 지정한 바운딩 박스 내 V-world LT_C_SPBD(도로명주소 건물) 전체를 수집해
 * JSON 파일로 저장합니다. DB에는 아무것도 쓰지 않습니다.
 *
 * 실행:
 *   npx tsx scripts/collect-area.ts \
 *     --bbox "minLng,minLat,maxLng,maxLat" \
 *     --out  "scripts/output/tekmon-raw.json"
 *
 * 예시:
 *   npx tsx scripts/collect-area.ts \
 *     --bbox "128.597,35.882,128.616,35.898" \
 *     --out  "scripts/output/tekmon-raw.json"
 */

import fs   from 'fs'
import path from 'path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const VWORLD_KEY = process.env.VWORLD_KEY!
const PAGE_SIZE  = 1000
const DELAY_MS   = 300

// ── CLI 인수 파싱 ─────────────────────────────────────────────
function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

const bboxRaw = arg('bbox')
const outFile = arg('out') ?? 'scripts/output/area-raw.json'

if (!bboxRaw) {
  console.error('사용법: npx tsx scripts/collect-area.ts --bbox "minLng,minLat,maxLng,maxLat" [--out path]')
  console.error('예시:   --bbox "128.597,35.882,128.616,35.898"')
  process.exit(1)
}

const [minLng, minLat, maxLng, maxLat] = bboxRaw.split(',').map(Number)
if ([minLng, minLat, maxLng, maxLat].some(isNaN)) {
  console.error('bbox 좌표가 올바르지 않습니다.')
  process.exit(1)
}

// ── GeoJSON 폴리곤 → 중심 좌표 계산 ─────────────────────────
function centroid(geometry: { type: string; coordinates: unknown }): [number, number] {
  if (geometry.type === 'Point') {
    const c = geometry.coordinates as number[]
    return [c[0], c[1]]
  }
  const ring: number[][] =
    geometry.type === 'Polygon'
      ? (geometry.coordinates as number[][][])[0]
      : (geometry.coordinates as number[][][][])[0][0] // MultiPolygon

  const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length
  const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length
  return [lng, lat]
}

// ── V-world 응답 타입 ─────────────────────────────────────────
interface VworldFeature {
  type: 'Feature'
  geometry: { type: string; coordinates: unknown }
  properties: {
    buld_nm:    string | null
    buld_nm_dc: string | null
    gro_flo_co: string | null
    bd_mgt_sn:  string | null
    ugrnd_flo_co?: string | null
  }
}
interface VworldResponse {
  response: {
    status: string
    result?: {
      featureCollection?: {
        features: VworldFeature[]
      }
    }
    page?: { total: string; current: string; size: string }
    error?: { code: string; text: string }
  }
}

async function fetchPage(page: number): Promise<{ features: VworldFeature[]; total: number; totalPages: number }> {
  const params = new URLSearchParams({
    service:    'data',
    request:    'GetFeature',
    data:       'LT_C_SPBD',
    key:        VWORLD_KEY,
    geomFilter: `BOX(${minLng},${minLat},${maxLng},${maxLat})`,
    size:       String(PAGE_SIZE),
    page:       String(page),
    format:     'json',
    crs:        'EPSG:4326',
    columns:    'buld_nm,buld_nm_dc,gro_flo_co,bd_mgt_sn,ugrnd_flo_co',
    geometry:   'true',
    domain:     '*',
  })

  const res = await fetch(`https://api.vworld.kr/req/data?${params}`)
  if (!res.ok) throw new Error(`V-world HTTP ${res.status}`)

  const data: VworldResponse = await res.json()
  if (data.response.status === 'NOT_FOUND') return { features: [], total: 0, totalPages: 0 }
  if (data.response.status !== 'OK') {
    throw new Error(`V-world 오류: ${data.response.error?.text ?? data.response.status}`)
  }

  const features   = data.response.result?.featureCollection?.features ?? []
  // V-world page.total = 전체 페이지 수 (features 수가 아님)
  const totalPages = parseInt(data.response.page?.total ?? '1', 10)
  return { features, total: features.length, totalPages }
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)) }

// ── 수집된 건물 레코드 타입 ───────────────────────────────────
export interface CollectedBuilding {
  bd_mgt_sn:    string
  lng:          number
  lat:          number
  name:         string | null
  total_floors: number | null
  ugrnd_floors: number | null
}

async function main() {
  if (!VWORLD_KEY) { console.error('VWORLD_KEY 없음'); process.exit(1) }

  console.log(`수집 구역: BBOX(${minLng}, ${minLat}, ${maxLng}, ${maxLat})`)
  console.log(`출력 파일: ${outFile}\n`)

  // 1페이지로 전체 페이지 수 파악
  process.stdout.write('페이지 1 조회 중...')
  const firstPage = await fetchPage(1)
  const totalPages = firstPage.totalPages
  console.log(` 총 ${totalPages}페이지`)

  const allFeatures: VworldFeature[] = [...firstPage.features]

  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_MS)
    process.stdout.write(`\r페이지 ${p}/${totalPages} 조회 중...`)
    const { features } = await fetchPage(p)
    allFeatures.push(...features)
  }
  console.log('\n')

  // bd_mgt_sn 없는 건물 제거, 중복 제거
  const seen = new Set<string>()
  const buildings: CollectedBuilding[] = []

  for (const f of allFeatures) {
    const sn = f.properties.bd_mgt_sn?.trim()
    if (!sn || seen.has(sn)) continue
    seen.add(sn)

    const [lng, lat] = centroid(f.geometry)

    const buld_nm = f.properties.buld_nm?.trim() || null
    const buld_nm_dc = f.properties.buld_nm_dc?.trim() || null
    const name = buld_nm
      ? (buld_nm_dc ? `${buld_nm} ${buld_nm_dc}` : buld_nm)
      : null

    buildings.push({
      bd_mgt_sn:    sn,
      lng:          Math.round(lng * 1e7) / 1e7,
      lat:          Math.round(lat * 1e7) / 1e7,
      name,
      total_floors: f.properties.gro_flo_co   ? parseInt(f.properties.gro_flo_co, 10)   : null,
      ugrnd_floors: f.properties.ugrnd_flo_co ? parseInt(f.properties.ugrnd_flo_co, 10) : null,
    })
  }

  // 출력 디렉토리 생성
  const dir = path.dirname(path.resolve(outFile))
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const output = {
    meta: {
      bbox:         [minLng, minLat, maxLng, maxLat],
      collected_at: new Date().toISOString(),
      total_raw:    allFeatures.length,
      total_deduped: buildings.length,
    },
    buildings,
  }

  fs.writeFileSync(path.resolve(outFile), JSON.stringify(output, null, 2), 'utf-8')

  console.log(`완료:`)
  console.log(`  수집 (raw)    ${allFeatures.length}개`)
  console.log(`  중복 제거 후  ${buildings.length}개`)
  console.log(`  저장 위치     ${outFile}`)
}

main().catch((e) => { console.error('\n✗', e.message); process.exit(1) })
