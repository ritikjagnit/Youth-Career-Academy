
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS documents_status jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS college_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS branch_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_signature_name text,
  ADD COLUMN IF NOT EXISTS witness_name text,
  ADD COLUMN IF NOT EXISTS service_selected text;
