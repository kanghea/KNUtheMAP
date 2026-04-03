import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()

  // Supabase PostgREST max_rows=1000 이므로 페이지네이션으로 전체 조회
  const PAGE = 1000
  type Row = { id: string; name: string | null; address: string | null; lat: number; lng: number; total_floors: number | null; main_purps_nm: string | null; has_elevator: boolean | null; hhld_cnt: number | null; use_apr_day: string | null }
  const all: Row[] = []
  let page = 0

  for (;;) {
    const { data, error } = await supabase
      .from('buildings')
      .select('id, name, address, lat, lng, total_floors, main_purps_nm, has_elevator, hhld_cnt, use_apr_day')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .range(page * PAGE, (page + 1) * PAGE - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) break
    all.push(...(data as Row[]))
    if (data.length < PAGE) break
    page++
  }

  const geojson = {
    type: 'FeatureCollection',
    features: all.map((b) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [b.lng, b.lat],
      },
      properties: {
        id:            b.id,
        name:          b.name ?? '',
        address:       b.address ?? '',
        total_floors:  b.total_floors ?? 0,
        main_purps_nm: b.main_purps_nm ?? '',
        has_elevator:  b.has_elevator ?? false,
        hhld_cnt:      b.hhld_cnt ?? 0,
        use_apr_day:   b.use_apr_day ?? '',
      },
    })),
  }

  return NextResponse.json(geojson, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
