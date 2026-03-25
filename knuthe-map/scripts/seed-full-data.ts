/**
 * scripts/seed-full-data.ts
 *
 * lib/full_data.json → Supabase 전체 삽입
 *   - gates / streetlights → map_layers
 *   - zones               → zones
 *   - buildings           → buildings
 *
 * 실행:
 *   npm run seed
 *
 * 중복 실행 안전: upsert (osm_id / name+lat+lng 기준)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import data from '../lib/full_data.json'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── 헬퍼
function buildAddress(b: {
  address?: string | null
  addr_city?: string | null
  addr_district?: string | null
  addr_street?: string | null
  addr_housenumber?: string | null
}): string | null {
  if (b.address) return b.address
  const parts = [b.addr_city, b.addr_district, b.addr_street, b.addr_housenumber]
    .filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

async function upsertMapLayers(
  rows: typeof data.gates | typeof data.streetlights,
) {
  // map_layers 에는 unique constraint 가 없으므로
  // 같은 name+layer_type 이 이미 있으면 skip, 없으면 insert
  const { data: existing } = await supabase
    .from('map_layers')
    .select('name, layer_type')

  const existingSet = new Set(
    (existing ?? []).map((r: { name: string; layer_type: string }) => `${r.name}|${r.layer_type}`),
  )

  const toInsert = rows
    .filter((r) => !existingSet.has(`${r.name}|${r.layer_type}`))
    .map((r) => ({
      name:        r.name,
      layer_type:  r.layer_type,
      lat:         r.lat,
      lng:         r.lng,
      zone:        (r as { zone?: string | null }).zone ?? null,
      icon:        (r as { icon?: string | null }).icon ?? null,
      description: r.description ?? null,
      is_active:   r.is_active,
    }))

  if (toInsert.length === 0) {
    console.log('  → 이미 모두 존재, 스킵')
    return
  }

  const { error } = await supabase.from('map_layers').insert(toInsert)
  if (error) throw new Error(`map_layers insert 실패: ${error.message}`)
  console.log(`  → ${toInsert.length}건 삽입`)
}

async function seedZones() {
  console.log('\n[zones]')

  const { data: existing } = await supabase.from('zones').select('osm_id')
  const existingSet = new Set((existing ?? []).map((r: { osm_id: string }) => r.osm_id))

  const toInsert = data.zones
    .filter((z) => !existingSet.has(z.osm_id))
    .map((z) => ({
      osm_id:     z.osm_id,
      name:       z.name,
      layer_type: z.layer_type,
      lat:        z.lat,
      lng:        z.lng,
      footprint:  z.footprint,
      is_active:  z.is_active,
    }))

  if (toInsert.length === 0) {
    console.log('  → 이미 모두 존재, 스킵')
    return
  }

  const { error } = await supabase.from('zones').insert(toInsert)
  if (error) throw new Error(`zones insert 실패: ${error.message}`)
  console.log(`  → ${toInsert.length}건 삽입`)
}

async function seedBuildings() {
  console.log('\n[buildings]')

  const CHUNK = 200  // Supabase insert 한 번에 보낼 행 수

  const rows = data.buildings.map((b) => ({
    osm_id:              b.osm_id,
    name:                b.name ?? null,
    lat:                 b.lat,
    lng:                 b.lng,
    zone:                b.zone ?? null,
    address:             buildAddress(b),
    footprint:           b.footprint ?? null,
    total_floors:        b.building_levels ?? null,
    height_m:            b.height_m ?? null,
    building_type:       b.building_type ?? null,
    amenity:             b.amenity ?? null,
    shop:                b.shop ?? null,
    office:              b.office ?? null,
    religion:            b.religion ?? null,
    juso_search_keyword: b.juso_search_keyword ?? null,
    juso_enriched:       b.juso_enriched ?? false,
    juso_official_name:  b.juso_official_name ?? null,
    juso_official_lat:   b.juso_official_lat ?? null,
    juso_official_lng:   b.juso_official_lng ?? null,
    is_active:           true,
  }))

  // 이미 존재하는 osm_id 목록 수집
  const { data: existing } = await supabase.from('buildings').select('osm_id')
  const existingSet = new Set((existing ?? []).map((r: { osm_id: string | null }) => r.osm_id))

  const toInsert = rows.filter((r) => !existingSet.has(r.osm_id))
  if (toInsert.length === 0) {
    console.log('  → 이미 모두 존재, 스킵')
    return
  }

  let inserted = 0
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK)

    const { error } = await supabase.from('buildings').insert(chunk)

    if (error) throw new Error(`buildings insert 실패 (offset ${i}): ${error.message}`)
    inserted += chunk.length
    process.stdout.write(`\r  → ${inserted} / ${toInsert.length}건`)
  }
  console.log()
}

async function main() {
  console.log('[gates]')
  await upsertMapLayers(data.gates)

  console.log('\n[streetlights]')
  await upsertMapLayers(data.streetlights)

  await seedZones()
  await seedBuildings()

  console.log('\n✓ seed 완료')
}

main().catch((e) => {
  console.error('\n✗', e.message)
  process.exit(1)
})
