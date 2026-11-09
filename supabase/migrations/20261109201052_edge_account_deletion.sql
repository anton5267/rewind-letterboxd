-- A verified Edge identity may enqueue deletion and remove its own REWIND
-- profile atomically. Hosted Auth cleanup is performed by the server worker.
CREATE OR REPLACE FUNCTION rewind.delete_current_supabase_profile()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, rewind
AS $$
DECLARE
  v_supabase_user_id text := rewind.current_supabase_uid();
  v_user_id bigint;
BEGIN
  IF v_supabase_user_id IS NULL OR btrim(v_supabase_user_id) = '' THEN
    RAISE EXCEPTION 'A verified Supabase identity is required';
  END IF;

  SELECT id INTO v_user_id
  FROM rewind.users
  WHERE supabase_user_id = v_supabase_user_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO rewind.supabase_identity_deletion_outbox (supabase_user_id)
  VALUES (v_supabase_user_id)
  ON CONFLICT (supabase_user_id) DO NOTHING;

  DELETE FROM rewind.users WHERE id = v_user_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION rewind.delete_current_supabase_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION rewind.delete_current_supabase_profile() TO rewind_edge_app;

GRANT SELECT, UPDATE, DELETE ON rewind.supabase_identity_deletion_outbox TO rewind_edge_app;

CREATE POLICY edge_app_identity_outbox_worker
  ON rewind.supabase_identity_deletion_outbox
  FOR ALL TO rewind_edge_app
  USING (current_setting('rewind.identity_cleanup_worker', TRUE) = 'true')
  WITH CHECK (current_setting('rewind.identity_cleanup_worker', TRUE) = 'true');
