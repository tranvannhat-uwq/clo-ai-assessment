import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import Link from 'next/link'
import styles from '../../../lecturer/page.module.css' // Reuse lecturer styles for layout consistence

type Props = { params: Promise<{ classId: string }> }

export default async function StudentClassPage({ params }: Props) {
  const { classId } = await params
  const user = await getUser()
  if (!user) return <div>Lỗi máy chủ: Token Expired.</div>

  const { data: cls } = await supabaseAdmin.from('classes').select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name)').eq('id', classId).single()
  const { data: clos } = await supabaseAdmin.from('clos').select('*').eq('course_id', cls?.course_id).order('priority', { ascending: true })
  const { data: tracking } = await supabaseAdmin.from('progress_tracking').select('clo_id, status').eq('student_id', user.id)

  const trackingMap: Record<string, string> = {}
  tracking?.forEach(t => trackingMap[t.clo_id] = t.status)

  return (
    <div>
      <h1 className={styles.title}>Lớp học: {cls?.courses?.name}</h1>
      <p style={{marginBottom: '2rem', color: '#64748b', fontSize: '1.05rem'}}>
        Mã hệ thống: {cls?.courses?.code} | Giảng viên: {cls?.profiles?.full_name}
      </p>

      <div style={{background: '#eff6ff', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem'}}>
        <h2 style={{color: '#1e3a8a', marginBottom: '0.5rem'}}>Danh sách Chuẩn đầu ra (CLO)</h2>
        <p style={{color: '#475569'}}>Bạn cần phải hoàn thành bài thi cho tất cả các chuẩn đầu ra dưới đây.</p>
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {clos?.map((clo: any, index: number) => {
          const status = trackingMap[clo.id] || 'CHƯA THI'
          const isPassed = status === 'PASSED'
          
          return (
            <div key={clo.id} style={{background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{ flex: 1, paddingRight: '2rem' }}>
                <h3 style={{color: '#0f172a', marginBottom: '0.5rem'}}>
                  <span style={{background: '#38bdf8', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', marginRight: '0.5rem', fontSize: '0.8rem'}}>CLO {index + 1}</span>
                  {clo.code}
                </h3>
                <p style={{color: '#475569', fontSize: '0.95rem'}}>{clo.content}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', minWidth: '180px' }}>
                {isPassed ? (
                  <div style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '2rem', fontWeight: 600, width: '100%', textAlign: 'center', fontSize: '0.9rem' }}>
                     ✅ ĐÃ HOÀN THÀNH
                  </div>
                ) : (
                  <>
                    <Link 
                      href={`/student/exam/${classId}?mode=ORAL&cloId=${clo.id}`} 
                      style={{ background: '#3b82f6', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, width: '100%', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                      🎤 Thi Vấn Đáp
                    </Link>
                    <Link 
                      href={`/student/exam/${classId}?mode=MULTIPLE_CHOICE&cloId=${clo.id}`} 
                      style={{ background: '#10b981', color: 'white', padding: '0.6rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, width: '100%', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                      📝 Thi Trắc Nghiệm
                    </Link>
                  </>
                )}
              </div>
            </div>
          )
        })}
        {(!clos || clos.length === 0) && (
           <p style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>Giảng viên chưa cấu hình chuẩn đầu ra (CLO) cho môn học này.</p>
        )}
      </div>

      <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
         {/* Phân tích điểm yếu */}
         <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h2 style={{ color: '#1e3a8a', marginBottom: '0.5rem', fontSize: '1.25rem' }}>📊 Phân tích điểm yếu</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Xem chi tiết đánh giá từ AI về những kiến thức bạn còn hổng dựa trên lịch sử thi.</p>
            <Link href={`/student/class/${classId}/report`} style={{ display: 'block', background: '#f1f5f9', color: '#1e3a8a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', textDecoration: 'none', fontWeight: 600 }}>
               Xem Phân Tích AI
            </Link>
         </div>

         {/* Bài tập AI gợi ý */}
         <div style={{ background: '#1e3a8a', padding: '1.5rem', borderRadius: '1rem', color: 'white', boxShadow: '0 10px 15px -3px rgba(30, 58, 138, 0.3)' }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>🤖 Ôn tập cùng AI</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.9 }}>Tham gia làm các bài tập rèn luyện do AI thiết kế riêng cho các lỗ hổng kiến thức của bạn.</p>
            <Link href={`/student/class/${classId}/practice`} style={{ display: 'block', background: 'white', color: '#1e3a8a', padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', textDecoration: 'none', fontWeight: 800 }}>
               Làm Bài Tập Gợi Ý
            </Link>
         </div>
      </div>
    </div>
  )
}
