-- Run as the project database owner after the profile_media_storage migration.
-- cron.schedule updates an existing job with this name when replayed.
-- This public read wakes the Edge cleanup worker only while media work is due.
SELECT cron.schedule(
    'rewind-profile-media-cleanup',
    '*/5 * * * *',
    $job$
    SELECT net.http_get(
        url := 'https://cuirmicbzspomijgkkwo.supabase.co/functions/v1/rewind-api/api/genres',
        params := jsonb_build_object('cleanupTick', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint),
        headers := '{"Cache-Control":"no-cache"}'::jsonb,
        timeout_milliseconds := 10000
    )
    WHERE EXISTS (
        SELECT 1 FROM rewind.profile_media_objects
        WHERE status <> 'ACTIVE' AND next_attempt_at <= CURRENT_TIMESTAMP
            AND (locked_until IS NULL OR locked_until <= CURRENT_TIMESTAMP)
    );
    $job$
);
