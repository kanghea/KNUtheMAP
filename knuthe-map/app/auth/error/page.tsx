import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">로그인 중 문제가 발생했습니다.</p>
        <Link href="/login" className="text-blue-600 underline text-sm">다시 시도</Link>
      </div>
    </div>
  )
}
