import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>
}) {
  const { msg } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 px-8 py-10 flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">⚠️</span>
          <h1 className="text-lg font-bold text-gray-900">로그인 실패</h1>
          <p className="text-sm text-gray-500">인증 과정에서 문제가 발생했어요.</p>
        </div>

        {msg && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-red-500 mb-1">에러 내용</p>
            <p className="text-xs text-red-700 font-mono break-all">{msg}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500 leading-relaxed space-y-1">
          <p className="font-semibold text-gray-700">확인사항</p>
          <p>1. Supabase → Authentication → URL Configuration에 <code className="bg-gray-200 px-1 rounded">localhost:3000/auth/callback</code> 등록</p>
          <p>2. Google Cloud Console → OAuth 클라이언트 → 승인된 리디렉션 URI에 <code className="bg-gray-200 px-1 rounded">https://vgmmsemyeecphwqymxaw.supabase.co/auth/v1/callback</code> 등록</p>
          <p>3. Supabase → Authentication → Providers → Google에 Client ID / Secret 입력</p>
        </div>

        <Link
          href="/login"
          className="w-full text-center bg-blue-600 text-white rounded-xl py-3 text-sm font-bold"
        >
          다시 시도
        </Link>
      </div>
    </div>
  )
}
