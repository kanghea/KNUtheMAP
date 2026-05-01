/**
 * 좌표 → 도로명주소 (네이버 역지오코딩)
 *
 * `docs/api-guide.md` §3 의 API 패턴을 그대로 따른다.
 * 호출 실패·결과 없음·키 미설정 등 모든 케이스에 `null` 반환 — 호출자는
 * 폴백을 자유롭게 결정할 수 있다.
 */

const ENDPOINT = 'https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc'

interface NaverReverseGeocodeResponse {
  results?: Array<{
    region?: {
      area1?: { name?: string }
      area2?: { name?: string }
      area3?: { name?: string }
    }
    land?: {
      name?:    string  // 도로명
      number1?: string  // 본번
      number2?: string  // 부번
      addition0?: { value?: string }
    }
  }>
}

/**
 * 위·경도 한 쌍에서 짧은 도로명주소 문자열을 만든다.
 *
 * 예: "북구 복현로 12" — 시 단위는 너무 무거우므로 제외, 시군구 + 도로명 + 번지만.
 *
 * @returns 변환 성공 시 주소 문자열, 그 외 `null`
 */
export async function reverseGeocodeToRoadAddress(
  lat: number, lng: number,
): Promise<string | null> {
  const clientId     = process.env.NAVER_MAP_CLIENT_ID
  const clientSecret = process.env.NAVER_MAP_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  try {
    const url = `${ENDPOINT}?coords=${lng},${lat}&output=json&orders=roadaddr`
    const res = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY':    clientSecret,
      },
      // 약간 짧은 timeout — 사용자 업로드 흐름을 막지 않도록.
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null

    const data    = (await res.json()) as NaverReverseGeocodeResponse
    const result  = data.results?.[0]
    if (!result) return null

    const area2  = result.region?.area2?.name?.trim() || ''   // 시군구
    const road   = result.land?.name?.trim()           || ''   // 도로명
    const num1   = result.land?.number1?.trim()        || ''
    const num2   = result.land?.number2?.trim()        || ''

    const numPart = num2 ? `${num1}-${num2}` : num1
    const parts   = [area2, road, numPart].filter(Boolean)
    if (parts.length === 0) return null
    return parts.join(' ')
  } catch {
    return null
  }
}
