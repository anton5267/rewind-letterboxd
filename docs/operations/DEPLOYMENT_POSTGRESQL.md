# REWIND on GitHub Pages + Supabase Free

**Current state checked:** 2026-11-09

**Approved hosting:** existing GitHub repository `anton5267/rewind-letterboxd` and Supabase project `cuirmicbzspomijgkkwo`; budget $0, no additional hosting provider.

## Live deployment

- Public site: <https://anton5267.github.io/rewind-letterboxd/>.
- GitHub Pages run [42697704599](https://github.com/anton5267/rewind-letterboxd/actions/runs/42697704599) succeeded. Commit `4147f80` prerenders 976 UK/EN catalogue routes and 58 noindex application route shells. Direct HTTPS GET returned 200 for the root, UK search, EN registration, UK login, EN forgot-password, UK reset-password, and UK list discovery.
- Supabase project `REWIND` is ACTIVE_HEALTHY on PostgreSQL 17.11. Edge Function `rewind-api` is ACTIVE v13; live migration history ends at `20261109201052 edge_account_deletion`.
- Live Pages-origin smoke returned HTTP 200 for 16 public API GET routes covering genres, movie/person search, global search, review feeds, journal, four public-list feeds, tags, community directories, popular reviewers, and recent activity. Profile and admin GET routes returned 401 without a session. CORS returned exactly `https://anton5267.github.io`.
- Latest local React production build and TypeScript check passed with `npm run verify:build` (299 modules).
- REWIND data lives in the private `rewind` schema. Browser `anon`/`authenticated` roles have no direct access; Edge routes enforce access through the server-side database role and RLS. Existing local MySQL data and accounts were not migrated or changed.
- A live read-only count on 2026-11-09 found **0** hosted Auth users, REWIND profiles, admins, ratings, reviews, lists, and messages. The first public account defaults to `USER`; admin operations remain unavailable until the site owner is confirmed and an `ADMIN` role is assigned to that exact Supabase UUID.

For the one-time owner bootstrap, first complete and confirm the owner's signup, then obtain that authenticated account's Supabase UUID. In Supabase SQL Editor, update by UUID only and confirm exactly one returned row:

```sql
UPDATE rewind.users
SET role = 'ADMIN'
WHERE supabase_user_id = '<verified-owner-supabase-uuid>'::uuid
  AND role = 'USER'
RETURNING id, supabase_user_id, role;
```

Do not choose a profile by email or expose a public admin-bootstrap endpoint. This query is a prepared runbook only; it has not been executed because no Auth profile exists.

## Auth readiness: still open

The deployed UI and Edge API are ready to exercise, but public signup, recovery, and account lifecycle are not accepted yet:

- Live Auth settings confirm email signup is enabled and email confirmation is required (`mailer_autoconfirm=false`). No test Auth user has been created and no email has been sent.
- The Supabase MCP tools cannot read or update the Dashboard Auth URL/SMTP settings. Site URL and the current redirect allowlist therefore remain unverified; a previous 04.11.2026 check recorded zero allowlist rules.
- In the current Pages build, set Site URL to `https://anton5267.github.io/rewind-letterboxd/` and allow these exact redirect URLs:
  - `https://anton5267.github.io/rewind-letterboxd/uk/login/`
  - `https://anton5267.github.io/rewind-letterboxd/en/login/`
  - `https://anton5267.github.io/rewind-letterboxd/uk/reset-password/`
  - `https://anton5267.github.io/rewind-letterboxd/en/reset-password/`
- A custom SMTP sender is required for email to people outside the Supabase organization. Supabase's built-in sender refuses non-team recipients; disabling email confirmation would let users register unverified addresses and is not an acceptable release workaround. SMTP credentials must be entered only in Supabase Dashboard or a secret manager, never in the repository or chat.
- Account deletion also needs a server-only Supabase secret available to the Edge Function. Its presence is not verifiable through the current Supabase tools. Do not expose it in Pages or client code.

## Acceptance sequence

After the Auth URL/callback and SMTP configuration is available, test using a disposable account and clean it up:

1. Signup and confirmation email from both UK and EN routes.
2. Owner signs in with the intended account; verify the Supabase UUID, then promote that profile to `ADMIN`. Never grant `ADMIN` from `user_metadata` or match a legacy profile only by email.
3. Login, logout, token refresh, and access to private profile routes.
4. Password recovery email, reset callback in both locales, and login with the new password.
5. Owner isolation and REWIND role enforcement on ratings, lists, reviews, messages, notifications, and admin APIs.
6. Password-confirmed account deletion and hosted identity outbox cleanup.

Until this passes, describe the site as publicly browsable with the account UI deployed, not as a fully accepted public account service. Local legacy profiles remain in MySQL and are intentionally not matched to Supabase users by email.

## GitHub Actions encrypted application export

The manual workflow `.github/workflows/backup-supabase.yml` exports the `rewind` schema using PostgreSQL 17, checks the archive table of contents, encrypts it with GPG AES256, and uploads only ciphertext plus its SHA-256 checksum. Artifacts expire after 30 days. The hosted database reports PostgreSQL 17.11. The workflow is available through manual dispatch after publication. Its first production export and restore rehearsal remain pending.

Configure repository Actions secrets at `https://github.com/anton5267/rewind-letterboxd/settings/secrets/actions` using the project's **session pooler** connection details, port 5432.

- `SUPABASE_BACKUP_HOST` — session pooler hostname.
- `SUPABASE_BACKUP_USER` — session pooler database username.
- `SUPABASE_BACKUP_PASSWORD` — database password.
- `REWIND_BACKUP_PASSPHRASE` — strong independent encryption passphrase, also retained in the owner's password manager for recovery.

After publishing the workflow, run it manually from Actions. Download the encrypted artifact before expiry. Decrypt with `gpg --output rewind.dump --decrypt rewind.dump.gpg`, which prompts for the passphrase. Restore into a disposable PostgreSQL database with the required REWIND roles/functions available and compare rows, IDs, foreign keys and sequences before accepting recovery. The dump contains application schema/data. Auth identities, Storage objects, role definitions, Edge secrets and Dashboard settings require separate recovery handling. A successful archive listing alone does not complete restore acceptance.

## References

- [Project plan](../../PLAN.md)
- [Current progress](../project/PROGRESS.md)
- [Release evidence](RELEASE_EVIDENCE.md#github-pages-direct-application-routes--09112026)
- [Supabase custom SMTP guide](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
