import Link from 'next/link'
import { getServerThemeTokens } from '@/lib/theme-server'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>
}) {
  const [{ msg }, { tok }] = await Promise.all([
    searchParams,
    getServerThemeTokens(),
  ])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tok.pageBg, padding: 16,
    }}>
      <div style={{
        width: '100%', maxWidth: 384,
        background: tok.cardBg,
        borderRadius: 16,
        border: `1px solid ${tok.cardBorder}`,
        boxShadow: tok.shadow,
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: tok.dangerBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke={tok.dangerColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>
            로그인 실패
          </h1>
          <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0 }}>
            인증 과정에서 문제가 발생했어요.
          </p>
        </div>

        {msg && (
          <div style={{
            background: tok.dangerBg,
            border: `1px solid ${tok.dangerColor}30`,
            borderRadius: 12,
            padding: '12px 14px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: tok.dangerColor, margin: '0 0 4px' }}>
              에러 내용
            </p>
            <p style={{ fontSize: 12, color: tok.dangerColor, fontFamily: 'monospace',
                        wordBreak: 'break-all', margin: 0 }}>
              {msg}
            </p>
          </div>
        )}

        <Link href="/login" style={{
          width: '100%', textAlign: 'center', textDecoration: 'none',
          background: tok.accentBg, color: tok.accentColor,
          borderRadius: 12, padding: '12px 16px',
          fontSize: 14, fontWeight: 700,
        }}>
          다시 시도
        </Link>
      </div>
    </div>
  )
}
