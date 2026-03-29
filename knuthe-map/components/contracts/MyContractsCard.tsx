'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase-browser'

interface Contract {
  id:            string
  contract_type: '월세' | '전세'
  rent:          number | null
  deposit:       number
  area_m2:       number | null
  floor:         number | null
  room_type:     string | null
  contract_date: string | null
  source:        string
  buildings: {
    name:    string | null
    address: string | null
  } | null
}

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

interface Props {
  initialContracts?: Contract[]
  hideHeader?: boolean
  theme?: 'light' | 'dark'
}

export default function MyContractsCard({ initialContracts, hideHeader, theme = 'dark' }: Props) {
  const [contracts, setContracts] = useState<Contract[] | null>(initialContracts ?? null)
  const [loggedIn,  setLoggedIn]  = useState<boolean | null>(null)
  const [loading,   setLoading]   = useState(!initialContracts)

  const isDark = theme === 'dark'

  // 테마 변수
  const cardBg   = isDark ? '#111111'                    : '#fff'
  const border   = isDark ? 'rgba(255,255,255,0.08)'     : '#f1f5f9'
  const shadow   = isDark ? '0 2px 12px rgba(0,0,0,0.4)': '0 2px 12px rgba(0,0,0,0.04)'
  const title    = isDark ? '#ffffff'                    : '#0f172a'
  const muted    = isDark ? 'rgba(255,255,255,0.35)'     : '#94a3b8'
  const emptyBg  = isDark ? 'rgba(255,255,255,0.05)'     : '#f8fafc'
  const emptyTxt = isDark ? 'rgba(255,255,255,0.5)'      : '#64748b'
  const divider  = isDark ? 'rgba(255,255,255,0.05)'     : '#f8fafc'
  const priceTxt = isDark ? '#ffffff'                    : '#0f172a'
  const metaTxt  = isDark ? 'rgba(255,255,255,0.5)'      : '#64748b'
  const addrMuted= isDark ? 'rgba(255,255,255,0.35)'     : '#94a3b8'

  useEffect(() => {
    if (initialContracts) {
      setLoggedIn(true)
      return
    }

    const supabase = createBrowserSupabase()

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      setLoggedIn(!!user)
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('transactions')
        .select('id, contract_type, rent, deposit, area_m2, floor, room_type, contract_date, source, buildings(name, address)')
        .eq('reported_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

      setContracts((data as unknown as Contract[]) ?? [])
      setLoading(false)
    }

    load()
  }, [initialContracts])

  // ── 비로그인 ──────────────────────────────────────────────────────
  if (loggedIn === false) {
    return (
      <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: shadow, marginBottom: 16, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: title, margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{ background: emptyBg, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <p style={{ margin: 0, fontSize: 13, color: emptyTxt, textAlign: 'center', lineHeight: 1.6 }}>
            로그인하면 내가 제보한<br />계약 내역을 관리할 수 있어요
          </p>
          <Link
            href="/login"
            style={{
              marginTop: 4, padding: '10px 24px', borderRadius: 999,
              background: '#2563eb', color: '#fff',
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
      <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: shadow, marginBottom: 16, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: title, margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: muted }}>불러오는 중…</span>
        </div>
      </div>
    )
  }

  // ── 빈 상태 ───────────────────────────────────────────────────────
  if (contracts?.length === 0) {
    return (
      <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: shadow, marginBottom: 16, padding: '20px' }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: title, margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{ background: emptyBg, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <p style={{ margin: 0, fontSize: 13, color: emptyTxt, textAlign: 'center' }}>
            아직 제보한 거래 내역이 없어요
          </p>
          <p style={{ margin: 0, fontSize: 12, color: muted, textAlign: 'center' }}>
            건물 페이지에서 실거주 리뷰를 작성하면<br />자동으로 등록됩니다
          </p>
        </div>
      </div>
    )
  }

  // ── 목록 ──────────────────────────────────────────────────────────
  return (
    <div style={{ background: cardBg, borderRadius: 20, border: `1px solid ${border}`, boxShadow: shadow, marginBottom: 16, overflow: 'hidden' }}>
      {!hideHeader && (
        <div style={{ padding: '18px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: title, margin: 0 }}>내 계약 관리</h2>
          <span style={{ fontSize: 12, color: muted }}>{contracts?.length}건</span>
        </div>
      )}

      <div>
        {contracts?.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: '14px 20px',
              borderTop: i === 0 && hideHeader ? 'none' : `1px solid ${divider}`,
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: '4px 8px', borderRadius: 8,
              background: c.contract_type === '월세'
                ? (isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff')
                : (isDark ? 'rgba(5,150,105,0.15)' : '#f0fdf4'),
              color: c.contract_type === '월세'
                ? (isDark ? '#60a5fa' : '#2563eb')
                : (isDark ? '#4ade80' : '#16a34a'),
            }}>
              {c.contract_type}
            </span>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: priceTxt, marginBottom: 2 }}>
                {priceLabel(c)}
              </div>
              <div style={{ fontSize: 11, color: metaTxt, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {buildingLabel(c)}
                {metaLabel(c) && <span style={{ color: addrMuted }}> · {metaLabel(c)}</span>}
              </div>
            </div>

            {c.contract_date && (
              <span style={{ fontSize: 11, color: muted, flexShrink: 0 }}>
                {c.contract_date.slice(0, 7)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
