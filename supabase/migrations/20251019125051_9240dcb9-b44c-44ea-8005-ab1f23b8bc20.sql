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