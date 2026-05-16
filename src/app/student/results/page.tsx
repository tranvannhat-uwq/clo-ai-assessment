import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import Link from 'next/link'
import styles from '../../lecturer/page.module.css'

export default async function StudentResultsSelectorPage() {
  const user = await getUser()
  if (!user) return <div>Lỗi máy chủ: Token Expired. Hãy tải lại trang.</div>

  const { data: profile } = await supabaseAdmin.from('profiles').select('student_class_id').eq('id', user.id).single()

  let enrollments: any[] = []

  // 1. Lấy các lớp được gán cho toàn bộ Lớp hành chính
  if (profile?.student_class_id) {
    const { data: plannedSubjects } = await supabaseAdmin
      .from('class_subjects')
      .select('*, courses(code, name), profiles(full_name)')
      .eq('student_class_id', profile.student_class_id)
    
    if (plannedSubjects) {
      const courseIds = plannedSubjects.map(ps => ps.course_id)
      const { data: actualClasses } = await supabaseAdmin
        .from('classes')
        .select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name)')
        .eq('student_class_id', profile.student_class_id)
        .in('course_id', courseIds)

      plannedSubjects.forEach(ps => {
        const match = actualClasses?.find(ac => ac.course_id === ps.course_id)
        enrollments.push({
          id: match?.id || ps.id,
          course_id: ps.course_id,
          courses: ps.courses,
          profiles: ps.profiles,
          is_active: !!match
        })
      })
    }
  }

  // 2. Lấy các lớp sinh viên được đăng ký riêng lẻ (junction table)
  const { data: indivClasses } = await supabaseAdmin
    .from('student_class')
    .select('class_id, classes(*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name))')
    .eq('student_id', user.id)

  if (indivClasses) {
    indivClasses.forEach((ic: any) => {
      if (!ic.classes) return
      if (!enrollments.find(e => e.course_id === ic.classes.course_id)) {
        enrollments.push({ ...ic.classes, is_active: true })
      }
    })
  }

  return (
    <div>
      <h1 className={styles.title}>Kết quả Học tập & Tiến độ CLO 📈</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>Theo dõi chi tiết điểm số, tiến độ hoàn thành chuẩn đầu ra (CLO) và nhận tư vấn từ AI.</p>

      <div className={styles.grid}>
        {enrollments?.map((cls: any) => (
          <div key={cls.id} className={styles.card} style={{display: 'flex', flexDirection: 'column'}}>
            <h3 style={{color: '#1e3a8a'}}>{cls.courses?.code} - {cls.courses?.name}</h3>
            <p style={{marginBottom: '0.25rem', color: '#475569'}}><strong>Giảng viên:</strong> {cls.profiles?.full_name}</p>
            <p style={{marginBottom: '1.5rem', color: '#475569'}}><strong>Học kỳ:</strong> {cls.semester}</p>
            
            <div style={{display: 'flex', gap: '0.5rem', marginTop: 'auto'}}>
              <Link 
                href={`/student/class/${cls.id}/report`} 
                style={{
                  flex: 1, background: '#10b981', color: 'white', padding: '0.85rem', 
                  borderRadius: '0.5rem', textAlign: 'center', 
                  textDecoration: 'none', transition: '0.2s', fontSize: '1rem', fontWeight: 700,
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                }}
              >
                🤖 Xem Đánh Giá Cố Vấn AI
              </Link>
            </div>
          </div>
        ))}
        {(!enrollments || enrollments.length === 0) && (
          <div className={styles.emptyCard} style={{gridColumn: '1 / -1', padding: '4rem'}}>
            Tài khoản chưa có môn học nào để xem điểm đánh giá.
          </div>
        )}
      </div>
    </div>
  )
}
