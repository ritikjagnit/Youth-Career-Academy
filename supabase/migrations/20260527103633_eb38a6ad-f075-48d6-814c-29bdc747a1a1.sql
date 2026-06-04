CREATE TABLE public.otp_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  otp_code text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  is_used boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_otp_verifications_email_created ON public.otp_verifications (email, created_at DESC);

-- Only service_role (server functions) may access; no anon/authenticated grants by design.
GRANT ALL ON public.otp_verifications TO service_role;

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Explicit deny: no policies for anon/authenticated means no row access via Data API.
-- service_role bypasses RLS automatically.