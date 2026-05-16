'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createStudentClass(formData: FormData) {
  const name = formData.get('name') as string
  const cohort = formData.get('cohort') as string
  const department_id = formData.get('department_id') as string

  if (!name || !cohort) return { error: 'Vui lòng cung cấp đủ thông tin lớp hành chính' }

  const dataToInsert: any = {
    name: name.trim().toUpperCase(),
    cohort: cohort.trim().toUpperCase()
  }
  
  if (department_id) {
    dataToInsert.department_id = department_id
  }

  const { error } = await supabaseAdmin.from('student_classes').insert(dataToInsert)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/student-classes')
  // revalidate needed for all pages using this list
  revalidatePath('/admin/users')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function updateStudentClass(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const cohort = formData.get('cohort') as string
  const department_id = formData.get('department_id') as string

  const dataToUpdate: any = {
    name: name.trim().toUpperCase(),
    cohort: cohort.trim().toUpperCase()
  }
  
  if (department_id) {
    dataToUpdate.department_id = department_id
  }

  const { error } = await supabaseAdmin.from('student_classes').update(dataToUpdate).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/student-classes')
  revalidatePath('/admin/users')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function createBulkStudentClasses(
  cohort: string,
  rows: { name: string; department_id: string | null }[]
) {
  if (!cohort || !rows || rows.length === 0) {
    return { error: 'Vui lòng nhập Khóa và ít nhất một lớp.' }
  }

  const validRows = rows.filter(r => r.name && r.name.trim())
  if (validRows.length === 0) {
    return { error: 'Vui lòng nhập tên ít nhất một lớp hợp lệ.' }
  }

  const inserts = validRows.map(r => ({
    name: r.name.trim().toUpperCase(),
    cohort: cohort.trim().toUpperCase(),
    ...(r.department_id ? { department_id: r.department_id } : {})
  }))

  const { error } = await supabaseAdmin.from('student_classes').insert(inserts)
  if (error) return { error: error.message }

  revalidatePath('/admin/student-classes')
  revalidatePath('/admin/users')
  revalidatePath('/admin/classes')
  return { success: true, count: inserts.length }
}

export async function deleteStudentClass(id: string) {
  const { error } = await supabaseAdmin.from('student_classes').delete().eq('id', id)
  if (error) return { error: error.message }
  
  revalidatePath('/admin/student-classes')
  revalidatePath('/admin/users')
  revalidatePath('/admin/classes')
  return { success: true }
}
