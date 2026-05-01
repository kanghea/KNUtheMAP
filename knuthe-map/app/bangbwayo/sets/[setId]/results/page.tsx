// 방봐요 — 결과물 (가로 스와이프 트랙 카드, CSS 3D 틸트)
//
// 기획서 §8.2 의 "결과물의 형태는 아직 정하지 않는다" — MVP 의 v0.
// 카드 한 장이 트랙 하나. 사용자가 좌우로 스와이프하며 비교.
//
// 3D 처리: 깊이 추정은 다음 사이클. 지금은 CSS perspective + 자이로/스크롤 미세 회전으로
// "블렌더 같은 입체감" 흉내. 추가 인프라 비용 0.

import { notFound, redirect } from 'next/navigation'
import Link                   from 'next/link'
import { format }             from 'date-fns'
import { ko }                 from 'date-fns/locale'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient }  from '@/lib/supabase'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { EmptyState }           from '@/components/shared/EmptyState'
import { Card }                 from '@/components/shared/Card'
import { getChecklistFor, type ChecklistItem, type Rating } from '@/lib/bangbwayo-checklist'
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
  buildingName: string | null
  responses:    ResultResponse[]
  photos:       ResultPhoto[]
  checklist:    readonly ChecklistItem[]
}

function setLabel(s: SetRow): string {
  return s.title?.trim() || format(new Date(s.started_at), 'M월 d일 (eee) 결과물', { locale: ko })
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ setId: string }>
}) {
  const { setId } = await params
  const user = await getServerUser()
  if (!user) redirect(`/auth/sign-in?redirect=/bangbwayo/sets/${setId}/results`)

  const { tok } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  const { data: setData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .eq('id', setId)
    .maybeSingle()
  if (!setData) notFound()
  const set = setData as SetRow

  const { data: tracksData } = await supabase
    .from('bangbwayo_tracks')
    .select(`
      id, order_index, building_id, building_address_text, unit_number,
      time_option, deposit, monthly_rent, maintenance, floor, contract_type,
      overall_rating, overall_memo, status
    `)
    .eq('set_id', setId)
    .order('order_index', { ascending: true })

  const tracks = (tracksData ?? []) as TrackRow[]

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
      ? supabase.from('buildings').select('id, name').in('id', buildingIds)
      : Promise.resolve({ data: [] }),
  ])

  // signed URL
  const allPhotos = (pData ?? []) as Array<{ id: string; track_id: string; checklist_item_key: string | null; storage_path: string }>
  const signed: Record<string, string> = {}
  if (allPhotos.length > 0) {
    const service = createServiceClient()
    const { data: list } = await service.storage
      .from('bangbwayo-photos')
      .createSignedUrls(allPhotos.map((p) => p.storage_path), 60 * 60)
    allPhotos.forEach((p, i) => {
      const url = list?.[i]?.signedUrl
      if (url) signed[p.storage_path] = url
    })
  }

  const buildingMap: Record<string, string> = {}
  for (const b of (bData ?? []) as Array<{ id: string; name: string | null }>) {
    if (b.id && b.name) buildingMap[b.id] = b.name
  }

  // 트랙 단위로 묶기
  const result: ResultTrack[] = tracks.map((t) => ({
    track:        t,
    buildingName: t.building_id ? (buildingMap[t.building_id] ?? null) : null,
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
  }))

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title={setLabel(set)}
        subtitle={`${tracks.length}개 방 비교`}
        backHref={`/bangbwayo/sets/${set.id}`}
      />
      <ResultsClient tok={tok} tracks={result} />
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
