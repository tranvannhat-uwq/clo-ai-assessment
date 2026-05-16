'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createCLO(formData: FormData) {
  const courseId = formData.get('courseId') as string
  const code = formData.get('code') as string
  const content = formData.get('content') as string
  const priority = parseInt(formData.get('priority') as string) || 1

  const { error } = await supabaseAdmin.from('clos').insert({
    course_id: courseId,
    code,
    content,
    priority
  })

  if (error) return { error: error.message }
  revalidatePath(`/lecturer/courses/${courseId}`)
  return { success: true }
}

export async function updateCLO(formData: FormData) {
  const cloId = formData.get('cloId') as string
  const courseId = formData.get('courseId') as string
  const code = formData.get('code') as string
  const content = formData.get('content') as string
  const priority = parseInt(formData.get('priority') as string) || 1

  if (!code || !content) return { error: 'Mã CLO và nội dung không được để trống.' }

  const { error } = await supabaseAdmin
    .from('clos')
    .update({ code, content, priority })
    .eq('id', cloId)

  if (error) return { error: error.message }
  revalidatePath(`/lecturer/courses/${courseId}`)
  return { success: true }
}

export async function deleteCLO(id: string) {
  const { data } = await supabaseAdmin.from('clos').select('course_id').eq('id', id).single()
  if (data) {
    await supabaseAdmin.from('clos').delete().eq('id', id)
    revalidatePath(`/lecturer/courses/${data.course_id}`)
  }
}

export async function updateCLOExamCount(formData: FormData) {
  const cloId = formData.get('cloId') as string
  const courseId = formData.get('courseId') as string
  const examKn = parseInt(formData.get('examKn') as string) || 0
  const examCo = parseInt(formData.get('examCo') as string) || 0
  const examAp = parseInt(formData.get('examAp') as string) || 0
  const examTime = parseInt(formData.get('examTime') as string) || 0

  await supabaseAdmin.from('clos').update({ 
    exam_knowledge_count: examKn,
    exam_comprehension_count: examCo,
    exam_application_count: examAp,
    exam_time_minutes: examTime
  }).eq('id', cloId)
  
  revalidatePath(`/lecturer/courses/${courseId}`)
}
