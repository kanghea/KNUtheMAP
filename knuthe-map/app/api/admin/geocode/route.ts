import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// GET /api/admin/geocode?q=대구+북구+복현로+123
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: '주소를 입력해주세요' }, { status: 400 })

  const clientId     = process.env.NAVER_MAP_CLIENT_ID
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET
  if (!clientId || !clientSecret)
    return NextResponse.json({ error: 'Naver API 키가 설정되지 않았습니다' }, { status: 500 })

  const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(q)}`
  const res = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY':    clientSecret,
    },
  })

  if (!res.ok) return NextResponse.json({ error: `Naver API 오류 (${res.status})` }, { status: 502 })

  const json = await res.json()

  if (json.status !== 'OK' || !json.addresses?.length)
    return NextResponse.json({ error: '주소를 찾을 수 없어요' }, { status: 404 })

  type NaverAddr = {
    roadAddress: string
    jibunAddress: string
    x: string   // lng
    y: string   // lat
  }

  const addrs = json.addresses as NaverAddr[]
  const top   = addrs[0]

  return NextResponse.json({
    lat:          parseFloat(top.y),
    lng:          parseFloat(top.x),
    roadAddress:  top.roadAddress  || top.jibunAddress,
    jibunAddress: top.jibunAddress || top.roadAddress,
    candidates: addrs.slice(0, 5).map((a) => ({
      label: a.roadAddress || a.jibunAddress,
      lat:   parseFloat(a.y),
      lng:   parseFloat(a.x),
    })),
  })
}
