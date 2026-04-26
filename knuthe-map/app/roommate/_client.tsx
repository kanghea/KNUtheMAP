'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/hooks/useTheme'
import type { ThemeTokens } from '@/lib/theme-tokens'
import { loadRoommateDraft, clearRoommateDraft, DORMITORIES } from '@/lib/roommate-constants'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { SkeletonCard } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconUsers, IconAlert } from '@/components/shared/icons'

interface MatchResult {
  user_id: string
  compatibility: number
  nickname: string | null
  avatar_url: string | null
  dept: string | null
  grade: string | null
  living_type: string
  dormitory: string | null
  student_id: number
  bedtime_start: string
  bedtime_end: string
  smoking: string
  cleanliness: number
  introduction: string | null
}

const ROOMMATE_ACCENT = '#6C63FF'  // 룸메이트 정체성 색 (보라)
const SCORE_GRADIENT  = `linear-gradient(135deg, ${ROOMMATE_ACCENT}, #8B5CF6)`

export default function RoommateClient({ saveDraft }: { saveDraft: boolean }) {
  const router = useRouter()
  const { tok } = useTheme()
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'dormitory' | 'offcampus'>('dormitory')
  const [dormFilter, setDormFilter] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // 온보딩 후 로컬스토리지에서 프로필 저장
  useEffect(() => {
    if (!saveDraft || saved) return
    const draft = loadRoommateDraft()
    if (!draft) return

    fetch('/api/roommate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: draft.profile, weights: draft.weights }),
    }).then(res => {
      if (res.ok) {
        clearRoommateDraft()
        setSaved(true)
        router.replace('/roommate')
      }
    })
  }, [saveDraft, saved, router])

  // 매칭 목록 조회
  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams()
    params.set('living_type', tab)
    if (dormFilter) params.set('dormitory', dormFilter)

    const res = await fetch(`/api/roommate?${params.toString()}`)
    if (res.status === 404) {
      router.push('/?reset=1')
      return
    }
    if (!res.ok) {
      setError('매칭 목록을 불러오지 못했어요')
      setLoading(false)
      return
    }
    const data = await res.json()
    setMatches(data.matches ?? [])
    setLoading(false)
  }, [tab, dormFilter, router])

  useEffect(() => {
    if (saveDraft && !saved) return
    fetchMatches()
  }, [fetchMatches, saveDraft, saved])

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="룸메이트"
        subtitle="나와 잘 맞는 룸메이트를 찾아보세요"
        backHref="/"
      />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 0' }}>
        {/* ── Segmented 탭 (기숙사 / 자취방) ───────────────── */}
        <div style={{
          display: 'flex', gap: 0, padding: 4, borderRadius: 12,
          background: tok.inputBg, border: `1px solid ${tok.cardBorder}`,
          marginBottom: 12,
        }}>
          {([['dormitory', '기숙사'], ['offcampus', '자취방']] as const).map(([key, label]) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => { setTab(key); setDormFilter(null) }}
                style={{
                  flex: 1, padding: '10px', borderRadius: 9,
                  fontSize: 14, fontWeight: 700, border: 'none',
                  background: active ? ROOMMATE_ACCENT : 'transparent',
                  color: active ? '#fff' : tok.textSecondary,
                  cursor: 'pointer', transition: 'all .15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ── 기숙사 건물 필터 (가로 스크롤) ───────────────── */}
        {tab === 'dormitory' && (
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              display: 'flex', gap: 6, padding: '2px 4px 6px',
              overflowX: 'auto', WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              <FilterChip label="전체" active={!dormFilter}
                onClick={() => setDormFilter(null)} tok={tok} />
              {DORMITORIES.map(d => (
                <FilterChip key={d} label={d} active={dormFilter === d}
                  onClick={() => setDormFilter(dormFilter === d ? null : d)} tok={tok} />
              ))}
            </div>
            {/* 우측 페이드: chip이 더 있다는 시각 신호 */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 28,
              background: `linear-gradient(to left, ${tok.pageBg}, transparent)`,
              pointerEvents: 'none',
            }} />
          </div>
        )}
      </div>

      {/* ── 매칭 목록 ───────────────────────────────────── */}
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 24px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <SkeletonCard key={i} tok={tok} height={120} radius={18} />)}
          </div>
        )}

        {!loading && error && (
          <Card tok={tok} padding={0}>
            <EmptyState
              tok={tok}
              icon={<IconAlert size={36} color={tok.textTertiary} />}
              title={error}
              description="잠시 후 다시 시도해주세요"
              action={{ label: '다시 시도', onClick: fetchMatches }}
            />
          </Card>
        )}

        {!loading && !error && matches.length === 0 && (
          <Card tok={tok} padding={0}>
            <EmptyState
              tok={tok}
              icon={
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `${ROOMMATE_ACCENT}1f`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 4,
                }}>
                  <IconUsers size={28} color={ROOMMATE_ACCENT} />
                </div>
              }
              title="아직 매칭할 룸메이트가 없어요"
              description={tab === 'dormitory' && dormFilter
                ? `${dormFilter}에 등록한 사용자가 없어요. 다른 기숙사도 둘러보세요`
                : '더 많은 사용자가 등록하면 알려드릴게요'}
              action={tab === 'dormitory' && dormFilter
                ? { label: '전체 보기', onClick: () => setDormFilter(null) }
                : undefined}
            />
          </Card>
        )}

        {!loading && !error && matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {matches.map(m => <MatchCard key={m.user_id} match={m} tok={tok} />)}
          </div>
        )}
      </main>
    </PageWrapper>
  )
}

// ── 필터 칩 ──
function FilterChip({ label, active, onClick, tok }: {
  label: string; active: boolean; onClick: () => void; tok: ThemeTokens
}) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
      whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
      border: `1.5px solid ${active ? `${ROOMMATE_ACCENT}66` : tok.inputBorder}`,
      background: active ? `${ROOMMATE_ACCENT}1a` : tok.inputBg,
      color: active ? ROOMMATE_ACCENT : tok.textSecondary,
      transition: 'all .15s ease',
    }}>
      {label}
    </button>
  )
}

// ── 매칭 카드 ──
function MatchCard({ match, tok }: { match: MatchResult; tok: ThemeTokens }) {
  const cleanlinessLabel = ['', '낮음', '보통', '높음', '매우 높음'][match.cleanliness] ?? ''

  return (
    <div style={{
      padding: 16, borderRadius: 18,
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      boxShadow: tok.shadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* 호환도 */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: SCORE_GRADIENT,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {match.compatibility}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 2 }}>
            % 일치
          </span>
        </div>

        {/* 프로필 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: tok.textPrimary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
            }}>
              {match.nickname ?? '익명'}
            </span>
            {match.grade && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                background: `${ROOMMATE_ACCENT}1a`, color: ROOMMATE_ACCENT,
              }}>
                {match.grade}
              </span>
            )}
          </div>

          {match.dept && (
            <p style={{ fontSize: 12, color: tok.textSecondary, margin: '0 0 8px' }}>
              {match.dept}
            </p>
          )}

          {/* 태그 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <InfoTag label={`취침 ${match.bedtime_start}${match.bedtime_start !== match.bedtime_end ? `~${match.bedtime_end}` : ''}`} tok={tok} />
            <InfoTag label={match.smoking === 'smoker' ? '흡연' : '비흡연'} tok={tok}
              highlight={match.smoking === 'smoker'} />
            <InfoTag label={`청결 ${cleanlinessLabel}`} tok={tok} />
            {match.dormitory && <InfoTag label={match.dormitory} tok={tok} />}
          </div>

          {/* 한 줄 소개 */}
          {match.introduction && (
            <p style={{
              fontSize: 12, color: tok.textSecondary, margin: '10px 0 0',
              lineHeight: 1.5,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {match.introduction}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoTag({ label, tok, highlight = false }: {
  label: string; tok: ThemeTokens; highlight?: boolean
}) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
      background: highlight ? tok.dangerBg : `${ROOMMATE_ACCENT}14`,
      color: highlight ? tok.dangerColor : ROOMMATE_ACCENT,
    }}>
      {label}
    </span>
  )
}
