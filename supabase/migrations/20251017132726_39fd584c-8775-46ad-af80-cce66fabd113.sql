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