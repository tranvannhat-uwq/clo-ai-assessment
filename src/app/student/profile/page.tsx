import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { StudentProfileClient } from './StudentProfileClient'

export default async function StudentProfilePage() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng nhập lại.</div>

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*, student_classes(name)')
    .eq('id', user.id)
    .single()

  return <StudentProfileClient profile={profile} email={user.email || ''} />
}
