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
