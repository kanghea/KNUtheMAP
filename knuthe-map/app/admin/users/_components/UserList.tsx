'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  nickname: string | null
  role: string
  created_at: string
}

const ROLE_OPTIONS = ['tenant', 'owner', 'agent', 'admin']

const ROLE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  tenant: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',  label: '학생' },
  owner:  { bg: 'rgba(34,197,94,0.15)',   color: '#4ade80',                label: '건물주' },
  agent:  { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa',                label: '중개사' },
  admin:  { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24',                label: '관리자' },
}

export default function UserList({ users }: { users: User[] }) {
  const [list,       setList]       = useState(users)
  const [search,     setSearch]     = useState('')
  const [changing,   setChanging]   = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const filtered = list.filter((u) => {
    const matchSearch = !search ||
      u.email.includes(search) ||
      (u.nickname ?? '').includes(search)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChanging(userId)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    })
    setChanging(null)
    if (res.ok) {
      setList((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* 검색 */}
      <input
        placeholder="이메일 또는 닉네임 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 12,
          border: '1.5px solid rgba(255,255,255,0.12)', fontSize: 16, color: '#ffffff',
          background: '#1a1a1a', outline: 'none', boxSizing: 'border-box',
        }}
      />

      {/* 역할 필터 탭 */}
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4 }}>
        {(['all', ...ROLE_OPTIONS] as const).map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 600,
            background: roleFilter === r ? '#1a1a1a' : 'transparent',
            color: roleFilter === r ? '#ffffff' : 'rgba(255,255,255,0.35)',
            boxShadow: roleFilter === r ? '0 1px 4px rgba(0,0,0,0.4)' : 'none',
          }}>
            {r === 'all' ? `전체 (${list.length})` : (ROLE_STYLE[r]?.label ?? r)}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          검색 결과가 없어요
        </div>
      )}

      {filtered.map((u) => {
        const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.tenant
        return (
          <div key={u.id} style={{
            background: '#111111', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 1px 6px rgba(0,0,0,0.4)', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* 아바타 */}
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: rs.bg, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: rs.color,
            }}>
              {(u.nickname ?? u.email)[0].toUpperCase()}
            </div>

            {/* 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.nickname ?? '(닉네임 없음)'}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {u.email}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                가입 {new Date(u.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>

            {/* 역할 변경 */}
            <select
              value={u.role}
              disabled={changing === u.id}
              onChange={(e) => handleRoleChange(u.id, e.target.value)}
              style={{
                padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                border: `1.5px solid ${rs.color}40`,
                background: rs.bg, color: rs.color,
                cursor: 'pointer', outline: 'none', flexShrink: 0,
                opacity: changing === u.id ? 0.5 : 1,
              }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_STYLE[r]?.label ?? r}</option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}
