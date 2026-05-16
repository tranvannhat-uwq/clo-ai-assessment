import { supabaseAdmin } from '@/lib/supabase-admin'
import styles from '../users/page.module.css'
import { ClassManagementTabs } from './ClassManagementTabs'

export default async function ClassesPage() {
  const { data: classes, error: fetchError } = await supabaseAdmin
    .from('classes')
    .select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name, departments(name)), student_classes(name)')
    .order('created_at', { ascending: false })

  const { data: courses } = await supabaseAdmin.from('courses').select('id, code, name, classes(id)')
  const { data: lecturers } = await supabaseAdmin.from('profiles').select('id, full_name, departments(name)').eq('role', 'LECTURER')
  const { data: studentClasses } = await supabaseAdmin.from('student_classes').select('*').order('name')
  const { data: courseLecturerTemplates } = await supabaseAdmin
    .from('classes')
    .select('id, course_id, lecturer_id, semester, schedule, profiles!classes_lecturer_id_fkey(full_name, departments(name))')
    .is('student_class_id', null)
  const { data: classSubjects } = await supabaseAdmin
    .from('class_subjects')
    .select('id, student_class_id, course_id, semester, lecturer_id, schedule')

  const { data: studentProfiles } = await supabaseAdmin
    .from('profiles')
    .select('student_class_id')
    .eq('role', 'STUDENT')

  const studentCountByClassId: Record<string, number> = {}
  ;(studentProfiles || []).forEach((p: any) => {
    if (!p.student_class_id) return
    studentCountByClassId[p.student_class_id] = (studentCountByClassId[p.student_class_id] || 0) + 1
  })

  return (
    <div>
      <h1 className={styles.title}>Quản lý Lớp học phần</h1>
      
      {fetchError && (
        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f87171'}}>
          <strong>Hệ thống Database từ chối truy xuất: </strong> {fetchError.message}
        </div>
      )}
      
      <div className={styles.content} style={{ gridTemplateColumns: '1fr' }}>
        <ClassManagementTabs
          courses={courses}
          lecturers={lecturers}
          studentClasses={studentClasses}
          classes={classes}
          courseLecturerTemplates={courseLecturerTemplates || []}
          classSubjects={classSubjects || []}
          studentCountByClassId={studentCountByClassId}
        />
      </div>
    </div>
  )
}
