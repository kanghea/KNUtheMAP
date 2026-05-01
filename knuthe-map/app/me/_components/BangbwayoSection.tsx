// 마이페이지 — 방봐요로 본 방들 정리 섹션
//
// `/bangbwayo` 메인과 동일한 셋 카드 디자인 사용 — 시간 라벨, 썸네일,
// 트랙 라벨 미리보기, 응답 분포 도트, 상태 칩 모두 한 번의 시각.

import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { SetCardRow } from '@/components/bangbwayo/SetCardRow'
import { buildSetCards,
         type SetCardInputSet,
         type SetCardInputTrack,
         type SetCardInputResponse,
         type SetCardInputPhoto,
         type SetCardInputBuilding } from '@/lib/bangbwayo-set-summary'
import type { ThemeTokens } from '@/lib/theme-tokens'

export default async function BangbwayoSection({ tok }: { tok: ThemeTokens }) {
  const supabase = await createSupabaseServer()

  // 본인 셋 — RLS 가 본인만 반환
  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetCardInputSet[]
  if (sets.length === 0) {
    return (
      <Card tok={tok} padding={20} style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 12px' }}>
          방봐요로 본 방들
        </h2>
        <EmptyState
          tok={tok}
          padding="20px 0"
          title="아직 본 방이 없어요"
          description="다음에 방 보러 갈 때 방봐요로 기록해 보세요."
          action={
            <Link
              href="/bangbwayo"
              className="knu-press"
              style={{
                marginTop: 4, padding: '8px 16px', borderRadius: 999,
                background: tok.accentColor, color: '#fff',
                textDecoration: 'none',
                fontSize: 13, fontWeight: 700,
                transition: 'transform .1s',
              }}
            >
              방봐요 시작하기
            </Link>
          }
        />
      </Card>
    )
  }

  const setIds = sets.map((s) => s.id)
  const { data: tracksData } = await supabase
    .from('bangbwayo_tracks')
    .select('id, set_id, order_index, building_id, building_address_text, unit_number')
    .in('set_id', setIds)

  const tracks   = (tracksData ?? []) as SetCardInputTrack[]
  const trackIds = tracks.map((t) => t.id)

  const [respRes, photosRes] = await Promise.all([
    trackIds.length > 0
      ? supabase
          .from('bangbwayo_responses')
          .select('track_id, rating')
          .in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
    trackIds.length > 0
      ? supabase
          .from('bangbwayo_photos')
          .select('track_id, storage_path, created_at')
          .in('track_id', trackIds)
      : Promise.resolve({ data: [] }),
  ])
  const responses = (respRes.data   ?? []) as SetCardInputResponse[]
  const photos    = (photosRes.data ?? []) as SetCardInputPhoto[]

  const buildingIds = Array.from(new Set(
    tracks.map((t) => t.building_id).filter((id): id is string => !!id),
  ))
  let buildings: SetCardInputBuilding[] = []
  if (buildingIds.length > 0) {
    const { data: bData } = await supabase
      .from('buildings')
      .select('id, name, address')
      .in('id', buildingIds)
    buildings = (bData ?? []) as SetCardInputBuilding[]
  }

  const service = createServiceClient()
  const cards = await buildSetCards({
    service, sets, tracks, responses, photos, buildings,
  })

  return (
    <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 16 }}>
      <div style={{
        padding: '18px 20px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
          방봐요로 본 방들
        </h2>
        <span style={{ fontSize: 11, color: tok.textTertiary, fontWeight: 600 }}>
          {sets.length}개 투어 · 방 {tracks.length}개
        </span>
      </div>

      {cards.map((c, i) => (
        <div key={c.id} style={{
          borderTop: i === 0 ? `1px solid ${tok.cardBorder}` : `1px solid ${tok.cardBorder}`,
        }}>
          <SetCardRow tok={tok} summary={c} href={`/bangbwayo/sets/${c.id}`} />
        </div>
      ))}
    </Card>
  )
}
