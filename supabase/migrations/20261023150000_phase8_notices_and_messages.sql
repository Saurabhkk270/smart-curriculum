-- =======================================================
-- PHASE 8: CAMPUS NOTICES & INTERNAL MESSAGING
-- =======================================================

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  priority text not null default 'normal', -- 'normal', 'high', 'urgent'
  target_audience text not null default 'all', -- 'all', 'students', 'teachers'
  department text default null,
  author_id uuid references public.profiles(id) on delete set null,
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Notices Policies
DROP POLICY IF EXISTS "Anyone authenticated can view notices" ON public.notices;
CREATE POLICY "Anyone authenticated can view notices" ON public.notices
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins and teachers can create notices" ON public.notices;
CREATE POLICY "Admins and teachers can create notices" ON public.notices
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Admins and teachers can update notices" ON public.notices;
CREATE POLICY "Admins and teachers can update notices" ON public.notices
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'teacher')
    )
  );

DROP POLICY IF EXISTS "Admins can delete notices" ON public.notices;
CREATE POLICY "Admins can delete notices" ON public.notices
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Messages Policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
  );

DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Receivers can mark messages as read" ON public.messages
  FOR UPDATE TO authenticated USING (
    receiver_id = auth.uid()
  );
