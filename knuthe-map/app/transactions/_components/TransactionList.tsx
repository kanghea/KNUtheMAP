'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-browser'
import AreaToggle from '@/components/shared/AreaToggle'
import { LoadingRunnerOverlay } from '@/components/shared/LoadingRunner'
import { THEME_TOKENS, type ThemeMode, type ThemeTokens } from '@/lib/theme-tokens'

// ── 타입 ──────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  contract_type: '월세' | '전세' | '매매'
  deposit: number
  monthly_rent: number | null
  area_m2: number | null
  floor: number | null
  room_type: string | null
  created_at: string
  buildings: {
    name: string | null
    address: string | null
    zone: string | null
  } | null
}

// ── 계약 유형 색상 ────────────────────────────────────────────────────

const CONTRACT_COLORS: Record<string, { dark: { bg: string; color: string }; light: { bg: string; color: string } }> = {
  월세: {
    dark:  { bg: 'rgba(37,99,235,0.15)', color: '#60a5fa' },
    light: { bg: 'rgba(37,99,235,0.08)', color: '#2563eb' },
  },
  전세: {
    dark:  { bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
    light: { bg: 'rgba(34,197,94,0.08)', color: '#16a34a' },
  },
  매매: {
    dark:  { bg: 'rgba(249,115,22,0.15)', color: '#fb923c' },
    light: { bg: 'rgba(249,115,22,0.08)', color: '#ea580c' },
  },
}

// ── 가격 포맷 ─────────────────────────────────────────────────────────

function fmtPrice(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}억`
  return `${n.toLocaleString()}만`
}

// ── 카드 컴포넌트 ─────────────────────────────────────────────────────

function TransactionCard({ tx, tok, theme }: { tx: Transaction; tok: ThemeTokens; theme: ThemeMode }) {
  const b = tx.buildings
  const cc = CONTRACT_COLORS[tx.contract_type]?.[theme] ?? CONTRACT_COLORS['월세'][theme]

  const priceLabel = tx.contract_type === '월세'
    ? `${fmtPrice(tx.deposit)} / ${tx.monthly_rent != null ? fmtPrice(tx.monthly_rent) : '-'}`
    : `${tx.contract_type} ${fmtPrice(tx.deposit)}`

  const dateLabel = new Date(tx.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <div style={{
      background: tok.cardBg,
      borderRadius: 16,
      border: `1px solid ${tok.cardBorder}`,
      boxShadow: tok.shadow,
      padding: '16px 18px',
    }}>
      {/* 상단: 건물명 + 계약 유형 배지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary }}>
          {b?.name ?? '(건물명 없음)'}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
          background: cc.bg, color: cc.color,
        }}>
          {tx.contract_type}
        </span>
        {tx.room_type && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 999,
            background: theme === 'dark' ? 'rgba(255,255,255,0.07)' : '#f1f5f9',
            color: tok.textSecondary,
          }}>
            {tx.room_type}
          </span>
        )}
      </div>

      {/* 주소 */}
      <div style={{
        fontSize: 12, color: tok.textTertiary, marginBottom: 8,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {b?.address ?? '주소 없음'}
        {b?.zone && ` · ${b.zone}`}
      </div>

      {/* 가격 + 메타 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: cc.color }}>
          {priceLabel}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tx.floor != null && (
            <span style={{ fontSize: 11, color: tok.textSecondary }}>{tx.floor}층</span>
          )}
          <AreaToggle areaM2={tx.area_m2} tok={tok} fontSize={11} />
        </div>
      </div>

      {/* 날짜 */}
      <div style={{ fontSize: 10, color: tok.textTertiary, marginTop: 6 }}>
        {dateLabel}
      </div>
    </div>
  )
}

// ── 메인 리스트 ───────────────────────────────────────────────────────

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [contractTab,  setContractTab]  = useState<'전체' | '월세' | '전세' | '매매'>('전체')
  const [sortBy,       setSortBy]       = useState<'latest' | 'price_asc' | 'price_desc'>('latest')
  const [theme,        setTheme]        = useState<ThemeMode>('dark')
  const supabaseRef = useRef(createBrowserSupabase())

  const tok = THEME_TOKENS[theme]

  // 시스템 테마 감지
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(mq.matches ? 'dark' : 'light')
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // 데이터 fetch — is_active인 방만 (보안: 비활성/비공개 데이터 노출 방지)
  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabaseRef.current
        .from('rooms')
        .select(`
          id, contract_type, deposit, monthly_rent,
          area_m2, floor, room_type, created_at,
          buildings ( name, address, zone )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Supabase는 1:N join을 배열로 반환할 수 있으므로 정규화
        const normalized = data.map((r: Record<string, unknown>) => ({
          ...r,
          buildings: Array.isArray(r.buildings) ? r.buildings[0] ?? null : r.buildings,
        }))
        setTransactions(normalized as Transaction[])
      }
    } catch {
      // rooms 테이블 미존재 시 빈 배열
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 필터링
  const filtered = transactions.filter((tx) => {
    // 계약 유형 필터
    if (contractTab !== '전체' && tx.contract_type !== contractTab) return false
    // 검색
    if (search) {
      const q = search.toLowerCase()
      const b = tx.buildings
      const match =
        (b?.name ?? '').toLowerCase().includes(q) ||
        (b?.address ?? '').toLowerCase().includes(q) ||
        (b?.zone ?? '').toLowerCase().includes(q) ||
        (tx.room_type ?? '').includes(q)
      if (!match) return false
    }
    return true
  })

  // 정렬
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.deposit - b.deposit
    if (sortBy === 'price_desc') return b.deposit - a.deposit
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const contractTabs = ['전체', '월세', '전세', '매매'] as const

  return (
    <div style={{ minHeight: '100vh', background: tok.pageBg, transition: 'background .3s' }}>

      {/* ── 헤더 ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: tok.headerBg, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${tok.headerBorder}`,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: tok.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
            실거래 수집
          </h1>
          <p style={{ fontSize: 11, color: tok.textTertiary, margin: '2px 0 0' }}>
            {loading ? '불러오는 중…' : `전체 ${transactions.length}건`}
          </p>
        </div>

        {/* 테마 토글 */}
        <button
          onClick={() => setTheme((t) => t === 'dark' ? 'light' : 'dark')}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
            border: `1px solid ${tok.cardBorder}`,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px 100px' }}>

        {/* ── 검색 ──────────────────────────────────────────── */}
        <input
          placeholder="건물명, 주소, 구역 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '11px 14px', borderRadius: 12,
            border: `1.5px solid ${tok.inputBorder}`, fontSize: 14,
            outline: 'none', boxSizing: 'border-box',
            background: tok.inputBg, color: tok.inputColor,
            marginBottom: 12,
          }}
        />

        {/* ── 계약 유형 탭 ──────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4,
          background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
          borderRadius: 10, padding: 3, marginBottom: 12,
        }}>
          {contractTabs.map((t) => (
            <button
              key={t}
              onClick={() => setContractTab(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: contractTab === t ? tok.cardBg : 'transparent',
                color: contractTab === t ? tok.textPrimary : tok.textTertiary,
                boxShadow: contractTab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
                transition: 'all .15s',
              }}
            >
              {t}
              {t !== '전체' && (
                <span style={{ marginLeft: 3, fontSize: 10, opacity: 0.6 }}>
                  {transactions.filter((tx) => tx.contract_type === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── 정렬 + 결과 수 ────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 12, padding: '0 2px',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: tok.textSecondary }}>
            {sorted.length}건
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '5px 8px', borderRadius: 8, fontSize: 11,
              border: `1px solid ${tok.inputBorder}`,
              background: tok.inputBg, color: tok.textSecondary,
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="latest">최신순</option>
            <option value="price_asc">가격 낮은순</option>
            <option value="price_desc">가격 높은순</option>
          </select>
        </div>

        {/* ── 리스트 ────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: tok.textTertiary, fontSize: 14 }}>
            불러오는 중…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{
            padding: '60px 0', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 40 }}>{search || contractTab !== '전체' ? '\uD83D\uDD0D' : '\uD83C\uDFE0'}</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
              {search || contractTab !== '전체' ? '조건에 맞는 거래가 없어요' : '아직 등록된 거래가 없어요'}
            </p>
            <p style={{ fontSize: 12, color: tok.textTertiary, margin: 0 }}>
              경북대 주변 실거래 정보가 등록되면 여기에 표시돼요
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sorted.map((tx) => (
              <TransactionCard key={tx.id} tx={tx} tok={tok} theme={theme} />
            ))}
          </div>
        )}
      </div>
      <LoadingRunnerOverlay show={loading} />
    </div>
  )
}
