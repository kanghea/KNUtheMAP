'use client'

export default function LogoutButton() {
  return (
    <div style={{ marginTop: 8, textAlign: 'center' }}>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500, padding: '8px',
          }}
        >
          로그아웃
        </button>
      </form>
    </div>
  )
}
