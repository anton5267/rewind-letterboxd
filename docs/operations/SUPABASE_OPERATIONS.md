# Hosted Supabase operations

This runbook covers the public GitHub Pages + Supabase deployment. It is separate from the local Spring Boot/MySQL Compose environment and from the legacy VPS runbook.

## Daily TMDB catalog refresh

The hosted job `rewind-tmdb-refresh-daily` is configured for `0 3 * * *` (03:00 UTC in the verified project database session). It calls the private Edge worker. The worker processes at most 10 movies per run, and only refreshes records that already have a verified TMDB ID. It does not discover or assign new IDs. An item that fails is recorded with a sanitized error code and becomes eligible for retry after four days. A transaction advisory lock prevents overlapping runs.

### Before a scheduled run

Use the Supabase SQL editor or the authorized Supabase database tool for these read-only checks:

```sql
select jobname, schedule, active
from cron.job
where jobname = 'rewind-tmdb-refresh-daily';
```

Confirm that the Vault credential exists without selecting or printing its value:

```sql
select exists (
  select 1 from vault.secrets where name = 'rewind_tmdb_refresh_secret'
) as worker_secret_present;
```

```sql
select
  count(*) as linked_movies,
  count(*) filter (where s.movie_id is null) as never_attempted,
  count(*) filter (where s.succeeded_at is not null) as previously_succeeded,
  count(*) filter (where s.last_error_code is not null) as latest_attempt_failed,
  count(*) filter (
    where s.attempted_at is null
       or s.attempted_at < current_timestamp - interval '4 days'
  ) as eligible_for_batch
from rewind.movies m
left join rewind.tmdb_refresh_state s on s.movie_id = m.id
where m.tmdb_id is not null;
```

### After a scheduled run

Check the run history first. Limit the query to recent rows and the one job; do not select the full history:

```sql
select jobid, status, start_time, end_time, left(return_message, 200) as return_message
from cron.job_run_details
where jobid = (
  select jobid from cron.job where jobname = 'rewind-tmdb-refresh-daily'
)
  and start_time >= current_timestamp - interval '1 day'
order by start_time desc
limit 5;
```

The project SQL role may not be able to see `cron.job_run_details`; if the query returns no visible row, check the job's History in Supabase Dashboard → Integrations → Cron. Do not manually invoke the worker and describe that as a cron run.

Then check only the bounded worker state:

```sql
select
  count(*) filter (where s.attempted_at >= current_timestamp - interval '2 hours') as recently_attempted,
  count(*) filter (
    where s.attempted_at >= current_timestamp - interval '2 hours'
      and s.succeeded_at >= current_timestamp - interval '2 hours'
  ) as recently_succeeded,
  count(*) filter (
    where s.attempted_at >= current_timestamp - interval '2 hours'
      and s.last_error_code is not null
  ) as recently_failed
from rewind.tmdb_refresh_state s;
```

One run is expected to attempt up to 10 eligible movies; it may attempt fewer if fewer are eligible. Compare this state with the pre-run snapshot. A failure is not a reason to assign a guessed TMDB ID or edit the state table manually. The current worker uses `TMDB_NOT_FOUND`, `TMDB_UNAVAILABLE`, and `SYNC_FAILED` to avoid storing provider response details.

If the run history and state table disagree, inspect the Edge Function request log only for the narrow window around 03:00 UTC. Avoid repeated or broad Log Query searches; the Dashboard previously showed Log Query usage above its Free allowance, and broad queries can increase scanned volume.

### First scheduled run checkpoint — historical

The first scheduled invocation ran at `2026-11-12 03:00:00 UTC` and cron recorded it as `succeeded`. The bounded 03:05 UTC read-back found 10 attempts, 10 successes, and 0 failures in the preceding two hours; a separate exact-window audit read-back found 10 `MOVIE_TMDB_SYNCED` events. The catalog remains 50 movies with 49 verified TMDB IDs; total successful refresh rows increased from 10 to 20, leaving 29 linked records eligible for later batches. No manual worker request was sent and the Vault secret value was not read. The full Edge Deno suite passed **94/94**, focused handler/worker tests **76/76**, and `deno check` passed. See [post-run read-back](../archive/RELEASE_EVIDENCE_2026.md#tmdb-cron-first-scheduled-run-readback--12112026-0305-utc), [pre-run read-back](../archive/RELEASE_EVIDENCE_2026.md#tmdb-cron-pre-run-readback--12112026-0227-utc), [focused tests](../archive/RELEASE_EVIDENCE_2026.md#admin-movie-catalog-edge-v30-count-parser-fix--12112026), and [live source parity](../archive/RELEASE_EVIDENCE_2026.md#tmdb-worker-live-source-parity--11112026-2356-utc).

### Latest recorded read-only follow-up — 12.11.2026 19:40 UTC

The latest recorded schedule read-back at 12:39 UTC showed the single job active at `0 3 * * *`, with a successful run at 03:00 UTC. A later aggregate-only check at 19:40 UTC found 49 tracked movies, all 49 successful at least once, 39 successful attempts since UTC midnight, and 0 rows with a current error code. That aggregate does not identify which attempts came from cron; it is not evidence of another scheduled run. These are the latest recorded checks, not a fresh live read-back. No worker was manually invoked and no Vault value was read. [Schedule read-back](../archive/RELEASE_EVIDENCE_2026.md#supabase-live-read-only-advisors-role-and-tmdb-refresh--12112026-1239-utc), [later aggregate](../archive/RELEASE_EVIDENCE_2026.md#tmdb-refresh-live-aggregate-recheck--12112026-1940-utc).

Supabase's [Cron guide](https://supabase.com/docs/guides/cron) documents `cron.job` and `cron.job_run_details` as the schedule and run-history tables. The [quickstart](https://supabase.com/docs/guides/cron/quickstart) shows the bounded history query pattern.

## Backup and recovery

The Free-plan export and restore prerequisites are tracked separately in [the PostgreSQL backup runbook](DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted). Do not treat an application-schema dump as a full Supabase project backup: Auth identities, Storage objects, service settings, and Edge secrets need separate recovery planning. The current export helper intentionally refuses to run until CLI authentication, the project link, and an encrypted, access-restricted destination are verified.

## Profile image storage and cleanup

Hosted avatar and banner uploads use the public `rewind-profile-media` bucket. JPEG/PNG files are limited to 2 MB and 4096 pixels per dimension. The browser decodes and re-encodes images to remove source metadata. Edge checks MIME, file headers, dimensions and streamed byte size, then authenticates the numeric profile ID against the confirmed Supabase identity. Client Storage writes have no policies.

The private RLS table `rewind.profile_media_objects` tracks PENDING uploads, ACTIVE images and DELETE work. Reservations expire after ten minutes. Replacement, removal and account deletion queue obsolete files. Cleanup uses bounded batches, leased jobs and retry backoff. The account-deletion trigger keeps detached cleanup records until Storage deletion succeeds.

After restoring the application schema and Edge source, create the bucket with the metadata in migration `20261114014943_profile_media_storage.sql` if it is missing, restore its object bytes separately, and replay `scripts/configure-supabase-media-cleanup.sql` as the database owner. For another Supabase project, replace the public project URL in that script. Replaying the script updates the named five-minute Cron job. It calls the public genres API only while cleanup work is due, waking the Edge worker without an additional secret. An application-schema dump excludes Storage bytes, bucket metadata and Cron schedules.

Inspect only the relevant state when diagnosing cleanup.

```sql
SELECT status, count(*) FROM rewind.profile_media_objects GROUP BY status;
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'rewind-profile-media-cleanup';
```
