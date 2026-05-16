'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function saveSettings(formData: FormData) {
  const provider = formData.get('provider') as string
  const apiKey = formData.get('apiKey') as string
  const systemPrompt = formData.get('systemPrompt') as string

  // Kiểm tra cấu hình đã có tải vào DB hay chưa
  const { data: existing } = await supabaseAdmin.from('sys_settings').select('id').single()

  if (existing) {
    const { error } = await supabaseAdmin.from('sys_settings').update({
      llm_provider: provider,
      api_key: apiKey,
      system_prompt: systemPrompt,
      updated_at: new Date().toISOString()
    }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    // Nếu chưa có (first setup)
    const { error } = await supabaseAdmin.from('sys_settings').insert({
      llm_provider: provider,
      api_key: apiKey,
      system_prompt: systemPrompt
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}
