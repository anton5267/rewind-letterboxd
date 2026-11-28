# TMDB on-demand catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let every REWIND user find any TMDB movie and use it in the app through a protected, bounded, on-demand import.

**Architecture:** Keep TMDB credentials and database writes in the existing Supabase Edge API. Search TMDB on demand, merge remote candidates with existing catalogue search, and import a chosen TMDB ID only after confirmed authentication. Keep local search and existing records/IDs intact; do not bulk mirror the provider.

**Tech Stack:** React, TypeScript, Vite; Supabase Edge Functions (Deno), PostgreSQL private `rewind` schema, existing TMDB v3 adapter.

**Spec:** `docs/superpowers/specs/2026-11-28-tmdb-on-demand-catalog-design.md`

## Global Constraints

- Keep GitHub Pages + Supabase as the only production architecture; no new paid service.
- Never send `TMDB_API_KEY`, Supabase secret keys, or service-role keys to the browser.
- Keep app tables in private schema `rewind`; use migrations and existing edge roles/RLS.
- Never change existing user records or activity while adding provider metadata.
- TMDB query page maximum 500, query maximum 120 characters, response maximum 8 candidates, import maximum 5 films per account per UTC day.
- Keep `include_adult=false`, preserve TMDB attribution, and honor provider `429` responses.

## Review Focus

- Duplicate/concurrent selection of one TMDB ID must return one stable REWIND movie ID; verify using the unique `movies.tmdb_id` constraint.
- An unauthenticated import must not write; verify route returns 401 before repository invocation.
- An inactive or missing REWIND profile must not import; verify `beginUserTransaction` guard.
- Provider 429/timeout/missing API key must not leak response bodies or secrets; verify sanitized retryable API response.
- Existing local search and activity/IDs remain intact; verify through diff review and read-only local/API fixture checks if fixtures already exist.

---

### Task 1: Extend TMDB provider search contract

**Files:**
- Modify: `supabase/functions/rewind-api/tmdb.ts`
- Modify: `supabase/functions/rewind-api/contracts/catalog.ts`

**Interfaces:**
- Add `searchTmdbMoviePage(...) -> Promise<TmdbMovieCandidatePage>` while preserving the existing `searchTmdbMovies(...)` candidate-list contract used by admin tooling.

- [x] Accept bounded page and locale; preserve existing admin candidate API contract.
- [x] Keep valid provider IDs/titles and cap results at eight.

### Task 2: Add secure public search and authenticated import routes

**Files:**
- Create: `supabase/functions/rewind-api/http/routes/tmdb_catalog.ts`
- Modify: `supabase/functions/rewind-api/handler.ts`
- Modify: `supabase/functions/rewind-api/contracts/repository.ts`
- Modify: `supabase/functions/rewind-api/index.ts`
- Create: `supabase/functions/rewind-api/repositories/tmdb_catalog.ts`
- Create: `supabase/migrations/20261128020750_tmdb_user_import_quota.sql`

**Interfaces:**
- `GET /api/tmdb/movies/search?q=&year=&page=&language=` returns `{ content, page, totalPages, totalResults }` with public cache headers.
- `POST /api/tmdb/movies/import` body `{ tmdbId }` returns canonical `{ movieId, title }`; requires confirmed authenticated active account.
- Search performs no database writes. Import fetches provider metadata server-side, checks for existing TMDB ID, and atomically inserts/synchronizes only the selected film.
- Limit imports to five new films per user per UTC day; re-selecting an already imported ID returns its existing record without consuming quota.
- Use an Edge-only import event table in private `rewind` schema with minimal RLS/grants; lock the user's profile row so simultaneous imports cannot exceed the limit.

- [x] Validate request shape, query length, page/year/language bounds, positive safe TMDB ID, and HTTP method.
- [x] Reuse the TMDB mapper and unique `movies.tmdb_id` constraint; return canonical IDs on duplicate selections.
- [x] Keep error details sanitized, map provider 429/unavailable responses, and keep credentials server-side.
- [x] Cache search requests in-memory for 15 minutes with at most 256 keys.
- [x] Set transaction-local `rewind.tmdb_user_import` only after confirmed Edge Auth and profile/quota checks; add narrow RLS policies and grants.

### Task 3: Integrate provider results into movie search surfaces

**Files:**
- Modify: `frontend/src/api/movies.api.ts`
- Modify: `frontend/src/pages/FilmsDiscover.tsx`
- Modify: `frontend/src/pages/GlobalSearch.tsx`
- Modify: `frontend/src/pages/GlobalSearch.module.css`
- Modify: `frontend/src/components/ListEntrySearch.tsx`
- Modify: `frontend/src/components/ListEntrySearch.module.css`
- Modify: `frontend/src/pages/Search.tsx`
- Modify: `frontend/src/i18n.ts`
- Modify: `frontend/src/pages/About.tsx` only if attribution sentence is not already visible.

**Interfaces:**
- Use typed client helpers for TMDB search/import.
- Combine local and TMDB candidates by `tmdbId`, show local REWIND matches first, and clearly label provider-only results.
- Guests may search and preview candidates; selecting one sends them through the existing login return flow. Signed-in users explicitly add one candidate; successful import navigates to its canonical REWIND movie ID.
- List entry search returns the imported REWIND ID before adding it to a list.

- [x] Preserve current local results and add localized, debounced provider results with stale-request protection.
- [x] Require an explicit add action; guests are routed through the existing login return flow.
- [x] Keep TMDB provider identity and credits; existing About attribution is retained.

### Task 4: Document operations and release boundary

**Files:**
- Modify: `docs/backend/API.md`
- Modify: `docs/operations/SUPABASE_OPERATIONS.md`
- Modify: `PLAN.md`

- [x] Document search/import limits, UTC quota, secret location, and release boundary.
- [x] Record local build, CI, hosted migration, Edge API, and Pages verification.
- [x] Apply hosted migration `20261128020750`, deploy `rewind-api` v70, and publish the frontend.

## Verification Boundary

GitHub Actions CI passed on PR #15 (backend tests with MySQL, Deno checks/tests, frontend build, and clean PostgreSQL 17.11 migration replay) and PR #16 (migration-history alignment). Local `frontend/npm run verify:build` and `npx deno check index.ts` passed earlier. A disposable Supabase CLI 3.0.0 stack replayed all 60 repository migrations on PostgreSQL 17.11 and was stopped afterward. Production migration `20261128020750`, Edge Function v70, and the Pages frontend are deployed. Live checks returned eight TMDB search candidates and rejected an unauthenticated import with 401; no authenticated sample import was performed, so no new movie row was created during verification. Production import rows are currently zero and RLS remains enabled.

## Self-review

- Spec coverage: provider contract (Task 1); search/import security, limits, cache and idempotency (Task 2); user UI and authentication return flow (Task 3); attribution and operations documentation (Task 4).
- Type consistency: `movieId` is the canonical REWIND numeric ID; `tmdbId` remains provider identity; search response is page-shaped and import response is one movie.
- Review risks: duplicate import, auth/profile state, provider failures/rate limits, local result preservation, and UI locale/focus flows are explicitly covered by Review Focus and implementation bounds.
- Scope: one product subsystem, React/Edge/schema changes are coupled by the selected on-demand workflow and remain a single plan.
