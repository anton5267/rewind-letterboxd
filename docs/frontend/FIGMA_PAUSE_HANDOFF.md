# REWIND Figma parity — progress handoff

**Last updated:** 25 November 2026
**Status:** Resumed 25 November 2026. No production deployment has been performed as part of this Figma work.

## Goal

Review the full REWIND Figma file, compare the approved/visible screens with the local app, implement missing UI where appropriate, and leave the application usable locally and on GitHub Pages. Treat Figma's `READY` frames as implementation targets; inspect `DRAFT`, `REFERENCE`, hidden and untagged layers before deciding whether they are app requirements. Do not invent working integrations where the product/API has none.

## Work completed before this pause

- Created and populated `docs/frontend/FIGMA_PARITY_MATRIX.csv`: **574 layer/frame rows** with status, node ID, likely route, locale, viewport, dimensions and review notes.
- Added the overall approach and screen inventory in `docs/frontend/FIGMA_PARITY_DESIGN.md`; ongoing visual and implementation notes are in `docs/frontend/FIGMA_HANDOFF.md`.
- Implemented and visually checked many auth, profile, public profile, list, film, person, journal, community, notification and admin screens/states. The handoff and matrix contain the frame-level evidence, screenshots and focused test results; use those as the source of truth rather than this summary as a replacement.
- Recent account-settings work covered Connections, Profile, Avatar/Banner and Authentication desktop/mobile states. Profile and Authentication anchors were verified locally. Connections is documented as an integration gap: Figma depicts X/Instagram OAuth cards, while the app has manual profile links and no provider OAuth routes. No fake connect buttons were introduced.
- Completed desktop parity for the owner list editor frames `361:592` (unranked) and `341:4372` (ranked). Added the in-editor film search/add flow, aligned the desktop Delete action, and matched the remove/reorder controls while preserving mobile controls. At 1440×3988 the first row is y1758 with 230px pitch and footer y3723; ranked number x177/y1833.5 and poster x238/y1789; unranked poster x168/y1789.
- Added `frontend/tests/e2e/own-list-edit-desktop-ready-figma.spec.ts`; the latest combined run of that suite and `own-list-edit-entries-figma.spec.ts` passed **4/4** desktop/mobile cases using local fixtures. Captures are in `artifacts/visual-audit-20261125/lists/`.
- Reviewed all **7 visible READY admin frames**. Film catalog/editor and comment moderation are covered by existing API-backed UI and focused Playwright checks; all-lists and reported-lists are present as summary/filter surfaces. The two list detail/editor READY frames require backend actions/data absent from the current Supabase Edge API and were recorded as gaps instead of adding inert controls.
- Reviewed 12 mobile DRAFT states for Messages, Admin Settings and Moderator Logs. Existing route states and recovery behaviors are implemented; focused mobile E2E suites passed **21/21**. Exact screenshot geometry for several of those DRAFT variants remains open.
- Reviewed 12 additional auth DRAFT rows spanning desktop email confirmation and localized password recovery/reset states. Fixed stale recovery test fixtures/selectors; `auth-recovery-figma.spec.ts` now passes **12/12**. Desktop email-action checks pass **14/14** when run against a Vite preview with `VITE_SUPABASE_AUTH_ENABLED=true` and a dummy test publishable key, because the verification code intentionally refuses to run when hosted Supabase Auth is disabled.
- Reviewed and implemented four mobile DRAFT public-list comment states. Empty comment threads now remain available on lists with no films, including guest sign-in prompt; the focused guest check passes. Current member/comment/settings suite summary is recorded in the handoff with one unrelated English reply-preference locator still needing follow-up.

## Current scope still open

The seven visible READY admin frames are no longer inventory-only; their current evidence and API gaps are in the matrix/handoff. All 10 remaining visible DRAFT rows and all explicitly tagged REFERENCE, PROTOTYPE, ALTERNATE and ARCHIVE rows have been classified. All 574 matrix rows now have a disposition; **0 remain marked “inventory only.”** Thirty-four rows still describe partial or unverified visual/API evidence, so this is not full Figma acceptance. Three candidate API gaps remain documented without fake controls.

Recent targeted checks: Admin Movies and Admin moderation report specs **2/2 passed**; Messages mobile and Admin retry focus specs **21/21 passed**; password recovery **12/12 passed**; desktop email-action **14/14 passed** with the hosted-Auth test build noted above; mobile header menus **4/4 passed** for UK/EN guests/admins; Journal article editorial frame **1/1 passed**; Admin Settings desktop geometry **1/1 passed** with local API fixtures; mobile global search categories **1/1 passed**; mobile film-filter disclosure/focus **1/1 passed** with local API fixtures. The real API URL-preservation check could not run because the local proxy backend on port 8081 is not running. These are focused local checks, not full CI or overall Figma acceptance.

The owner-list editor review now includes the Figma toolbar search/add action and desktop control styling. Keep existing discard/navigation and mobile touch/keyboard behavior intact during later edits.

## Resume checklist

1. The list editor desktop and mobile checks passed. The local Vite server is available on port 3000 for Playwright and 3010 for the earlier visual-audit session:
   ```powershell
   $env:E2E_BASE_URL='http://127.0.0.1:3010'
   npx playwright test tests/e2e/own-list-edit-desktop-ready-figma.spec.ts --reporter=line
   ```
2. The 574-row inventory classification is complete. Continue resolving the 34 partial/unverified evidence rows: map product screens/components to runtime routes/states and review them at matching viewport/locale; keep library fragments and hidden layers classified by parent/source relationship.
3. Mobile Admin Settings loading, load-error and save-error states plus Moderator Logs UK/EN geometry now match their 393×852 Figma frames. Continue with other unverified mobile states; resolve the admin-list backend contract gap before attempting detail/editor parity.
4. Before calling the audit complete, reconcile every in-scope visible `READY` frame against current matrix evidence, run relevant focused and full quality gates, inspect the final rendered app locally, and verify deployment readiness for GitHub Pages plus Supabase. Do not claim full parity from a subset of passing screens.
5. Publish only after the full audit and release checks are actually complete. The user previously approved working independently and publishing after validation; if the deployment target, credentials, or external production state has changed, confirm the intended target before modifying it.

## Workspace and safety notes

- Repo: `C:\Users\anton\Downloads\Rewimd\rewind-letterboxd`.
- Frontend: `frontend`; local preview used during this work: `http://127.0.0.1:3010`.
- Visual artifacts: `artifacts/visual-audit-20261125/`; Playwright output: `frontend/test-results/`.
- The Git worktree is heavily modified and contains many untracked implementation files, tests, fixtures, and visual assets across frontend, Supabase and docs. Preserve all of it. Do not run broad reset/clean/revert commands. Inspect `git status` and diffs by task before resuming.
- The Figma audit itself does not require recovering the lost MySQL data. Use the existing GitHub repository and Supabase setup as the app's configured services; do not paste passwords or API keys into chat or this document.
- No final full-suite, build, Pages deployment, merge, or completion audit was done for the whole Figma scope at this pause.


Recent continuation: Mobile Moderator Logs UK/EN DRAFT frames now match at 393×852, including the compact admin header, localized Audit log navigation, description, visible target, first card (x16/y340/361×326) and second card at y720. Focused Playwright passes 1/1; captures are under artifacts/visual-audit-20261125/admin-moderator-logs-mobile/.

Recent continuation: Rechecked READY desktop owner Followers frame `363:411` at 15% Figma zoom. The first row is approximately y=1527 in the frame (screenshot-based measurement); local first row y=1529.5, a ~3px difference within screenshot measurement tolerance. Sixteen rows, three metrics per member, pagination and footer remain as previously recorded. Adjacent Following frame `445:455` still requires source opacity/content review. No code or external service state changed.

Following source follow-up: selected exact READY frame `445:455` in Figma. Layer properties explicitly report frame-level opacity `0.2`; the whole owner Following screen is dimmed. Underlying content is visible and resembles the Followers list, but frame styling/state intent is ambiguous. Keep runtime in its regular undimmed product style; do not treat the 20%-opacity frame as its visual target until the designer/source intent is established. No code or Figma changes.
