# KNUtheMAP API 가이드

이 프로젝트에서 사용하는 외부 API 목록과 사용법 정리.

---

## 1. Supabase

| 항목 | 내용 |
|------|------|
| 용도 | PostgreSQL 데이터베이스, 인증, RLS |
| Docs | https://supabase.com/docs |
| 환경변수 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

**클라이언트 생성:**
```ts
// 클라이언트 (RLS 적용)
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey)

// 서버 / 스크립트 (RLS 우회)
const supabase = createClient(url, serviceRoleKey)
```

**주의사항:**
- 스크립트에서는 반드시 `SUPABASE_SERVICE_ROLE_KEY` 사용 (RLS 우회 필요)
- `serviceRoleKey`는 절대 클라이언트에 노출 금지

---

## 2. Mapbox GL JS

| 항목 | 내용 |
|------|------|
| 용도 | 지도 렌더링, 3D 레이어 |
| Docs | https://docs.mapbox.com/mapbox-gl-js/api/ |
| 환경변수 | `NEXT_PUBLIC_MAPBOX_TOKEN` |
| 버전 | `mapbox-gl@3.x` |

**기본 사용:**
```ts
import mapboxgl from 'mapbox-gl'
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
const map = new mapboxgl.Map({ container, style, center, zoom })
```

**3D 커스텀 레이어 (Three.js):**
- `map.addLayer({ type: 'custom', id, render(_, matrix) {...} })`
- `camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix)`
- 좌표 변환: `MercatorCoordinate.fromLngLat(lngLat, altitude)`
- 스케일: `mercatorCoord.meterInMercatorCoordinateUnits()`

---

## 3. Naver Maps API — 좌표→주소 (역지오코딩)

| 항목 | 내용 |
|------|------|
| 용도 | 위경도 → 도로명주소 변환 |
| Endpoint | `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc` |
| 환경변수 | `NAVER_MAP_CLIENT_ID`, `NAVER_MAP_CLIENT_SECRET` |

**요청:**
```ts
const url = `https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&output=json&orders=roadaddr`
const res = await fetch(url, {
  headers: {
    'X-NCP-APIGW-API-KEY-ID': clientId,
    'X-NCP-APIGW-API-KEY':    clientSecret,
  }
})
```

**응답 파싱:**
```ts
const result = data.results?.[0]
const area1  = result?.region?.area1?.name   // 시/도
const area2  = result?.region?.area2?.name   // 시/군/구
const road   = result?.land?.name            // 도로명
const number = result?.land?.number1         // 번지
```

**주의사항:**
- `orders=roadaddr` 로 도로명 우선 요청
- 결과 없을 때 빈 문자열(`''`)로 마킹해서 무한루프 방지

---

## 4. V-world API — 도로명주소 건물 정보

| 항목 | 내용 |
|------|------|
| 용도 | 위경도 → 건물명(buld_nm), 층수(gro_flo_co), 건물관리번호(bd_mgt_sn) |
| Endpoint | `https://api.vworld.kr/req/data` |
| 데이터셋 | `LT_C_SPBD` (도로명주소 건물) |
| 환경변수 | `VWORLD_KEY` |

**요청:**
```ts
const params = new URLSearchParams({
  service:    'data',
  request:    'GetFeature',
  data:       'LT_C_SPBD',
  key:        VWORLD_KEY,
  geomFilter: `POINT(${lng} ${lat})`,  // 주의: lng 먼저
  buffer:     '10',                     // 10m 반경
  size:       '1',
  format:     'json',
  crs:        'EPSG:4326',
  columns:    'buld_nm,buld_nm_dc,gro_flo_co,bd_mgt_sn',
  geometry:   'false',
  domain:     '*',                      // 필수: 없으면 INCORRECT_KEY 오류
})
```

**응답 파싱:**
```ts
const feature = data.response.result?.featureCollection?.features?.[0]
const props   = feature?.properties
// props.buld_nm, props.buld_nm_dc, props.gro_flo_co, props.bd_mgt_sn
```

**건물명 조합:**
```ts
const name = props.buld_nm
  ? props.buld_nm_dc
    ? `${props.buld_nm} ${props.buld_nm_dc}`
    : props.buld_nm
  : null
```

**주의사항:**
- `domain: '*'` 없으면 `INCORRECT_KEY` 오류 발생
- `geomFilter`는 `POINT(경도 위도)` 순서 (WGS84)
- 아파트/학교 등 공식 명칭 있는 건물만 `buld_nm` 반환; 일반 빌라는 null

---

## 5. 건축물대장 정보서비스 (공공데이터포털)

| 항목 | 내용 |
|------|------|
| 용도 | 건물명(bldNm), 사용승인일(useAprDay), 층수, 면적, 세대수, 승강기 등 공식 건축물 정보 |
| Endpoint | `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo` |
| 환경변수 | `BLDRGST_API_KEY` (URL-encoded 키 그대로 저장) |
| 신청 | https://www.data.go.kr → 건축물대장 정보서비스 → 활용신청 |

**bd_mgt_sn(건물관리번호) 파싱:**
```ts
function parseBdMgtSn(bdMgtSn: string) {
  return {
    sigunguCd: bdMgtSn.slice(0, 5),   // 시군구코드
    bjdongCd:  bdMgtSn.slice(5, 10),  // 법정동코드
    platGbCd:  bdMgtSn.slice(10, 11), // 대지구분 (0:대지, 1:산, 2:블록)
    bun:       bdMgtSn.slice(11, 15), // 번
    ji:        bdMgtSn.slice(15, 19), // 지
  }
}
```

**요청 (serviceKey 이중인코딩 방지):**
```ts
// BLDRGST_API_KEY는 이미 URL-encoded 상태로 저장 → 문자열 직접 삽입
const { sigunguCd, bjdongCd, platGbCd, bun, ji } = parseBdMgtSn(bdMgtSn)
const params = `serviceKey=${BLDRGST_API_KEY}&sigunguCd=${sigunguCd}&bjdongCd=${bjdongCd}&platGbCd=${platGbCd}&bun=${bun}&ji=${ji}&numOfRows=1&pageNo=1&_type=json`
const url = `https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo?${params}`
```

**주요 응답 필드:**
```ts
interface BldrgstItem {
  bldNm:          string  // 건물명 (빌라 포함 공식 명칭)
  useAprDay:      string  // 사용승인일 YYYYMMDD
  grndFlrCnt:     string  // 지상층수
  ugrndFlrCnt:    string  // 지하층수
  totArea:        string  // 연면적 (㎡)
  mainPurpsCdNm:  string  // 주용도명 (예: 공동주택, 제1종근린생활시설)
  strctCdNm:      string  // 구조명 (예: 철근콘크리트구조)
  hhldCnt:        string  // 세대수
  rideUseElvtCnt: string  // 승용승강기수
}
```

**platGbCd 주의사항:**

V-world `bd_mgt_sn`의 position 10은 건축물대장 API `platGbCd`와 일치하지 않는 경우가 있음.
→ platGbCd=`0`(대지)로 먼저 시도하고, 결과 없으면 `1`(산), `2`(블록) 순서로 재시도:
```ts
for (const platGbCd of ['0', '1', '2']) {
  const result = await callApi({ ...params, platGbCd })
  if (result.totalCount > 0) return result.item
}
```

**bldNm 특성:**
- 공동주택(아파트, 빌라, 연립)은 `bldNm`에 이름 포함 (예: "한사랑빌라")
- 단독주택, 근린생활시설 등은 `bldNm`이 공백(`" "`)으로 반환됨 → `trim()` 후 falsy 처리

**기타 주의사항:**
- `serviceKey`를 `URLSearchParams`에 넣으면 이중인코딩 → 반드시 문자열로 URL에 직접 삽입
- 활용신청 후 승인(즉시~수 시간) 필요; 미승인 시 401 Unauthorized
- `totalCount=0`이면 해당 번지에 건축물대장 없음 (미등록 또는 파라미터 오류)

---

## 6. Juso 주소정보 API (현재 미사용)

| 항목 | 내용 |
|------|------|
| 용도 | 키워드 → 도로명주소, 건물명 검색 |
| Endpoint | `https://business.juso.go.kr/addrlink/addrLinkApi.do` |
| 환경변수 | `JUSO_CONFIRM_KEY` |

**주의사항:**
- 검색용 확인키와 좌표제공용 확인키가 별도 발급; 혼용 시 E0001 오류
- 현재 보유 키(`JUSO_CONFIRM_KEY`)는 좌표제공용으로 검색 API에서 사용 불가
- 필요 시 [주소정보 누리집](https://www.juso.go.kr)에서 검색용 키 별도 신청

---

## 배치 처리 패턴

스크립트에서 대량 건물 처리 시 공통 패턴:

```ts
// ❌ 잘못된 방식: range(offset, ...) — 업데이트 후 인덱스가 밀림
// ✅ 올바른 방식: while(true) + limit
while (true) {
  const { data } = await supabase
    .from('buildings')
    .select(...)
    .eq('enriched_flag', false)   // 미처리 건만 조회
    .limit(BATCH_SIZE)

  if (data.length === 0) break

  for (const row of data) {
    // ... API 호출 ...
    await supabase.from('buildings').update({ enriched_flag: true, ...fields }).eq('id', row.id)
    await sleep(DELAY_MS)
  }
}
```

`enriched_flag`를 처리 여부 마커로 사용하면 스크립트 중단 후 재개 가능.
