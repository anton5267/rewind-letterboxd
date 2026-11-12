-- Best-effort ACL hardening for environments where the migration role owns
-- pg_net. Hosted Supabase currently owns schema net as supabase_admin, so the
-- project postgres role cannot change those grants; Data API must not expose net.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'net') THEN
    REVOKE USAGE ON SCHEMA net FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC, anon, authenticated;
    GRANT USAGE ON SCHEMA net TO postgres;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA net TO postgres;
  END IF;
END
$migration$;
