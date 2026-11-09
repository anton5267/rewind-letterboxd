-- Keep Supabase's automatic public-schema RLS event-trigger function
-- unavailable to browser roles. Supabase creates this function on hosted
-- projects; local PostgreSQL rehearsal containers do not, so skip if absent.
DO $migration$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC';
  END IF;
END;
$migration$;
