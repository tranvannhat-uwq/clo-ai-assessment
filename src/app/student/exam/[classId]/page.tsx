import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { initializeExamSession, setupFirstQuestion } from '@/actions/student/exam'
import { ChatInterface } from './ChatInterface'
import { QuizInterface } from './QuizInterface'

export default async function ExamSessionPage({ params, searchParams }: { params: Promise<{ classId: string }>, searchParams: Promise<{ mode?: string, cloId?: string }> }) {
  const { classId } = await params
  const { mode, cloId } = await searchParams
  const user = await getUser()
  if (!user) return <div>Auth Failed: You must be logged in.</div>
  
  if (!cloId) return <div style={{padding: '3rem', fontSize: '1.2rem', color: '#ef4444', textAlign: 'center'}}>Thiếu ID chuẩn đầu ra. Bấm TRỞ LẠI và chọn lại.</div>

  const examMode = mode === 'MULTIPLE_CHOICE' ? 'MULTIPLE_CHOICE' : 'ORAL'

  // 1. Core Logic Database INIT
  const sessionId = await initializeExamSession(classId, examMode, cloId)
  if (!sessionId) return <div style={{padding: '3rem', fontSize: '1.2rem', color: '#ef4444', textAlign: 'center'}}>Lỗi khởi tạo phiên thi cho môn học này. (Chưa có CLO hoặc không đăng ký số lượng câu hỏi. Vui lòng liên hệ giảng viên).</div>

  const { data: sessionData } = await supabaseAdmin
    .from('assessment_sessions')
    .select('status, exam_mode, start_time, clos(exam_time_minutes)')
    .eq('id', sessionId)
    .single()

  const cloData: any = sessionData?.clos;
  const examTimeMinutes = Array.isArray(cloData) ? cloData[0]?.exam_time_minutes : cloData?.exam_time_minutes;

  if (sessionData?.exam_mode === 'MULTIPLE_CHOICE') {
    return <QuizInterface 
             sessionId={sessionId} 
             classId={classId} 
             isCompleted={sessionData?.status === 'COMPLETED'} 
             startTime={sessionData?.start_time}
             examTimeMinutes={examTimeMinutes}
           />
  }

  await setupFirstQuestion(sessionId, classId, user.id)

  // Lấy dòng hội thoại Realtime bằng React SSR
  const { data: logs } = await supabaseAdmin
    .from('chat_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  const { data: classInfo } = await supabaseAdmin.from('classes').select('*, courses(name, code)').eq('id', classId).single()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0, color: '#1e3a8a', fontWeight: 700 }}>
          GIAO DIỆN CHẤM THI CỦA MÁY CHỦ: <span style={{fontWeight: 400}}>{classInfo?.courses?.name}</span>
        </h1>
        {sessionData?.status === 'IN_PROGRESS' ? (
           <span style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700, border: '2px solid #b91c1c' }}>🔴 PROCTORING MODE: BẬT CHẾ ĐỘ QUAN SÁT</span>
        ) : (
           <span style={{ padding: '0.5rem 1.5rem', background: '#10b981', color: 'white', borderRadius: '0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>✅ THIẾT KẾ HOÀN THÀNH</span>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ChatInterface 
           logs={logs || []} 
           sessionId={sessionId} 
           classId={classId} 
           isCompleted={sessionData?.status === 'COMPLETED'}
           startTime={sessionData?.start_time}
           examTimeMinutes={examTimeMinutes}
        />
      </div>
    </div>
  )
}
