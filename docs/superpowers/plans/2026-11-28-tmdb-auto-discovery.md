# TMDB Auto Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show a live, paginated TMDB popular-movies feed by default on the unfiltered Films page, without importing titles unless the visitor explicitly adds one.

**Architecture:** Reuse the existing Supabase Edge discovery endpoint, filters, and cards. Start discovery open on the initial empty-query route; preserve manual close, query suppression, and URL-driven deep links. Keep REWIND catalogue requests and layout anchors unchanged.

**Tech Stack:** React, TypeScript, React Router, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-tmdb-public-discovery-design.md`

## Global Constraints

- TMDB credentials remain server-side in the existing Supabase Edge API.
- Discovery is public, paginated, localized, and read-only.
- Import occurs only after an authenticated visitor explicitly chooses Add.
- Preserve REWIND catalogue anchors at 1440px and mobile no-overflow.
- Keep TMDB attribution visible.

## Review Focus

- Initial empty query requests and shows a live first page without a click; test initial auto-open/fetch.
- Explicit close remains closed during local filter changes; test close before and after a local query-param update.
- A movie title query hides discovery; test title-search transition.
- Returning from title query restores the feed; test browser back and clear-search transition.
- Guests can browse but cannot import; preserve existing guest login assertion.

---

### Task 1: Make default discovery visible

**Files:**
- Modify: `frontend/src/pages/Search.tsx`
- Test: `frontend/tests/e2e/films-tmdb-disclosure.spec.ts`
- Modify: `frontend/tests/e2e/films-desktop-catalog-figma.spec.ts`
- Modify: `docs/frontend/FIGMA_PARITY_MATRIX.csv`
- Modify: `docs/frontend/FIGMA_HANDOFF.md`
- Modify: `PLAN.md`

**Interfaces:** Reuse `discoverTmdbMovies`, `tmdbDiscoveryOpen`, existing URL filters, and existing TMDB cards.

- [x] **Step 1: Update the E2E test first** to expect the empty-query page to start expanded, fetch one discovery response automatically, render the result, and allow explicit close/focus restoration.
- [x] **Step 2: Run the focused test and confirm it fails** only because initial state is closed and request count remains zero.
- [x] **Step 3: Set initial open state in `Search.tsx`** while retaining title-query close and URL deep-link opening. Do not move or replace the discovery section or alter API behavior.
- [x] **Step 4: Run the focused Playwright tests** and verify automatic request, title query, history, close/focus, guest state, 1440px catalogue anchors, and 393px overflow. Fixture the automatic discovery response in the adjacent desktop parity test and scope its card count to the REWIND catalog.
- [x] **Step 5: Update parity and release notes** to state that automatic discovery is an intentional extension below the source-matched catalogue and does not import any movie automatically.
- [x] **Step 6: Run the existing adjacent TMDB/Films checks** and `npm run verify:build`; record results in `docs/operations/RELEASE_EVIDENCE.md`.

## Self-review

- Spec coverage: first-page request, filters, pagination and import remain existing tested behavior; this plan changes only default visibility/load behavior.
- Test focus covers the regression cases in Review Focus.
- No schema, Edge Function, secret, production data, or deployment changes are included.
- One implementation task is sufficient; the feature uses existing API and UI interfaces.
