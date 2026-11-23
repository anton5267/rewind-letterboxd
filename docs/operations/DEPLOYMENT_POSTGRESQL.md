# REWIND on GitHub Pages + Supabase Free

## Public deployment

The public React application runs on [GitHub Pages](https://anton5267.github.io/rewind-letterboxd/). `rewind-api`, Supabase Auth, private PostgreSQL application tables and profile-image Storage provide the hosted service. Source and deployment configuration remain in GitHub. [Architecture](../../README.md#architecture), [current release evidence](RELEASE_EVIDENCE.md).

Deploy the frontend through `.github/workflows/deploy-pages.yml`. It uses the project base path `/rewind-letterboxd/`, `VITE_PUBLIC_CATALOG_ONLY=false`, the Edge API URL and client-safe Supabase configuration. Deploy Edge from the complete `supabase/functions/rewind-api` source graph and `deno.json`; retain type-only modules in Git. Apply reviewed versioned hosted migrations separately and verify the resulting source/schema state.

## Auth configuration

Production Site URL is `https://anton5267.github.io/rewind-letterboxd/`. Keep these UK/EN callback targets in the redirect allowlist.

- `https://anton5267.github.io/rewind-letterboxd/uk/login/`
- `https://anton5267.github.io/rewind-letterboxd/en/login/`
- `https://anton5267.github.io/rewind-letterboxd/uk/reset-password/`
- `https://anton5267.github.io/rewind-letterboxd/en/reset-password/`

Use the checked-in bilingual templates, custom SMTP and email confirmation. Recovery/confirmation links use the published email-action route; preserve its verified redirect chain. Keep one-time URLs and SMTP, Management API and database credentials in their designated secret stores. Profile linking uses the confirmed Supabase UUID. Leaked-password protection remains a known Free-plan limitation.

Controlled live acceptance is tracked in [PLAN](../../PLAN.md#наступна-робота). The current `+rewindtest` identity is an ADMIN and must be preserved during cleanup. Previous disposable-identity records and early deployment versions are [historical evidence](../archive/DEPLOYMENT_POSTGRESQL_2026_11_14.md).

## Migration boundary

Local Spring/MySQL and hosted PostgreSQL have different records. Historical isolated rehearsal verified row counts, IDs, nullable fields, FK and sequences. Before moving real data, obtain consistent snapshots, reconcile rows from both sources, define per-table ID ownership and rehearse rollback. Preserve existing migration histories, resolve the local/upstream Flyway V32 overlap and use the dedicated PostgreSQL baseline. The hosted `supabase/migrations` history is separate from MySQL Flyway. Keep `rewind` private and preserve Supabase-managed Auth objects.

The hosted migration registry contains 56 versions. Source file `20261116144505_movie_crew_credits.sql` was absent from GitHub and the recovery archive, so its local body was reconstructed from read-only production catalog metadata; it is not a byte-for-byte recovery. Its isolated PGlite PostgreSQL 17.4 replay passed against the required earlier schema/roles and access rules. A fresh Supabase local stack replayed all 56 migrations successfully on PostgreSQL 17.11 in GitHub Actions run [`45180339021`](https://github.com/anton5267/rewind-letterboxd/actions/runs/45180339021), using pinned Supabase CLI 3.0.0 and `major_version = 17`. This accepts the clean-baseline migration replay; compare the resulting schema with the hosted catalog as a separate reconciliation step. Do not reapply the reconstructed migration to the hosted project: its version is already present there.

## Supabase Free backup and recovery — partially accepted

### GitHub Actions encrypted application export

The manual workflow `.github/workflows/backup-supabase.yml` exports the `rewind` schema using PostgreSQL 17.11, checks the archive table of contents, encrypts the dump and deterministic per-table rowset manifest with GPG AES256, and uploads only ciphertext plus SHA-256 checksums. Artifacts expire after 30 days. Production [backup run `45183024184`](https://github.com/anton5267/rewind-letterboxd/actions/runs/45183024184) completed successfully on 23 November 2026. [Restore run `45183275567`](https://github.com/anton5267/rewind-letterboxd/actions/runs/45183275567) decrypted the artifact, restored into an ephemeral PostgreSQL 17.11 service, and confirmed that each table's row count and row-content manifest matched the pre-upload restored snapshot; it also scanned all tables and confirmed foreign keys and sequences. Private row counts and hashes were not logged. Earlier archive-only rehearsals are `43932021794` and `44040026836`. This accepts encrypted application-schema snapshot/restore integrity only; it does not compare current live data with a local MySQL source or recover Auth, Storage, secrets, and Dashboard settings.

To verify an existing artifact without changing production, dispatch the workflow with `operation=restore` and the numeric `restore_run_id` of a non-expired backup (current rehearsal run `45183024184`, artifact retained until 23 Dec 2026). The job downloads the encrypted artifact, validates its checksums, decrypts it only in the runner's temporary directory, restores it into an ephemeral PostgreSQL 17.11 service and compares the encrypted rowset manifest against the restored rows. It scans all restored tables and checks that foreign keys and sequences exist; private row counts and hashes are not written to public Actions logs. The runner and disposable database are removed when the job ends. This verifies snapshot/restore integrity, but does not reconcile the snapshot with current live rows or cover Auth, Storage, secrets, and settings.

Configure repository Actions secrets at `https://github.com/anton5267/rewind-letterboxd/settings/secrets/actions` using the project's **session pooler** connection details, port 5432.

- `SUPABASE_BACKUP_HOST` — session pooler hostname.
- `SUPABASE_BACKUP_USER` — session pooler database username.
- `SUPABASE_BACKUP_PASSWORD` — database password.
- `REWIND_BACKUP_PASSPHRASE` — strong independent encryption passphrase, also retained in the owner's password manager for recovery.

For a manual restore, select the backup's workflow run ID; do not restore the production export into the hosted project. This restore workflow's disposable PostgreSQL target is the supported rehearsal path. The dump contains application schema/data. Auth identities, Storage objects, role definitions, Edge secrets and Dashboard settings require separate recovery handling. A successful rowset match proves archive integrity, not full cross-system recovery acceptance.

### Recovery scope and older helper

Restore into a disposable PostgreSQL target with the required roles/functions, then compare rows, IDs, foreign keys, nullable fields and sequences. Keep the live project and local MySQL data intact. Recovery must also cover matching Auth UUIDs, Auth configuration, Storage object bytes/bucket settings, Edge source/secrets and Cron schedules. Follow the [Storage restoration procedure](SUPABASE_OPERATIONS.md#profile-image-storage-and-cleanup).

The earlier Windows export helper belongs to the unpublished local checkout. Its CLI version, ACL/encryption checks, preflight/export commands and limitations are preserved in the [historical runbook](../archive/DEPLOYMENT_POSTGRESQL_2026_11_14.md#existing-windows-export-helper). The published GitHub Actions workflow provides the current cloud export path. The local MySQL VPS backup/restore scripts handle their own environment.

## References

- [Hosted operations, TMDB and Storage restoration](SUPABASE_OPERATIONS.md).
- [Current release evidence](RELEASE_EVIDENCE.md).
- [Historical deployment and recovery observations](../archive/DEPLOYMENT_POSTGRESQL_2026_11_14.md).
