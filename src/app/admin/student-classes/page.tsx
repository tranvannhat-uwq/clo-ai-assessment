import { supabaseAdmin } from '@/lib/supabase-admin'
import { StudentClassTable } from './StudentClassTable'
import styles from '../users/page.module.css'

export default async function StudentClassesPage() {
  const { data: classes, error: fetchError } = await supabaseAdmin
    .from('student_classes')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: departments } = await supabaseAdmin
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div>
      <h1 className={styles.title}>Quản lý Lớp hành chính & Khóa</h1>
      
      {fetchError && (
        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f87171'}}>
          <strong>Lỗi cơ sở dữ liệu: </strong> {fetchError.message}
        </div>
      )}
      
      <div className={styles.content}>
        <StudentClassTable classes={classes || []} departments={departments || []} />
      </div>
    </div>
  )
}
