# Featured Lists Empty State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the empty Featured Lists route clear without fabricated content or repeated category messages.

**Architecture:** Keep the existing Supabase-backed feed and category grouping. Change only the rendering decision for empty categories and provide one localized empty state when the entire feed is empty.

**Tech Stack:** React, TypeScript, CSS Modules, Playwright, UK/EN i18n.

**Spec:** `docs/superpowers/specs/2026-11-28-featured-lists-empty-state.md`

## Global Constraints

- Do not mutate production data or schema.
- Keep existing API contracts and category ordering.
- Keep UK and EN copy localized.
- Preserve loading and error/retry behavior.

## Review Focus

- Empty response for the current request produces exactly one useful empty message; an in-app route transition cannot flash stale empty content.
- Partially populated responses do not display empty groups.
- Existing populated category layout remains unchanged.
- Loading and error states do not show the empty state prematurely.
- UK and EN route variants use the correct localized copy.

## File Structure

- `frontend/src/pages/PublicLists.tsx` — render the single empty state or populated categories.
- `frontend/src/pages/PublicLists.module.css` — style the empty state using existing page tokens.
- `frontend/src/i18n.ts` — localized empty-state copy.
- `frontend/tests/e2e/public-lists-featured-empty-state.spec.ts` — isolated empty, partial, loading, and error behavior.

## Tasks

### Task 1: Add regression coverage

- [x] Add fixture-backed UK/EN empty-feed, one-category-populated, landing-transition, and error/retry assertions.
- [x] Run the focused test and confirm it fails on duplicate groups and a transient pre-response empty status.

### Task 2: Implement minimal rendering and copy

- [x] Add localized empty-state text.
- [x] Render one empty-state panel when the successful feed has zero results.
- [x] Render only non-empty categories when results exist.
- [x] Keep existing skeleton and retry rendering unchanged.
- [x] Run new tests plus the existing desktop/mobile Figma suite (6/6), then production build/typecheck.

### Task 3: Record evidence

- [x] Update `PLAN.md` and `docs/operations/RELEASE_EVIDENCE.md` with local-only evidence.
- [x] Run `git diff --check` and inspect the final diff.
