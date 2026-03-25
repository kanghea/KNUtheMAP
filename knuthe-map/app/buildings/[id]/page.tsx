import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { MAPBOX_TOKEN } from '@/lib/mapbox'
import TransactionTabs from './_components/TransactionTabs'
import InfoExpand from './_components/InfoExpand'
import NaverRoadView from './_components/NaverRoadView'
import AgeDistribution from './_components/AgeDistribution'

// ── 유틸 ──────────────────────────────────────────────────────

function shortAddress(addr: string | null): string {
  if (!addr) return '주소 없음'
  const parts = addr.trim().split(' ')
  return parts.length >= 2 ? parts.slice(-2).join(' ') : addr
}

/** Haversine 거리 (미터) */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDist(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

/** 건물 연식 (년 수) */
function buildingAge(useAprDay: string | null): number | null {
  if (!useAprDay || useAprDay.length < 8) return null
  const y = parseInt(useAprDay.slice(0, 4))
  const m = parseInt(useAprDay.slice(4, 6)) - 1
  const d = parseInt(useAprDay.slice(6, 8))
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  const built = new Date(y, m, d)
  return Math.floor((Date.now() - built.getTime()) / (365.25 * 24 * 3600 * 1000))
}

// ── 아이콘 ────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const BookmarkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
  </svg>
)

const StarIcon = ({ fill = '#f59e0b', size = 13 }: { fill?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const HouseIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
      fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="9 22 9 12 15 12 15 22"
      stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RATING_CATS = ['건물/단지', '집 내부', '주변환경', '교통편의']

// ── 페이지 ────────────────────────────────────────────────────

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }    = await params
  const supabase  = createServiceClient()

  const { data: b, error } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !b) notFound()

  // ── 주변 건물 (±0.005° ≈ 500m, 거리순)
  const DELTA = 0.005
  const { data: nearbyRaw } = await supabase
    .from('buildings')
    .select('id, name, address, lat, lng, main_purps_nm')
    .neq('id', id)
    .gte('lat', b.lat - DELTA).lte('lat', b.lat + DELTA)
    .gte('lng', b.lng - DELTA).lte('lng', b.lng + DELTA)
    .limit(30)

  const nearby = (nearbyRaw ?? [])
    .map((n) => ({ ...n, distM: haversineM(b.lat, b.lng, n.lat, n.lng) }))
    .sort((a, z) => a.distM - z.distM)
    .slice(0, 6)

  // ── 같은 구역 건물 연식 (정규분포용)
  const currentAge = buildingAge(b.use_apr_day)
  let zoneAges: number[] = []

  if (b.zone && currentAge != null) {
    const { data: zoneBuildings } = await supabase
      .from('buildings')
      .select('use_apr_day')
      .eq('zone', b.zone)
      .not('use_apr_day', 'is', null)
      .neq('use_apr_day', '')

    zoneAges = (zoneBuildings ?? [])
      .map((zb) => buildingAge(zb.use_apr_day))
      .filter((a): a is number => a !== null && a > 0)
  }

  const title = b.name?.trim() || shortAddress(b.address)

  // Mapbox 위성 이미지 (로드뷰 폴백 + 지도 섹션용)
  const mapboxStaticImg = b.lat && b.lng
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-l-building+2563eb(${b.lng},${b.lat})/` +
      `${b.lng},${b.lat},16,0,0/800x360@2x?access_token=${MAPBOX_TOKEN}`
    : null

  // 위성 (로드뷰 헤더 폴백)
  const satelliteImg = b.lat && b.lng
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
      `pin-l-building+ffffff(${b.lng},${b.lat})/` +
      `${b.lng},${b.lat},17,0,0/800x520@2x?access_token=${MAPBOX_TOKEN}`
    : null

  const naverClientId = process.env.NAVER_MAP_CLIENT_ID ?? ''

  return (
    <div className="min-h-screen bg-white">

      {/* ── 로드뷰 헤더 ───────────────────────────────────────── */}
      <div className="relative" style={{ height: 360 }}>
        {naverClientId && satelliteImg ? (
          <NaverRoadView
            lat={b.lat}
            lng={b.lng}
            clientId={naverClientId}
            fallbackImg={satelliteImg}
          />
        ) : satelliteImg ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={satelliteImg} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200" />
        )}

        {/* 그라데이션 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 55%)' }}
        />

        {/* 네비 버튼 */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-5 flex items-center gap-2">
          <Link
            href="/map"
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 shadow"
          >
            <ChevronLeft />
          </Link>
          <span className="flex-1 text-sm font-semibold text-white drop-shadow truncate">
            {title}
          </span>
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-600 shadow"
          >
            <HomeIcon />
          </Link>
        </div>
      </div>

      {/* ── 본문 ─────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto">

        {/* ── 건물 타이틀 카드 ─────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          {/* 이름 + 평점 */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[1.3rem] font-bold text-gray-900 leading-tight">{title}</h1>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <StarIcon fill="#f59e0b" size={16} />
              <span className="text-base font-bold text-gray-800">–</span>
              <span className="text-sm text-gray-400 underline cursor-pointer">(0개)</span>
            </div>
          </div>

          {/* 주소 배지 */}
          <div className="mt-3 flex flex-col gap-1.5">
            {b.address && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5 shrink-0 leading-none">
                  도로명
                </span>
                <span className="text-sm text-gray-700">{b.address}</span>
              </div>
            )}
            {b.bd_mgt_sn && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 border border-gray-300 rounded px-1.5 py-0.5 shrink-0 leading-none">
                  관리번호
                </span>
                <span className="text-sm text-gray-500 font-mono text-xs">{b.bd_mgt_sn}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 월세 실거래가 ────────────────────────────────────── */}
        <TransactionTabs />

        {/* ── 건물 소개 ─────────────────────────────────────────── */}
        <section className="px-5 pt-7 pb-6 border-b border-gray-100">
          <h2 className="text-[1.15rem] font-bold text-gray-900 mb-4">{title} 소개</h2>

          {/* 지도 (스트리트맵) */}
          {mapboxStaticImg && (
            <div className="rounded-xl overflow-hidden border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapboxStaticImg}
                alt={title}
                className="w-full object-cover"
                style={{ height: 220 }}
              />
            </div>
          )}

          {/* 건물 정보 그리드 */}
          <div className="border border-t-0 border-gray-200 rounded-b-xl px-5 pt-1 pb-3">
            <InfoExpand building={b} />
          </div>
        </section>

        {/* ── 연식 정규분포 ─────────────────────────────────────── */}
        {currentAge != null && zoneAges.length >= 5 && (
          <section className="px-5 pt-6 pb-5 border-b border-gray-100">
            <AgeDistribution
              ages={zoneAges}
              currentAge={currentAge}
              zone={b.zone ?? '해당 구역'}
            />
          </section>
        )}

        {/* ── 리뷰 섹션 ─────────────────────────────────────────── */}
        <section className="px-5 pt-7 pb-6 border-b border-gray-100">
          <h2 className="text-[1.15rem] font-bold text-gray-900 mb-5">
            살아본 사람들의 이야기 👋
          </h2>

          {/* 종합 평점 카드 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="px-5 py-5 flex flex-col items-center justify-center gap-1.5">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  집 종합평점
                  <span className="w-3.5 h-3.5 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center text-[9px] font-bold leading-none">i</span>
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[1.75rem] font-bold text-gray-300 leading-none">–</span>
                  <span className="text-sm text-gray-300">/ 5</span>
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((i) => <StarIcon key={i} fill="#e5e7eb" size={15} />)}
                </div>
              </div>
              <div className="px-5 py-5 flex flex-col justify-center gap-3">
                {RATING_CATS.map((cat) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-[4.5rem] shrink-0">{cat}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
                    <span className="text-xs text-gray-300 w-4 text-right shrink-0">–</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 관심등록 카드 */}
          <div className="border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between mb-7">
            <div>
              <p className="text-sm font-semibold text-gray-800">이 건물에 관심 있으신가요?</p>
              <p className="text-xs text-gray-400 mt-0.5">관심등록 하면 새로운 리뷰를 알려드려요!</p>
            </div>
            <button className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
              <BookmarkIcon />
            </button>
          </div>

          {/* 리뷰 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white bg-emerald-500 rounded-md px-2 py-0.5">건물 리뷰</span>
              <span className="text-sm font-semibold text-gray-800">{title}</span>
            </div>
            <div className="flex items-center gap-1">
              <StarIcon size={13} fill="#f59e0b" />
              <span className="text-sm text-gray-400">리뷰 없음</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 text-center py-8">아직 등록된 리뷰가 없습니다.</p>

          <button
            disabled
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl text-sm
              hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            건물 리뷰 작성하고 모든 리뷰 보기
          </button>
        </section>

        {/* ── 주변 건물 ─────────────────────────────────────────── */}
        {nearby.length > 0 && (
          <section className="px-5 pt-7 pb-6">
            <h2 className="text-[1.15rem] font-bold text-gray-900 mb-5">
              다른 사람들은 옆 집도 함께 봤어요!
            </h2>
            <div>
              {nearby.map((n, i) => {
                const nTitle = n.name?.trim() || shortAddress(n.address)
                const nSub   = n.address
                  ? n.address.trim().split(' ').slice(3).join(' ')
                  : (n.main_purps_nm ?? '')
                return (
                  <Link
                    key={n.id}
                    href={`/buildings/${n.id}`}
                    className={`flex items-center gap-3.5 py-3.5 transition-colors hover:bg-gray-50
                      -mx-2 px-2 rounded-xl ${i < nearby.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <HouseIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{nTitle}</p>
                      {nSub && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{nSub}</p>
                      )}
                    </div>
                    {/* 거리 */}
                    <span className="text-xs font-medium text-blue-500 shrink-0 bg-blue-50 px-2 py-0.5 rounded-full">
                      {formatDist(n.distM)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      className="shrink-0">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="h-12" />
      </div>
    </div>
  )
}
