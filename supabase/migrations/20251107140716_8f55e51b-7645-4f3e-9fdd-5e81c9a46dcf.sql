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