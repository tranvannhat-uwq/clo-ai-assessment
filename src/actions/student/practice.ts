'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function generatePracticeQuestions(courseId: string, cloId: string) {
  // 1. Lấy dữ liệu giáo trình và CLO
  const { data: materials } = await supabaseAdmin.from('materials').select('extracted_text').eq('course_id', courseId).limit(2)
  const { data: clo } = await supabaseAdmin.from('clos').select('code, content').eq('id', cloId).single()
  const { data: settings } = await supabaseAdmin.from('sys_settings').select('*').single()
  
  if (!clo || !settings) return { error: 'Dữ liệu CLO hoặc cấu hình hệ thống bị thiếu.' }

  const combinedText = materials?.map(m => m.extracted_text).join('\n').substring(0, 8000) || ''

  try {
    const prompt = `
      Bạn là một Trợ lý Ôn tập AI. 
      Nhiệm vụ: Tạo 5 câu hỏi TRẮC NGHIỆM rèn luyện cho sinh viên.
      
      Dựa vào nội dung giáo trình: "${combinedText}"
      Tập trung vào Chuẩn đầu ra (CLO): ${clo.code} - ${clo.content}
      
      QUY TẮC:
      - Trả về mảng JSON gồm 5 đối tượng.
      - Mỗi đối tượng có: content, options (mảng 4 chuỗi), correct_answer (phải nằm trong options), explanation (giải thích tại sao đáp án đó đúng).
      - KHÔNG bọc trong code block markdown.
      
      Định dạng:
      [
        {
          "content": "...",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "...",
          "explanation": "..."
        }
      ]
    `

    const genAI = new GoogleGenerativeAI(settings.api_key || process.env.GEMINI_API_KEY || '')
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
    const result = await model.generateContent(prompt)
    let text = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim()
    
    return { data: JSON.parse(text) }
  } catch (err: any) {
    return { error: 'Lỗi sinh câu hỏi rèn luyện: ' + err.message }
  }
}
