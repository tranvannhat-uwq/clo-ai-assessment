import { createClient } from '@supabase/supabase-js';

const url = 'https://wulczbhhtpbxpxndcmqd.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bGN6YmhodHBieHB4bmRjbXFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU3NDYwOCwiZXhwIjoyMDkwMTUwNjA4fQ.HYW9m8jDPOK1onKPRFvDxkT7cnVIzjZKkMAZ__Bw6MM';

const supabase = createClient(url, key);

async function check() {
  const { data: dept } = await supabase.from('departments').select('*').limit(1);
  if (dept && dept.length > 0) {
    console.log("Department ID type:", typeof dept[0].id);
    console.log("Department ID value:", dept[0].id);
  } else {
    console.log("No departments found");
  }
}
check();
