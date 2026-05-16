import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { ProfileClient } from './ProfileClient'

export default async function LecturerProfilePage() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng nhập lại.</div>

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ProfileClient profile={profile} email={user.email || ''} />
}
