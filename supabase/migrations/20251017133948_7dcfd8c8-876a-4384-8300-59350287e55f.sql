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