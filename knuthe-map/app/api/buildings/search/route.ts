import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 1) return NextResponse.json([])

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('buildings')
    .select('id, name, address, lat, lng, main_purps_nm')
    .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
    .eq('is_active', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(8)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
