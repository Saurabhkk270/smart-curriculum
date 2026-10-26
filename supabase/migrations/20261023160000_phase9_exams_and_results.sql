-- =======================================================
-- PHASE 9: EXAMS, EXAM SCHEDULES & RESULTS
-- =======================================================

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  exam_type text not null default 'midterm', -- 'midterm', 'final', 'quiz', 'practical'
  academic_year text default '2026',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  exam_date date not null,
  start_time time not null,
  end_time time not null,
  room_no text not null,
  max_marks integer not null default 100,
  passing_marks integer not null default 40,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.exam_results (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references public.exam_schedules(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  marks_obtained numeric not null,
  grade text not null,
  status text not null default 'pass', -- 'pass', 'fail', 'absent'
  remarks text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  CONSTRAINT exam_results_student_schedule_unique UNIQUE(schedule_id, student_id)
);

-- Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Read Policies
DROP POLICY IF EXISTS "Anyone authenticated can view exams" ON public.exams;
CREATE POLICY "Anyone authenticated can view exams" ON public.exams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view exam schedules" ON public.exam_schedules;
CREATE POLICY "Anyone authenticated can view exam schedules" ON public.exam_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view results" ON public.exam_results;
CREATE POLICY "Anyone authenticated can view results" ON public.exam_results FOR SELECT TO authenticated USING (true);

-- Admin & Teacher Write Policies
DROP POLICY IF EXISTS "Admins and teachers can manage exams" ON public.exams;
CREATE POLICY "Admins and teachers can manage exams" ON public.exams FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can manage exam schedules" ON public.exam_schedules;
CREATE POLICY "Admins and teachers can manage exam schedules" ON public.exam_schedules FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can manage results" ON public.exam_results;
CREATE POLICY "Admins and teachers can manage results" ON public.exam_results FOR ALL TO authenticated USING (true);
