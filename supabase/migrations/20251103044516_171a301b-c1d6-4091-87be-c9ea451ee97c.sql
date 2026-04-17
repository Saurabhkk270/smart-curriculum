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