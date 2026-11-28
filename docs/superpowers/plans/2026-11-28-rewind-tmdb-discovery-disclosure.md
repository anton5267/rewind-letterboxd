# REWIND TMDB Discovery Disclosure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Films catalogue aligned with Figma while making TMDB discovery easy to open, browse, and share without automatically importing a bulk catalogue.

**Architecture:** Add a localized disclosure control to the existing Films hero and render the existing discovery filters/results only while open. Keep URL-backed filters and lazy Edge API requests; deep-linked discovery URLs open automatically. No database or production changes.

**Tech Stack:** React, TypeScript, CSS Modules, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-28-tmdb-public-discovery-design.md`

## Global Constraints

- TMDB credentials remain server-side in the existing Supabase Edge API.
- TMDB discovery remains read-only; only the existing explicit authenticated import action writes a selected movie.
- The unfiltered route makes no TMDB discovery request until a visitor opens the panel.
- No bulk mirroring, schema changes, or production deployment.

## Review Focus

- A deep link with any discovery filter/page parameter must open discovery and preserve its filters.
- A title query of at least two characters must use title search and suppress discovery.
- Opening/closing the panel must have accessible state, focus, and reduced-motion-aware scrolling.
- The collapsed default must preserve desktop Figma geometry and fit the mobile viewport.
- Guests must continue seeing login links instead of import actions.

---

### Task 1: Accessible Films discovery disclosure

**Files:**
- Modify: `frontend/src/pages/Search.tsx`
- Modify: `frontend/src/pages/Search.module.css`
- Modify: `frontend/src/i18n.ts`
- Test: `frontend/tests/e2e/films-tmdb-disclosure.spec.ts`
- Modify: `docs/frontend/FIGMA_HANDOFF.md`
- Modify: `docs/operations/RELEASE_EVIDENCE.md`

**Interfaces:**
- Consume existing `discoverTmdbMovies`, URL filter helpers, catalogue rendering, and authenticated explicit import actions.
- Add localized discovery open/close labels in both Ukrainian and English.

- [x] **Step 1: Write the failing Playwright test**

  `films-tmdb-disclosure.spec.ts` stubs the catalogue, genres, auth, and discovery endpoints. Assert the default route shows a collapsed hero toggle, issues zero discovery requests, and retains desktop y anchors (filters 294, poster 607, pagination 2502, footer 2691); opening calls discovery once and exposes results; closing hides results and restores focus; each deep-link parameter opens discovery; same-page search transitions suppress discovery, browser Back reopens the deep-linked panel, and Forward hides it again. At 393px assert a 44px toggle and zero horizontal overflow.

- [x] **Step 2: Run the focused test and observe the expected failure**

  Run: `cd frontend; npm exec -- playwright test tests/e2e/films-tmdb-disclosure.spec.ts --reporter=line`

- [x] **Step 3: Implement the smallest accessible disclosure change**

  Add a hero button with `aria-expanded`/`aria-controls`; render a controlled discovery panel after the catalogue only while open; auto-open when discovery URL parameters are present; retain existing query-search behavior. Focus/scroll to the panel heading with reduced-motion support, and return focus on close. Use the existing 44px mobile control sizing and adjust only the collapsed desktop page spacing needed by the Figma anchors.

- [x] **Step 4: Run the focused test and verify the complete contract**

  Run: `cd frontend; npm exec -- playwright test tests/e2e/films-tmdb-disclosure.spec.ts --reporter=line`

- [x] **Step 5: Verify typecheck and production build**

  Run: `cd frontend; npm run verify:build`

  Expected: TypeScript succeeds and Vite emits the production bundle.

- [x] **Step 6: Update handoff and release evidence**

  Record the observed browser geometry and disclosure/accessibility behavior. Mark production verification and deployment pending because this task makes no deployment.
