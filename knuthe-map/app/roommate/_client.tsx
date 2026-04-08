'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { THEME_TOKENS, type ThemeMode } from '@/lib/theme-tokens'
import { loadRoommateDraft, clearRoommateDraft, DORMITORIES } from '@/lib/roommate-constants'

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

// ── 테마 토큰 확장 ──
const TOKENS = {
  dark: {
    ...THEME_TOKENS.dark,
    accent: '#6C63FF',
    tabActive: '#6C63FF',
    tabInactive: 'rgba(255,255,255,0.3)',
    tabBg: '#111111',
    filterChipBg: '#1a1a1a',
    filterChipBorder: 'rgba(255,255,255,0.12)',
    filterChipActiveBg: 'rgba(108,99,255,0.15)',
    filterChipActiveBorder: 'rgba(108,99,255,0.5)',
    scoreGradient: 'linear-gradient(135deg, #6C63FF, #8B5CF6)',
    emptyColor: 'rgba(255,255,255,0.25)',
    logoFilter: 'brightness(0) invert(1)',
  },
  light: {
    ...THEME_TOKENS.light,
    accent: '#2563eb',
    tabActive: '#2563eb',
    tabInactive: '#94a3b8',
    tabBg: '#ffffff',
    filterChipBg: '#f1f5f9',
    filterChipBorder: '#e2e8f0',
    filterChipActiveBg: 'rgba(37,99,235,0.08)',
    filterChipActiveBorder: 'rgba(37,99,235,0.4)',
    scoreGradient: 'linear-gradient(135deg, #2563eb, #4f46e5)',
    emptyColor: '#94a3b8',
    logoFilter: 'none',
  },
} as const

export default function RoommateClient({ saveDraft }: { saveDraft: boolean }) {
  const router = useRouter()
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'dormitory' | 'offcampus'>('dormitory')
  const [dormFilter, setDormFilter] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const tok = TOKENS[theme]

  // 테마 감지
  useEffect(() => {
    try {
      const raw = document.cookie.split('; ').find(r => r.startsWith('knu_prefs='))
      if (raw) {
        const prefs = JSON.parse(decodeURIComponent(raw.split('=')[1]))
        if (prefs.theme === 'light') setTheme('light')
      }
    } catch { /* ignore */ }
  }, [])

  // 온보딩 후 로컬스토리지에서 프로필 저장
  useEffect(() => {
    if (!saveDraft || saved) return
    const draft = loadRoommateDraft()
    if (!draft || !draft.profile || !draft.weights) {
      // 로컬스토리지에 데이터가 없음 (OAuth 리다이렉트 중 유실 가능)
      // 온보딩으로 돌려보내기
      console.warn('[roommate] 임시 저장 데이터가 없습니다')
      setError('프로필 데이터를 찾을 수 없어요. 다시 등록해 주세요.')
      setLoading(false)
      return
    }

    fetch('/api/roommate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: draft.profile, weights: draft.weights }),
    })
      .then(async res => {
        if (res.ok) {
          clearRoommateDraft()
          setSaved(true)
          router.replace('/roommate')
        } else {
          const data = await res.json().catch(() => ({}))
          console.error('[roommate] 프로필 저장 실패:', data)
          setError(data.error ?? '프로필 저장에 실패했어요. 다시 시도해 주세요.')
          setLoading(false)
        }
      })
      .catch(err => {
        console.error('[roommate] 네트워크 에러:', err)
        setError('네트워크 오류가 발생했어요. 다시 시도해 주세요.')
        setLoading(false)
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
      // 프로필 미등록 → 온보딩으로
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
    <div style={{
      minHeight: '100vh', background: tok.pageBg,
      transition: 'background .4s ease',
    }}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        transition: 'background .4s ease, border-color .4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image
            src="/images/경북대 로고(현).png"
            alt="경북대학교"
            width={28}
            height={28}
            style={{ objectFit: 'contain', filter: tok.logoFilter, transition: 'filter .4s ease' }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: tok.textPrimary, transition: 'color .4s ease' }}>
            룸메이트
          </span>
        </div>
        <button
          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: `1px solid ${tok.cardBorder}`, background: tok.cardBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
            transition: 'background .4s ease, border-color .4s ease',
          }}
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </header>

      {/* 탭 */}
      <div style={{
        display: 'flex', gap: 0, padding: '0 20px',
        borderBottom: `1px solid ${tok.headerBorder}`,
        background: tok.tabBg,
        transition: 'background .4s ease, border-color .4s ease',
      }}>
        {([['dormitory', '기숙사'], ['offcampus', '자취방']] as const).map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setDormFilter(null) }} style={{
            flex: 1, padding: '14px 0', fontSize: 14, fontWeight: 700,
            background: 'none', border: 'none', cursor: 'pointer',
            color: tab === key ? tok.tabActive : tok.tabInactive,
            borderBottom: tab === key ? `2px solid ${tok.tabActive}` : '2px solid transparent',
            transition: 'color .3s ease, border-color .3s ease',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* 기숙사 건물 필터 */}
      {tab === 'dormitory' && (
        <div style={{
          display: 'flex', gap: 6, padding: '12px 20px',
          overflowX: 'auto',
        }}>
          <FilterChip label="전체" active={!dormFilter} onClick={() => setDormFilter(null)} tok={tok} />
          {DORMITORIES.map(d => (
            <FilterChip key={d} label={d} active={dormFilter === d}
              onClick={() => setDormFilter(dormFilter === d ? null : d)} tok={tok} />
          ))}
        </div>
      )}

      {/* 매칭 목록 */}
      <main style={{ padding: '16px 20px', maxWidth: 600, margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: tok.textTertiary }}>
            <p style={{ fontSize: 14 }}>매칭 중...</p>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: tok.textTertiary }}>
            <p style={{ fontSize: 14 }}>{error}</p>
            <button onClick={fetchMatches} style={{
              marginTop: 12, padding: '8px 20px', borderRadius: 10,
              background: tok.accent, color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: tok.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg viewBox="0 0 24 24" width={28} height={28} fill="none"
                stroke={tok.emptyColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: tok.textPrimary, marginBottom: 6, transition: 'color .4s ease' }}>
              아직 매칭할 룸메이트가 없어요
            </p>
            <p style={{ fontSize: 13, color: tok.textSecondary, transition: 'color .4s ease' }}>
              더 많은 사용자가 등록하면 알려드릴게요
            </p>
          </div>
        )}

        {!loading && !error && matches.map(m => (
          <MatchCard key={m.user_id} match={m} tok={tok} />
        ))}
      </main>
    </div>
  )
}

// ── 필터 칩 ──
function FilterChip({ label, active, onClick, tok }: {
  label: string; active: boolean; onClick: () => void
  tok: typeof TOKENS[keyof typeof TOKENS]
}) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
      border: `1.5px solid ${active ? tok.filterChipActiveBorder : tok.filterChipBorder}`,
      background: active ? tok.filterChipActiveBg : tok.filterChipBg,
      color: active ? tok.accent : tok.textSecondary,
      transition: 'all .2s ease',
    }}>
      {label}
    </button>
  )
}

// ── 매칭 카드 ──
function MatchCard({ match, tok }: {
  match: MatchResult
  tok: typeof TOKENS[keyof typeof TOKENS]
}) {
  const cleanlinessLabel = ['', '낮음', '보통', '높음', '매우 높음'][match.cleanliness] ?? ''

  return (
    <div style={{
      padding: '18px', borderRadius: 18, marginBottom: 12,
      background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
      boxShadow: tok.shadow,
      transition: 'background .4s ease, border-color .4s ease, box-shadow .4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* 호환도 */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: tok.scoreGradient,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {match.compatibility}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>%</span>
        </div>

        {/* 프로필 정보 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: tok.textPrimary, transition: 'color .4s ease' }}>
              {match.nickname ?? '익명'}
            </span>
            {match.grade && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                background: tok.accentBg, color: tok.accentColor,
              }}>
                {match.grade}
              </span>
            )}
          </div>

          {match.dept && (
            <p style={{ fontSize: 12, color: tok.textSecondary, margin: '0 0 8px', transition: 'color .4s ease' }}>
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
              lineHeight: 1.5, transition: 'color .4s ease',
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
  label: string; tok: typeof TOKENS[keyof typeof TOKENS]; highlight?: boolean
}) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
      background: highlight ? tok.dangerBg : tok.accentBg,
      color: highlight ? tok.dangerColor : tok.accentColor,
    }}>
      {label}
    </span>
  )
}
