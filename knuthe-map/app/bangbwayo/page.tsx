// 방봐요 메인 — 활성 셋 + 과거 셋 + 새 셋 시작
//
// 셋·트랙 모델: 셋(투어) ⊃ 트랙(방 한 개) ⊃ 카드(체크리스트 항목)
//   메인 화면은 "지금 어디까지 와 있는가" 를 한눈에. 진행 중 셋이 있으면 그걸로 이어가고,
//   없으면 새로 시작. 과거는 별도 섹션.

import { redirect }   from 'next/navigation'
import Link           from 'next/link'
import { format }     from 'date-fns'
import { ko }         from 'date-fns/locale'
import { getServerThemeTokens } from '@/lib/theme-server'
import { getServerUser }        from '@/lib/auth-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { PageWrapper }          from '@/components/shared/PageWrapper'
import { DashboardHeader }      from '@/components/shared/DashboardHeader'
import { Card }                 from '@/components/shared/Card'
import { EmptyState }           from '@/components/shared/EmptyState'
import { IconChevronRight }     from '@/components/shared/icons'
import StartSetButton           from './_components/StartSetButton'

interface SetRow {
  id:                  string
  title:               string | null
  status:              'active' | 'ended' | 'results_generated'
  started_at:          string
  ended_at:            string | null
  result_generated_at: string | null
}

function setLabel(s: SetRow): string {
  return s.title?.trim() || format(new Date(s.started_at), 'M월 d일 (eee)', { locale: ko })
}

export default async function BangbwayoPage() {
  const user = await getServerUser()
  if (!user) redirect('/auth/sign-in?redirect=/bangbwayo')

  const { tok } = await getServerThemeTokens()
  const supabase = await createSupabaseServer()

  const { data: setsData } = await supabase
    .from('bangbwayo_sets')
    .select('id, title, status, started_at, ended_at, result_generated_at')
    .order('started_at', { ascending: false })

  const sets: SetRow[] = (setsData ?? []) as SetRow[]
  const ids  = sets.map((s) => s.id)

  // 셋별 트랙 수
  const counts: Record<string, number> = {}
  if (ids.length > 0) {
    const { data: tRows } = await supabase
      .from('bangbwayo_tracks')
      .select('set_id')
      .in('set_id', ids)
    for (const r of tRows ?? []) {
      const k = r.set_id as string
      counts[k] = (counts[k] ?? 0) + 1
    }
  }

  const active = sets.find((s) => s.status === 'active') ?? null
  const past   = sets.filter((s) => s.status !== 'active')

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="방봐요"
        subtitle="방 보러 갈 때 함께 가는 도구"
        backHref="/"
      />

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 활성 셋 ─────────────────────────────────────────────── */}
        {active && (
          <Link
            href={`/bangbwayo/sets/${active.id}`}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}
          >
            <Card tok={tok} padding="18px 20px" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span aria-hidden style={{
                width: 8, height: 8, borderRadius: 999,
                background: tok.successColor,
                boxShadow: `0 0 0 4px ${tok.successBg}`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: tok.successColor, margin: 0, letterSpacing: '0.04em' }}>
                  진행 중
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: tok.textPrimary, margin: '2px 0 0' }}>
                  {setLabel(active)}
                </p>
                <p style={{ fontSize: 12, color: tok.textSecondary, margin: '2px 0 0' }}>
                  트랙 {counts[active.id] ?? 0}개 · 이어서 작성하기
                </p>
              </div>
              <IconChevronRight size={16} color={tok.textTertiary} />
            </Card>
          </Link>
        )}

        {/* ── 새 셋 시작 — 활성 셋 없을 때만 ─────────────────────── */}
        {!active && (
          <div style={{ marginBottom: 14 }}>
            <StartSetButton tok={tok} />
          </div>
        )}

        {/* ── 과거 셋 ─────────────────────────────────────────────── */}
        {past.length > 0 ? (
          <Card tok={tok} padding={0} overflow="hidden" style={{ marginBottom: 14 }}>
            <div style={{
              padding: '14px 20px 8px',
              fontSize: 12, fontWeight: 700, color: tok.textTertiary,
              letterSpacing: '0.04em',
            }}>
              지난 투어
            </div>
            {past.map((s, i) => (
              // 지난 투어 — 결과물 페이지로 바로 진입.
              // 트랙이 0개여도 결과물 페이지의 EmptyState 가 받아준다.
              <Link
                key={s.id}
                href={`/bangbwayo/sets/${s.id}/results`}
                className="knu-press"
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 20px',
                  borderTop: i === 0 ? 'none' : `1px solid ${tok.cardBorder}`,
                  transition: 'transform .1s, background .15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: tok.textPrimary, margin: 0 }}>
                    {setLabel(s)}
                  </p>
                  <p style={{ fontSize: 12, color: tok.textSecondary, margin: '2px 0 0' }}>
                    트랙 {counts[s.id] ?? 0}개
                    {s.result_generated_at ? ' · 결과물 완성' : ''}
                  </p>
                </div>
                <IconChevronRight size={14} color={tok.textTertiary} />
              </Link>
            ))}
          </Card>
        ) : !active && (
          <Card tok={tok}>
            <EmptyState
              tok={tok}
              title="아직 본 방이 없어요"
              description="방을 보러 갈 때 새 셋을 시작해 보세요. 본 방마다 트랙으로 기록돼요."
            />
          </Card>
        )}

      </div>
    </PageWrapper>
  )
}
