'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ── 타입 ──────────────────────────────────────────────────────────────

interface Contract {
  id:            string
  contract_type: '월세' | '전세'
  rent:          number | null
  deposit:       number
  area_m2:       number | null
  floor:         number | null
  room_type:     string | null
  contract_date: string | null
  buildings: {
    name:    string | null
    address: string | null
  } | null
}

interface UserContractRow {
  id:             string
  contract_type:  '월세' | '전세'
  deposit:        number
  monthly_rent:   number | null
  area_m2:        number | null
  floor:          number | null
  room_type:      string | null
  contract_start: string | null
  contract_end:   string | null
  buildings: {
    name:    string | null
    address: string | null
  } | null
}

// ── 테마 토큰 ─────────────────────────────────────────────────────────

const TOK = {
  dark: {
    cardBg:      '#111111',
    altBg:       'rgba(255,255,255,0.04)',
    border:      'rgba(255,255,255,0.07)',
    borderSoft:  'rgba(255,255,255,0.05)',
    shadow:      '0 2px 12px rgba(0,0,0,0.3)',
    textPrimary: '#ffffff',
    textSecond:  'rgba(255,255,255,0.65)',
    textThird:   'rgba(255,255,255,0.35)',
    badgeWolse:  { bg: 'rgba(37,99,235,0.18)',  color: '#60a5fa' },
    badgeJeonse: { bg: 'rgba(16,185,129,0.18)', color: '#34d399' },
    loginBtnBg:  '#2563eb',
    loginBtnTx:  '#ffffff',
  },
  light: {
    cardBg:      '#ffffff',
    altBg:       '#f8fafc',
    border:      '#f1f5f9',
    borderSoft:  '#f8fafc',
    shadow:      '0 2px 12px rgba(0,0,0,0.04)',
    textPrimary: '#0f172a',
    textSecond:  '#334155',
    textThird:   '#64748b',
    badgeWolse:  { bg: '#eff6ff', color: '#2563eb' },
    badgeJeonse: { bg: '#f0fdf4', color: '#16a34a' },
    loginBtnBg:  '#2563eb',
    loginBtnTx:  '#ffffff',
  },
} as const

type Tok = typeof TOK[keyof typeof TOK]

// ── 유틸 ──────────────────────────────────────────────────────────────

function priceLabel(c: Contract): string {
  if (c.contract_type === '전세') return `전세 ${c.deposit.toLocaleString()}만`
  const dep  = c.deposit > 0 ? `${c.deposit.toLocaleString()}만/` : ''
  const rent = c.rent ? `월 ${c.rent.toLocaleString()}만` : '-'
  return `${dep}${rent}`
}

function buildingLabel(c: Contract): string {
  if (c.buildings?.name?.trim()) return c.buildings.name.trim()
  if (c.buildings?.address) {
    const parts = c.buildings.address.trim().split(' ')
    return parts.slice(-2).join(' ')
  }
  return '건물명 없음'
}

function metaLabel(c: Contract): string {
  return [c.room_type, c.floor ? `${c.floor}층` : null, c.area_m2 ? `${Math.round(c.area_m2)}㎡` : null]
    .filter(Boolean).join(' · ')
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────

interface Props {
  /** 마이페이지에서 이미 서버에서 fetch 한 데이터를 전달할 때 사용 */
  initialContracts?: Contract[]
  /** 헤더 숨김 여부 (마이페이지 등 이미 제목이 있는 경우) */
  hideHeader?: boolean
  /** 다크/라이트 테마 */
  theme?: 'dark' | 'light'
}

export default function MyContractsCard({ initialContracts, hideHeader, theme = 'light' }: Props) {
  const [contracts, setContracts] = useState<Contract[] | null>(initialContracts ?? null)
  const [loggedIn,  setLoggedIn]  = useState<boolean | null>(null)
  const [loading,   setLoading]   = useState(!initialContracts)

  const tok: Tok = TOK[theme]

  useEffect(() => {
    if (initialContracts) {
      setLoggedIn(true)
      return
    }

    async function load() {
      const res = await fetch('/api/user-contracts')
      if (res.status === 401) { setLoggedIn(false); setLoading(false); return }
      setLoggedIn(true)
      if (!res.ok) { setContracts([]); setLoading(false); return }

      const rows = (await res.json()) as UserContractRow[]
      const mapped: Contract[] = (rows ?? []).map((r) => ({
        id:            r.id,
        contract_type: r.contract_type,
        rent:          r.monthly_rent,
        deposit:       r.deposit,
        area_m2:       r.area_m2,
        floor:         r.floor,
        room_type:     r.room_type,
        contract_date: r.contract_start ?? r.contract_end ?? null,
        buildings:     r.buildings ?? null,
      }))
      setContracts(mapped)
      setLoading(false)
    }

    load()
  }, [initialContracts])

  const containerBase: React.CSSProperties = {
    background:   tok.cardBg,
    borderRadius: 20,
    border:       `1px solid ${tok.border}`,
    boxShadow:    tok.shadow,
    marginBottom: 16,
  }

  // ── 비로그인 ──────────────────────────────────────────────────────
  if (loggedIn === false) {
    return (
      <div style={{ ...containerBase, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 12px' }}>
            내 계약 관리
          </h2>
        )}
        <div style={{
          background: tok.altBg, borderRadius: 14, padding: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <p style={{ margin: 0, fontSize: 13, color: tok.textThird, textAlign: 'center', lineHeight: 1.6 }}>
            로그인하면 내 계약을<br />등록·관리할 수 있어요
          </p>
          <Link
            href="/login"
            style={{
              marginTop: 4, padding: '10px 24px', borderRadius: 999,
              background: tok.loginBtnBg, color: tok.loginBtnTx,
              fontSize: 13, fontWeight: 700, textDecoration: 'none',
            }}
          >
            로그인하기
          </Link>
        </div>
      </div>
    )
  }

  // ── 로딩 ──────────────────────────────────────────────────────────
  if (loading || loggedIn === null) {
    return (
      <div style={{ ...containerBase, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: tok.textThird }}>불러오는 중…</span>
        </div>
      </div>
    )
  }

  // ── 빈 상태 ───────────────────────────────────────────────────────
  if (contracts?.length === 0) {
    return (
      <div style={{ ...containerBase, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{
          background: tok.altBg, borderRadius: 14, padding: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <p style={{ margin: 0, fontSize: 13, color: tok.textThird, textAlign: 'center' }}>
            아직 등록된 계약이 없어요
          </p>
          <p style={{ margin: 0, fontSize: 12, color: tok.textThird, textAlign: 'center' }}>
            마이페이지에서 계약을 추가하면<br />여기에 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  // ── 목록 ──────────────────────────────────────────────────────────
  return (
    <div style={{ ...containerBase, overflow: 'hidden' }}>
      {!hideHeader && (
        <div style={{
          padding: '18px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>내 계약 관리</h2>
          <span style={{ fontSize: 12, color: tok.textThird }}>{contracts?.length}건</span>
        </div>
      )}

      <div>
        {contracts?.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: '14px 20px',
              borderTop: i === 0 && hideHeader ? 'none' : `1px solid ${tok.borderSoft}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            {/* 계약 유형 배지 */}
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: '4px 8px', borderRadius: 8,
              background: c.contract_type === '월세' ? tok.badgeWolse.bg  : tok.badgeJeonse.bg,
              color:      c.contract_type === '월세' ? tok.badgeWolse.color : tok.badgeJeonse.color,
            }}>
              {c.contract_type}
            </span>

            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: tok.textPrimary, marginBottom: 2 }}>
                {priceLabel(c)}
              </div>
              <div style={{ fontSize: 11, color: tok.textSecond, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {buildingLabel(c)}
                {metaLabel(c) && <span style={{ color: tok.textThird }}> · {metaLabel(c)}</span>}
              </div>
            </div>

            {/* 날짜 */}
            {c.contract_date && (
              <span style={{ fontSize: 11, color: tok.textThird, flexShrink: 0 }}>
                {c.contract_date.slice(0, 7)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
