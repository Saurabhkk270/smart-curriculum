-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Update handle_new_user function to insert into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, student_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  
  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop and recreate all problematic RLS policies to use has_role function

-- Classes policies
DROP POLICY IF EXISTS "Teachers can create classes" ON public.classes;
CREATE POLICY "Teachers can create classes"
ON public.classes
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Teachers can update own classes"
ON public.classes
FOR UPDATE
USING (teacher_id = auth.uid());

-- Attendance sessions policies
DROP POLICY IF EXISTS "Teachers can create attendance sessions" ON public.attendance_sessions;
CREATE POLICY "Teachers can create attendance sessions"
ON public.attendance_sessions
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Attendance records policies
DROP POLICY IF EXISTS "Teachers can manually mark attendance" ON public.attendance_records;
CREATE POLICY "Teachers can manually mark attendance"
ON public.attendance_records
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance_records;
CREATE POLICY "Students can view own attendance"
ON public.attendance_records
FOR SELECT
USING (
  student_id = auth.uid() OR
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Teachers can update attendance records" ON public.attendance_records;
CREATE POLICY "Teachers can update attendance records"
ON public.attendance_records
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Teachers can delete attendance records" ON public.attendance_records;
CREATE POLICY "Teachers can delete attendance records"
ON public.attendance_records
FOR DELETE
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Class enrollments policies
DROP POLICY IF EXISTS "Teachers can manage enrollments" ON public.class_enrollments;
CREATE POLICY "Teachers can manage enrollments"
ON public.class_enrollments
FOR ALL
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

-- Announcements policies
DROP POLICY IF EXISTS "Students can view announcements for enrolled classes" ON public.announcements;
CREATE POLICY "Students can view announcements for enrolled classes"
ON public.announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE class_enrollments.class_id = announcements.class_id
    AND class_enrollments.student_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Teachers can create announcements" ON public.announcements;
CREATE POLICY "Teachers can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = announcements.class_id
    AND classes.teacher_id = auth.uid()
  ) OR
  public.has_role(auth.uid(), 'admin')
);

-- Timetables policies
DROP POLICY IF EXISTS "Teachers can upload timetables" ON public.timetables;
CREATE POLICY "Teachers can upload timetables"
ON public.timetables
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Teachers can delete timetables" ON public.timetables;
CREATE POLICY "Teachers can delete timetables"
ON public.timetables
FOR DELETE
USING (
  public.has_role(auth.uid(), 'teacher') OR 
  public.has_role(auth.uid(), 'admin')
);