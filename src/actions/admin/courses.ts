'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createCourse(formData: FormData) {
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const credits = parseInt(formData.get('credits') as string) || 3

  const { error } = await supabaseAdmin.from('courses').insert({
    code,
    name,
    credits
  })

  if (error) return { error: error.message }
  
  revalidatePath('/admin/courses')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function deleteCourse(id: string) {
  const { error } = await supabaseAdmin.from('courses').delete().eq('id', id)
  if (error) return { error: error.message }
  
  revalidatePath('/admin/courses')
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function updateCourse(formData: FormData) {
  const id = formData.get('id') as string
  const code = formData.get('code') as string
  const name = formData.get('name') as string
  const credits = parseInt(formData.get('credits') as string) || 3

  const { error } = await supabaseAdmin.from('courses').update({
    code,
    name,
    credits
  }).eq('id', id)

  if (error) return { error: error.message }
  
  revalidatePath('/admin/courses')
  revalidatePath('/admin/classes')
  return { success: true }
}
