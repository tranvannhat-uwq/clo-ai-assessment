'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function updateStudentProfile(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Chưa đăng nhập.' }

  const full_name = (formData.get('full_name') as string)?.trim()
  const dob = (formData.get('dob') as string) || null
  const gender = (formData.get('gender') as string) || null
  const hometown = (formData.get('hometown') as string)?.trim() || null

  if (!full_name) return { error: 'Họ tên không được để trống.' }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ full_name, dob, gender, hometown })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/student/profile')
  return { success: true }
}

export async function changeStudentPassword(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Chưa đăng nhập.' }

  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!newPassword || newPassword.length < 6)
    return { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }
  if (newPassword !== confirmPassword)
    return { error: 'Xác nhận mật khẩu không khớp.' }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })

  if (error) return { error: error.message }
  return { success: true }
}
