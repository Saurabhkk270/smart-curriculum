-- Allow teachers to view all student profiles for enrollment
CREATE POLICY "Teachers can view all students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (role = 'student' AND has_role(auth.uid(), 'teacher'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);