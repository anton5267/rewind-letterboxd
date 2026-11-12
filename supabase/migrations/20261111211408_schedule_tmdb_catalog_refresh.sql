-- Daily private refresh of already-linked movie metadata, batched by the Edge worker.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

CREATE EXTENSION IF NOT EXISTS pg_net;

DO $secrets$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'rewind_tmdb_refresh_secret') THEN
    PERFORM vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text,
      'rewind_tmdb_refresh_secret', 'Private header credential for the scheduled REWIND TMDB worker');
  END IF;
END
$secrets$;

DO $schedule$
DECLARE existing_job BIGINT;
BEGIN
  SELECT jobid INTO existing_job FROM cron.job WHERE jobname = 'rewind-tmdb-refresh-daily';
  IF existing_job IS NOT NULL THEN PERFORM cron.unschedule(existing_job); END IF;
  PERFORM cron.schedule(
    'rewind-tmdb-refresh-daily',
    '0 3 * * *',
    $job$
      SELECT net.http_post(
        url := 'https://cuirmicbzspomijgkkwo.supabase.co/functions/v1/rewind-api/internal/tmdb-refresh',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Rewind-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'rewind_tmdb_refresh_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 120000
      );
    $job$
  );
END
$schedule$;
