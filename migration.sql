-- Chạy file SQL này vào DB Supabase của bạn nhé:

ALTER TABLE clos ADD COLUMN IF NOT EXISTS exam_question_count INTEGER DEFAULT 1;

ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ORAL'; -- 'ORAL' hoặc 'MULTIPLE_CHOICE'
ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB; 
ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer TEXT;

ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS exam_mode VARCHAR(20) DEFAULT 'ORAL';

CREATE TABLE IF NOT EXISTS session_questions (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    student_answer TEXT, 
    is_correct BOOLEAN   
);
