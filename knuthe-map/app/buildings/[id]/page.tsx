import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { MAPBOX_TOKEN } from '@/lib/mapbox'
import InfoExpand from './_components/InfoExpand'
import NaverRoadView from './_components/NaverRoadView'
import GateDistance    from './_components/GateDistance'
import PersonalScore, { type FactorResult } from './_components/PersonalScore'
import { gateDistances, haversineM as gateHaversine, GATES } from '@/lib/gate-utils'
import { cookies } from 'next/headers'
import { parsePrefs } from '@/lib/prefs'
import {
  DeferredReviewsAndTx,
  DeferredAgeDistribution,
  DeferredNearby,
} from './_components/DeferredSections'

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

// ── 스켈레톤 폴백 ─────────────────────────────────────────────

function SectionSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div className="px-5 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{
        height, borderRadius: 12,
        background: 'rgba(255,255,255,0.04)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.5 } }`}</style>
    </div>
  )
}

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

  // ── 사용자 개인화 설정 읽기 (쿠키, DB 불필요)
  const jar      = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const prefs    = prefsRaw ? parsePrefs(prefsRaw) : null

  // ── 가까운 출입문 (순수 계산, DB 불필요)
  const nearestGates = b.lat && b.lng
    ? gateDistances(b.lat, b.lng).slice(0, 3).map((gd) => ({
        name:    gd.gate.name,
        distM:   gd.distM,
        minutes: gd.minutes,
      }))
    : []

  // ── 내 기준 factor 점수 계산 (순수 계산)
  let personalFactors: FactorResult[] = []
  if (prefs && prefs.priorities.length > 0 && b.lat && b.lng) {
    const age = buildingAge(b.use_apr_day)

    const gateObj = prefs.gate ? GATES.find((g) => g.name === prefs.gate) ?? null : null
    const gateDistM = gateObj ? gateHaversine(b.lat, b.lng, gateObj.lat, gateObj.lng) : null
    const gateMin   = gateDistM !== null ? Math.round((gateDistM * 1.3) / 70) : null

    const distStars = gateDistM === null ? 3
      : gateDistM < 100  ? 5
      : gateDistM < 400  ? 4
      : gateDistM < 700  ? 3
      : gateDistM < 1000 ? 2 : 1

    const ageStars = age === null ? 3
      : age < 5  ? 5
      : age < 15 ? 4
      : age < 25 ? 3
      : age < 35 ? 2 : 1

    const areaPerUnit  = (b.tot_area ?? 0) > 0 && (b.hhld_cnt ?? 0) > 0
      ? (b.tot_area as number) / (b.hhld_cnt as number) : null
    const sizeStars = areaPerUnit === null ? 3
      : areaPerUnit > 80 ? 5
      : areaPerUnit > 50 ? 4
      : areaPerUnit > 35 ? 3
      : areaPerUnit > 20 ? 2 : 1

    let sec = 0
    if (b.has_elevator)                          sec += 35
    if ((b.ride_use_elvt_cnt ?? 0) >= 2)         sec += 15
    if ((b.hhld_cnt ?? 0) >= 5)                  sec += 25
    if (age !== null && age <= 10)               sec += 25
    else if (age !== null && age <= 20)          sec += 12
    const secStars = sec >= 70 ? 5 : sec >= 50 ? 4 : sec >= 30 ? 3 : sec >= 15 ? 2 : 1

    const factorMap: Record<string, FactorResult> = {
      dist: {
        id: 'dist', stars: distStars,
        detail: gateMin !== null ? `${prefs.gate ?? ''}에서 도보 ${gateMin}분` : '문 미설정',
      },
      age: {
        id: 'age', stars: ageStars,
        detail: age !== null ? `준공 ${age}년` : '연식 정보 없음',
      },
      size: {
        id: 'size', stars: sizeStars,
        detail: areaPerUnit !== null ? `세대당 ${Math.round(areaPerUnit)}㎡` : '면적 정보 없음',
      },
      security: {
        id: 'security', stars: secStars,
        detail: b.has_elevator ? '엘리베이터 있음' : '엘리베이터 없음',
      },
      nearby: {
        id: 'nearby', stars: 3,
        detail: '주변 정보 로딩 중…',
      },
    }
    personalFactors = prefs.priorities
      .map((pid) => factorMap[pid])
      .filter(Boolean) as FactorResult[]
  }

  const title = b.name?.trim() || shortAddress(b.address)
  const theme = prefs?.theme ?? 'dark'
  const tok: Tok = BLDG_THEME[theme]

  const mapboxStaticImg = b.lat && b.lng
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `pin-l-building+2563eb(${b.lng},${b.lat})/` +
      `${b.lng},${b.lat},16,0,0/800x360@2x?access_token=${MAPBOX_TOKEN}`
    : null

  const satelliteImg = b.lat && b.lng
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/` +
      `pin-l-building+ffffff(${b.lng},${b.lat})/` +
      `${b.lng},${b.lat},17,0,0/800x520@2x?access_token=${MAPBOX_TOKEN}`
    : null

  const naverClientId = process.env.NAVER_MAP_CLIENT_ID ?? ''

  return (
    <div className="min-h-screen" style={{ background: tok.pageBg }}>

      {/* ── 로드뷰 헤더 (즉시 렌더) ──────────────────────────── */}
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

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 55%)' }}
        />

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

        {/* ── 건물 타이틀 카드 (즉시 렌더) ─────────────────────── */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${tok.border}` }}>
          <h1 className="text-[1.3rem] font-bold leading-tight" style={{ color: tok.textPrimary }}>{title}</h1>
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

        {/* ── 거래 + 리뷰 (Suspense 스트리밍) ─────────────────── */}
        <Suspense fallback={<><SectionSkeleton height={180} /><SectionSkeleton height={200} /></>}>
          <DeferredReviewsAndTx
            buildingId={id}
            buildingName={title}
            tok={tok}
            theme={theme}
          />
        </Suspense>

        {/* ── 건물 소개 (즉시 렌더 — DB 불필요) ────────────────── */}
        <section className="px-5 pt-7 pb-6" style={{ borderBottom: `1px solid ${tok.border}` }}>
          <h2 className="text-[1.15rem] font-bold mb-4" style={{ color: tok.textPrimary }}>{title} 소개</h2>
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
          <div className="rounded-b-xl px-5 pt-1 pb-3" style={{ border: `1px solid ${tok.borderSoft}`, borderTop: 0 }}>
            <InfoExpand building={b} tok={tok} />
          </div>
        </section>

        {/* ── 내 기준 적합도 (즉시 렌더 — 순수 계산) ────────────── */}
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

        {/* ── 가까운 출입문 (즉시 렌더 — 순수 계산) ─────────────── */}
        {nearestGates.length > 0 && (
          <section className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${tok.border}` }}>
            <GateDistance gates={nearestGates} tok={tok} />
          </section>
        )}

        {/* ── 연식 정규분포 (Suspense 스트리밍) ────────────────── */}
        <Suspense fallback={<SectionSkeleton height={160} />}>
          <DeferredAgeDistribution building={b} tok={tok} />
        </Suspense>

        {/* ── 주변 건물 (Suspense 스트리밍) ────────────────────── */}
        <Suspense fallback={<SectionSkeleton height={200} />}>
          <DeferredNearby buildingId={id} lat={b.lat} lng={b.lng} tok={tok} />
        </Suspense>

        <div className="h-12" />
      </div>
    </div>
  )
}
