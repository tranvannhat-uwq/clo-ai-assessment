import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateCourse } from '@/actions/admin/courses'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from '../../../users/page.module.css'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: course } = await supabaseAdmin.from('courses').select('*').eq('id', id).single()

  if (!course) redirect('/admin/courses')

  async function updateCourseAction(formData: FormData) {
    'use server'
    const res = await updateCourse(formData)
    if (res && 'error' in res) {
      throw new Error(res.error)
    }
    redirect('/admin/courses')
  }

  return (
    <div>
      <h1 className={styles.title}>Chỉnh Sửa Thuộc Tính Môn Học</h1>
      <p style={{marginBottom: '2rem', color: '#64748b'}}>Hệ thống sẽ cập nhật thay đổi này vào mọi dữ liệu liên quan ở tương lai.</p>
      
      <div className={styles.content} style={{ display: 'block', maxWidth: '600px' }}>
        <div className={styles.formCard}>
          <form action={updateCourseAction} className={styles.form}>
            <input type="hidden" name="id" value={course.id} />
            <div className={styles.inputGroup}>
              <label>Mã môn học</label>
              <input type="text" name="code" required defaultValue={course.code} />
            </div>

            <div className={styles.inputGroup}>
              <label>Tên tên đầy đủ</label>
              <input type="text" name="name" required defaultValue={course.name} />
            </div>

            <div className={styles.inputGroup}>
              <label>Số tín chỉ hệ thống (Credits)</label>
              <input type="number" name="credits" required min="1" max="10" defaultValue={course.credits} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className={styles.submitBtn} style={{ flex: 1 }}>Cập nhật Môn &rarr;</button>
              <Link href="/admin/courses" style={{ flex: 1, textAlign: 'center', lineHeight: '3rem', background: '#f1f5f9', color: '#475569', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>Quay lại</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
