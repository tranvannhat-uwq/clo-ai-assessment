import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  
  if (!token) return null
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) return null
  return user
}
