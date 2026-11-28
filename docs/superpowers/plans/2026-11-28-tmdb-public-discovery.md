# TMDB public discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let visitors browse paginated, filtered TMDB movie discovery results without first entering a title, while importing only movies they explicitly choose.

**Architecture:** Add a bounded public read-only route to the existing Supabase Edge API and reuse TMDB `/discover/movie`. Reuse local genre rows only where a true `tmdb_id` exists. Add a localized discover section to the existing `/films` search page for empty queries; preserve the existing search and import route.

**Tech Stack:** React, TypeScript, CSS modules, Supabase Edge Function (Deno), TMDB v3.

**Spec:** `docs/superpowers/specs/2026-11-28-tmdb-public-discovery-design.md`

## Global Constraints

- Keep GitHub Pages + Supabase Free and do not add paid services.
- Never expose TMDB or Supabase secret keys to the browser.
- Browse is read-only; explicit authenticated import remains a separate action.
- `include_adult=false`; page max 500; candidate response max eight; cache max 256 entries for 10 minutes.
- No migration or production data writes for discovery.

## Review Focus

- Bad page/filter/language values must return 400 before provider access.
- Provider errors/429 must be sanitized and must not reveal the API key.
- Genre IDs must be TMDB IDs, not REWIND database IDs.
- Changing filters/pages must discard stale responses and update shareable URL state.
- Mobile and unauthenticated browsing must not expose or trigger imports.

---

### Task 1: Normalize TMDB discovery pages

**Files:** `supabase/functions/rewind-api/tmdb.ts`, `supabase/functions/rewind-api/tmdb_test.ts`

- [x] Add failing tests for `/discover/movie` params and normalized candidate/pagination shape.
- [x] Verify RED with the focused Deno test.
- [x] Implement `discoverTmdbMoviePage({ page, genreId, year, minRating, language }, apiKey, fetcher, baseUrl)` without changing the existing admin discovery contract.
- [x] Verify GREEN with the focused Deno test.

### Task 2: Add public Edge route, bounded cache, and mapped genres

**Files:** `supabase/functions/rewind-api/http/routes/tmdb_catalog.ts`, `supabase/functions/rewind-api/repositories/tmdb_catalog.ts`, `supabase/functions/rewind-api/contracts/repository.ts`, `supabase/functions/rewind-api/contracts/catalog.ts`, `supabase/functions/rewind-api/repositories/catalogue.ts`, `supabase/functions/rewind-api/handler_test.ts`

- [x] Add failing route tests for valid public discovery, invalid query parameters, and no database import calls.
- [x] Verify RED using the repository's existing Deno test command.
- [x] Implement route validation, public cache headers, 10-minute/256-entry cache, normalized discovery repository method, and nullable `tmdbId` in genre rows.
- [x] Verify GREEN with the full Edge Deno suite (198 passed).

### Task 3: Add empty-query TMDB discovery UI

**Files:** `frontend/src/api/movies.api.ts`, `frontend/src/api/search.api.ts`, `frontend/src/pages/Search.tsx`, `frontend/src/pages/Search.module.css`, `frontend/src/i18n.ts`

- [x] Add typed discovery query/response API functions and typed `tmdbId` genre metadata.
- [x] Implement URL-backed discovery page/filter state, stale-request protection, loading/error/empty states, pagination, TMDB links, and existing authenticated Add action.
- [x] Keep the existing TMDB query-search branch unchanged; show discovery only when query is blank or shorter than two characters.
- [x] Add Ukrainian/English labels, accessible group labels/status, and responsive grid styles.
- [x] Verify with `npm run verify:build --prefix frontend`.

### Task 4: Document, release, and verify

**Files:** `docs/backend/API.md`, `docs/operations/SUPABASE_OPERATIONS.md`, `PLAN.md`, this plan.

- [x] Document route parameters, filters, cache, read-only boundary, and attribution.
- [x] Run full CI and review the complete diff (CI run `46110051095`; both `verify` and isolated migration replay succeeded).
- [x] Merge after CI and deploy Edge API v72 plus Pages through the established workflow (PR #28, commit `0244d154`; Pages run `46110273909`).
- [x] Verify production `/uk/films/` shell and discovery bundle, public discovery HTTP 200 with eight results, year/rating filters HTTP 200, and GitHub Pages CORS preflight HTTP 204. The endpoint is read-only; no import was made.
- [x] Record results in `PLAN.md`.

**Deferred:** A browser interaction through the discovery pagination and a signed-in Add flow remain part of later controlled UX acceptance. No production user content was created for this release verification.
