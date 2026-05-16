'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

/** Sửa điểm thủ công: cập nhật trạng thái passed/pending cho một CLO của sinh viên trong lớp cụ thể */
export async function updateProgressScore(
  studentId: string,
  cloId: string,
  status: 'PASSED' | 'PENDING'
) {
  const passedAt = status === 'PASSED' ? new Date().toISOString() : null

  const { data: existing } = await supabaseAdmin
    .from('progress_tracking')
    .select('id')
    .eq('student_id', studentId)
    .eq('clo_id', cloId)
    .single()

  if (existing) {
    const { error } = await supabaseAdmin
      .from('progress_tracking')
      .update({ status, passed_at: passedAt })
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabaseAdmin
      .from('progress_tracking')
      .insert({ student_id: studentId, clo_id: cloId, status, passed_at: passedAt })
    if (error) return { error: error.message }
  }

  revalidatePath('/lecturer/scores')
  revalidatePath('/lecturer/progress')
  return { success: true }
}
