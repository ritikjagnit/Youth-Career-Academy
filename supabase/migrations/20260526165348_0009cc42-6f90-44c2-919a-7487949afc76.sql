
ALTER FUNCTION public.generate_application_id() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

DROP POLICY IF EXISTS "Authenticated can update applications" ON public.applications;
REVOKE UPDATE ON public.applications FROM authenticated;
