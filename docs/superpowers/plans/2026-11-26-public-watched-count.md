# Public watched-film count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an API-backed desktop watched-film total to Films Discovery using the existing public Supabase watched-list data.

**Architecture:** A read-only Edge API route asks a Postgres repository for one aggregate count, validates it as a safe non-negative integer, and returns `{ count }`. The Films Discovery page fetches that value and shows it beside “Just reviewed” at desktop widths only; on failure it omits the metric.

**Tech Stack:** Supabase Edge Function (Deno/TypeScript), PostgreSQL, React, TypeScript, CSS Modules, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-26-public-watched-count-design.md`

## Global Constraints

- Count rows in `rewind.list_items` joined to `rewind.lists` with `list_type='WATCHED'`, active `rewind.users`, and published `rewind.movies`.
- System WATCHED lists remain public as defined by the current RLS policy.
- Do not change schema/data, use the Figma sample total as runtime truth, or change mobile layout.
- Do not deploy as part of this local implementation.

## Review Focus

- Inactive owners must not contribute counts — repository query test checks the active-user predicate.
- Unpublished movies must not contribute counts — repository query test checks the published-movie predicate.
- Zero watched entries must produce `{ count: 0 }` — Edge route test covers empty data.
- Database result outside safe non-negative integer range must fail instead of being rounded — repository parser test covers invalid values.
- Failed or unavailable API must not render a fabricated metric — desktop Playwright case covers omission on failure.

---

### Task 1: Aggregate repository query and endpoint

**Files:**
- Create: `supabase/functions/rewind-api/repositories/public_stats.ts`
- Create: `supabase/functions/rewind-api/http/routes/public_stats.ts`
- Create: `supabase/functions/rewind-api/public_stats_test.ts`
- Modify: `supabase/functions/rewind-api/contracts/repository.ts`
- Modify: `supabase/functions/rewind-api/handler.ts`
- Modify: `supabase/functions/rewind-api/index.ts`

**Interfaces:**
- Produces optional repository method `getPublicWatchedFilmCount(): Promise<number>`.
- Produces `GET /api/stats/watched-films -> { count: number }`.

- [x] **Step 1: Write tests** for the aggregate query predicates and for `GET /api/stats/watched-films` success/zero/unavailable-repository behavior.
- [ ] **Step 2: Run** `deno test --allow-env supabase/functions/rewind-api/public_stats_test.ts`; Deno is not installed in this environment, so the Edge tests remain unverified.
- [x] **Step 3: Implement** a single aggregate query and route. Parse the SQL text count with the existing safe-count parser; return 503 when a test/alternate repository does not provide the optional method.
- [ ] **Step 4: Run** the focused Deno test and confirm all cases pass; pending Deno availability.

### Task 2: Desktop metric in Films Discovery

**Files:**
- Create: `frontend/src/api/stats.api.ts`
- Modify: `frontend/src/pages/FilmsDiscover.tsx`
- Modify: `frontend/src/pages/FilmsDiscover.module.css`
- Modify: `frontend/src/i18n.ts`
- Modify: `frontend/tests/e2e/films-discovery-matched-runtime.spec.ts`

**Interfaces:**
- Frontend API call `getPublicWatchedFilmCount()` returns the `count` from `/stats/watched-films`.
- UI translation key supplies localized “films watched” copy.

- [x] **Step 1: Write a failing desktop browser assertion** for the formatted count beside “Just reviewed,” hidden count on mobile, and no fabricated count after a failed request.
- [x] **Step 2: Run** `npx playwright test tests/e2e/films-discovery-matched-runtime.spec.ts`; count and layout assertions now pass.
- [x] **Step 3: Implement** the API call, localized copy and responsive heading markup. Show the metric only at desktop widths after a successful response.
- [x] **Step 4: Run** `npx playwright test tests/e2e/films-discovery-matched-runtime.spec.ts` (2/2), `npm run typecheck`, and `npm run verify:build`.

### Task 3: Evidence reconciliation

**Files:**
- Modify: `docs/frontend/FIGMA_PARITY_MATRIX.csv`
- Modify: `docs/frontend/FIGMA_HANDOFF.md`
- Modify: `docs/project/PROGRESS.md`
- Modify: `docs/superpowers/plans/2026-11-23-figma-parity.md`

- [x] **Step 1:** Record the API-backed aggregate semantics, desktop-only source match, mobile omission, focused test evidence, and the local Deno limitation.
- [ ] **Step 2:** Run `git diff --check` and parse the Figma matrix CSV; confirm 574 data rows and equal column counts.
- [ ] **Step 3:** Confirm no migration or production state changed.
