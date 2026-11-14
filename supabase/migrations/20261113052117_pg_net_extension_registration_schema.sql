-- Register pg_net outside the exposed public schema to clear the Supabase
-- Security Advisor finding. Supabase keeps the extension API in schema `net`;
-- the pg_cron command can therefore continue calling net.http_post.
-- Fail closed rather than deleting queued requests or stored responses.
DO $migration$
DECLARE
  extension_schema text;
  queued_requests bigint := 0;
BEGIN
  SELECT n.nspname
    INTO extension_schema
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
   WHERE e.extname = 'pg_net';

  IF NOT FOUND THEN
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
    EXECUTE 'CREATE EXTENSION pg_net WITH SCHEMA extensions';
    RETURN;
  END IF;

  IF extension_schema = 'extensions' THEN
    RETURN;
  END IF;

  IF extension_schema <> 'public' THEN
    RAISE EXCEPTION 'pg_net is registered in unexpected schema %, refusing to move it', extension_schema;
  END IF;

  IF to_regclass('net.http_request_queue') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM net.http_request_queue' INTO queued_requests;
  END IF;
  IF queued_requests <> 0 THEN
    RAISE EXCEPTION 'pg_net has % queued requests; refusing to drop the extension', queued_requests;
  END IF;

  IF to_regclass('net._http_response') IS NOT NULL THEN
    EXECUTE 'CREATE TEMP TABLE pg_net_response_backup ON COMMIT DROP AS SELECT id, status_code, content_type, headers, content, timed_out, error_msg, created FROM net._http_response';
  END IF;

  EXECUTE 'CREATE SCHEMA IF NOT EXISTS extensions';
  EXECUTE 'DROP EXTENSION pg_net';
  EXECUTE 'CREATE EXTENSION pg_net WITH SCHEMA extensions';

  IF to_regclass('pg_temp.pg_net_response_backup') IS NOT NULL THEN
    EXECUTE 'INSERT INTO net._http_response (id, status_code, content_type, headers, content, timed_out, error_msg, created) SELECT id, status_code, content_type, headers, content, timed_out, error_msg, created FROM pg_temp.pg_net_response_backup';
  END IF;
END
$migration$;
