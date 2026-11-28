# TMDB Add to Watchlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the explicit TMDB add action import a missing catalog movie and add it to the initiating user's Watchlist atomically.

**Architecture:** Reuse the existing authenticated TMDB import route and user-scoped transaction. Resolve the Watchlist from the authenticated profile and use the existing `(list_id, movie_id)` uniqueness constraint for idempotency.

**Tech Stack:** React, TypeScript, Supabase Edge Function, PostgreSQL.

**Spec:** `docs/superpowers/specs/2026-11-28-tmdb-add-to-watchlist.md`

## Global Constraints

- TMDB credentials stay in the Edge Function.
- Browsing is read-only; user list changes require the explicit add action.
- Do not create a Supabase migration or write to production during local implementation.
- Keep new import quota behavior and existing user authorization checks.

## Review Focus

- Published duplicate: add to Watchlist, no new import quota row.
- New movie: movie, metadata, quota and Watchlist item commit together.
- Missing Watchlist: fail without leaving a published orphan movie.
- Repeated action: one Watchlist row only.
- Guest: retain login redirect and return location.

---

### Task 1: Atomic Watchlist inclusion

**Files:**
- Modify: `supabase/functions/rewind-api/repositories/tmdb_catalog.ts`
- Modify: `supabase/functions/rewind-api/http/routes/tmdb_catalog.ts`
- Modify: `supabase/functions/rewind-api/contracts/repository.ts`
- Modify: `frontend/src/api/movies.api.ts`
- Modify: `frontend/src/pages/Search.tsx`
- Modify: `frontend/src/components/ListEntrySearch.tsx` only if its default import behavior changes
- Modify: `frontend/src/i18n.ts`
- Modify: `docs/superpowers/specs/2026-11-28-tmdb-public-discovery-design.md`
- Modify: `PLAN.md`

**Interfaces:** Preserve `POST /api/tmdb/movies/import` and its `{ movieId, title }` response; the authenticated profile is resolved server-side.

- [x] Add the authenticated user's Watchlist item before each successful global-catalog action transaction commit, including existing-movie and concurrent-insert paths.
- [x] Keep duplicate insertion idempotent using the existing list-item unique constraint.
- [x] Change the global Films results to localized “Add to my Watchlist” wording; keep custom-list editor wording and behavior.
- [x] Record that TMDB browse remains read-only and import occurs only on explicit selection.
- [x] Run the frontend TypeScript/Vite production build and Deno type check for the touched Edge modules; no production deploy or hosted DB mutation is part of this plan.
