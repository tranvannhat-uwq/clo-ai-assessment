import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { ProgressClient } from './ProgressClient'

export default async function LecturerProgressPage() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng xuất và đăng nhập lại.</div>

  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('*, courses(code, name), student_classes(name)')
    .eq('lecturer_id', user.id)

  const studentClassIds = Array.from(new Set(classes?.map(c => c.student_class_id).filter(Boolean))) as string[]

  let students: any[] = []
  if (studentClassIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'STUDENT')
      .in('student_class_id', studentClassIds)
      .order('code')
    students = data || []
  }

  return <ProgressClient classes={classes || []} students={students} />
}
