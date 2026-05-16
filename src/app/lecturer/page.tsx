import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import Link from 'next/link'
import { formatScheduleList } from '@/lib/utils'
import styles from './page.module.css'

export default async function LecturerDashboard() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng nhập lại.</div>

  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('*, courses(code, name), student_classes(name)')
    .eq('lecturer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className={styles.title}>Lớp học phần phân công</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>
        Vui lòng chọn lớp học để khởi tạo Chuẩn đầu ra (CLO) và tải tài liệu sinh ngân hàng đề tự động.
      </p>

      <div className={styles.grid}>
        {classes?.map(cls => (
          <Link href={`/lecturer/classes/${cls.id}`} key={cls.id} className={styles.card}>
            <h3>{cls.courses?.name} - {cls.courses?.code}</h3>
            <p style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '0.95rem', color: '#0369a1' }}>
              <strong>Lớp:</strong> {cls.student_classes?.name || 'Chung (Không chia lớp)'}
            </p>
            {cls.schedule && (
              <p style={{ marginBottom: '0.25rem', fontSize: '0.9rem', color: '#059669' }}>
                <strong>Lịch:</strong> {formatScheduleList(cls.schedule)}
              </p>
            )}
            <p><strong>Học kỳ:</strong> {cls.semester}</p>
            <span className={styles.btnAction}>Quản lý CLO & Tài liệu &rarr;</span>
          </Link>
        ))}
        {(!classes || classes.length === 0) && (
          <div className={styles.emptyCard}>
            Bạn chưa được phân bổ giảng dạy bất kỳ lớp học phần nào trên hệ thống.
          </div>
        )}
      </div>
    </div>
  )
}
