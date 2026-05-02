// 방봐요 — 셋 상세 (트랙 목록 + 새 트랙 시작 + 종료 갈림길)
//
// 셋(투어) 안에서 본 방들(트랙)을 시간 순서로 나열한다. 활성 셋이면 새 트랙 추가와
// 종료 갈림길("오늘 다 봤어요")을 노출. 종료된 셋이면 결과물로 갈 수 있는 입구.

import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { formatInTimeZone }   from 'date-fns-tz'
import { ko }                 from 'date-fns/locale'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { IconChevronRight }     from '@/components/shared/icons'
import { cookies }              from 'next/headers'
import { parsePrefs }           from '@/lib/prefs'
import { getGatesByDept }       from '@/lib/department-zones'
import { GATES, gateDistances } from '@/lib/gate-utils'
import { TIME_OPTIONS }         from '@/lib/bangbwayo-checklist'
import { formatTrackLabel }     from '@/lib/bangbwayo-track-label'
import StartTrackButton         from './_components/StartTrackButton'
import EndSetButtons            from './_components/EndSetButtons'

interface SetRow {
  id:                  string
  title:               string | null
  status:              'active' | 'ended' | 'results_generated'
  started_at:          string
  ended_at:            string | null
  result_generated_at: string | null
}

interface TrackRow {
  id:                    string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
  time_option:           '5min' | '15min' | '30min'
  status:                'draft' | 'saved' | 'closed' | 'included'
  visited_at:            string
  overall_rating:        number | null
}

function setLabel(s: SetRow): string {
  // started_at 은 timestamptz(UTC). 서버 런타임 UTC 에서 format 하면
  // 한국 사용자에게 9시간/하루 어긋난 날짜가 보이므로 KST 로 변환.
  return s.title?.trim()
    || formatInTimeZone(new Date(s.started_at), 'Asia/Seoul', 'M월 d일 (eee) 투어', { locale: ko })
}


export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  // 인증·테마·DB 클라이언트 동시 발사.
  const [user, themeRes, supabase] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bangbwayo/sets/${setId}`)}`)
  const { tok } = themeRes

  // set 과 tracks 는 둘 다 setId 만 알면 되므로 동시 발사.
  const [setRes, tracksRes] = await Promise.all([
    supabase
      .from('bangbwayo_sets')
      .select('id, title, status, started_at, ended_at, result_generated_at')
      .eq('id', setId)
      .maybeSingle(),
    supabase
      .from('bangbwayo_tracks')
      .select(`
        id, order_index, building_id, building_address_text, unit_number,
        time_option, status, visited_at, overall_rating
      `)
      .eq('set_id', setId)
      .order('order_index', { ascending: true }),
  ])
  if (!setRes.data) notFound()
  const set    = setRes.data    as SetRow
  const tracks = (tracksRes.data ?? []) as TrackRow[]

  // 트랙들의 building_id 모음 → 한 번에 buildings 조회
  const buildingIds = tracks
    .map((t) => t.building_id)
    .filter((id): id is string => !!id)
  const buildingMap: Record<string, { name: string | null; address: string | null; lat: number | null; lng: number | null }> = {}
  if (buildingIds.length > 0) {
    const { data: bldgs } = await supabase
      .from('buildings')
      .select('id, name, address, lat, lng')
      .in('id', buildingIds)
    for (const b of bldgs ?? []) {
      if (b.id) buildingMap[b.id as string] = {
        name:    (b.name    ?? null) as string | null,
        address: (b.address ?? null) as string | null,
        lat:     (b.lat     ?? null) as number | null,
        lng:     (b.lng     ?? null) as number | null,
      }
    }
  }

  const isActive = set.status === 'active'
  const allClosed = tracks.length > 0 && tracks.every((t) => t.status === 'closed' || t.status === 'included')
  const hasResults = !!set.result_generated_at

  // 학과 주문 ↔ 건물 거리 자동 계산 — 한 번에 prefs 읽고 사용자 학과의 주문 좌표
  // 를 구해두면 트랙별 계산이 가벼워진다 (게이트 좌표 1번 lookup).
  const jar    = await cookies()
  const prefsRaw = jar.get('knu_prefs')?.value
  const prefs  = prefsRaw ? parsePrefs(prefsRaw) : null
  const userDept = prefs?.dept ?? null
  const gateName = userDept ? (getGatesByDept(userDept)[0] ?? null) : null
  const targetGate = gateName ? GATES.find((g) => g.name === gateName) ?? null : null

  function distanceLabelFor(b: { lat: number | null; lng: number | null } | null): string | null {
    if (!b || b.lat == null || b.lng == null) return null
    const sorted = gateDistances(b.lat, b.lng)
    const used = targetGate
      ? (sorted.find((s) => s.gate.name === targetGate.name) ?? sorted[0])
      : sorted[0]
    if (!used) return null
    return `${used.gate.name} ${used.minutes}분`
  }

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title={setLabel(set)}
        subtitle={isActive ? '진행 중' : (hasResults ? '결과물 완성' : '저장됨')}
        backHref="/bangbwayo"
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 트랙 목록 ──────────────────────────────────────────── */}
        {tracks.length > 0 ? (
          <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
            {tracks.map((t, i) => {
              const b = t.building_id ? (buildingMap[t.building_id] ?? null) : null
              const label = formatTrackLabel(t, b)
              return (
                <Link
                  key={t.id}
                  href={`/bangbwayo/sets/${set.id}/tracks/${t.id}`}
                  style={{
                    textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px',
                    borderTop: i === 0 ? 'none' : `1px solid ${tok.cardBorder}`,
                  }}
                >
                  <span aria-hidden style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: tok.inputBg, color: tok.textSecondary,
                    fontSize: 12, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {t.order_index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14, fontWeight: 600, color: tok.textPrimary, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 11, color: tok.textTertiary, margin: '2px 0 0' }}>
                      {t.status === 'closed' || t.status === 'included' ? '마무리됨' : '작성 중'}
                      {t.overall_rating ? ` · 별 ${t.overall_rating}` : ''}
                      {(() => {
                        const dl = distanceLabelFor(b)
                        return dl ? ` · 🚶 ${dl}` : ''
                      })()}
                    </p>
                  </div>
                  <IconChevronRight size={14} color={tok.textTertiary} />
                </Link>
              )
            })}
          </Card>
        ) : (
          <Card tok={tok}>
            <EmptyState
              tok={tok}
              title="아직 본 방이 없어요"
              description={isActive
                ? '방에 도착하면 새 트랙을 시작해 보세요.'
                : '이 셋에는 트랙이 없네요.'}
            />
          </Card>
        )}

        {/* ── 활성 셋: 새 트랙 + 종료 갈림길 ─────────────────────── */}
        {isActive && (
          <>
            <StartTrackButton
              tok={tok}
              setId={set.id}
              timeOptions={TIME_OPTIONS}
            />
            {allClosed && (
              <div style={{ marginTop: 14 }}>
                <EndSetButtons tok={tok} setId={set.id} />
              </div>
            )}
          </>
        )}

        {/* ── 종료된 셋: 결과물 입구 ─────────────────────────────── */}
        {!isActive && tracks.length > 0 && (
          <Link
            href={`/bangbwayo/sets/${set.id}/results`}
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '14px 20px',
              marginTop: 6,
              borderRadius: 14,
              background: tok.accentBg,
              color: tok.accentColor,
              fontSize: 14, fontWeight: 700,
              textAlign: 'center',
              border: `1px solid ${tok.cardBorder}`,
            }}
          >
            {hasResults ? '결과물 다시 보기' : '결과물 만들기'}
          </Link>
        )}

      </div>
    </PageWrapper>
  )
}
