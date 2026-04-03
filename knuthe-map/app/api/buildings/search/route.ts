import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

/**
 * PostgREST 필터 특수문자를 이스케이프합니다.
 * 콤마(,)와 마침표(.)는 PostgREST에서 필터 구분자/연산자로 해석되므로,
 * 사용자 입력이 필터 로직을 변조하지 못하도록 제거합니다.
 */
function sanitizeSearchQuery(input: string): string {
  // PostgREST 필터에서 의미를 가지는 특수문자 제거: , . ( ) \ *
  return input.replace(/[,.()*\\]/g, '')
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('q')?.trim()
  if (!raw || raw.length < 1) return NextResponse.json([])

  const q = sanitizeSearchQuery(raw)
  if (!q) return NextResponse.json([])

  const supabase = await createSupabaseServer()
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
