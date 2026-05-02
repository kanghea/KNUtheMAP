// 방봐요 — 셋 상세 (트랙 목록 + 새 트랙 시작 + 종료 갈림길)
//
// 셋(투어) 안에서 본 방들(트랙)을 시간 순서로 나열한다. 활성 셋이면 새 트랙 추가와
// 종료 갈림길("오늘 다 봤어요")을 노출. 종료된 셋이면 결과물로 갈 수 있는 입구.

import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { format }             from 'date-fns'
import { ko }                 from 'date-fns/locale'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { IconChevronRight }     from '@/components/shared/icons'
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
  return s.title?.trim() || format(new Date(s.started_at), 'M월 d일 (eee) 투어', { locale: ko })
}


export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const user = await getServerUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bangbwayo/sets/${setId}`)}`)

  const { tok } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  const { data: setData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, ended_at, result_generated_at')
    .eq('id', setId)
    .maybeSingle()
  if (!setData) notFound()
  const set = setData as SetRow

  const { data: tracksData } = await supabase
    .from('bangbwayo_tracks')
    .select(`
      id, order_index, building_id, building_address_text, unit_number,
      time_option, status, visited_at, overall_rating
    `)
    .eq('set_id', setId)
    .order('order_index', { ascending: true })

  const tracks = (tracksData ?? []) as TrackRow[]

  // 트랙들의 building_id 모음 → 한 번에 buildings 조회
  const buildingIds = tracks
    .map((t) => t.building_id)
    .filter((id): id is string => !!id)
  const buildingMap: Record<string, { name: string | null; address: string | null }> = {}
  if (buildingIds.length > 0) {
    const { data: bldgs } = await supabase
      .from('buildings')
      .select('id, name, address')
      .in('id', buildingIds)
    for (const b of bldgs ?? []) {
      if (b.id) buildingMap[b.id as string] = {
        name:    (b.name    ?? null) as string | null,
        address: (b.address ?? null) as string | null,
      }
    }
  }

  const isActive = set.status === 'active'
  const allClosed = tracks.length > 0 && tracks.every((t) => t.status === 'closed' || t.status === 'included')
  const hasResults = !!set.result_generated_at

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
