'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createDepartment(formData: FormData) {
  const code = formData.get('code') as string
  const name = formData.get('name') as string

  if (!code || !name) return { error: 'Vui lòng điền đủ mã khoa và tên khoa' }

  const { error } = await supabaseAdmin
    .from('departments')
    .insert({ code, name })

  if (error) {
    if (error.code === '23505') return { error: `Mã khoa hoặc tên khoa này đã tồn tại (${code})` }
    return { error: error.message }
  }

  revalidatePath('/admin/departments')
}

export async function updateDepartment(id: string, formData: FormData) {
  const code = formData.get('code') as string
  const name = formData.get('name') as string

  if (!code || !name) return { error: 'Vui lòng điền đủ dữ liệu' }

  const { error } = await supabaseAdmin
    .from('departments')
    .update({ code, name })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') return { error: `Mã khoa hoặc tên khoa này bị trùng với khoa khác` }
    return { error: error.message }
  }

  revalidatePath('/admin/departments')
}

export async function deleteDepartment(id: string) {
  const { error } = await supabaseAdmin
    .from('departments')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/departments')
}
