import Link from 'next/link'
import { getServerThemeTokens } from '@/lib/theme-server'
import { Card } from '@/components/shared/Card'

export default async function NotFound() {
  const { tok } = await getServerThemeTokens()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tok.pageBg, padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 384 }}>
        <Card tok={tok} radius={16} padding="36px 28px"
              style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            fontSize: 48, fontWeight: 900,
            color: tok.textTertiary, lineHeight: 1, letterSpacing: -2,
          }}>
            404
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: tok.textPrimary, margin: 0 }}>
              페이지를 찾을 수 없어요
            </h1>
            <p style={{ fontSize: 13, color: tok.textSecondary, margin: 0, lineHeight: 1.6 }}>
              주소가 바뀌었거나 삭제된 페이지일 수 있어요.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Link href="/" style={{
              flex: 1,
              background: tok.accentBg, color: tok.accentColor,
              borderRadius: 12,
              padding: '12px 16px', fontSize: 14, fontWeight: 700,
              textAlign: 'center', textDecoration: 'none',
            }}>
              홈으로
            </Link>
            <Link href="/map" style={{
              flex: 1,
              background: tok.inputBg, color: tok.textPrimary,
              border: `1px solid ${tok.inputBorder}`, borderRadius: 12,
              padding: '12px 16px', fontSize: 14, fontWeight: 700,
              textAlign: 'center', textDecoration: 'none',
            }}>
              지도 보기
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
