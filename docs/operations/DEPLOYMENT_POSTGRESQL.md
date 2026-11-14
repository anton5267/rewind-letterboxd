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

## Supabase Free backup and recovery — not yet accepted

### GitHub Actions encrypted application export

The manual workflow `.github/workflows/backup-supabase.yml` exports the `rewind` schema using PostgreSQL 17, checks the archive table of contents, encrypts it with GPG AES256, and uploads only ciphertext plus its SHA-256 checksum. Artifacts expire after 30 days. The hosted database reports PostgreSQL 17.11. The published workflow is available through manual dispatch. Its first production export and restore rehearsal remain pending.

Configure repository Actions secrets at `https://github.com/anton5267/rewind-letterboxd/settings/secrets/actions` using the project's **session pooler** connection details, port 5432.

- `SUPABASE_BACKUP_HOST` — session pooler hostname.
- `SUPABASE_BACKUP_USER` — session pooler database username.
- `SUPABASE_BACKUP_PASSWORD` — database password.
- `REWIND_BACKUP_PASSPHRASE` — strong independent encryption passphrase, also retained in the owner's password manager for recovery.

Once the secrets are configured, run the workflow manually from Actions. Download the encrypted artifact before expiry. Decrypt with `gpg --output rewind.dump --decrypt rewind.dump.gpg`, which prompts for the passphrase. Restore into a disposable PostgreSQL database with the required REWIND roles/functions available and compare rows, IDs, foreign keys and sequences before accepting recovery. The dump contains application schema/data. Auth identities, Storage objects, role definitions, Edge secrets and Dashboard settings require separate recovery handling. A successful archive listing alone does not complete restore acceptance.

### Recovery scope and older helper

Restore into a disposable PostgreSQL target with the required roles/functions, then compare rows, IDs, foreign keys, nullable fields and sequences. Keep the live project and local MySQL data intact. Recovery must also cover matching Auth UUIDs, Auth configuration, Storage object bytes/bucket settings, Edge source/secrets and Cron schedules. Follow the [Storage restoration procedure](SUPABASE_OPERATIONS.md#profile-image-storage-and-cleanup).

The earlier Windows export helper belongs to the unpublished local checkout. Its CLI version, ACL/encryption checks, preflight/export commands and limitations are preserved in the [historical runbook](../archive/DEPLOYMENT_POSTGRESQL_2026_11_14.md#existing-windows-export-helper). The published GitHub Actions workflow provides the current cloud export path. The local MySQL VPS backup/restore scripts handle their own environment.

## References

- [Hosted operations, TMDB and Storage restoration](SUPABASE_OPERATIONS.md).
- [Current release evidence](RELEASE_EVIDENCE.md).
- [Historical deployment and recovery observations](../archive/DEPLOYMENT_POSTGRESQL_2026_11_14.md).
