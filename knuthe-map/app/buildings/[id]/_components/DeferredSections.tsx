import { createServiceClient } from '@/lib/supabase'
import TransactionTabs from './TransactionTabs'
import AgeDistribution from './AgeDistribution'
import ReviewSection from '@/components/review/ReviewSection'
import BookmarkButton from './BookmarkButton'

// ── 유틸 ──────────────────────────────────────────────────────

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

function buildingAge(useAprDay: string | null): number | null {
  if (!useAprDay || useAprDay.length < 8) return null
  const y = parseInt(useAprDay.slice(0, 4))
  const m = parseInt(useAprDay.slice(4, 6)) - 1
  const d = parseInt(useAprDay.slice(6, 8))
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null
  const built = new Date(y, m, d)
  return Math.floor((Date.now() - built.getTime()) / (365.25 * 24 * 3600 * 1000))
}

function shortAddress(addr: string | null): string {
  if (!addr) return '주소 없음'
  const parts = addr.trim().split(' ')
  return parts.length >= 2 ? parts.slice(-2).join(' ') : addr
}

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

// ── Types ─────────────────────────────────────────────────────

type Tok = {
  pageBg: string; cardBg: string; cardBgAlt: string
  border: string; borderSoft: string
  textPrimary: string; textSecondary: string; textTertiary: string
  accent: string; accentBg: string; starEmpty: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Building = any

import Link from 'next/link'

// ── 리뷰 + 거래 + 평점 섹션 ──────────────────────────────────

export async function DeferredReviewsAndTx({
  buildingId, buildingName, tok, theme,
}: {
  buildingId: string; buildingName: string; tok: Tok; theme: string
}) {
  const supabase = createServiceClient()

  const [{ data: reviewsData }, { data: txData }] = await Promise.all([
    supabase
      .from('reviews')
      .select(`
        id, rating_overall, rating_clean, rating_noise,
        rating_security, rating_transport, rating_cost,
        content, pros, cons, floor, room_type,
        lived_from, lived_to, is_anonymous, created_at,
        user:users(nickname, avatar_url)
      `)
      .eq('building_id', buildingId)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('contract_type, rent, deposit, maintenance, area_m2, floor, room_type, unit_number, contract_date, contract_start, contract_end, source')
      .eq('building_id', buildingId)
      .eq('is_active', true)
      .order('contract_date', { ascending: false }),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = (reviewsData ?? []).map((r: any) => ({
    ...r,
    user: Array.isArray(r.user) ? (r.user[0] ?? null) : r.user,
  })) as Parameters<typeof ReviewSection>[0]['initialReviews']
  const transactions = txData ?? []

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating_overall, 0) / reviews.length) * 10) / 10
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monthlyTx = transactions.filter((t: any) => t.contract_type === '월세' && t.rent)
  const txSummary = monthlyTx.length
    ? {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avg_rent: Math.round(monthlyTx.reduce((s: number, t: any) => s + (t.rent ?? 0), 0) / monthlyTx.length),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        min_rent: Math.min(...monthlyTx.map((t: any) => t.rent ?? 0)),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        max_rent: Math.max(...monthlyTx.map((t: any) => t.rent ?? 0)),
        count: monthlyTx.length,
      }
    : null

  return (
    <>
      {/* 평점 배지 */}
      <div className="px-5 pb-2 flex items-center gap-1.5">
        <StarIcon fill="#f59e0b" size={16} />
        <span className="text-base font-bold" style={{ color: tok.textPrimary }}>
          {avgRating !== null ? avgRating.toFixed(1) : '–'}
        </span>
        <span className="text-sm" style={{ color: tok.textTertiary }}>({reviews.length}개)</span>
      </div>

      {/* 월세 실거래가 */}
      <TransactionTabs transactions={transactions} summary={txSummary} tok={tok} />

      {/* 리뷰 섹션 */}
      <section className="px-5 pt-7 pb-6" style={{ borderBottom: `1px solid ${tok.border}` }}>
        <h2 className="text-[1.15rem] font-bold mb-5" style={{ color: tok.textPrimary }}>
          살아본 사람들의 이야기 👋
        </h2>
        <BookmarkButton buildingId={buildingId} theme={(theme as 'dark' | 'light') ?? 'dark'} />
        <ReviewSection
          buildingId={buildingId}
          buildingName={buildingName}
          initialReviews={reviews}
          initialAvg={avgRating}
        />
      </section>
    </>
  )
}

// ── 연식 정규분포 섹션 ────────────────────────────────────────

export async function DeferredAgeDistribution({
  building, tok,
}: {
  building: Building; tok: Tok
}) {
  const currentAge = buildingAge(building.use_apr_day)
  if (!building.zone || currentAge == null) return null

  const supabase = createServiceClient()
  const { data: zoneBuildings } = await supabase
    .from('buildings')
    .select('use_apr_day')
    .eq('zone', building.zone)
    .not('use_apr_day', 'is', null)
    .neq('use_apr_day', '')

  const zoneAges = (zoneBuildings ?? [])
    .map((zb: { use_apr_day: string | null }) => buildingAge(zb.use_apr_day))
    .filter((a: number | null): a is number => a !== null && a > 0)

  if (zoneAges.length < 5 || !building.use_apr_day) return null

  return (
    <section className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${tok.border}` }}>
      <AgeDistribution
        ages={zoneAges}
        currentAge={currentAge}
        zone={building.zone ?? '해당 구역'}
        builtYear={parseInt(building.use_apr_day.slice(0, 4))}
        tok={tok}
      />
    </section>
  )
}

// ── 주변 건물 섹션 ────────────────────────────────────────────

export async function DeferredNearby({
  buildingId, lat, lng, tok,
}: {
  buildingId: string; lat: number; lng: number; tok: Tok
}) {
  const supabase = createServiceClient()
  const DELTA = 0.005
  const { data: nearbyRaw } = await supabase
    .from('buildings')
    .select('id, name, address, lat, lng, main_purps_nm')
    .neq('id', buildingId)
    .gte('lat', lat - DELTA).lte('lat', lat + DELTA)
    .gte('lng', lng - DELTA).lte('lng', lng + DELTA)
    .limit(30)

  const nearby = (nearbyRaw ?? [])
    .map((n: { id: string; name: string | null; address: string | null; lat: number; lng: number; main_purps_nm: string | null }) => ({
      ...n,
      distM: haversineM(lat, lng, n.lat, n.lng),
    }))
    .sort((a: { distM: number }, z: { distM: number }) => a.distM - z.distM)
    .slice(0, 6)

  if (nearby.length === 0) return null

  return (
    <section className="px-5 pt-7 pb-6">
      <h2 className="text-[1.15rem] font-bold mb-5" style={{ color: tok.textPrimary }}>
        다른 사람들은 옆 집도 함께 봤어요!
      </h2>
      <div>
        {nearby.map((n: { id: string; name: string | null; address: string | null; main_purps_nm: string | null; distM: number }, i: number) => {
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
  )
}
