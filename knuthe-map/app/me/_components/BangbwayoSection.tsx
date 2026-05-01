// 마이페이지 — 방봐요로 본 방들 정리 섹션
//
// 셋 단위로 묶어서 시간순으로 보여준다. 셋 안의 트랙은 라벨(건물명/주소 + 호수)과
// 종합 별점·체크리스트 응답 수를 한 줄로 요약. 각 행 클릭 시 트랙 페이지로 이동.

import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { createSupabaseServer } from '@/lib/supabase-server'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconChevronRight } from '@/components/shared/icons'
import { formatTrackLabel } from '@/lib/bangbwayo-track-label'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface SetRow {
  id:                  string
  title:               string | null
  status:              'active' | 'ended' | 'results_generated'
  started_at:          string
  result_generated_at: string | null
}
interface TrackRow {
  id:                    string
  set_id:                string
  order_index:           number
  building_id:           string | null
  building_address_text: string | null
  unit_number:           string | null
  status:                'draft' | 'saved' | 'closed' | 'included'
  visited_at:            string
  overall_rating:        number | null
}

function setLabel(s: SetRow): string {
  return s.title?.trim() || format(new Date(s.started_at), 'M월 d일 (eee)', { locale: ko })
}

export default async function BangbwayoSection({ tok }: { tok: ThemeTokens }) {
  const supabase = await createSupabaseServer()

  // 본인 셋 + 트랙 — RLS 가 본인만 반환
  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets = (setsData ?? []) as SetRow[]
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
              style={{
                marginTop: 4, padding: '8px 16px', borderRadius: 999,
                background: tok.accentColor, color: '#fff',
                textDecoration: 'none',
                fontSize: 13, fontWeight: 700,
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
    .select(`
      id, set_id, order_index, building_id, building_address_text,
      unit_number, status, visited_at, overall_rating
    `)
    .in('set_id', setIds)
    .order('order_index', { ascending: true })

  const tracks = (tracksData ?? []) as TrackRow[]
  const trackCount = tracks.length

  // 매칭된 건물 일괄 조회
  const buildingIds = tracks
    .map((t) => t.building_id)
    .filter((id): id is string => !!id)
  const buildingMap: Record<string, { name: string | null; address: string | null }> = {}
  if (buildingIds.length > 0) {
    const { data: bldgs } = await supabase
      .from('buildings')
      .select('id, name, address')
      .in('id', buildingIds)
    for (const b of (bldgs ?? []) as Array<{ id: string; name: string | null; address: string | null }>) {
      if (b.id) buildingMap[b.id] = { name: b.name ?? null, address: b.address ?? null }
    }
  }

  // 셋별로 트랙 묶기
  const tracksBySet: Record<string, TrackRow[]> = {}
  for (const t of tracks) {
    (tracksBySet[t.set_id] ??= []).push(t)
  }

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
          {sets.length}개 투어 · 방 {trackCount}개
        </span>
      </div>

      {sets.map((s, i) => {
        const setTracks = tracksBySet[s.id] ?? []
        return (
          <div
            key={s.id}
            style={{
              borderTop: i === 0 ? `1px solid ${tok.cardBorder}` : `1px solid ${tok.cardBorder}`,
              padding: '10px 20px 12px',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              padding: '4px 0 6px',
            }}>
              <Link
                href={`/bangbwayo/sets/${s.id}`}
                style={{
                  fontSize: 12, fontWeight: 700, color: tok.textSecondary,
                  textDecoration: 'none', letterSpacing: '0.02em',
                }}
              >
                {setLabel(s)}
              </Link>
              <span style={{ fontSize: 10, color: tok.textTertiary, fontWeight: 600 }}>
                {s.status === 'active' ? '진행 중' :
                 s.result_generated_at ? '결과물 완성' : '저장됨'}
              </span>
            </div>

            {setTracks.length === 0 ? (
              <p style={{ fontSize: 12, color: tok.textTertiary, margin: '4px 0 0' }}>
                아직 트랙 없음
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {setTracks.map((t) => {
                  const b = t.building_id ? (buildingMap[t.building_id] ?? null) : null
                  const label = formatTrackLabel(t, b)
                  return (
                    <Link
                      key={t.id}
                      href={`/bangbwayo/sets/${s.id}/tracks/${t.id}`}
                      style={{
                        textDecoration: 'none',
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: tok.inputBg,
                        border: `1px solid ${tok.inputBorder}`,
                      }}
                    >
                      <span style={{ flex: 1, minWidth: 0,
                        fontSize: 13, fontWeight: 600, color: tok.textPrimary,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                      {t.overall_rating ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: tok.textSecondary,
                          flexShrink: 0,
                        }}>
                          ★ {t.overall_rating}
                        </span>
                      ) : null}
                      <IconChevronRight size={12} color={tok.textTertiary} />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </Card>
  )
}
