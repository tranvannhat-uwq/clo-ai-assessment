import { createClient } from '@supabase/supabase-js';

const url = 'https://wulczbhhtpbxpxndcmqd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGN6YmhodHBieHB4bmRjbXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3NDYwOCwiZXhwIjoyMDkwMTUwNjA4fQ.HYW9m8jDPOK1onKPRFvDxkT7cnVIzjZKkMAZ__Bw6MM';

const supabase = createClient(url, key);

async function resetPassword() {
  const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, email').eq('role', 'ADMIN');
  if (profileErr || !profiles.length) {
    console.log("Error or no admin found", profileErr);
    return;
  }
  
  const adminId = profiles[0].id;
  const { data, error } = await supabase.auth.admin.updateUserById(
    adminId,
    { password: 'admin123456' }
  );
  if (error) {
    console.log("Error updating password:", error.message);
  } else {
    console.log("SUCCESS. Email:", profiles[0].email, "Password: admin123456");
  }
}
resetPassword();
