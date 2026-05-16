import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import Link from 'next/link'
import styles from '../lecturer/page.module.css'

export default async function StudentDashboard() {
  const user = await getUser()
  if (!user) return <div>Lỗi máy chủ: Token Expired. Hãy tải lại trang.</div>

  const { data: profile } = await supabaseAdmin.from('profiles').select('student_class_id').eq('id', user.id).single()

  let enrollments: any[] = []
  
  // 1. Lấy danh sách môn học được phân cho Lớp hành chính (từ class_subjects)
  if (profile?.student_class_id) {
    const { data: plannedSubjects } = await supabaseAdmin
      .from('class_subjects')
      .select('*, courses(code, name), profiles(full_name)')
      .eq('student_class_id', profile.student_class_id)
    
    if (plannedSubjects) {
      // Tìm các lớp học phần thực tế (classes) tương ứng để có ID và Schedule
      const courseIds = plannedSubjects.map(ps => ps.course_id)
      const { data: actualClasses } = await supabaseAdmin
        .from('classes')
        .select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name)')
        .eq('student_class_id', profile.student_class_id)
        .in('course_id', courseIds)

      plannedSubjects.forEach(ps => {
        // Tìm lớp thực tế khớp môn và giảng viên (nếu có)
        const match = actualClasses?.find(ac => ac.course_id === ps.course_id)
        enrollments.push({
          id: match?.id || ps.id, // Ưu tiên ID lớp học phần, nếu chưa có thì dùng ID phân công
          course_id: ps.course_id,
          semester: ps.semester,
          courses: ps.courses,
          profiles: ps.profiles, // Giảng viên từ bảng phân công
          is_active: !!match,
          schedule: match?.schedule || ps.schedule
        })
      })
    }
  }

  // 2. Lấy các lớp sinh viên được đăng ký riêng lẻ (junction table student_class)
  const { data: indivClasses } = await supabaseAdmin
    .from('student_class')
    .select('class_id, classes(*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name))')
    .eq('student_id', user.id)

  if (indivClasses) {
    indivClasses.forEach((ic: any) => {
      if (!ic.classes) return
      // Chỉ thêm nếu chưa có trong danh sách (tránh trùng với môn lớp hành chính)
      if (!enrollments.find(e => e.course_id === ic.classes.course_id)) {
        enrollments.push({
          ...ic.classes,
          is_active: true
        })
      }
    })
  }

  return (
    <div>
      <h1 className={styles.title}>Xin chào Học viên! 👋</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>Chào mừng đến với Nền tảng Đánh giá Chuẩn Đầu Ra qua AI (CLO AI Agent). Vui lòng chọn môn thi bên dưới.</p>

      <div className={styles.grid}>
        {enrollments?.map((cls: any) => (
          <div key={cls.id} className={styles.card} style={{display: 'flex', flexDirection: 'column'}}>
            <h3>{cls.courses?.code} - {cls.courses?.name}</h3>
            <p style={{marginBottom: '0.25rem'}}><strong>Giảng viên:</strong> {cls.profiles?.full_name}</p>
            <p style={{marginBottom: '1.5rem'}}><strong>Học kỳ:</strong> {cls.semester}</p>
            
            <div style={{display: 'flex', gap: '0.5rem', marginTop: 'auto'}}>
              {cls.is_active ? (
                <Link 
                  href={`/student/class/${cls.id}`} 
                  style={{
                    flex: 1, background: '#3b82f6', color: 'white', padding: '0.75rem', 
                    borderRadius: '0.5rem', textAlign: 'center', 
                    textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem', fontWeight: 600
                  }}
                >
                  🎓 Vào Lớp Học
                </Link>
              ) : (
                <div 
                  style={{
                    flex: 1, background: '#f1f5f9', color: '#94a3b8', padding: '0.75rem', 
                    borderRadius: '0.5rem', textAlign: 'center', 
                    fontSize: '0.9rem', fontWeight: 600, border: '1px dashed #cbd5e1'
                  }}
                >
                  🕒 Đang chờ xếp lịch...
                </div>
              )}
            </div>
          </div>
        ))}
        {(!enrollments || enrollments.length === 0) && (
          <div className={styles.emptyCard} style={{gridColumn: '1 / -1', padding: '4rem'}}>
            Tài khoản của bạn chưa được thiết lập vào Lớp hành chính nào hoặc lớp hiện tại chưa có Lớp học phần phân công. Vui lòng liên hệ Admin.
          </div>
        )}
      </div>
    </div>
  )
}
