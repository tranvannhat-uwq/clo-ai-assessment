'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { GoogleGenerativeAI } from '@google/generative-ai'

// 1. Initialise Session
export async function initializeExamSession(classId: string, examMode: string = 'ORAL', cloId: string) {
  const user = await getUser()
  if (!user) return null

  const { data: activeSession } = await supabaseAdmin
    .from('assessment_sessions')
    .select('id, session_questions(id)')
    .eq('student_id', user.id)
    .eq('class_id', classId)
    .eq('clo_id', cloId)
    .eq('exam_mode', examMode)
    .in('status', ['IN_PROGRESS', 'COMPLETED'])
    .single()

  if (activeSession) {
    if (activeSession.session_questions && activeSession.session_questions.length > 0) {
       return activeSession.id
    } else {
       // Corrupted old session, delete it to restart
       await supabaseAdmin.from('assessment_sessions').delete().eq('id', activeSession.id)
    }
  }

  const { data: newSession } = await supabaseAdmin
    .from('assessment_sessions')
    .insert({
      student_id: user.id,
      class_id: classId,
      clo_id: cloId,
      status: 'IN_PROGRESS',
      exam_mode: examMode,
      start_time: new Date().toISOString()
    })
    .select('id').single()

  if (!newSession) return null

  // RANDOM PULLING LOGIC
  const { data: clo } = await supabaseAdmin.from('clos').select('id, code, exam_knowledge_count, exam_comprehension_count, exam_application_count').eq('id', cloId).single()
  
  let allSelectedQuestions: any[] = []
  
  if (clo) {
    const counts = [
       { level: 'Nhận biết', limit: clo.exam_knowledge_count || 0 },
       { level: 'Thông hiểu', limit: clo.exam_comprehension_count || 0 },
       { level: 'Vận dụng cao', limit: clo.exam_application_count || 0 },
    ]

    for (const config of counts) {
       if (config.limit <= 0) continue;

       const { data: questions } = await supabaseAdmin
         .from('questions')
         .select('id')
         .eq('clo_id', clo.id)
         .eq('is_active', true)
         .eq('bloom_level', config.level)
         
       if (questions && questions.length > 0) {
          const shuffled = questions.sort(() => 0.5 - Math.random())
          const selected = shuffled.slice(0, config.limit)
          allSelectedQuestions.push(...selected.map(q => q.id))
       }
    }
  }
  
  const sessionQuestionsData = allSelectedQuestions.map((qId, index) => ({
    session_id: newSession.id,
    question_id: qId,
    order_index: index,
  }))
  
  if (sessionQuestionsData.length > 0) {
    await supabaseAdmin.from('session_questions').insert(sessionQuestionsData)
  } else {
    await supabaseAdmin.from('assessment_sessions').delete().eq('id', newSession.id)
    return null
  }

  return newSession.id
}

export async function setupFirstQuestion(sessionId: string, classId: string, studentId: string) {
  const { count } = await supabaseAdmin.from('chat_logs').select('*', { count: 'exact', head: true }).eq('session_id', sessionId)
  if (count && count > 0) return 

  // Tìm câu hỏi đầu tiên (order_index thấp nhất)
  const { data: sq } = await supabaseAdmin
    .from('session_questions')
    .select('questions!inner(content, clos(code))')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })
    .limit(1)
    .single()

  if (!sq) return

  const questionObj: any = Array.isArray(sq?.questions) ? sq?.questions[0] : sq?.questions
  const questionText = questionObj?.content || "Vui lòng trình bày sự hiểu biết của bạn về mục tiêu này (System AI Fallback)."
  const cloCode = questionObj?.clos?.code || 'CLO'

  await supabaseAdmin.from('chat_logs').insert({
    session_id: sessionId,
    sender: 'AI',
    message: `Chào em, chúng ta bắt đầu bài kiểm tra đánh giá với \`${cloCode}\`. Câu hỏi đầu tiên dành cho em là:\n\n**${questionText}**\n\nHãy suy nghĩ kỹ và gõ câu trả lời vào ô bên dưới nhé!`
  })
}

export async function submitExamAnswer(formData: FormData) {
  const sessionId = formData.get('sessionId') as string
  const studentAnswer = formData.get('message') as string
  const classId = formData.get('classId') as string

  if (!sessionId || !studentAnswer.trim()) return

  // Log answer
  await supabaseAdmin.from('chat_logs').insert({ session_id: sessionId, sender: 'STUDENT', message: studentAnswer })

  const user = await getUser()
  const studentId = user?.id || ''

  // Current active question is the FIRST session_question where is_correct IS NULL
  const { data: activeSQs } = await supabaseAdmin
    .from('session_questions')
    .select('id, is_correct, order_index, questions!inner(id, content, rubrics(criteria), clos(code))')
    .eq('session_id', sessionId)
    .is('is_correct', null)
    .order('order_index', { ascending: true })
    .limit(1)
  
  const activeSQ = activeSQs?.[0]
  if (!activeSQ) {
    revalidatePath(`/student/exam/${classId}`)
    return
  }

  const questionObj: any = Array.isArray(activeSQ?.questions) ? activeSQ?.questions[0] : activeSQ?.questions
  const question = questionObj
  if (!question) return

  // Gather context
  const { data: settings } = await supabaseAdmin.from('sys_settings').select('*').single()
  const { data: recentLogs } = await supabaseAdmin
    .from('chat_logs')
    .select('sender, message')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: false })
    .limit(6)

  const history = recentLogs?.reverse().map(l => `${l.sender}: ${l.message}`).join('\n')

  const prompt = `
    Quy tắc Hệ thống (Roleplay): ${settings?.system_prompt}
    ===================
    Bạn là Giám khảo chấm điểm vấn đáp trực tiếp.
    Câu hỏi chuẩn hiện tại của giám khảo (bạn) đang là: "${question.content}"
    Tiêu chí (Rubric) bắt buộc để TÍNH ĐIỂM ĐẬU (PASS): "${question.rubrics?.[0]?.criteria}"
    
    Lịch sử đoạn chat từ trước tới nay:
    ${history}

    Câu trả lời mới nhất sinh viên vừa phản hồi: Khoảng vài giây trước, Sinh Viên đã nói: "${studentAnswer}"

    YÊU CẦU: Hãy đánh giá quá trình vấn đáp dựa trên toàn bộ mạch trò chuyện. 
    Sinh viên không nhất thiết phải trả lời thuộc lòng nguyên văn. Nếu qua mạch trò chuyện, sinh viên thể hiện được tư duy logic, hiểu bản chất vấn đề và từng bước đáp ứng được cốt lõi của Rubric, hãy đánh giá đạt.

    - Nếu câu trả lời mới nhất (cộng với lịch sử trước đó) đã cho thấy sinh viên hiểu ĐỦ ý cốt lõi theo Rubric -> Trả về JSON {"status": "PASS"}
    - Nếu sinh viên đang đi đúng hướng nhưng chưa đủ ý -> Trả về JSON {"status": "FAIL", "message": "[Khen ngợi 1 chút và đặt câu hỏi gợi ý tiếp theo để dẫn dắt sinh viên tự suy luận đi đến kết luận]"}
    - Nếu sinh viên trả lời sai hướng hoặc chưa hiểu -> Trả về JSON {"status": "FAIL", "message": "[Nhắc nhở nhẹ nhàng và gợi ý lại bao quát hơn theo góc nhìn khác]"}

    BẠN CHỈ ĐƯỢC PHÉP TRẢ VỀ DUY NHẤT 1 OBJECT JSON (CÓ 2 KEY LÀ status VÀ message (nếu fail)). KHÔNG DÙNG DẤU MARKDOWN \`\`\`json. Lỗi cú pháp sẽ làm crash hệ thống! Trả về nguyên gốc JSON stringify.
  `

  const genAI = new GoogleGenerativeAI(settings?.api_key || process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    generationConfig: { temperature: 0.5 }
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim()
  
  try {
    const aiResp = JSON.parse(text)
    
    if (aiResp.status === 'PASS') {
      // Mark current session question as passed
      await supabaseAdmin.from('session_questions').update({ is_correct: true }).eq('id', activeSQ.id)
      
      // Find NEXT question
      const { data: nextSQs } = await supabaseAdmin
        .from('session_questions')
        .select('questions!inner(content, clos(code))')
        .eq('session_id', sessionId)
        .is('is_correct', null)
        .neq('id', activeSQ.id)
        .order('order_index', { ascending: true })
        .limit(1)
      
      const nextSQ = nextSQs?.[0]
      
      if (nextSQ) {
         const nqObj: any = Array.isArray(nextSQ?.questions) ? nextSQ?.questions[0] : nextSQ?.questions
         
         const prefixMsg = `Tuyệt vời, ý trả lời này rất chính xác! Chúng ta tiếp tục với một câu hỏi khác thuộc phần \`${questionObj?.clos?.code}\` nhé:`
         
         await supabaseAdmin.from('chat_logs').insert({
            session_id: sessionId,
            sender: 'AI',
            message: `${prefixMsg}\n\n**${nqObj?.content || 'Hệ thống đang tải câu hỏi AI...'}**`
         })
      } else {
         // Full Pass cho CLO này
         await supabaseAdmin.from('assessment_sessions').update({ status: 'COMPLETED', end_time: new Date().toISOString() }).eq('id', sessionId)
         
         // Mark progress in tracking
         const { data: pData } = await supabaseAdmin.from('progress_tracking').select('id').eq('student_id', studentId).eq('clo_id', questionObj?.clos?.id).single()
         if (pData) {
            await supabaseAdmin.from('progress_tracking').update({ status: 'PASSED', passed_at: new Date().toISOString() }).eq('id', pData.id)
         } else {
            await supabaseAdmin.from('progress_tracking').insert({ student_id: studentId, clo_id: questionObj?.clos?.id, status: 'PASSED', passed_at: new Date().toISOString() })
         }

         await supabaseAdmin.from('chat_logs').insert({
            session_id: sessionId,
            sender: 'AI',
            message: `🏆 Quá xuất sắc! Xin chúc mừng, em đã chinh phục thành công toàn bộ nội dung của Chuẩn đầu ra \`${questionObj?.clos?.code}\`. Phiên kiểm tra kết thúc, em có thể quay về màn hình Môn học để thi tiếp các phần còn lại.`
         })
      }
    } else {
       await supabaseAdmin.from('chat_logs').insert({ session_id: sessionId, sender: 'AI', message: aiResp.message || "Hãy cố gắng bổ sung thêm ý nhé." })
    }

  } catch (e) {
    console.error(e)
    await supabaseAdmin.from('chat_logs').insert({
      session_id: sessionId,
      sender: 'SYSTEM',
      message: "Xin lỗi, đã có lỗi định dạng khi AI truy vết thuật toán. Hãy gõ lại hoặc làm mới trang nhé."
    })
  }

  revalidatePath(`/student/exam/${classId}`)
}

export async function forceCompleteSession(sessionId: string, classId: string) {
  await supabaseAdmin.from('assessment_sessions').update({ status: 'COMPLETED', end_time: new Date().toISOString() }).eq('id', sessionId)
  revalidatePath(`/student/exam/${classId}`)
  return { success: true }
}
