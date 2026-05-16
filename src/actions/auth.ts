'use server'

import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Vui lòng nhập đầy đủ email và mật khẩu' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Tài khoản hoặc mật khẩu không chính xác' }
  }

  // Lấy role từ bảng profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (data.session) {
    const cookieStore = await cookies()
    cookieStore.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: data.session.expires_in,
      path: '/'
    })
    cookieStore.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    
    // Lưu role để Middleware điều hướng
    const role = profile?.role || 'STUDENT'
    cookieStore.set('user-role', role, { path: '/' })
    
    if (role === 'ADMIN') redirect('/admin')
    if (role === 'LECTURER') redirect('/lecturer')
    redirect('/student')
  }
  
  return { error: 'Lỗi máy chủ' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
  cookieStore.delete('user-role')
  await supabase.auth.signOut()
  redirect('/login')
}
