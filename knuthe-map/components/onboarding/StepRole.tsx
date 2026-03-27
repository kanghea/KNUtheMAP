'use client'

export type UserRole = 'tenant' | 'owner' | 'agent'

interface Props {
  selected: UserRole | null
  onSelect: (role: UserRole) => void
}

const ROLES = [
  {
    key: 'tenant' as UserRole,
    emoji: '🔍',
    title: '방 구하기',
    desc: '경북대 주변 매물을 찾고\n건물 정보·리뷰를 확인해요',
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    key: 'owner' as UserRole,
    emoji: '🏠',
    title: '건물주',
    desc: '내 건물 호실을 직접 관리하고\n임대 계약을 등록해요',
    color: '#16a34a',
    bg: '#f0fdf4',
    badge: '관리자 승인 필요',
  },
  {
    key: 'agent' as UserRole,
    emoji: '🏢',
    title: '공인중개사',
    desc: '여러 건물 매물을 등록·관리하고\n통계와 계약을 한 곳에서 확인해요',
    color: '#7c3aed',
    bg: '#f5f3ff',
    badge: '관리자 승인 필요',
  },
]

export default function StepRole({ selected, onSelect }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ROLES.map((r) => {
        const active = selected === r.key
        return (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 18px', borderRadius: 16, textAlign: 'left',
              border: active ? `2px solid ${r.color}` : '2px solid #e2e8f0',
              background: active ? r.bg : '#fff',
              cursor: 'pointer', transition: 'border .15s, background .15s',
              width: '100%',
            }}
          >
            <span style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: active ? r.bg : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, border: active ? `1.5px solid ${r.color}40` : '1.5px solid #f1f5f9',
            }}>
              {r.emoji}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: active ? r.color : '#0f172a' }}>
                  {r.title}
                </span>
                {r.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                    background: '#fef3c7', color: '#92400e',
                  }}>
                    {r.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {r.desc}
              </span>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: active ? `2px solid ${r.color}` : '2px solid #cbd5e1',
              background: active ? r.color : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {active && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
