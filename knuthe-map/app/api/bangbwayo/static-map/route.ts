/**
 * GET /api/bangbwayo/static-map?lat=..&lng=..&w=..&h=..&level=..
 *
 * 주소 확인 단계의 위성 미리보기 — Naver Cloud Static Map API 를 서버에서
 * 프록시한다. 인증 헤더(`X-NCP-APIGW-API-KEY-ID/KEY`)가 필요한 API 라
 * 클라이언트가 직접 부를 수 없어 이 라우트가 키를 붙여 호출 후 PNG 만 흘려준다.
 *
 * 동일 좌표·사이즈·레벨이면 항상 같은 이미지 → `Cache-Control: immutable` 로
 * 브라우저가 영구 캐시. 같은 트랙 페이지를 다시 열어도 Naver 호출 없음.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/auth-guard'

const NAVER_BASE = 'https://naveropenapi.apigw.ntruss.com/map-static/v2/raster'

// Naver Static Map 한도. 실제로 이보다 큰 값을 보내도 잘림 정도이지만 미리 차단.
const MAX_W = 1024
const MAX_H = 1024

function clampInt(raw: string | null, fallback: number, min: number, max: number): number {
  const n = raw !== null ? Number(raw) : fallback
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const guard = await requireAuth(supabase)
  if (!guard.ok) return guard.response

  const sp = req.nextUrl.searchParams
  const lat = Number(sp.get('lat'))
  const lng = Number(sp.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return NextResponse.json({ error: 'lat, lng 필수' }, { status: 400 })
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180)
    return NextResponse.json({ error: 'lat/lng 범위 밖' }, { status: 400 })

  const w     = clampInt(sp.get('w'),     600, 1, MAX_W)
  const h     = clampInt(sp.get('h'),     280, 1, MAX_H)
  const level = clampInt(sp.get('level'), 17,  0, 20)

  const clientId     = process.env.NAVER_MAP_CLIENT_ID
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET
  if (!clientId || !clientSecret)
    return NextResponse.json({ error: 'Naver Maps 키 미설정' }, { status: 500 })

  // markers 값 안의 `|`·공백·`:` 가 안전하게 전달되도록 통째로 인코딩.
  const markers = encodeURIComponent(`type:d|size:mid|pos:${lng} ${lat}`)
  const url =
    `${NAVER_BASE}` +
    `?w=${w}&h=${h}&scale=2` +
    `&center=${lng},${lat}` +
    `&level=${level}` +
    `&maptype=satellite` +
    `&markers=${markers}` +
    `&format=png` +
    `&lang=ko`

  const upstream = await fetch(url, {
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY':    clientSecret,
    },
    cache: 'no-store',
  })
  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Naver Static Map ${upstream.status}` },
      { status: 502 },
    )
  }

  const body = await upstream.arrayBuffer()
  return new NextResponse(Buffer.from(body), {
    status: 200,
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
