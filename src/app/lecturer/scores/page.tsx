import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { ScoresClient } from './ScoresClient'

export default async function LecturerScoresPage() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng nhập lại.</div>

  // Lấy tất cả lớp của giảng viên
  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('*, courses(id, code, name), student_classes(id, name)')
    .eq('lecturer_id', user.id)

  // Lấy danh sách student_class_id để tìm sinh viên
  const studentClassIds = Array.from(
    new Set(classes?.map(c => c.student_class_id).filter(Boolean))
  ) as string[]

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

  // Lấy CLO của tất cả course liên quan
  const courseIds = Array.from(
    new Set(classes?.map(c => c.course_id).filter(Boolean))
  ) as string[]

  let clos: any[] = []
  if (courseIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('clos')
      .select('*')
      .in('course_id', courseIds)
      .order('priority')
    clos = data || []
  }

  // Lấy progress_tracking cho các sinh viên
  const studentIds = students.map(s => s.id)
  const cloIds = clos.map(c => c.id)

  let progressData: any[] = []
  if (studentIds.length > 0 && cloIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('progress_tracking')
      .select('*')
      .in('student_id', studentIds)
      .in('clo_id', cloIds)
    progressData = data || []
  }

  // Lấy assessment_sessions
  let sessions: any[] = []
  const classIds = (classes || []).map(c => c.id)
  if (studentIds.length > 0 && classIds.length > 0) {
    const { data } = await supabaseAdmin
      .from('assessment_sessions')
      .select('*, session_questions(id, question_id, student_answer, is_correct)')
      .in('student_id', studentIds)
      .in('class_id', classIds)
      .order('start_time', { ascending: false })
    sessions = data || []
  }

  return (
    <ScoresClient
      classes={classes || []}
      students={students}
      clos={clos}
      progressData={progressData}
      sessions={sessions}
    />
  )
}
