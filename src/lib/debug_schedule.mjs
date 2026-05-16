import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wulczbhhtpbxpxndcmqd.supabase.co"
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGN6YmhodHBieHB4bmRjbXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3NDYwOCwiZXhwIjoyMDkwMTUwNjA4fQ.HYW9m8jDPOK1onKPRFvDxkT7cnVIzjZKkMAZ__Bw6MM"

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkSchedule() {
  const { data: subjects } = await supabase
    .from('class_subjects')
    .select('*, courses(code)')
    .eq('student_class_id', '7a49287e-72f3-4e6c-9a9d-b3a60a409e68')
  
  console.log(JSON.stringify(subjects, null, 2))
}

checkSchedule()
