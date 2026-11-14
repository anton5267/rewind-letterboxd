# REWIND on GitHub Pages + Supabase Free

> Historical snapshot retained on 14 November 2026. Current guidance is linked from the [archive index](README.md). Old completion labels and local file paths describe their recorded date.

**Current state checked:** 2026-11-13

**Approved hosting:** existing GitHub repository `anton5267/rewind-letterboxd` and Supabase project `cuirmicbzspomijgkkwo`; budget $0, no additional hosting provider.

## Live deployment

- Public site: <https://anton5267.github.io/rewind-letterboxd/>.
- The Node 24 Pages workflow refresh in commit [`c889168`](https://github.com/anton5267/rewind-letterboxd/commit/c889168) passed [run 43010334868](https://github.com/anton5267/rewind-letterboxd/actions/runs/43010334868); post-deploy `/uk/` and `/en/` checks returned HTTP 200.
- The earlier read-only check at **00:34 UTC** found `rewind-api` v38 ACTIVE and public/private route smoke passed; it is historical, not the latest deployment. The latest archived read-back at **15:40 UTC** confirms **v43 ACTIVE**, with activity visibility guards; guest catalog returned HTTP 200 and private activity returned HTTP 401. Neither check proves full signed-in acceptance. [Latest v43 evidence](RELEASE_EVIDENCE_2026.md) · [Earlier v38 smoke](RELEASE_EVIDENCE_2026.md#supabase-edge-v38-deployment-readback-and-public-smoke--13112026-0034-utc).
- The application schema remains private as `rewind`, with RLS enabled. A count-only comparison at **00:57 UTC on 2026-11-13** found 40 hosted and 38 local application tables; 24 corresponding row counts match, and some tables differ substantially. Supabase includes hosted TMDB enrichment, audit and worker state absent from local MySQL; local MySQL contains extra profile/list/tag/movie records. Do not restore either database over the other. Reconcile both snapshots and define per-table merge/ID/FK ownership before any live import. [Full table-count evidence](RELEASE_EVIDENCE_2026.md#live-full-table-count-comparison-read-only--13112026-0057-utc).
- The current core count comparison is **50 hosted movies / 51 local movies**, **2/4 profiles**, **0/0 reviews**, **0/0 ratings**, and **6/12 private lists**. Hosted movie IDs are 1–50; local IDs are 1–50 plus 565. The extra profiles/lists and movie have not been classified as disposable or migration targets. [Core parity evidence](RELEASE_EVIDENCE_2026.md#live-mysql-to-supabase-data-parity-read-only--13112026-0049-utc).

## Auth readiness

The owner saved the production Site URL and four UK/EN login/reset callback URLs, configured Gmail custom SMTP, and saved the branded confirmation/recovery templates. UK confirmation and recovery delivered branded emails; the UK reset and subsequent password sign-in were completed in the production UI. On 11.11, an English confirmation email was delivered and its one-time token was accepted by Supabase Auth `verify`; the resulting profile had role `USER`. This was direct Auth API acceptance, not a browser click-through. An English recovery email was delivered with the published `/en/email-action/` target. The owner reported opening that email, completing the reset, and signing in. A read-only Supabase query at 23:13 UTC found one confirmed USER identity, one linked profile, one session updated at 22:28 UTC, and no deletion-outbox jobs. At 23:36 UTC, the recovered Chrome bridge showed the exact `+rewindtest` alias on the signed-in REWIND Profile page, matching the disposable identity; the account-deletion form was inspected but not submitted. The EN recovery callback UI remains unobserved independently. See [browser match](RELEASE_EVIDENCE_2026.md#disposable-auth-session-browser-match--11112026-2336-utc), [PROGRESS](../project/PROGRESS.md), and [release evidence](../operations/RELEASE_EVIDENCE.md).

The bilingual REWIND confirmation/recovery sources and narrowly scoped apply/read-back helper are published. EN recovery delivery and its callback target are verified; the owner reports following the link and completing reset/sign-in. The recovered Chrome bridge later matched the signed-in Profile page to the exact disposable alias, but did not observe the EN reset callback UI itself. Do not reuse the one-time URL shown in the 11.11 screenshot. Never place SMTP or Management API credentials or one-time Auth links in the repository, frontend, logs, or chat. Leaked-password protection is unavailable on the current Free plan.

## Acceptance sequence

Remaining owner/release checks:

1. **Partly verified:** UK/EN confirmation and recovery emails were delivered. EN confirmation token acceptance and USER provisioning passed through the Auth API; UK recovery/reset/password login passed in the production UI. For EN recovery, the owner reported opening the email, completing the reset, and signing in. At 23:36 UTC, Chrome Profile showed the exact signed-in `+rewindtest` alias, matching the disposable identity. This validates the current profile session but does not independently show the EN callback UI. Do not send another email or reuse the one-time link from the screenshot without a fresh, separately scoped test.
2. **Open cleanup:** the 23:36 UTC browser match confirmed the signed-in REWIND Profile page is the disposable `+rewindtest` identity; the scoped 23:39 UTC read-only inventory found one linked profile, three empty lists, and no ratings, reviews, comments, messages, social records, or outbox jobs. The normal account-deletion flow requires the current password. It was inspected but not submitted; no password was entered and no data changed. Complete cleanup only through the app's authenticated deletion flow, then read back zero Auth/profile/outbox rows. [Browser match](RELEASE_EVIDENCE_2026.md#disposable-auth-session-browser-match--11112026-2336-utc) · [data inventory](RELEASE_EVIDENCE_2026.md#disposable-auth-data-inventory-readback--11112026-2339-utc).
3. Resolve the Free-plan backup/recovery gap below before calling recovery readiness accepted.

Local legacy profiles remain in MySQL and are intentionally not matched to Supabase users by email.

## Supabase Free backup and recovery — not yet accepted

### GitHub Actions encrypted application export

The manual workflow `.github/workflows/backup-supabase.yml` exports the `rewind` schema using PostgreSQL 17, checks the archive table of contents, encrypts it with GPG AES256, and uploads only ciphertext plus its SHA-256 checksum. Artifacts expire after 30 days. The hosted database reports PostgreSQL 17.11. The workflow is available through manual dispatch after publication. Its first production export and restore rehearsal remain pending.

Configure repository Actions secrets at `https://github.com/anton5267/rewind-letterboxd/settings/secrets/actions` using the project's **session pooler** connection details, port 5432.

- `SUPABASE_BACKUP_HOST` — session pooler hostname.
- `SUPABASE_BACKUP_USER` — session pooler database username.
- `SUPABASE_BACKUP_PASSWORD` — database password.
- `REWIND_BACKUP_PASSPHRASE` — strong independent encryption passphrase, also retained in the owner's password manager for recovery.

After publishing the workflow, run it manually from Actions. Download the encrypted artifact before expiry. Decrypt with `gpg --output rewind.dump --decrypt rewind.dump.gpg`, which prompts for the passphrase. Restore into a disposable PostgreSQL database with the required REWIND roles/functions available and compare rows, IDs, foreign keys and sequences before accepting recovery. The dump contains application schema/data. Auth identities, Storage objects, role definitions, Edge secrets and Dashboard settings require separate recovery handling. A successful archive listing alone does not complete restore acceptance.

### Existing Windows export helper

The current project is on the Free plan. Supabase's current documentation says daily managed backups are included on Pro/Team/Enterprise and recommends regular CLI exports plus off-site copies for Free projects. Dashboard **Restore to a new project** requires a paid plan with physical backups enabled. [Backups](https://supabase.com/docs/guides/platform/backups) · [Restore to a new project](https://supabase.com/docs/guides/platform/clone-project).

The Supabase CLI logical dump is only a partial recovery artifact for this application: it excludes managed schemas such as `auth` and `storage`; the default dump also omits table data and custom roles unless requested. REWIND profile rows reference Supabase Auth UUIDs, so a `rewind`-only data restore cannot by itself restore a complete working account service. Storage objects, Auth settings/API keys, Edge secrets, and some project settings need separate handling. Do not treat a SQL dump as a complete project backup. [CLI backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) · [CLI db dump reference](https://supabase.com/docs/reference/cli/supabase-db-dump).

For a future **data-export rehearsal only**, run the repository helper from PowerShell with an already-created EFS/BitLocker-encrypted, access-restricted destination outside this repository. In export mode the helper independently requires a protected ACL whose owner and allowed principals are limited to the current user, SYSTEM, and local Administrators, with Full Control for the current user; it also verifies EFS or active BitLocker itself. The confirmation switch does not bypass either check. It pins Supabase CLI **3.1.0**, checks that this checkout is linked to the intended project, uses the linked remote target, writes separate role/schema/data files, and records SHA-256 hashes. Without `-RunBackup`, it performs only a local CLI/Docker preflight and makes no Supabase connection. Before an export, authenticate with `npx --yes supabase@3.1.0 login` if needed, then link with `npx --yes supabase@3.1.0 link cuirmicbzspomijgkkwo`. Keep the default shared session pooler; do not pass `--skip-pooler`, which selects the direct endpoint. Enter any database password only in the CLI's hidden prompt. Do not place a database password in command arguments, files, or logs.

```powershell
$BackupDir = 'D:\REWIND-backups\supabase'
& .\scripts\backup-supabase.ps1 -Destination $BackupDir
# Only after checking that this folder is encrypted and access-restricted:
& .\scripts\backup-supabase.ps1 -Destination $BackupDir -RunBackup -ConfirmEncryptedDestination
# The export helper runs this integrity check before reporting success; rerun it before any restore:
& .\scripts\verify-supabase-backup.ps1 -ExportDirectory 'D:\REWIND-backups\supabase\rewind-supabase-<timestamp>-<suffix>'
```

The verifier checks the expected project and partial-export marker, the exact three dump filenames, file sizes, and SHA-256 digests. It is an accidental-corruption check, not a signature or proof against a maliciously replaced dump and manifest; it does not establish that PostgreSQL can restore the files or recover Supabase Auth identities. Keep exports encrypted and access-restricted.

The helper's local preflight was verified with Supabase CLI **3.1.0** via `npx` and Docker Engine **29.4.3**. Invocation checks confirmed rejection of the repository, drive root, and unencrypted `%TEMP%`; the latter failed before a dump directory was created. The current ACL guard accepts the dedicated folder only after verifying its protected ACL and rejects the ordinary `%TEMP%` ACL before CLI linking. A fresh CLI `db dump --remote=<project-ref> --dry-run` stopped with `DbConfigIpv6Error` because this network cannot reach the project's direct IPv6 endpoint; no SQL dump ran. The helper now requires the local CLI link for the intended project and uses bare `--remote` so the default shared session pooler is selected. A previous read-only BitLocker check reported `C:` and `S:` fully decrypted. The current session cannot read BitLocker state without administrative rights; current `cipher /c` checks show no EFS encryption on `C:\Users\Legion` or `S:\`. No `-RunBackup` export was run and no database contents were written. `psql` remains unavailable for a restore rehearsal. Replace the example destination with an EFS/BitLocker-encrypted location before running; the helper rejects paths inside the repository and symlink/junction destinations. An incomplete export leaves only its newly created run folder and reports that it contains sensitive partial files.

**Latest destination check — 13.11.2026 00:59 UTC:** S: is an internal NVMe volume, not an external backup device. Earlier checks found C: and S: fully decrypted and no EFS encryption on `%TEMP%` or the S: root. The encryption/admin preflight from 12.11 found no usable protected encrypted folder. No production dump was created. Do not use S: or `%TEMP%` as the production export destination.

A restore rehearsal must target a new disposable database/project, never the live project or local MySQL. Full recovery acceptance still requires a safe Auth-identity export/recovery plan and a verified restore of matching `rewind.users` UUIDs; Auth settings and Edge secrets; and any Storage objects. The current local `backup-production.sh` and `restore-production.sh` scripts are MySQL VPS scripts and do not back up Supabase.

## References

- [Project plan](../../PLAN.md)
- [Current progress](../project/PROGRESS.md)
- [Release evidence](RELEASE_EVIDENCE_2026.md)
- [Supabase custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
