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

### Current first-run checkpoint

At the latest pre-run read-back on 12.11.2026 02:10 UTC, the job remained active and had no invocation. Of 49 verified TMDB IDs, 10 have succeeded and 39 have no refresh-state row, so remain eligible; there are no latest failures. The Vault secret was confirmed present in the earlier 01:54 UTC check, without reading its value. Focused Deno handler/worker tests passed **76/76**, and `deno check` passed for the runtime and test modules. This checkpoint does not prove that the scheduled invocation ran; see [latest read-back](RELEASE_EVIDENCE.md#tmdb-cron-pre-run-readback--12112026-0210-utc), [focused tests](RELEASE_EVIDENCE.md#admin-movie-catalog-edge-v30-count-parser-fix--12112026), and [live source parity](RELEASE_EVIDENCE.md#tmdb-worker-live-source-parity--11112026-2356-utc).

Supabase's [Cron guide](https://supabase.com/docs/guides/cron) documents `cron.job` and `cron.job_run_details` as the schedule and run-history tables. The [quickstart](https://supabase.com/docs/guides/cron/quickstart) shows the bounded history query pattern.

## Backup and recovery

The Free-plan export and restore prerequisites are tracked separately in [the PostgreSQL backup runbook](DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted). Do not treat an application-schema dump as a full Supabase project backup: Auth identities, Storage objects, service settings, and Edge secrets need separate recovery planning. The current export helper intentionally refuses to run until CLI authentication, the project link, and an encrypted, access-restricted destination are verified.
