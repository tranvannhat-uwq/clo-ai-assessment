import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wulczbhhtpbxpxndcmqd.supabase.co"
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGN6YmhodHBieHB4bmRjbXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3NDYwOCwiZXhwIjoyMDkwMTUwNjA4fQ.HYW9m8jDPOK1onKPRFvDxkT7cnVIzjZKkMAZ__Bw6MM"

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkStudentEnrollments() {
  const email = 'sv21@gmail.com'
  
  // 1. Get Student Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single()
  if (!profile) {
    console.log('Student not found')
    return
  }
  console.log(`Student: ${profile.full_name} (${profile.id})`)
  console.log(`Administrative Class ID: ${profile.student_class_id}`)

  // 2. Check classes linked to administrative class
  const { data: adminClasses } = await supabase
    .from('classes')
    .select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name)')
    .eq('student_class_id', profile.student_class_id)
  
  console.log('\n--- CLASSES LINKED TO ADMIN CLASS ---')
  console.log('Count:', adminClasses?.length || 0)
  adminClasses?.forEach(c => console.log(` - ${c.courses?.code}: ${c.courses?.name} (Lecturer: ${c.profiles?.full_name})`))

  // 3. Check individual enrollments (junction table)
  const { data: indivClasses } = await supabase
    .from('student_class')
    .select('*, classes(*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name))')
    .eq('student_id', profile.id)
  
  console.log('\n--- INDIVIDUAL ENROLLMENTS (student_class table) ---')
  console.log('Count:', indivClasses?.length || 0)
  indivClasses?.forEach(ic => console.log(` - ${ic.classes?.courses?.code}: ${ic.classes?.courses?.name} (Lecturer: ${ic.classes?.profiles?.full_name})`))

  // 4. Check class_subjects (The Plan)
  const { data: subjects } = await supabase
    .from('class_subjects')
    .select('*, courses(name, code), profiles(full_name)')
    .eq('student_class_id', profile.student_class_id)
  
  console.log('\n--- CLASS_SUBJECTS (Planned for this class) ---')
  console.log('Count:', subjects?.length || 0)
  subjects?.forEach(s => console.log(` - ${s.courses?.code}: ${s.courses?.name} (Lecturer: ${s.profiles?.full_name})`))
}

checkStudentEnrollments()
