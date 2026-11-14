# REWIND — release evidence

Reviewed 14 November 2026. This page summarizes recorded production state and acceptance boundaries. Detailed results retain their dates in the [archive](../archive/README.md).

## Current production snapshot

| Area | Last verified evidence |
| --- | --- |
| Frontend | Full UK/EN React application. Dated release/acceptance proofs are retained in the November archive. Current publication is tracked by the [Pages workflow](https://github.com/anton5267/rewind-letterboxd/actions/workflows/deploy-pages.yml). |
| Edge API | `rewind-api` v59 ACTIVE. All 71 deployed files matched the 85-file source/config package. Fourteen type-only modules were omitted by the provider. Git retains the full redeployable source. |
| Database | Private `rewind` schema and RLS. The v55 inventory recorded 45/45 RLS-enabled application tables. Later Person releases added response enrichment without schema migrations. |
| Auth | Confirmation, recovery/reset and sign-in exercised with disposable identities. Profiles map by Supabase UUID. The current `+rewindtest` ADMIN identity remains protected from automatic cleanup. |
| Local environment | PostgreSQL baseline and data-import rehearsal passed on isolated databases. The original MySQL data was preserved. Fresh local/hosted reconciliation remains open. |

## Recent release coverage

Counts below belong to their recorded release and test scope. Full details, failures corrected during implementation, and read-back limits are retained in [November evidence](../archive/RELEASE_EVIDENCE_2026_11.md).

| Block | Recorded checks and live boundary |
| --- | --- |
| Live Journal authoring and reader | Production plain/rich create/edit/reload, media clear, publish/unpublish and UK/EN reader passed. Anonymous draft reads returned 404, published reads returned 200, and anonymous Admin access returned 401. QA article cleaned up, delivery count 0 and audit retained. Three structural-action focus losses fixed, two extended editor flows passed. Release 87926bf completed CI/Pages and live unsaved-form keyboard checks. |
| Journal article source alignment | Separate Header/Skeleton, exact existing background, original breadcrumb/divider SVGs, 1126×642 rounded cover and reader columns. Five reader/media/audio/error cases passed, followed by the updated header geometry/clearance case. Typecheck and 393/320px visual checks passed. Fonts and complete frame parity remain open. |
| Shared navigation Figma assets | Original logo verified against both exports. Original search/social SVGs, desktop border, nav slots/opacity, search focus and legal links checked across 10 UK/EN viewport combinations. Typecheck passed. Inter/SF Pro Display and full-frame parity remain open. |
| Admin queries and metadata compatibility | Request/role guards, localized genres and original-language omission have dated fixture coverage. Review editor styles use a dedicated module; two focused tests cover UK desktop/EN phone editing, focus and delayed errors. New cast-order fixtures passed 6/6 in each checkout across sparse/removed/null/empty/boundary cases and native validation. Both source typechecks passed. TOML explicitly excludes rewind, matching the denied live anon/authenticated schema grants. Real catalogue mutations remain open. |
| Profile settings and website link | Production UK save/reload and EN clear/reload passed for display name, names, bio, location, pronoun and all three reply preferences. Public reads omit names/email. Website save/reload/public-read/clear passed and baseline was restored. Media upload awaits Chrome extension file-URL permission. |
| Owner lists and profile navigation | Production create/order/rank/reply, description clear, pin/save/reload, comment create/edit/reload/delete and public→private acceptance passed. Privacy removed the pin and anonymous reads returned 404. Temporary data was cleaned up. Two UK/EN navigation fixtures and the existing Retry/focus scenario passed. |
| Viewer isolation and source reconciliation | Hosted migration versions/names cover 55/55. Home and Header reset by viewer ID and ignore late previous-viewer responses. Six focused Header scenarios passed across UK desktop and EN phone, covering loaded counters and late success/error. Earlier six UK/EN Home and six favorite scenarios passed after shared Auth-fixture extraction. Two original-checkout Home controls and both source typechecks passed. |
| Person biographies `645dbd7` / v59 | New provider/HTTP 7/7, existing TMDB 7/7, six scoped browser flows, targeted follow-up after phone CSS change. Four live API samples preserved prior fields and returned biographies. Actual Amanda Seyfried More/Less expanded and collapsed. |
| Related filmographies `cf4373d` / v58 | Deno 3/3, isolated SQL 10 assertions, six browser flows. Four live responses preserved previous fields; Amanda showed separate acting/producing sections. Detailed job/written credits remain open. |
| Person decades `3ea1218` | Two UK/EN flows and existing primary-grid geometry passed. Live David Bradley decade selection passed. Date-boundary coverage used fixtures. |
| Notifications `6fac660` | Six hosted and six local-Auth fixture flows passed. Live authenticated empty feed/preferences loaded. Real two-account delivery and local SSE reconnect remain open. |
| Messages `9135406` | Six hosted and three existing send/Retry flows passed. Live authenticated empty page loaded. Real two-account delivery remains open. |
| Community `abb7659`, `794ddf6` / v57 | Targeted API/SQL/UI and responsive geometry passed. Live public counts displayed; populated favorites remain open while public favorites are empty. |
| Journal media `bfb8bbd` / v56 | Deno 6/6, SQL 34 assertions, four new and three existing browser flows. Live editor displayed new controls. Later production acceptance is recorded above. |
| Profile/list settings / v49–55 | Targeted API, RLS/SQL, fixture and build checks recorded for reply rules, email change, comments, names, media and pin. Live forms loaded. Remaining mutations are listed in PLAN. |
| Source organization and README | Published `176ae26`, `b2552db`, `3338691`. Structural/API/JSX/CSS comparison and 19 focused browser scenarios passed. README is English with three architecture diagrams. |

## Open release gates

- Encrypted export, disposable restore and full Auth/Storage/settings/secrets recovery. Backup password and independent encryption passphrase remain missing. [Recovery procedure](DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted).
- Row-level reconciliation of local MySQL and hosted records, plus remaining local/upstream source review. Preserve the verified local V32 identity/V33 outbox/V36 original-language lineage during future Spring integration. Production import awaits backup and rollback acceptance.
- Controlled cross-account comment/report/moderation, profile-media upload/replacement/removal, cross-account list reply rules, email change, two-account messaging/notifications. [Work order](../../PLAN.md#наступна-робота).
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
