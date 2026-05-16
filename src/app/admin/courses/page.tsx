import { supabaseAdmin } from '@/lib/supabase-admin'
import { CourseTable } from './CourseTable'
import styles from '../users/page.module.css'

export default async function CoursesPage() {
  const { data: courses, error: fetchError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  const { data: lecturers } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, departments(name)')
    .eq('role', 'LECTURER')
    .order('full_name', { ascending: true })
  const { data: templates } = await supabaseAdmin
    .from('classes')
    .select('id, course_id, lecturer_id, semester, schedule, courses(code, name), profiles!classes_lecturer_id_fkey(full_name, departments(name))')
    .is('student_class_id', null)

  return (
    <div>
      <h1 className={styles.title}>Quản lý Môn học</h1>
      {fetchError && (
        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f87171'}}>
          <strong>Lỗi truy xuất thư viện DB: </strong> {fetchError.message}
        </div>
      )}
      
      <div className={styles.content}>
        <CourseTable courses={courses || []} lecturers={lecturers || []} templates={templates || []} />
      </div>
    </div>
  )
}
