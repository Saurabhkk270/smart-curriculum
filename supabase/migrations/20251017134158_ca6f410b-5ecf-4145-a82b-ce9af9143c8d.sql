-- Remove class_id foreign key and add course and semester fields
ALTER TABLE public.timetables 
DROP COLUMN IF EXISTS class_id;

ALTER TABLE public.timetables
ADD COLUMN course TEXT NOT NULL DEFAULT '',
ADD COLUMN semester TEXT NOT NULL DEFAULT '';

-- Add unique constraint to prevent duplicate timetables for same course/semester
ALTER TABLE public.timetables
ADD CONSTRAINT unique_course_semester UNIQUE (course, semester, uploaded_by);