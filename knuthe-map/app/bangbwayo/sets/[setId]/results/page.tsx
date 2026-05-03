// 방봐요 — 결과물 (가로 스와이프 트랙 카드, CSS 3D 틸트)
//
// 기획서 §8.2 의 "결과물의 형태는 아직 정하지 않는다" — MVP 의 v0.
// 카드 한 장이 트랙 하나. 사용자가 좌우로 스와이프하며 비교.
//
// 3D 처리: 깊이 추정은 다음 사이클. 지금은 CSS perspective + 자이로/스크롤 미세 회전으로
// "블렌더 같은 입체감" 흉내. 추가 인프라 비용 0.

import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { cookies }             from 'next/headers'
import { formatInTimeZone }   from 'date-fns-tz'
import { ko }                 from 'date-fns/locale'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { signPathsCached }      from '@/lib/storage-signed-url-cache'
import { parsePrefs }           from '@/lib/prefs'
import { getGatesByDept }       from '@/lib/department-zones'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { EmptyState }           from '@/components/shared/EmptyState'
import { Card }                 from '@/components/shared/Card'
import { getChecklistFor, type ChecklistItem, type Rating } from '@/lib/bangbwayo-checklist'
import { formatTrackLabel }     from '@/lib/bangbwayo-track-label'
import ResultsClient            from './_components/ResultsClient'

interface SetRow {
  id:                  string
  title:               string | null
  status:              'active' | 'ended' | 'results_generated'
  started_at:          string
  result_generated_at: string | null
}

interface TrackRow {
  id:                    string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
  time_option:           '5min' | '15min' | '30min'
  deposit:               number | null
  monthly_rent:          number | null
  maintenance:           number | null
  floor:                 number | null
  contract_type:         '월세' | '전세' | '매매' | null
  overall_rating:        number | null
  overall_memo:          string | null
  status:                'draft' | 'saved' | 'closed' | 'included'
}

export interface ResultPhoto { id: string; url: string | null; checklist_item_key: string | null }
export interface ResultResponse { checklist_item_key: string; rating: Rating | null; memo: string | null }
export interface ResultTrack {
  track:        TrackRow
  buildingName:    string | null
  buildingAddress: string | null
  /** 미리 계산된 표시 라벨 — 클라이언트에서도 일관 사용. */
  label:        string
  responses:    ResultResponse[]
  photos:       ResultPhoto[]
  checklist:    readonly ChecklistItem[]
  /** 매칭된 buildings 의 좌표 — 거리 축 계산용. 없으면 null (거리 0 처리). */
  lat:          number | null
  lng:          number | null
}

function setLabel(s: SetRow): string {
  // started_at 은 timestamptz(UTC). 서버 런타임 UTC 에서 format 하면
  // 한국 사용자에게 9시간/하루 어긋난 날짜가 보이므로 KST 로 변환.
  return s.title?.trim()
    || formatInTimeZone(new Date(s.started_at), 'Asia/Seoul', 'M월 d일 (eee) 결과물', { locale: ko })
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  // 인증·테마·DB 클라이언트 + set/tracks 까지 한 번에 발사.
  const [user, themeRes, supabase] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
    createSupabaseServer(),
  ])
  if (!user) redirect(`/login?next=${encodeURIComponent(`/bangbwayo/sets/${setId}/results`)}`)
  const { tok } = themeRes

  const [setRes, tracksRes] = await Promise.all([
    supabase
      .from('bangbwayo_sets')
      .select('id, title, status, started_at, result_generated_at')
      .eq('id', setId)
      .maybeSingle(),
    supabase
      .from('bangbwayo_tracks')
      .select(`
        id, order_index, building_id, building_address_text, unit_number,
        time_option, deposit, monthly_rent, maintenance, floor, contract_type,
        overall_rating, overall_memo, status
      `)
      .eq('set_id', setId)
      .order('order_index', { ascending: true }),
  ])
  if (!setRes.data) notFound()
  const set    = setRes.data    as SetRow
  const tracks = (tracksRes.data ?? []) as TrackRow[]

  if (tracks.length === 0) {
    return (
      <PageWrapper tok={tok}>
        <DashboardHeader
          tok={tok}
          title={setLabel(set)}
          backHref={`/bangbwayo/sets/${set.id}`}
        />
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>
          <Card tok={tok}>
            <EmptyState
              tok={tok}
              title="아직 본 방이 없어요"
              description="트랙을 만들고 다시 와주세요."
            />
          </Card>
        </div>
      </PageWrapper>
    )
  }

  // 사진 + 응답 + 건물명 한 번에
  const trackIds    = tracks.map((t) => t.id)
  const buildingIds = tracks.map((t) => t.building_id).filter((id): id is string => !!id)

  const [{ data: rData }, { data: pData }, { data: bData }] = await Promise.all([
    supabase
      .from('bangbwayo_responses')
      .select('track_id, checklist_item_key, rating, memo')
      .in('track_id', trackIds),
    supabase
      .from('bangbwayo_photos')
      .select('id, track_id, checklist_item_key, storage_path')
      .in('track_id', trackIds)
      .order('created_at', { ascending: true }),
    buildingIds.length > 0
      ? supabase.from('buildings').select('id, name, address, lat, lng').in('id', buildingIds)
      : Promise.resolve({ data: [] }),
  ])

  // signed URL — Lambda 메모리 LRU 캐시 활용. 같은 paths 재진입 시 0 왕복.
  const allPhotos = (pData ?? []) as Array<{ id: string; track_id: string; checklist_item_key: string | null; storage_path: string }>
  const signed = allPhotos.length > 0
    ? await signPathsCached(
        createServiceClient(),
        'bangbwayo-photos',
        allPhotos.map((p) => p.storage_path),
      )
    : {}

  const buildingMap: Record<string, { name: string | null; address: string | null; lat: number | null; lng: number | null }> = {}
  for (const b of (bData ?? []) as Array<{ id: string; name: string | null; address: string | null; lat: number | null; lng: number | null }>) {
    if (b.id) buildingMap[b.id] = {
      name: b.name ?? null, address: b.address ?? null,
      lat:  b.lat  ?? null, lng:     b.lng     ?? null,
    }
  }

  // 트랙 단위로 묶기
  const result: ResultTrack[] = tracks.map((t) => {
    const b = t.building_id ? (buildingMap[t.building_id] ?? null) : null
    return {
      track:           t,
      buildingName:    b?.name    ?? null,
      buildingAddress: b?.address ?? null,
      label:           formatTrackLabel(t, b),
      responses:    (rData ?? [])
        .filter((r) => (r as { track_id: string }).track_id === t.id)
        .map((r) => ({
          checklist_item_key: (r as { checklist_item_key: string }).checklist_item_key,
          rating:             (r as { rating: Rating | null }).rating,
          memo:               (r as { memo: string | null }).memo,
        })),
      photos:       allPhotos
        .filter((p) => p.track_id === t.id)
        .map((p) => ({
          id:                 p.id,
          checklist_item_key: p.checklist_item_key,
          url:                signed[p.storage_path] ?? null,
        })),
      checklist:    getChecklistFor(t.time_option),
      lat:          b?.lat ?? null,
      lng:          b?.lng ?? null,
    }
  })

  // 학과 주문(主門) — 거리 축 계산 기준. 학과 미설정 시 null (트랙별 가장 가까운
  // 문 폴백). prefs 쿠키에서 dept 읽어 getGatesByDept 로 결정.
  const prefsRaw = (await cookies()).get('knu_prefs')?.value
  const prefs    = prefsRaw ? parsePrefs(prefsRaw) : null
  const targetGateName = prefs?.dept ? (getGatesByDept(prefs.dept)[0] ?? null) : null

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title={setLabel(set)}
        subtitle={`${tracks.length}개 방 비교`}
        backHref={`/bangbwayo/sets/${set.id}`}
      />
      <ResultsClient tok={tok} setId={set.id} tracks={result} targetGateName={targetGateName} />
      <div style={{ maxWidth: 520, margin: '12px auto 0', padding: '0 16px' }}>
        <Link
          href={`/bangbwayo/sets/${set.id}`}
          style={{
            display: 'block', textAlign: 'center',
            padding: '12px', borderRadius: 12,
            background: tok.cardBg, color: tok.textSecondary,
            border: `1px solid ${tok.cardBorder}`,
            textDecoration: 'none',
            fontSize: 13, fontWeight: 600,
          }}
        >
          트랙 목록으로 돌아가기
        </Link>
      </div>
    </PageWrapper>
  )
}
