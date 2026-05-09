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
