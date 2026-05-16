-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.assessment_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  status character varying DEFAULT 'IN_PROGRESS'::character varying CHECK (status::text = ANY (ARRAY['IN_PROGRESS'::character varying, 'COMPLETED'::character varying, 'LOCKED'::character varying]::text[])),
  start_time timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  end_time timestamp with time zone,
  exam_mode character varying DEFAULT 'ORAL'::character varying,
  clo_id uuid,
  CONSTRAINT assessment_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT assessment_sessions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT assessment_sessions_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assessment_sessions_clo_id_fkey FOREIGN KEY (clo_id) REFERENCES public.clos(id)
);
CREATE TABLE public.chat_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  sender character varying NOT NULL CHECK (sender::text = ANY (ARRAY['STUDENT'::character varying, 'AI'::character varying, 'SYSTEM'::character varying]::text[])),
  message text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chat_logs_pkey PRIMARY KEY (id),
  CONSTRAINT chat_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.assessment_sessions(id)
);
CREATE TABLE public.class_subjects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_class_id uuid NOT NULL,
  course_id uuid NOT NULL,
  semester character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  lecturer_id uuid,
  schedule jsonb CHECK (schedule IS NULL OR jsonb_typeof(schedule) = 'array'::text),
  CONSTRAINT class_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT class_subjects_student_class_id_fkey FOREIGN KEY (student_class_id) REFERENCES public.student_classes(id),
  CONSTRAINT class_subjects_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT class_subjects_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.classes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  lecturer_id uuid,
  semester character varying NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  student_class_id uuid,
  schedule text,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT classes_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.profiles(id),
  CONSTRAINT classes_student_class_id_fkey FOREIGN KEY (student_class_id) REFERENCES public.student_classes(id)
);
CREATE TABLE public.clos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  code character varying NOT NULL,
  content text NOT NULL,
  priority integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  exam_question_count integer DEFAULT 1,
  exam_knowledge_count integer DEFAULT 1,
  exam_comprehension_count integer DEFAULT 0,
  exam_application_count integer DEFAULT 0,
  exam_time_minutes integer,
  CONSTRAINT clos_pkey PRIMARY KEY (id),
  CONSTRAINT clos_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  name text NOT NULL,
  credits integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  code character varying UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  extracted_text text,
  uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['ADMIN'::character varying, 'LECTURER'::character varying, 'STUDENT'::character varying]::text[])),
  full_name text NOT NULL,
  code character varying UNIQUE,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  cohort character varying,
  dob date,
  hometown text,
  gender character varying,
  student_class_id uuid,
  department_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_student_class_id_fkey FOREIGN KEY (student_class_id) REFERENCES public.student_classes(id),
  CONSTRAINT profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.progress_tracking (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  student_id uuid NOT NULL,
  clo_id uuid NOT NULL,
  status character varying DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'PASSED'::character varying]::text[])),
  passed_at timestamp with time zone,
  CONSTRAINT progress_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT progress_tracking_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT progress_tracking_clo_id_fkey FOREIGN KEY (clo_id) REFERENCES public.clos(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clo_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_active boolean DEFAULT true,
  type character varying DEFAULT 'ORAL'::character varying,
  options jsonb,
  correct_answer text,
  bloom_level character varying DEFAULT 'Nhận biết'::character varying,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_clo_id_fkey FOREIGN KEY (clo_id) REFERENCES public.clos(id)
);
CREATE TABLE public.rubrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_id uuid NOT NULL,
  criteria text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rubrics_pkey PRIMARY KEY (id),
  CONSTRAINT rubrics_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.session_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  question_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  student_answer text,
  is_correct boolean,
  CONSTRAINT session_questions_pkey PRIMARY KEY (id),
  CONSTRAINT session_questions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.assessment_sessions(id),
  CONSTRAINT session_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.student_ai_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  class_id uuid,
  score_data jsonb,
  ai_markdown text,
  generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_ai_reports_pkey PRIMARY KEY (id),
  CONSTRAINT student_ai_reports_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_ai_reports_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.student_class (
  student_id uuid NOT NULL,
  class_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT student_class_pkey PRIMARY KEY (student_id, class_id),
  CONSTRAINT student_class_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_class_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.student_classes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  cohort character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  department_id uuid,
  CONSTRAINT student_classes_pkey PRIMARY KEY (id),
  CONSTRAINT fk_student_classes_department FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.sys_settings (
  id integer NOT NULL DEFAULT nextval('sys_settings_id_seq'::regclass),
  llm_provider character varying DEFAULT 'GEMINI'::character varying,
  api_key text,
  system_prompt text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sys_settings_pkey PRIMARY KEY (id)
);