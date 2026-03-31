import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { MAPBOX_TOKEN } from '@/lib/mapbox'
import TransactionTabs from './_components/TransactionTabs'
import InfoExpand from './_components/InfoExpand'
import NaverRoadView from './_components/NaverRoadView'
import AgeDistribution from './_components/AgeDistribution'
import GateDistance    from './_components/GateDistance'
import ReviewSection from '@/components/review/ReviewSection'
import BookmarkButton from './_components/BookmarkButton'
import { gateDistances, haversineM as gateHaversine, GATES } from '@/lib/gate-utils'
import { cookies } from 'next/headers'
import { parsePrefs } from '@/lib/prefs'
import PersonalScore, { type FactorResult } from './_components/PersonalScore'

// ── 테마 토큰 ─────────────────────────────────────────────────────
const BLDG_THEME = {
  dark: {
    pageBg:        '#0a0a0a',
    cardBg:        '#111111',
    cardBgAlt:     'rgba(255,255,255,0.04)',
    border:        'rgba(255,255,255,0.07)',
    borderSoft:    'rgba(255,255,255,0.12)',
    textPrimary:   '#ffffff',
    textSecondary: 'rgba(255,255,255,0.8)',
    textTertiary:  'rgba(255,255,255,0.35)',
    accent:        '#3b82f6',
    accentBg:      'rgba(37,99,235,0.15)',
    starEmpty:     'rgba(255,255,255,0.15)',
  },
  light: {
    pageBg:        '#f8fafc',
    cardBg:        '#ffffff',
    cardBgAlt:     '#f1f5f9',
    border:        '#e2e8f0',
    borderSoft:    '#e2e8f0',
    textPrimary:   '#0f172a',
    textSecondary: '#1e293b',
    textTertiary:  '#94a3b8',
    accent:        '#2563eb',
    accentBg:      '#eff6ff',
    starEmpty:     '#e5e7eb',
  },
} as const
type Tok = typeof BLDG_THEME[keyof typeof BLDG_THEME]

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

  // ── 주변 건물 + 리뷰 + 거래를 모두 병렬 실행
  const DELTA = 0.005
  const [{ data: nearbyRaw }, { data: reviewsData }, { data: txData }] = await Promise.all([
    supabase
      .from('buildings')
      .select('id, name, address, lat, lng, main_purps_nm')
      .neq('id', id)
      .gte('lat', b.lat - DELTA).lte('lat', b.lat + DELTA)
      .gte('lng', b.lng - DELTA).lte('lng', b.lng + DELTA)
      .limit(30),
    supabase
      .from('reviews')
      .select(`
        id, rating_overall, rating_clean, rating_noise,
        rating_security, rating_transport, rating_cost,
        content, pros, cons, floor, room_type,
        lived_from, lived_to, is_anonymous, created_at,
        user:users(nickname, avatar_url)
      `)
      .eq('building_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('contract_type, rent, deposit, maintenance, area_m2, floor, room_type, unit_number, contract_date, contract_start, contract_end, source')
      .eq('building_id', id)
      .eq('is_active', true)
      .order('contract_date', { ascending: false }),
  ])

  const nearby = (nearbyRaw ?? [])
    .map((n) => ({ ...n, distM: haversineM(b.lat, b.lng, n.lat, n.lng) }))
    .sort((a, z) => a.distM - z.distM)
    .slice(0, 6)

  // Supabase returns user as array from join; normalize to object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (reviewsData ?? []).map((r: any) => ({
    ...r,
    user: Array.isArray(r.user) ? (r.user[0] ?? null) : r.user,
  })) as Parameters<typeof ReviewSection>[0]['initialReviews']
  const transactions = txData ?? []

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length) * 10) / 10
    : null

  const monthlyTx = transactions.filter((t) => t.contract_type === '월세' && t.rent)
  const txSummary = monthlyTx.length
    ? {
        avg_rent: Math.round(monthlyTx.reduce((s, t) => s + (t.rent ?? 0), 0) / monthlyTx.length),
        min_rent: Math.min(...monthlyTx.map((t) => t.rent ?? 0)),
        max_rent: Math.max(...monthlyTx.map((t) => t.rent ?? 0)),
        count: monthlyTx.length,
      }
    : null

  // ── 사용자 개인화 설정 읽기 ──────────────────────────────────
  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const prefs    = prefsRaw ? parsePrefs(prefsRaw) : null

  // ── 가까운 출입문 (상위 3개)
  const nearestGates = b.lat && b.lng
    ? gateDistances(b.lat, b.lng).slice(0, 3).map((gd) => ({
        name:    gd.gate.name,
        distM:   gd.distM,
        minutes: gd.minutes,
      }))
    : []

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

  // ── 내 기준 factor 점수 계산 ─────────────────────────────────
  let personalFactors: FactorResult[] = []
  if (prefs && prefs.priorities.length > 0 && b.lat && b.lng) {
    const age = buildingAge(b.use_apr_day)

    // 거리: 선호 문까지 하버사인
    const gateObj = prefs.gate ? GATES.find((g) => g.name === prefs.gate) ?? null : null
    const gateDistM = gateObj ? gateHaversine(b.lat, b.lng, gateObj.lat, gateObj.lng) : null
    const gateMin   = gateDistM !== null ? Math.round((gateDistM * 1.3) / 70) : null

    const distStars = gateDistM === null ? 3
      : gateDistM < 100  ? 5
      : gateDistM < 400  ? 4
      : gateDistM < 700  ? 3
      : gateDistM < 1000 ? 2 : 1

    // 연식
    const ageStars = age === null ? 3
      : age < 5  ? 5
      : age < 15 ? 4
      : age < 25 ? 3
      : age < 35 ? 2 : 1

    // 방 크기
    const areaPerUnit  = (b.tot_area ?? 0) > 0 && (b.hhld_cnt ?? 0) > 0
      ? (b.tot_area as number) / (b.hhld_cnt as number) : null
    const sizeStars = areaPerUnit === null ? 3
      : areaPerUnit > 80 ? 5
      : areaPerUnit > 50 ? 4
      : areaPerUnit > 35 ? 3
      : areaPerUnit > 20 ? 2 : 1

    // 보안
    let sec = 0
    if (b.has_elevator)                          sec += 35
    if ((b.ride_use_elvt_cnt ?? 0) >= 2)         sec += 15
    if ((b.hhld_cnt ?? 0) >= 5)                  sec += 25
    if (age !== null && age <= 10)               sec += 25
    else if (age !== null && age <= 20)          sec += 12
    const secStars = sec >= 70 ? 5 : sec >= 50 ? 4 : sec >= 30 ? 3 : sec >= 15 ? 2 : 1

    // 주변 편의시설 (nearbyRaw 내 근린생활 수)
    const commercialCount = (nearbyRaw ?? []).filter((n) =>
      (n.main_purps_nm ?? '').includes('근린생활') ||
      (n.main_purps_nm ?? '').includes('판매')
    ).length
    const nearbyStars = commercialCount >= 10 ? 5
      : commercialCount >= 6  ? 4
      : commercialCount >= 3  ? 3
      : commercialCount >= 1  ? 2 : 1

    const factorMap: Record<string, FactorResult> = {
      dist: {
        id:     'dist',
        stars:  distStars,
        detail: gateMin !== null
          ? `${prefs.gate ?? ''}에서 도보 ${gateMin}분`
          : '문 미설정',
      },
      age: {
        id:     'age',
        stars:  ageStars,
        detail: age !== null ? `준공 ${age}년` : '연식 정보 없음',
      },
      size: {
        id:     'size',
        stars:  sizeStars,
        detail: areaPerUnit !== null ? `세대당 ${Math.round(areaPerUnit)}㎡` : '면적 정보 없음',
      },
      security: {
        id:     'security',
        stars:  secStars,
        detail: b.has_elevator ? '엘리베이터 있음' : '엘리베이터 없음',
      },
      nearby: {
        id:     'nearby',
        stars:  nearbyStars,
        detail: `500m 내 상점 ${commercialCount}개`,
      },
    }
    personalFactors = prefs.priorities
      .map((pid) => factorMap[pid])
      .filter(Boolean) as FactorResult[]
  }

  const title = b.name?.trim() || shortAddress(b.address)
  const theme = prefs?.theme ?? 'dark'
  const tok: Tok = BLDG_THEME[theme]

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
    <div className="min-h-screen" style={{ background: tok.pageBg }}>

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
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800" />
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
            className="w-9 h-9 rounded-full flex items-center justify-center shadow"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            <ChevronLeft />
          </Link>
          <span className="flex-1 text-sm font-semibold text-white drop-shadow truncate">
            {title}
          </span>
          <Link
            href="/"
            className="w-9 h-9 rounded-full flex items-center justify-center shadow"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
          >
            <HomeIcon />
          </Link>
        </div>
      </div>

      {/* ── 본문 ─────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto">

        {/* ── 건물 타이틀 카드 ─────────────────────────────────── */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${tok.border}` }}>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[1.3rem] font-bold leading-tight" style={{ color: tok.textPrimary }}>{title}</h1>
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <StarIcon fill="#f59e0b" size={16} />
              <span className="text-base font-bold" style={{ color: tok.textPrimary }}>
                {avgRating !== null ? avgRating.toFixed(1) : '–'}
              </span>
              <span className="text-sm" style={{ color: tok.textTertiary }}>({reviews.length}개)</span>
            </div>
          </div>

          {/* 주소 배지 */}
          <div className="mt-3 flex flex-col gap-1.5">
            {b.address && (
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0 leading-none px-1.5 py-0.5 rounded"
                  style={{ color: tok.textTertiary, border: `1px solid ${tok.borderSoft}` }}>
                  도로명
                </span>
                <span className="text-sm" style={{ color: tok.textSecondary }}>{b.address}</span>
              </div>
            )}
            {b.bd_mgt_sn && (
              <div className="flex items-center gap-2">
                <span className="text-xs shrink-0 leading-none px-1.5 py-0.5 rounded"
                  style={{ color: tok.textTertiary, border: `1px solid ${tok.borderSoft}` }}>
                  관리번호
                </span>
                <span className="text-xs font-mono" style={{ color: tok.textTertiary }}>{b.bd_mgt_sn}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── 월세 실거래가 ────────────────────────────────────── */}
        <TransactionTabs transactions={transactions} summary={txSummary} tok={tok} />

        {/* ── 건물 소개 ─────────────────────────────────────────── */}
        <section className="px-5 pt-7 pb-6" style={{ borderBottom: `1px solid ${tok.border}` }}>
          <h2 className="text-[1.15rem] font-bold mb-4" style={{ color: tok.textPrimary }}>{title} 소개</h2>

          {/* 지도 (스트리트맵) */}
          {mapboxStaticImg && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${tok.borderSoft}` }}>
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
          <div className="rounded-b-xl px-5 pt-1 pb-3" style={{ border: `1px solid ${tok.borderSoft}`, borderTop: 0 }}>
            <InfoExpand building={b} tok={tok} />
          </div>
        </section>

        {/* ── 내 기준 적합도 ────────────────────────────────────── */}
        {prefs && personalFactors.length > 0 && (
          <section className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${tok.border}` }}>
            <PersonalScore
              grade={prefs.grade}
              dept={prefs.dept}
              priorities={prefs.priorities}
              factors={personalFactors}
              tok={tok}
            />
          </section>
        )}

        {/* ── 가까운 출입문 ─────────────────────────────────────── */}
        {nearestGates.length > 0 && (
          <section className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${tok.border}` }}>
            <GateDistance gates={nearestGates} tok={tok} />
          </section>
        )}

        {/* ── 연식 정규분포 ─────────────────────────────────────── */}
        {currentAge != null && zoneAges.length >= 5 && b.use_apr_day && (
          <section className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${tok.border}` }}>
            <AgeDistribution
              ages={zoneAges}
              currentAge={currentAge}
              zone={b.zone ?? '해당 구역'}
              builtYear={parseInt(b.use_apr_day.slice(0, 4))}
              tok={tok}
            />
          </section>
        )}

        {/* ── 리뷰 섹션 ─────────────────────────────────────────── */}
        <section className="px-5 pt-7 pb-6" style={{ borderBottom: `1px solid ${tok.border}` }}>
          <h2 className="text-[1.15rem] font-bold mb-5" style={{ color: tok.textPrimary }}>
            살아본 사람들의 이야기 👋
          </h2>

          {/* 관심등록 카드 */}
          <BookmarkButton buildingId={id} theme={prefs?.theme ?? 'dark'} />

          <ReviewSection
            buildingId={id}
            buildingName={title}
            initialReviews={reviews}
            initialAvg={avgRating}
          />
        </section>

        {/* ── 주변 건물 ─────────────────────────────────────────── */}
        {nearby.length > 0 && (
          <section className="px-5 pt-7 pb-6">
            <h2 className="text-[1.15rem] font-bold mb-5" style={{ color: tok.textPrimary }}>
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
                    className="flex items-center gap-3.5 py-3.5 -mx-2 px-2 rounded-xl"
                    style={i < nearby.length - 1 ? { borderBottom: `1px solid ${tok.border}` } : {}}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: tok.accentBg }}>
                      <HouseIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: tok.textPrimary }}>{nTitle}</p>
                      {nSub && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: tok.textTertiary }}>{nSub}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium shrink-0 px-2 py-0.5 rounded-full"
                      style={{ color: tok.accent, background: tok.accentBg }}>
                      {formatDist(n.distM)}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={tok.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
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
