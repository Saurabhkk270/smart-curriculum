-- Create user role enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance_sessions table (for QR code sessions)
CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_time TIME NOT NULL DEFAULT CURRENT_TIME,
  qr_code_data TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(session_id, student_id)
);

-- Create class_enrollments table
CREATE TABLE class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Classes policies
CREATE POLICY "Everyone can view classes"
  ON classes FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can update own classes"
  ON classes FOR UPDATE
  USING (teacher_id = auth.uid());

-- Attendance sessions policies
CREATE POLICY "Everyone can view attendance sessions"
  ON attendance_sessions FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create attendance sessions"
  ON attendance_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Attendance records policies
CREATE POLICY "Students can view own attendance"
  ON attendance_records FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Students can mark attendance via QR"
  ON attendance_records FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM attendance_sessions
      WHERE attendance_sessions.id = session_id
      AND attendance_sessions.expires_at > NOW()
    )
  );

CREATE POLICY "Teachers can manually mark attendance"
  ON attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can update attendance records"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can delete attendance records"
  ON attendance_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Class enrollments policies
CREATE POLICY "Everyone can view enrollments"
  ON class_enrollments FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage enrollments"
  ON class_enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, student_id, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Create storage bucket for timetables
INSERT INTO storage.buckets (id, name, public)
VALUES ('timetables', 'timetables', true);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on timetables
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- Everyone can view timetables
CREATE POLICY "Everyone can view timetables"
ON public.timetables
FOR SELECT
USING (true);

-- Teachers can upload timetables
CREATE POLICY "Teachers can upload timetables"
ON public.timetables
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- Teachers can delete their own timetables
CREATE POLICY "Teachers can delete timetables"
ON public.timetables
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('teacher', 'admin')
  )
);

-- Storage policies for timetables bucket
CREATE POLICY "Public can view timetables"
ON storage.objects
FOR SELECT
USING (bucket_id = 'timetables');

CREATE POLICY "Teachers can upload timetables"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'timetables'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can delete their timetables"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'timetables'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
-- Drop the old policy for students marking attendance via QR
DROP POLICY IF EXISTS "Students can mark attendance via QR" ON public.attendance_records;

-- Create new policy that checks if student is enrolled in the class
CREATE POLICY "Students can mark attendance via QR" 
ON public.attendance_records 
FOR INSERT 
WITH CHECK (
  (student_id = auth.uid()) 
  AND (EXISTS (
    SELECT 1
    FROM attendance_sessions
    WHERE attendance_sessions.id = attendance_records.session_id
      AND attendance_sessions.expires_at > now()
      AND EXISTS (
        SELECT 1
        FROM class_enrollments
        WHERE class_enrollments.class_id = attendance_sessions.class_id
          AND class_enrollments.student_id = auth.uid()
      )
  ))
);
-- Remove class_id foreign key and add course and semester fields
ALTER TABLE public.timetables 
DROP COLUMN IF EXISTS class_id;

ALTER TABLE public.timetables
ADD COLUMN course TEXT NOT NULL DEFAULT '',
ADD COLUMN semester TEXT NOT NULL DEFAULT '';

-- Add unique constraint to prevent duplicate timetables for same course/semester
ALTER TABLE public.timetables
ADD CONSTRAINT unique_course_semester UNIQUE (course, semester, uploaded_by);
-- Create announcements table for teachers to post assignments, deadlines, and updates
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Students can view announcements for classes they're enrolled in
CREATE POLICY "Students can view announcements for enrolled classes"
ON public.announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_enrollments.class_id = announcements.class_id
    AND class_enrollments.student_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('teacher', 'admin')
  )
);

-- Teachers can create announcements for their classes
CREATE POLICY "Teachers can create announcements"
ON public.announcements
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.classes
    WHERE classes.id = announcements.class_id
    AND classes.teacher_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Teachers can update their own announcements
CREATE POLICY "Teachers can update own announcements"
ON public.announcements
FOR UPDATE
USING (teacher_id = auth.uid());

-- Teachers can delete their own announcements
CREATE POLICY "Teachers can delete own announcements"
ON public.announcements
FOR DELETE
USING (teacher_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
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
-- Create holidays table for national holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  country TEXT DEFAULT 'IN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, country)
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Everyone can view holidays
CREATE POLICY "Everyone can view holidays"
ON public.holidays
FOR SELECT
USING (true);

-- Teachers and admins can manage holidays
CREATE POLICY "Teachers can manage holidays"
ON public.holidays
FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Insert Indian national holidays for 2024-2025
INSERT INTO public.holidays (name, date, country) VALUES
('Republic Day', '2024-01-26', 'IN'),
('Holi', '2024-03-25', 'IN'),
('Good Friday', '2024-03-29', 'IN'),
('Eid al-Fitr', '2024-04-11', 'IN'),
('Mahavir Jayanti', '2024-04-21', 'IN'),
('Independence Day', '2024-08-15', 'IN'),
('Janmashtami', '2024-08-26', 'IN'),
('Gandhi Jayanti', '2024-10-02', 'IN'),
('Dussehra', '2024-10-12', 'IN'),
('Diwali', '2024-11-01', 'IN'),
('Guru Nanak Jayanti', '2024-11-15', 'IN'),
('Christmas', '2024-12-25', 'IN'),
('Republic Day', '2025-01-26', 'IN'),
('Holi', '2025-03-14', 'IN'),
('Good Friday', '2025-04-18', 'IN'),
('Eid al-Fitr', '2025-04-01', 'IN'),
('Independence Day', '2025-08-15', 'IN'),
('Gandhi Jayanti', '2025-10-02', 'IN'),
('Dussehra', '2025-10-02', 'IN'),
('Diwali', '2025-10-20', 'IN'),
('Christmas', '2025-12-25', 'IN')
ON CONFLICT (date, country) DO NOTHING;
-- Allow teachers to view all student profiles for enrollment
CREATE POLICY "Teachers can view all students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (role = 'student' AND has_role(auth.uid(), 'teacher'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);
-- Add course and semester columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN course text,
ADD COLUMN semester text;

-- Update the handle_new_user function to include course and semester
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, student_id, role, course, semester)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.raw_user_meta_data->>'course',
    NEW.raw_user_meta_data->>'semester'
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
$function$;

-- Drop the unique constraint on student_id to allow signup when student_id already exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_student_id_key;

-- Update the handle_new_user function to handle conflicts gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, student_id, role, course, semester)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'student_id',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
    NEW.raw_user_meta_data->>'course',
    NEW.raw_user_meta_data->>'semester'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    student_id = EXCLUDED.student_id,
    role = EXCLUDED.role,
    course = EXCLUDED.course,
    semester = EXCLUDED.semester;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Allow the app to repair a missing profile row for the signed-in user.
-- The auth trigger should normally create this row, but this keeps new logins
-- from getting stuck if an older database missed the trigger or policy.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND role = 'student'
);

-- Make the auth trigger idempotent so repeated auth events do not break signup.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  requested_role user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, student_id, role, course, semester)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    NULLIF(NEW.raw_user_meta_data->>'student_id', ''),
    requested_role,
    NULLIF(NEW.raw_user_meta_data->>'course', ''),
    NULLIF(NEW.raw_user_meta_data->>'semester', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    student_id = EXCLUDED.student_id,
    role = EXCLUDED.role,
    course = EXCLUDED.course,
    semester = EXCLUDED.semester;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role::text::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- Keep the release database aligned with the current app code.
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS status text DEFAULT 'present',
ADD COLUMN IF NOT EXISTS leave_proof_url text,
ADD COLUMN IF NOT EXISTS device_info text,
ADD COLUMN IF NOT EXISTS scan_location text;

ALTER TABLE public.attendance_records
DROP CONSTRAINT IF EXISTS attendance_records_status_check;

ALTER TABLE public.attendance_records
ADD CONSTRAINT attendance_records_status_check
CHECK (status IS NULL OR status IN ('present', 'leave'));

UPDATE public.attendance_records
SET status = 'present'
WHERE status IS NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('leave-proofs', 'leave-proofs', true)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can view leave proofs" ON storage.objects;
CREATE POLICY "Public can view leave proofs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'leave-proofs');

DROP POLICY IF EXISTS "Teachers can upload leave proofs" ON storage.objects;
CREATE POLICY "Teachers can upload leave proofs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'leave-proofs'
  AND (
    public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Teachers can delete leave proofs" ON storage.objects;
CREATE POLICY "Teachers can delete leave proofs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'leave-proofs'
  AND (
    public.has_role(auth.uid(), 'teacher')
    OR public.has_role(auth.uid(), 'admin')
  )
);
-- Allow all authenticated users to insert their own profile row.
-- This fixes a bug where teachers were blocked from inserting their profiles.
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_year integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_no text;
