import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import Link from 'next/link'
import styles from '../page.module.css'

export default async function LecturerCoursesPage() {
  const user = await getUser()
  if (!user) return <div>Vui lòng đăng nhập lại.</div>

  const { data: classes } = await supabaseAdmin
    .from('classes')
    .select('courses(id, code, name)')
    .eq('lecturer_id', user.id)

  const distinctCoursesMap = new Map()
  classes?.forEach(c => {
    const course = Array.isArray(c.courses) ? c.courses[0] : c.courses;
    if (course && !distinctCoursesMap.has(course.id)) {
      distinctCoursesMap.set(course.id, course)
    }
  })
  
  const courses = Array.from(distinctCoursesMap.values())

  return (
    <div>
      <h1 className={styles.title}>Ngân hàng Môn học</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>
        Vui lòng chọn môn học để quản lý Chuẩn đầu ra (CLO) và Ngân hàng Câu hỏi tự động từ AI.
      </p>

      <div className={styles.grid}>
        {courses.map(course => (
          <div key={course.id} className={styles.card} style={{display: 'flex', flexDirection: 'column'}}>
            <h3>{course.code} - {course.name}</h3>
            <p style={{marginTop: '0.5rem', marginBottom: '1.5rem', color: '#64748b'}}> Quản lý CLO và Giáo trình chung cho tất cả các lớp của môn học này.</p>
            <Link 
              href={`/lecturer/courses/${course.id}`} 
              className={styles.btnAction} 
              style={{
                background: '#3b82f6', color: 'white', padding: '0.85rem', 
                borderRadius: '0.5rem', textAlign: 'center', marginTop: 'auto', 
                textDecoration: 'none', transition: '0.2s', fontWeight: 600
              }}
            >
              Quản lý Dữ liệu Môn học &rarr;
            </Link>
          </div>
        ))}
        {courses.length === 0 && (
          <div className={styles.emptyCard} style={{gridColumn: '1 / -1', padding: '4rem'}}>
            Bạn chưa được phân bổ giảng dạy bất kỳ môn học nào trên hệ thống.
          </div>
        )}
      </div>
    </div>
  )
}
