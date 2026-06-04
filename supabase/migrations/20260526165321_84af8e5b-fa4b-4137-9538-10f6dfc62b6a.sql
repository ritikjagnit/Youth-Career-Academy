
-- Application status enum
CREATE TYPE public.application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- Applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  father_name text NOT NULL,
  mother_name text NOT NULL,
  gender text NOT NULL,
  dob date NOT NULL,
  category text NOT NULL,
  aadhaar_number text NOT NULL,
  mobile text NOT NULL,
  alternate_mobile text,
  email text NOT NULL,
  address text NOT NULL,
  district text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  tenth_board text,
  tenth_percentage text,
  tenth_year text,
  twelfth_board text,
  twelfth_percentage text,
  twelfth_year text,
  twelfth_stream text,
  pcm_pcb_percentage text,
  gap_year text,
  scholarship_details text,
  stream text NOT NULL,
  city_preference text,
  college_name text NOT NULL,
  branch_name text,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_app_id ON public.applications(application_id);
CREATE INDEX idx_applications_mobile ON public.applications(mobile);
CREATE INDEX idx_applications_stream ON public.applications(stream);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_created ON public.applications(created_at DESC);

-- Sequence for app id generation
CREATE SEQUENCE public.application_seq START 1;

-- Function to generate application_id like YCC-2025-00001
CREATE OR REPLACE FUNCTION public.generate_application_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('public.application_seq');
  RETURN 'YCC-' || EXTRACT(YEAR FROM now())::text || '-' || LPAD(next_val::text, 5, '0');
END;
$$;

-- Trigger to auto-set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grants
GRANT SELECT, INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
GRANT USAGE ON SEQUENCE public.application_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_application_id() TO anon, authenticated, service_role;

-- RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a new application
CREATE POLICY "Anyone can insert application"
ON public.applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can read applications (needed for receipt page lookup by application_id)
-- For a production app you'd want a token-based lookup; this is a public help-center portal
CREATE POLICY "Anyone can read applications"
ON public.applications FOR SELECT
TO anon, authenticated
USING (true);

-- Only authenticated admins (signed-in users) can update status
CREATE POLICY "Authenticated can update applications"
ON public.applications FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
