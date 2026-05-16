'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function deleteQuestion(id: string, courseId: string) {
  // xoá question (rubrics tự delete cascade hoặc bảng tự dọn)
  await supabaseAdmin.from('questions').delete().eq('id', id)
  
  revalidatePath(`/lecturer/courses/${courseId}`)
}

export async function updateQuestion(formData: FormData) {
  const qId = formData.get('questionId') as string
  const rId = formData.get('rubricId') as string
  const courseId = formData.get('courseId') as string
  const content = formData.get('content') as string
  const criteria = formData.get('criteria') as string
  const bloom_level = formData.get('bloom_level') as string
  const options = formData.get('options') as string
  const correct_answer = formData.get('correct_answer') as string

  if (qId && content) {
    const payload: any = { content, bloom_level, type: 'BOTH' }
    if (options && options.trim().startsWith('[')) payload.options = JSON.parse(options)
    if (correct_answer) payload.correct_answer = correct_answer
    await supabaseAdmin.from('questions').update(payload).eq('id', qId)
  }
  
  if (rId && criteria) {
    await supabaseAdmin.from('rubrics').update({ criteria }).eq('id', rId)
  }
  
  revalidatePath(`/lecturer/courses/${courseId}`)
}

export async function toggleQuestionActive(id: string, currentStatus: boolean, courseId: string) {
  await supabaseAdmin.from('questions').update({ is_active: !currentStatus }).eq('id', id)
  revalidatePath(`/lecturer/courses/${courseId}`)
}

export async function createQuestionManual(formData: FormData) {
  const cloId = formData.get('cloId') as string
  const courseId = formData.get('courseId') as string
  const content = formData.get('content') as string
  const type = formData.get('type') as string
  const bloom_level = formData.get('bloom_level') as string
  
  const options = formData.get('options') as string
  const correct_answer = formData.get('correct_answer') as string
  const criteria = formData.get('criteria') as string

  const payload: any = { clo_id: cloId, content, type, is_active: true, bloom_level }
  
  if (options && options.trim().startsWith('[')) {
    payload.options = JSON.parse(options || '[]')
    payload.correct_answer = correct_answer
  }

  const { data: qData } = await supabaseAdmin.from('questions').insert(payload).select().single()

  if (qData && criteria) {
    await supabaseAdmin.from('rubrics').insert({ question_id: qData.id, criteria })
  }

  revalidatePath(`/lecturer/courses/${courseId}`)
}
