import { getServerUser } from '@/lib/auth-server'
import { getServerThemeTokens } from '@/lib/theme-server'
import { createSupabaseServer } from '@/lib/supabase-server'
import MinwonClient from './MinwonClient'

export const metadata = {
  title: '민원 대신 처리해드립니다 · KNUtheMAP',
  description: '경북대 주변 자취 건물 민원, 대신 처리해드립니다.',
}

export default async function MinwonPage() {
  const [user, themed] = await Promise.all([
    getServerUser(),
    getServerThemeTokens(),
  ])

  // 로그인된 사용자라면 기존 학과/학번을 프리필 후보로 전달.
  // (전역 온보딩에서 이미 받은 값이면 다시 묻지 않아도 되도록)
  let prefillDept:  string | null = null
  let prefillGrade: string | null = null
  if (user) {
    const supabase = await createSupabaseServer()
    const { data } = await supabase
      .from('users')
      .select('dept, grade')
      .eq('id', user.id)
      .single()
    prefillDept  = (data?.dept  as string | null) ?? null
    prefillGrade = (data?.grade as string | null) ?? null
  }

  return (
    <MinwonClient
      tok={themed.tok}
      isAuthed={!!user}
      prefillDept={prefillDept}
      prefillGrade={prefillGrade}
    />
  )
}
