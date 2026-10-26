ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admission_year integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_no text;
