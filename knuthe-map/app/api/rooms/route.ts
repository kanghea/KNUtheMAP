import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('rooms')
    .select(`
      id, contract_type, deposit, monthly_rent,
      area_m2, floor, room_type, options,
      buildings (
        name, address, lat, lng,
        use_apr_day, main_purps_nm, zone
      )
    `)
    .eq('is_active', true)

  // rooms 테이블 미생성 등 에러 시 빈 GeoJSON 반환 (500 대신)
  if (error) {
    console.warn('[api/rooms]', error.message)
    return NextResponse.json({ type: 'FeatureCollection', features: [] })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features = (data ?? []).flatMap((r: any) => {
    const b = Array.isArray(r.buildings) ? r.buildings[0] : r.buildings
    if (!b?.lat || !b?.lng) return []
    return [{
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [b.lng, b.lat] },
      properties: {
        id:            r.id,
        contract_type: r.contract_type,
        deposit:       r.deposit ?? 0,
        monthly_rent:  r.monthly_rent ?? null,
        area_m2:       r.area_m2 ?? null,
        floor:         r.floor ?? null,
        room_type:     r.room_type ?? '',
        options:       r.options ?? {},
        building_name: b.name ?? '',
        address:       b.address ?? '',
        use_apr_day:   b.use_apr_day ?? '',
        main_purps_nm: b.main_purps_nm ?? '',
        zone:          b.zone ?? '',
      },
    }]
  })

  return NextResponse.json(
    { type: 'FeatureCollection', features },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
  )
}
