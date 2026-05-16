import { supabaseAdmin } from '@/lib/supabase-admin'
import { redirect } from 'next/navigation'
import styles from '../../../users/page.module.css'
import { EditClassForm } from './EditClassForm'

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: currentClass } = await supabaseAdmin.from('classes').select('*').eq('id', id).single()
  if (!currentClass) redirect('/admin/classes')

  const { data: courses } = await supabaseAdmin.from('courses').select('id, code, name')
  const { data: lecturers } = await supabaseAdmin.from('profiles').select('id, full_name').eq('role', 'LECTURER')

  return (
    <div>
      <h1 className={styles.title}>Chỉnh Sửa Thuộc Tính Lớp Học Phần</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>Hệ thống sẽ cập nhật thay đổi này lập tức nhằm không ảnh hưởng việc Sinh viên đang truy cập Khoá Ngoại (Ví dụ: Chuyển lại cho Giảng viên khác đứng lớp).</p>
      
      <div className={styles.content} style={{ display: 'block', maxWidth: '600px' }}>
        <div className={styles.formCard}>
          <EditClassForm currentClass={currentClass} courses={courses || []} lecturers={lecturers || []} />
        </div>
      </div>
    </div>
  )
}
