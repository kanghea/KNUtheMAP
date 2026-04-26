'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTheme } from '@/lib/hooks/useTheme'
import { Card } from '@/components/shared/Card'
import { IconAlert } from '@/components/shared/icons'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') console.error(error)
  }, [error])

  const { tok } = useTheme()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tok.pageBg, padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 384 }}>
        <Card tok={tok} radius={16} padding="32px 28px"
              style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: tok.dangerBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconAlert size={26} color={tok.dangerColor} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>
              문제가 발생했어요
            </h1>
            <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
              잠시 후 다시 시도해 주세요.<br />문제가 계속되면 새로고침 해 주세요.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button
              onClick={reset}
              style={{
                flex: 1,
                background: tok.accentBg, color: tok.accentColor,
                border: 'none', borderRadius: 12,
                padding: '12px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              다시 시도
            </button>
            <Link href="/" style={{
              flex: 1,
              background: tok.inputBg, color: tok.textPrimary,
              border: `1px solid ${tok.inputBorder}`, borderRadius: 12,
              padding: '12px 16px', fontSize: 14, fontWeight: 700,
              textAlign: 'center', textDecoration: 'none',
            }}>
              홈으로
            </Link>
          </div>

          {error.digest && (
            <p style={{ fontSize: 11, color: tok.textTertiary, margin: 0, fontFamily: 'monospace' }}>
              {error.digest}
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
