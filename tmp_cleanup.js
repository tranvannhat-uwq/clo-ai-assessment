const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
  const { data: sessions } = await supabase
    .from('assessment_sessions')
    .select('id, student_id, class_id')
    .in('status', ['IN_PROGRESS']);

  console.log(`Found ${sessions?.length || 0} active sessions.`);
  
  for (const s of sessions || []) {
    const { data: sq } = await supabase.from('session_questions').select('id').eq('session_id', s.id);
    if (!sq || sq.length === 0) {
      console.log(`Deleting corrupted session ${s.id}...`);
      await supabase.from('chat_logs').delete().eq('session_id', s.id);
      await supabase.from('assessment_sessions').delete().eq('id', s.id);
      console.log(`Deleted ${s.id}`);
    } else {
      console.log(`Session ${s.id} is healthy (${sq.length} questions).`);
    }
  }
}

clean().catch(console.error);
