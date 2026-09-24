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
