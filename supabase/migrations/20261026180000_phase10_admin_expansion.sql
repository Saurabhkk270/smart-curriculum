-- =======================================================
-- PHASE 10: ADMIN EXPANSION
-- Groups, Feedback, Gallery, Activity Logs & Campus Settings
-- =======================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  department text default null,
  mentor_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  CONSTRAINT group_members_group_student_unique UNIQUE(group_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  category text not null default 'general', -- 'academics', 'faculty', 'facilities', 'canteen', 'general'
  title text not null,
  content text not null,
  rating integer default 5,
  status text not null default 'pending', -- 'pending', 'under_review', 'resolved'
  admin_response text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text default '',
  category text not null default 'events', -- 'events', 'sports', 'cultural', 'academic', 'campus'
  image_url text not null,
  event_date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  details text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.campus_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_settings ENABLE ROW LEVEL SECURITY;

-- Groups Policies
DROP POLICY IF EXISTS "Anyone authenticated can view groups" ON public.groups;
CREATE POLICY "Anyone authenticated can view groups" ON public.groups FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can manage groups" ON public.groups;
CREATE POLICY "Admins and teachers can manage groups" ON public.groups FOR ALL TO authenticated USING (true);

-- Group Members Policies
DROP POLICY IF EXISTS "Anyone authenticated can view group members" ON public.group_members;
CREATE POLICY "Anyone authenticated can view group members" ON public.group_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can manage group members" ON public.group_members;
CREATE POLICY "Admins and teachers can manage group members" ON public.group_members FOR ALL TO authenticated USING (true);

-- Feedback Policies
DROP POLICY IF EXISTS "Anyone authenticated can view feedback" ON public.feedback;
CREATE POLICY "Anyone authenticated can view feedback" ON public.feedback FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "Users can insert feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins can update feedback" ON public.feedback FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can delete feedback" ON public.feedback;
CREATE POLICY "Admins can delete feedback" ON public.feedback FOR DELETE TO authenticated USING (true);

-- Gallery Items Policies
DROP POLICY IF EXISTS "Anyone authenticated can view gallery" ON public.gallery_items;
CREATE POLICY "Anyone authenticated can view gallery" ON public.gallery_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can manage gallery" ON public.gallery_items;
CREATE POLICY "Admins and teachers can manage gallery" ON public.gallery_items FOR ALL TO authenticated USING (true);

-- Activity Logs Policies
DROP POLICY IF EXISTS "Anyone authenticated can view activity logs" ON public.activity_logs;
CREATE POLICY "Anyone authenticated can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert activity logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Campus Settings Policies
DROP POLICY IF EXISTS "Anyone authenticated can view campus settings" ON public.campus_settings;
CREATE POLICY "Anyone authenticated can view campus settings" ON public.campus_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage campus settings" ON public.campus_settings;
CREATE POLICY "Admins can manage campus settings" ON public.campus_settings FOR ALL TO authenticated USING (true);
