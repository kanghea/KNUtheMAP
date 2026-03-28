'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase-browser'

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
  source:        string
  buildings: {
    name:    string | null
    address: string | null
  } | null
}

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
}

export default function MyContractsCard({ initialContracts, hideHeader }: Props) {
  const [contracts, setContracts] = useState<Contract[] | null>(initialContracts ?? null)
  const [loggedIn,  setLoggedIn]  = useState<boolean | null>(null)
  const [loading,   setLoading]   = useState(!initialContracts)

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
      <div style={{
        background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xs)', marginBottom: 16,
        padding: '20px',
      }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
            내 계약 관리
          </h2>
        )}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 14, padding: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 28 }}>📋</span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
            로그인하면 내가 제보한<br />계약 내역을 관리할 수 있어요
          </p>
          <Link
            href="/login"
            style={{
              marginTop: 4, padding: '10px 24px', borderRadius: 999,
              background: 'var(--color-primary)', color: 'var(--text-inverse)',
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
      <div style={{
        background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xs)', marginBottom: 16,
        padding: '20px',
      }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>불러오는 중…</span>
        </div>
      </div>
    )
  }

  // ── 빈 상태 ───────────────────────────────────────────────────────
  if (contracts?.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xs)', marginBottom: 16,
        padding: '20px',
      }}>
        {!hideHeader && (
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>내 계약 관리</h2>
        )}
        <div style={{
          background: 'var(--bg-secondary)', borderRadius: 14, padding: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 28 }}>📭</span>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            아직 제보한 거래 내역이 없어요
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            건물 페이지에서 실거주 리뷰를 작성하면<br />자동으로 등록됩니다
          </p>
        </div>
      </div>
    )
  }

  // ── 목록 ──────────────────────────────────────────────────────────
  return (
    <div style={{
      background: 'var(--bg-elevated)', borderRadius: 20, border: '1px solid var(--border-primary)',
      boxShadow: 'var(--shadow-xs)', marginBottom: 16,
      overflow: 'hidden',
    }}>
      {!hideHeader && (
        <div style={{
          padding: '18px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>내 계약 관리</h2>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{contracts?.length}건</span>
        </div>
      )}

      <div>
        {contracts?.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: '14px 20px',
              borderTop: i === 0 && hideHeader ? 'none' : '1px solid #f8fafc',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            {/* 계약 유형 배지 */}
            <span style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              padding: '4px 8px', borderRadius: 8,
              background: c.contract_type === '월세' ? '#eff6ff' : '#f0fdf4',
              color: c.contract_type === '월세' ? '#2563eb' : '#16a34a',
            }}>
              {c.contract_type}
            </span>

            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                {priceLabel(c)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {buildingLabel(c)}
                {metaLabel(c) && <span style={{ color: 'var(--text-tertiary)' }}> · {metaLabel(c)}</span>}
              </div>
            </div>

            {/* 날짜 */}
            {c.contract_date && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {c.contract_date.slice(0, 7)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
