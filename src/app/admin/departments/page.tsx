import { supabaseAdmin } from '@/lib/supabase-admin'
import { DepartmentForm } from './DepartmentForm'
import { DepartmentTable } from './DepartmentTable'
import styles from '../users/page.module.css'

export default async function DepartmentsPage() {
  const { data: departments, error: fetchError } = await supabaseAdmin
    .from('departments')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className={styles.title}>Quản lý Khoa / Viện</h1>
      
      {fetchError && (
        <div style={{color: '#b91c1c', background: '#fee2e2', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #f87171'}}>
          <strong>Lỗi cơ sở dữ liệu: </strong> {fetchError.message}
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className={styles.formCard} style={{ gridColumn: '1 / 2' }}>
          <h2>Thêm Khoa / Viện mới</h2>
          <DepartmentForm />
        </div>

        <div style={{ gridColumn: '2 / -1' }}>
          <DepartmentTable departments={departments || []} />
        </div>
      </div>
    </div>
  )
}
