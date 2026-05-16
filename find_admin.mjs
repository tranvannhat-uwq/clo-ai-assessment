import { createClient } from '@supabase/supabase-js';

const url = 'https://wulczbhhtpbxpxndcmqd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGN6YmhodHBieHB4bmRjbXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3NDYwOCwiZXhwIjoyMDkwMTUwNjA4fQ.HYW9m8jDPOK1onKPRFvDxkT7cnVIzjZKkMAZ__Bw6MM';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('profiles').select('email, full_name, role').eq('role', 'ADMIN');
  console.log("Admin Data:", data);
}
check();
