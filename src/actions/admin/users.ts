'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function createUser(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const code = formData.get('code') as string
    const role = formData.get('role') as string
    const cohort = formData.get('cohort') as string | null
    const dob = formData.get('dob') as string | null
    const hometown = formData.get('hometown') as string | null
    const gender = formData.get('gender') as string | null
    const studentClassId = formData.get('studentClassId') as string | null
    const departmentId = formData.get('departmentId') as string | null

    // 1. Tạo tài khoản trong Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return { error: authError?.message || 'Có lỗi khi tạo người dùng' }
    }

    // 2. Ghi metadata vào bảng profiles (Dùng upsert để tránh lỗi nếu Supabase có sẵn Trigger auto-insert)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      code,
      role,
      cohort,
      dob: (dob && dob.trim() !== '') ? new Date(dob).toISOString() : null,
      hometown,
      gender,
      student_class_id: (studentClassId && studentClassId.trim() !== '') ? studentClassId : null,
      department_id: (departmentId && departmentId.trim() !== '') ? departmentId : null
    }, { onConflict: 'id' })

    // Nếu chèn profile thất bại, rollback user Auth
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: profileError.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    console.error("createUser Error:", err)
    return { error: err.message || 'Lỗi server khi tạo người dùng' }
  }
}

export async function deleteUser(userId: string) {
  // Vì có ràng buộc ON DELETE CASCADE, xoá Auth User thì profile ở public cũng bay màu
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  
  revalidatePath('/admin/users')
  return { success: true }
}

export async function bulkCreateUsers(users: any[]) {
  const results = {
    total: users.length,
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const user of users) {
    try {
      const { email, password, fullName, code, role, cohort, dob, hometown, gender, studentClassId } = user

      if (!email || !password || !fullName || !code || !role) {
        results.failed++
        results.errors.push(`Thiếu thông tin bắt buộc cho user: ${email || code || 'Không xác định'}`)
        continue
      }

      // 1. Tạo tài khoản trong Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: String(email).trim(),
        password: String(password).trim(),
        email_confirm: true,
      })

      if (authError || !authData.user) {
        results.failed++
        results.errors.push(`Lỗi tạo auth cho ${email}: ${authError?.message || 'Không rõ'}`)
        continue // chuyển sang user tiếp theo
      }

      // 2. Ghi metadata
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        email: String(email).trim(),
        full_name: String(fullName).trim(),
        code: String(code).trim(),
        role: String(role).toUpperCase().trim(),
        cohort: cohort ? String(cohort).trim() : null,
        dob: (dob && String(dob).trim() !== '') ? new Date(dob).toISOString() : null,
        hometown: hometown ? String(hometown).trim() : null,
        gender: gender ? String(gender).trim() : null,
        student_class_id: (studentClassId && String(studentClassId).trim() !== '') ? studentClassId : null
      }, { onConflict: 'id' })

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        results.failed++
        results.errors.push(`Lỗi lưu profile cho ${email}: ${profileError.message}`)
        continue
      }

      results.success++
    } catch (err: any) {
      console.error("bulkCreateUsers user Error:", err)
      results.failed++
      results.errors.push(`Lỗi không mong muốn: ${err.message}`)
    }
  }

  revalidatePath('/admin/users')
  return results
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const fullName = formData.get('fullName') as string
    const code = formData.get('code') as string
    const cohort = formData.get('cohort') as string | null
    const dob = formData.get('dob') as string | null
    const hometown = formData.get('hometown') as string | null
    const gender = formData.get('gender') as string | null
    const studentClassId = formData.get('studentClassId') as string | null
    const departmentId = formData.get('departmentId') as string | null

    const { error } = await supabaseAdmin.from('profiles').update({
      full_name: fullName,
      code,
      cohort,
      dob: (dob && dob.trim() !== '') ? new Date(dob).toISOString() : null,
      hometown,
      gender,
      student_class_id: (studentClassId && studentClassId.trim() !== '') ? studentClassId : null,
      department_id: (departmentId && departmentId.trim() !== '') ? departmentId : null
    }).eq('id', userId)

    if (error) return { error: error.message }
    
    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    console.error("updateUser Error:", err)
    return { error: err.message || 'Lỗi server khi cập nhật' }
  }
}

export async function resetUserPassword(userId: string, formData: FormData) {
  try {
    const password = formData.get('password') as string
    if (!password || password.length < 6) return { error: 'Mật khẩu phải từ 6 ký tự' }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password
    })

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    console.error("resetUserPassword Error:", err)
    return { error: err.message || 'Lỗi server khi reset mật khẩu' }
  }
}


