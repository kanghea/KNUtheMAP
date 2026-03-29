'use client'

import { useState, useEffect, useRef } from 'react'

interface Building { id: string; name: string | null; address: string | null; total_floors: number | null }

interface Props {
  userId: string
  onRegistered: (building: unknown) => void
}

export default function BuildingRegister({ onRegistered }: Props) {
  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState<Building[]>([])
  const [searching,    setSearching]    = useState(false)
  const [selected,     setSelected]     = useState<Building | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/buildings/search?q=${encodeURIComponent(query)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.buildings ?? data ?? [])
      }
      setSearching(false)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleRegister = async () => {
    if (!selected) return
    setSaving(true); setError(null)

    const res = await fetch('/api/owner/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building_id: selected.id }),
    })

    setSaving(false)
    if (!res.ok) {
      const j = await res.json()
      setError(j.error ?? '등록에 실패했어요')
      return
    }
    const data = await res.json()
    onRegistered(data)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: '1.5px solid rgba(255,255,255,0.12)', fontSize: 16, color: '#ffffff',
    background: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: '#111111', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)', padding: '24px 20px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
          관리할 건물을 등록해주세요
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
          건물을 검색해서 등록하면 호실·계약 관리를 시작할 수 있어요
        </p>
      </div>

      {!selected ? (
        <>
          <input
            style={inputStyle}
            placeholder="건물명 또는 주소로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>검색 중…</p>
          )}
          {results.length > 0 && (
            <div style={{
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, overflow: 'hidden', marginTop: 8,
              background: '#1a1a1a',
            }}>
              {results.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelected(b); setResults([]) }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                    {b.name ?? '(이름 없음)'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{b.address}</div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{
            background: 'rgba(37,99,235,0.12)', border: '1.5px solid rgba(37,99,235,0.3)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>
                {selected.name ?? '이름 없는 건물'}
              </div>
              <div style={{ fontSize: 11, color: '#93c5fd', marginTop: 3 }}>{selected.address}</div>
              {selected.total_floors && (
                <div style={{ fontSize: 11, color: '#93c5fd' }}>{selected.total_floors}층</div>
              )}
            </div>
            <button onClick={() => setSelected(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#93c5fd' }}>
              변경
            </button>
          </div>

          {error && <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 10px' }}>{error}</p>}

          <button
            onClick={handleRegister}
            disabled={saving}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: saving ? '#93c5fd' : '#2563eb', color: '#fff',
              border: 'none', cursor: saving ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 700,
            }}
          >
            {saving ? '등록 중…' : '이 건물로 시작하기'}
          </button>
        </>
      )}
    </div>
  )
}
