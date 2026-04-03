import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase
    .from('map_layers')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mapbox GeoJSON FeatureCollection 형태로 변환
  const geojson = {
    type: 'FeatureCollection',
    features: data.map((layer) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [layer.lng, layer.lat],
      },
      properties: {
        id: layer.id,
        name: layer.name,
        layer_type: layer.layer_type,
        description: layer.description,
      },
    })),
  }

  return NextResponse.json(geojson)
}
