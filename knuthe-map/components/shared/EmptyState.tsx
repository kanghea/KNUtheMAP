import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens } from '@/lib/theme-tokens'

interface EmptyStateProps {
  tok: ThemeTokens
  /** 아이콘 컴포넌트 또는 이모지 */
  icon?: ReactNode
  title: string
  description?: string
  /** 선택적 액션 (예: 필터 초기화 버튼) */
  action?: { label: string; onClick: () => void } | ReactNode
  /** 외부 padding (기본 '60px 24px') */
  padding?: string | number
  style?: CSSProperties
}

function isActionPair(a: EmptyStateProps['action']): a is { label: string; onClick: () => void } {
  return !!a && typeof a === 'object' && 'label' in a && 'onClick' in a
}

/**
 * 리스트가 비어있을 때 보여주는 중앙 정렬 빈 상태.
 * "조건에 맞는 방이 없어요" 같은 안내에 사용.
 */
export function EmptyState({
  tok, icon, title, description, action,
  padding = '60px 24px',
  style,
}: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 12, padding,
      ...style,
    }}>
      {icon}
      <p style={{ fontSize: 16, fontWeight: 700, color: tok.textPrimary, margin: 0 }}>
        {title}
      </p>
      {description && (
        <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {isActionPair(action) ? (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 4, padding: '8px 20px', borderRadius: 999,
            background: tok.cardBg, border: `1px solid ${tok.cardBorder}`,
            cursor: 'pointer', fontSize: 13, fontWeight: 600, color: tok.textSecondary,
          }}
        >
          {action.label}
        </button>
      ) : action}
    </div>
  )
}
