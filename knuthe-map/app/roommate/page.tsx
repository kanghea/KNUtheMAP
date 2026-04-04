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

  const role = await getServerRole()
  if (role !== 'roommate' && role !== 'admin') redirect('/')

  const sp = await searchParams

  return <RoommateClient saveDraft={sp.save_draft === '1'} />
}
