'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generateAIReport(classId: string, forceUpdate: boolean = false) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }

  if (!forceUpdate) {
    // Check if report exists
    const { data: existing } = await supabaseAdmin.from('student_ai_reports')
       .select('*').eq('student_id', user.id).eq('class_id', classId).single()
    if (existing) return { data: existing }
  }

  // 1. Fetch Class & Course info
  const { data: cls } = await supabaseAdmin.from('classes').select('*, courses(*)').eq('id', classId).single()
  
  // 2. Fetch Sessions
  const { data: sessions } = await supabaseAdmin.from('assessment_sessions')
     .select('id, status, exam_mode, clo_id, end_time')
     .eq('student_id', user.id)
     .eq('class_id', classId)
     .in('status', ['COMPLETED', 'IN_PROGRESS'])

  let quizQuestions: string[] = []
  let oralLogsContext = ''
  const scoreData: any = {}

  if (sessions) {
    for (const session of sessions) {
      if (session.exam_mode === 'MULTIPLE_CHOICE') {
         const { data: sqData } = await supabaseAdmin.from('session_questions')
            .select('*, questions(content, options, correct_answer, clos(code))')
            .eq('session_id', session.id)
         
         if (sqData) {
            sqData.forEach(sq => {
               const qObj: any = Array.isArray(sq.questions) ? sq.questions[0] : sq.questions
               const cloCode = qObj?.clos?.code || 'Kiến thức chung'
               
               if (!scoreData[cloCode]) scoreData[cloCode] = { correct: 0, total: 0 }
               scoreData[cloCode].total++
               
               if (sq.is_correct) {
                  scoreData[cloCode].correct++
               } else {
                  quizQuestions.push(`- CLO: ${cloCode} | Sai câu hỏi: "${qObj?.content}" | SV chọn sai: "${sq.student_answer || 'Bỏ trống'}"`)
               }
            })
         }
      } else if (session.exam_mode === 'ORAL') {
         const { data: logs } = await supabaseAdmin.from('chat_logs')
            .select('*').eq('session_id', session.id).order('timestamp', { ascending: true })

         // Phiên Oral đôi khi không có clo_id gắn thẻ tĩnh mà dựa theo luồng, 
         // nhưng ta có thể tạm lưu nó dưới tên Nhóm Vấn Đáp.
         if (logs && logs.length > 0) {
            oralLogsContext += `\n--- Lịch sử hội thoại Vấn đáp ---\n`
            logs.forEach(l => {
               oralLogsContext += `${l.sender === 'STUDENT' ? 'Sinh Viên' : 'Trợ lý AI'}: ${l.message}\n`
            })
         }
      }
    }
  }

  const { data: settings } = await supabaseAdmin.from('sys_settings').select('*').single()
  const apiKey = settings?.api_key || process.env.GEMINI_API_KEY || ''
  if (!apiKey) {
      return { error: 'Hệ thống chưa thiết lập API Key của Google Gemini' }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  
  const prompt = `Bạn là Trợ lý Cố vấn Học tập thông minh. Đây là phân tích dữ liệu thi bài đánh giá năng lực của một bạn sinh viên.
Môn học: ${cls?.courses?.name || 'Môn học đánh giá'}

--- DANH SÁCH LỖI SAI (CÂU HỎI TRẮC NGHIỆM): ---
${quizQuestions.length > 0 ? quizQuestions.join('\n') : "Rất tốt, sinh viên không mắc lỗi đáng kể nào hoặc chưa làm phần trắc nghiệm."}

--- HỘI THOẠI LUYỆN TẬP VẤN ĐÁP: ---
${oralLogsContext || "Không có dữ liệu vấn đáp."}

YÊU CẦU ĐỐI VỚI BẠN (CỐ VẤN):
Dựa trên những kiến thức sai sót trên (trắc nghiệm) và cách tư duy phản xạ (qua hội thoại vấn đáp), hãy:
1. Đưa ra 1 đánh giá ngắn gọn, thân thiện về ưu điểm và nhược điểm trong cách làm bài.
2. Chỉ đích danh tên phần kiến thức/chủ đề sinh viên đang hổng (nếu có).
3. Đưa ra 3 câu hỏi bài tập nhỏ thực hành tự luận để sinh viên suy nghĩ củng cố lại. (Có đáp án giải thích nằm bên dưới).

HÃY XUẤT RA DƯỚI DẠNG FILE MARKDOWN NGÔN NGỮ TIẾNG VIỆT, TRÌNH BÀY SIÊU ĐẸP, HIỆN ĐẠI (Sử dụng heading ###, in đậm, danh sách ý - Không dùng thẻ HTML).`

  try {
     const modelsToTry = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro"]
     let aiMarkdown = ""
     let success = false
     let lastError = null

     for (const modelName of modelsToTry) {
        try {
           const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.7 } })
           const result = await model.generateContent(prompt)
           aiMarkdown = result.response.text()
           success = true
           break
        } catch (e: any) {
           console.log(`Model ${modelName} failed:`, e.message)
           lastError = e
        }
     }

     if (!success) {
        // Nếu tất cả các model backup đều sập do overload từ phía máy chủ Google
        return { error: 'Máy chủ AI của Google đang bị quá tải cục bộ (Lỗi 503). Bạn không cần lo lắng, chỉ cần chờ vài giây hoặc 1-2 phút sau đó F5 Tải Lại trang là được!' }
     }

     // Lưu vào Database Cache
     let finalReport = null
     const { data: existing } = await supabaseAdmin.from('student_ai_reports')
        .select('id').eq('student_id', user.id).eq('class_id', classId).single()
     
     if (existing) {
        const { data } = await supabaseAdmin.from('student_ai_reports').update({
          score_data: scoreData,
          ai_markdown: aiMarkdown,
          generated_at: new Date().toISOString()
        }).eq('id', existing.id).select().single()
        finalReport = data
     } else {
        const { data } = await supabaseAdmin.from('student_ai_reports').insert({
          student_id: user.id,
          class_id: classId,
          score_data: scoreData,
          ai_markdown: aiMarkdown
        }).select().single()
        finalReport = data
     }

     return { data: finalReport }
  } catch (error: any) {
     console.error("Gemini Error:", error)
     return { error: 'Trí Tuệ Nhân Tạo đang gặp sự cố quá tải. ' + error.message }
  }
}
