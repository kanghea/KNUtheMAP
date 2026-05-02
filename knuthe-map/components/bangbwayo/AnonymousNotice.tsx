import Link from 'next/link'
import type { ThemeTokens } from '@/lib/theme-tokens'

/**
 * 방봐요 — 익명 사용자에게 정식 로그인 권유.
 *
 * 익명 사용자가 만든 셋·트랙은 Supabase Anonymous Auth 의 user_id 에 묶여
 * 디바이스 쿠키에 종속. 다른 디바이스/브라우저에서는 못 본다.
 *
 * 로그인하면 자동으로 같은 user_id 에 OAuth identity 가 link 되어 데이터 그대로 유지.
 * 사용자에게 이 차이를 알리고 로그인 진입점 제공.
 *
 * 표시 조건: 페이지 측에서 `user.is_anonymous === true` 일 때만 렌더.
 */
export default function AnonymousNotice({
  tok,
  redirectAfter,
}: {
  tok: ThemeTokens
  /** 로그인 후 돌아갈 경로 (기본 현재 페이지) */
  redirectAfter?: string
}) {
  const next = redirectAfter ?? '/bangbwayo'
  const loginHref = `/login?next=${encodeURIComponent(next)}`

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      borderRadius: 12,
      background: tok.accentBg,
      border: `1px solid ${tok.cardBorder}`,
      marginBottom: 14,
    }}>
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>👋</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: tok.accentColor, margin: 0 }}>
          비로그인으로 사용 중이에요
        </p>
        <p style={{ fontSize: 11, color: tok.textSecondary, margin: '2px 0 0', lineHeight: 1.4 }}>
          로그인하면 다른 기기에서도 같은 기록을 볼 수 있어요.
        </p>
      </div>
      <Link
        href={loginHref}
        className="knu-press"
        style={{
          flexShrink: 0,
          padding: '6px 12px', borderRadius: 999,
          background: tok.accentColor, color: '#fff',
          fontSize: 11, fontWeight: 700,
          textDecoration: 'none',
          transition: 'transform .1s',
        }}
      >
        로그인
      </Link>
    </div>
  )
}
