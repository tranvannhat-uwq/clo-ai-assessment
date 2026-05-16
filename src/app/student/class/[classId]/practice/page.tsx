import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { PracticeClient } from './PracticeClient'

export default async function PracticePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params
  const user = await getUser()
  if (!user) return <div>Auth Required</div>

  const { data: cls } = await supabaseAdmin.from('classes').select('*, courses(id, name, code)').eq('id', classId).single()
  const { data: clos } = await supabaseAdmin.from('clos').select('*').eq('course_id', cls?.course_id).order('priority', { ascending: true })

  return <PracticeClient classId={classId} courseId={cls?.course_id} courseName={cls?.courses?.name} clos={clos || []} />
}
