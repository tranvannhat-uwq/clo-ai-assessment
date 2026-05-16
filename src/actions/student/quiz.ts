'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function submitQuizAnswers(sessionId: string, classId: string, answers: Record<string, string>) {
  // Lấy toàn bộ câu hỏi của session này để so đáp án 
  const { data: sessionQuestions } = await supabaseAdmin
    .from('session_questions')
    .select('id, question_id, questions(correct_answer)')
    .eq('session_id', sessionId)

  if (!sessionQuestions) return { success: false, score: 0 }

  let correctCount = 0
  const total = sessionQuestions.length

  // Lưu đáp án sinh viên và phân định đúng/sai trực tiếp
  for (const sq of sessionQuestions) {
    const studentAns = answers[sq.question_id]
    const qObj: any = Array.isArray(sq.questions) ? sq.questions[0] : sq.questions
    const correctAns = qObj?.correct_answer
    const isCorrect = studentAns === correctAns
    
    if (isCorrect) correctCount++

    await supabaseAdmin.from('session_questions').update({
      student_answer: studentAns || null,
      is_correct: isCorrect
    }).eq('id', sq.id)
  }

  // Cập nhật trạng thái phiên thành hoàn thành
  await supabaseAdmin.from('assessment_sessions').update({ status: 'COMPLETED', end_time: new Date().toISOString() }).eq('id', sessionId)
  
  // Đánh dấu hoàn thành cho CLO vào progress_tracking
  const { data: sessionInfo } = await supabaseAdmin.from('assessment_sessions').select('student_id, clo_id').eq('id', sessionId).single()
  if (sessionInfo && sessionInfo.clo_id && sessionInfo.student_id) {
     const { data: pData } = await supabaseAdmin.from('progress_tracking').select('id').eq('student_id', sessionInfo.student_id).eq('clo_id', sessionInfo.clo_id).single()
     if (pData) {
        await supabaseAdmin.from('progress_tracking').update({ status: 'PASSED', passed_at: new Date().toISOString() }).eq('id', pData.id)
     } else {
        await supabaseAdmin.from('progress_tracking').insert({ student_id: sessionInfo.student_id, clo_id: sessionInfo.clo_id, status: 'PASSED', passed_at: new Date().toISOString() })
     }
  }

  revalidatePath(`/student/exam/${classId}`)
  
  const score = total > 0 ? Math.round((correctCount / total) * 10) : 0
  return { success: true, score, correct: correctCount, total }
}
