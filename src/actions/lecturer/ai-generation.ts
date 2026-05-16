'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import mammoth from 'mammoth'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function uploadAndParseMaterial(formData: FormData) {
  const file = formData.get('file') as File
  const courseId = formData.get('courseId') as string
  
  if (!file || !courseId) return { error: 'Vui lòng cung cấp đầy đủ file và thông tin môn học' }

  // 1. Chuyển File thành Buffer
  const buffer = Buffer.from(await file.arrayBuffer())
  let extractedText = ''

  // 2. Chạy parsers tương ứng
  try {
    if (file.name.endsWith('.pdf')) {
      const pdfParseModule = await import('pdf-parse' as any)
      const pdfParseFn = pdfParseModule.default || pdfParseModule
      const data = await pdfParseFn(buffer)
      extractedText = data.text
    } else if (file.name.endsWith('.docx')) {
      const data = await mammoth.extractRawText({ buffer })
      extractedText = data.value
    } else {
      return { error: 'Chỉ hỗ trợ file dạng PDF hoặc DOCX' }
    }
  } catch (err: any) {
    return { error: 'Không thể trích xuất văn bản từ file. File có thể bị hỏng.' }
  }

  // 3. Import thẳng Text vào Postgres Database (In-memory file parsing saves storage costs)
  const { error } = await supabaseAdmin.from('materials').insert({
    course_id: courseId,
    file_name: file.name,
    file_url: 'LOCAL_PARSED', 
    extracted_text: extractedText
  })

  if (error) return { error: error.message }

  revalidatePath(`/lecturer/courses/${courseId}`)
  return { success: true }
}

export async function generateQuestionsByAI(courseId: string, materialId: string, cloId: string, countKn: number, countCo: number, countAp: number) {
  // 1. Lấy dữ liệu Material, CLO, Settings
  const { data: material } = await supabaseAdmin.from('materials').select('extracted_text').eq('id', materialId).single()
  const { data: clo } = await supabaseAdmin.from('clos').select('code, content').eq('id', cloId).single()
  const { data: settings } = await supabaseAdmin.from('sys_settings').select('*').single()
  
  if (!material || !clo || !settings) return { error: 'Cấu hình hệ thống hoặc dữ liệu bị thiếu.' }

  try {
    // 2. Wrap Prompt gửi lên Gemini
    const prompt = `
      Cấu hình AI hệ thống: ${settings.system_prompt}
      ===================================
      Nhiệm vụ của bạn là sinh câu hỏi khảo thí cho sinh viên.
      
      Dựa vào nội dung giáo trình sau đây (chỉ đọc dưới 8000 ký tự đầu tiên để tham chiếu từ vựng/kiến thức):
      "${material.extracted_text.substring(0, 8000)}"
      
      Hãy tạo ĐÚNG ${countKn + countCo + countAp} câu hỏi đánh giá tập trung vào Chuẩn đầu ra (CLO) sau:
      - Mã CLO: ${clo.code}
      - Yêu cầu của CLO: ${clo.content}
      
      Phân bổ số lượng và mức độ nhận thức (Bloom) như sau:
      ${countKn > 0 ? `- ${countKn} câu Nhận biết (Hỏi kiến thức cơ bản, định nghĩa, đặc điểm hiển nhiên trong giáo trình)` : ''}
      ${countCo > 0 ? `- ${countCo} câu Thông hiểu (Yêu cầu diễn giải, tóm tắt, so sánh ở mức hiểu bài)` : ''}
      ${countAp > 0 ? `- ${countAp} câu Vận dụng cao (Phân tích tình huống, thiết kế giải pháp, phản biện)` : ''}
      
      QUY TẮC PHẢN HỒI KẾT QUẢ: 
      TRẢ VỀ ĐÚNG 1 ĐỊNH DẠNG MẢNG JSON. KHÔNG BỌC TRONG CODE BLOCK HAY BẤT KỲ DẤU MARKDOWN NÀO (KHÔNG CÓ \`\`\`json).
      Cấu trúc chuẩn:
      [
        {
          "content": "Nội dung câu hỏi phân tích 1 dựa theo chuẩn",
          "bloom_level": "Nhận biết", // Chỉ trả về 1 trong 3 nhãn: "Nhận biết", "Thông hiểu", "Vận dụng cao"
          "criteria": "Tiêu chí chấm điểm vấn đáp (Rubric) chi tiết - sinh viên cần nói được những gì là đậu.",
          "options": ["Khái niệm A", "Khái niệm B", "Định lý C", "Nguyên lý D"],
          "correct_answer": "Khái niệm A"
        }
      ]
    `

    let generatedJsonText = ''

    if (settings.llm_provider === 'GEMINI') {
       const genAI = new GoogleGenerativeAI(settings.api_key || process.env.GEMINI_API_KEY || '')
       const model = genAI.getGenerativeModel({ 
         model: "gemini-flash-latest",
         generationConfig: { temperature: 0.5 }
       })
       const result = await model.generateContent(prompt)
       generatedJsonText = result.response.text()
    } else {
       return { error: 'Chức năng OpenAI chưa được implement. Vui lòng bật Gemini.' }
    }

    // 3. Phân tách dọn dẹp JSON
    generatedJsonText = generatedJsonText.replace(/```json/gi, '').replace(/```/g, '').trim()
    const parsedData = JSON.parse(generatedJsonText)

    // 4. Lưu câu hỏi kèm bộ tiêu chí vào CSDL
    for (const item of parsedData) {
       const payload: any = { 
         clo_id: cloId, 
         content: item.content, 
         is_active: true, 
         type: 'BOTH',
         bloom_level: item.bloom_level || 'Nhận biết'
       }
       
       if (item.options && Array.isArray(item.options)) {
          payload.options = item.options
          payload.correct_answer = item.correct_answer
       }

       const { data: qData, error: qError } = await supabaseAdmin.from('questions').insert(payload).select().single()

       if (!qError && qData && item.criteria) {
         await supabaseAdmin.from('rubrics').insert({
           question_id: qData.id,
           criteria: item.criteria
         })
       }
    }

    revalidatePath(`/lecturer/courses/${courseId}`)
    return { success: true }
  } catch (error: any) {
    return { error: 'Lỗi parse AI: ' + error?.message }
  }
}
