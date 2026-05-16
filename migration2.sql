-- Chạy vào DB Supabase dể hoàn thiện yêu cầu về độ khó:

ALTER TABLE questions ADD COLUMN IF NOT EXISTS bloom_level VARCHAR(50) DEFAULT 'Nhận biết';

ALTER TABLE clos ADD COLUMN IF NOT EXISTS exam_knowledge_count INTEGER DEFAULT 1;
ALTER TABLE clos ADD COLUMN IF NOT EXISTS exam_comprehension_count INTEGER DEFAULT 0;
ALTER TABLE clos ADD COLUMN IF NOT EXISTS exam_application_count INTEGER DEFAULT 0;
