import { supabaseAdmin } from '@/lib/supabase-admin'
import styles from './page.module.css'
import { UserModals } from './UserModals'
import { UserManagementTabs } from './UserManagementTabs'

export default async function UsersPage() {
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*, student_classes(name, cohort), departments(name)')
    .order('created_at', { ascending: false })

  const { data: studentClasses } = await supabaseAdmin.from('student_classes').select('*').order('name')
  const { data: departments } = await supabaseAdmin.from('departments').select('*').order('name')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className={styles.title} style={{ marginBottom: 0 }}>Quản lý Cán bộ & Sinh viên</h1>
        <UserModals studentClasses={studentClasses || []} departments={departments || []} />
      </div>
      
      <div className={styles.content}>
        <div style={{ flex: 1, minWidth: '0' }}>
          <UserManagementTabs profiles={profiles || []} studentClasses={studentClasses || []} departments={departments || []} />
        </div>
      </div>
    </div>
  )
}
