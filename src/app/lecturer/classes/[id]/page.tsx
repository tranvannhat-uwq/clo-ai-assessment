import { supabaseAdmin } from '@/lib/supabase-admin'
import Link from 'next/link'
import { formatScheduleList } from '@/lib/utils'
import styles from './page.module.css'

type Props = { params: Promise<{ id: string }> }

export default async function ClassDetailPage({ params }: Props) {
  const { id: classId } = await params
  
  const { data: cls } = await supabaseAdmin.from('classes').select('*, courses(name, code), student_classes(name)').eq('id', classId).single()
  let students: any[] = []
  if (cls?.student_class_id) {
    const { data: sData } = await supabaseAdmin.from('profiles').select('*').eq('role', 'STUDENT').eq('student_class_id', cls.student_class_id).order('code')
    students = sData || []
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Học phần: {cls?.courses?.name}</h1>
        <div className={styles.subtitle}>
          Mã môn: {cls?.courses?.code} &nbsp;|&nbsp; 
          <span style={{ color: '#0ea5e9', fontWeight: 600 }}> Lớp: {cls?.student_classes?.name || 'Dạy chung'}</span> 
          &nbsp;|&nbsp; Học kỳ: {cls?.semester}
          {cls?.schedule && <>&nbsp;|&nbsp; <span style={{ color: '#059669' }}>Lịch: {formatScheduleList(cls.schedule)}</span></>}
        </div>
      </div>
      
      <div style={{background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h2 style={{color: '#1e3a8a', fontSize: '1.15rem', marginBottom: '0.5rem'}}>Chuẩn đầu ra (CLO) & Ngân hàng câu hỏi</h2>
          <p style={{color: '#3b82f6', fontSize: '0.95rem'}}>Cấu hình dùng chung cho tất cả các lớp của môn học này.</p>
        </div>
        <Link href={`/lecturer/courses/${cls?.course_id}`} style={{background: '#2563eb', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600}}>Quản lý Thiết lập Môn học &rarr;</Link>
      </div>

      {/* Danh sách Sinh viên */}
      <div className={styles.section} style={{marginTop: '3rem'}}>
        <h2>4. Danh sách Sinh viên & Bảng điểm</h2>
        <div className={styles.card}>
          {!cls?.student_class_id ? (
            <p className={styles.emptyText}>Lớp học phần này không được gán cho một Lớp hành chính cụ thể (Dạy chung), nên không có danh sách sinh viên cố định.</p>
          ) : (
            <>
              {students.length === 0 ? (
                <p className={styles.emptyText}>Chưa có sinh viên nào được phân vào lớp hành chính <strong>{cls?.student_classes?.name}</strong>.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Mã SV</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Ngày sinh</th>
                        <th>Điểm quá trình (Tạm tính)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s: any) => (
                        <tr key={s.id}>
                          <td><strong>{s.code}</strong></td>
                          <td>{s.full_name}</td>
                          <td>{s.email}</td>
                          <td>{s.dob ? new Date(s.dob).toLocaleDateString('vi-VN') : '-'}</td>
                          <td style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Link sang điểm số */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link href="/lecturer/scores" style={{ color: '#3b82f6', fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>
          📝 Đi đến Quản lý Điểm số đầy đủ →
        </Link>
      </div>
    </div>
  )
}
