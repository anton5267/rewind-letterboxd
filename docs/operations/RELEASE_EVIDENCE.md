# REWIND — release evidence

Reviewed 14 November 2026. This page summarizes recorded production state and acceptance boundaries. Detailed results retain their dates in the [archive](../archive/README.md).

## Current production snapshot

| Area | Last verified evidence |
| --- | --- |
| Frontend | Functional commit `645dbd7`, person biographies. [CI 43555741993](https://github.com/anton5267/rewind-letterboxd/actions/runs/43555741993) and [Pages 43555742013](https://github.com/anton5267/rewind-letterboxd/actions/runs/43555742013) succeeded. |
| Edge API | `rewind-api` v59 ACTIVE. All 71 deployed files matched the 85-file source/config package. Fourteen type-only modules were omitted by the provider. Git retains the full redeployable source. |
| Database | Private `rewind` schema and RLS. The v55 inventory recorded 45/45 RLS-enabled application tables. Later Person releases added response enrichment without schema migrations. |
| Auth | Confirmation, recovery/reset and sign-in exercised with disposable identities. Profiles map by Supabase UUID. The current `+rewindtest` ADMIN identity remains protected from automatic cleanup. |
| Local environment | PostgreSQL baseline and data-import rehearsal passed on isolated databases. The original MySQL data was preserved. Fresh local/hosted reconciliation remains open. |

## Recent release coverage

Counts below belong to their recorded release and test scope. Full details, failures corrected during implementation, and read-back limits are retained in [November evidence](../archive/RELEASE_EVIDENCE_2026_11.md).

| Block | Recorded checks and live boundary |
| --- | --- |
| Person biographies `645dbd7` / v59 | New provider/HTTP 7/7, existing TMDB 7/7, six scoped browser flows, targeted follow-up after phone CSS change. Four live API samples preserved prior fields and returned biographies. Actual Amanda Seyfried More/Less expanded and collapsed. |
| Related filmographies `cf4373d` / v58 | Deno 3/3, isolated SQL 10 assertions, six browser flows. Four live responses preserved previous fields; Amanda showed separate acting/producing sections. Detailed job/written credits remain open. |
| Person decades `3ea1218` | Two UK/EN flows and existing primary-grid geometry passed. Live David Bradley decade selection passed. Date-boundary coverage used fixtures. |
| Notifications `6fac660` | Six hosted and six local-Auth fixture flows passed. Live authenticated empty feed/preferences loaded. Real two-account delivery and local SSE reconnect remain open. |
| Messages `9135406` | Six hosted and three existing send/Retry flows passed. Live authenticated empty page loaded. Real two-account delivery remains open. |
| Community `abb7659`, `794ddf6` / v57 | Targeted API/SQL/UI and responsive geometry passed. Live public counts displayed; populated favorites remain open while public favorites are empty. |
| Journal media `bfb8bbd` / v56 | Deno 6/6, SQL 34 assertions, four new and three existing browser flows. Live editor displayed new controls. Real editorial save remains open. |
| Profile/list settings / v49–55 | Targeted API, RLS/SQL, fixture and build checks recorded for reply rules, email change, comments, names, media and pin. Live forms loaded. Remaining mutations are listed in PLAN. |
| Source organization and README | Published `176ae26`, `b2552db`, `3338691`. Structural/API/JSX/CSS comparison and 19 focused browser scenarios passed. README is English with three architecture diagrams. |

## Open release gates

- Encrypted export, disposable restore and full Auth/Storage/settings/secrets recovery. Backup password and independent encryption passphrase remain missing. [Recovery procedure](DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted).
- Row-level reconciliation of local MySQL and hosted records, plus remaining local/upstream source review and Flyway V32 resolution. Production import awaits backup and rollback acceptance.
- Controlled live save/comment/report/moderation, profile-media replacement/removal, list settings, email change, two-account messaging/notifications and editorial save. [Work order](../../PLAN.md#наступна-робота).
- Remaining Figma/layout and product gaps. [Requirements](../project/PROJECT_REQUIREMENTS.md#implementation-status), [design handoff](../frontend/FIGMA_HANDOFF.md).
- TMDB snapshot retains 20/49 missing original-language values and one unverified movie ID. The next eligible scheduled batch was recorded as 16 November 2026, 03:00 UTC. [Worker procedure](SUPABASE_OPERATIONS.md).
- The recorded security review retains the Free-plan leaked-password limitation and three private no-policy table notices with denied client/app/reader SELECT. Preserve the grants and review changes against actual workload. [Dated advisor evidence](../archive/RELEASE_EVIDENCE_2026.md#pg_net-extension-registration-migration-isolated-verification--13112026-0516-utc).

## Evidence rules

- Identify source review, isolated SQL, fixture, CI, production read or authenticated live action explicitly.
- Record successful, failed, skipped and canceled attempts accurately. Link assertions to the paths they exercised.
- Keep secrets and one-time Auth URLs outside documentation and logs.
- Update this snapshot when production state or a release gate changes. Add detailed dated investigations to the archive.

## History

- [Consolidated 2026 evidence](../archive/RELEASE_EVIDENCE_2026.md).
- [November release details](../archive/RELEASE_EVIDENCE_2026_11.md).
- [Preserved published variants](../archive/PUBLISHED_DOC_VARIANTS_2026.md).
