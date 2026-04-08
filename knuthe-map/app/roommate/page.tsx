import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import RoommateClient from './_client'

export default async function RoommatePage({
  searchParams,
}: {
  searchParams: Promise<{ save_draft?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const sp = await searchParams
  const isSaveDraft = sp.save_draft === '1'

  // save_draft 모드일 때는 role 체크 완화
  // (auth callback에서 role 업데이트가 아직 반영 안 됐을 수 있음)
  if (!isSaveDraft) {
    const role = await getServerRole()
    if (role !== 'roommate' && role !== 'admin') redirect('/')
  }

  return <RoommateClient saveDraft={isSaveDraft} />
}
