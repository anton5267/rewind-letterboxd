# Admin List Editing and Report Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Figma Admin list editing and report review screens with real Supabase data and audited actions.

**Architecture:** Extend the existing Admin repository/HTTP contract for list detail, text edits, and adding a published movie. Reuse existing Admin visibility/delete/user-deactivation/report-resolution routes from one responsive React detail component.

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), PostgreSQL, React, TypeScript, CSS Modules, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-26-admin-list-moderation-design.md`

## Global Constraints

- Preserve current API authorization through `beginAdminTransaction` and existing `confirmedAuthUser` guards.
- Do not add migrations, mutate hosted data, or deploy production.
- Render only dynamic values returned from the API; static Figma values belong only to test fixtures.
- Only `CUSTOM` lists and published movies may be edited or added by this screen.

## Review Focus

- Non-admin requests never receive list details or mutation success; route tests cover missing/unauthorized identities.
- A report ID from another list or a closed/missing report never opens a reported-list state; route/repository tests cover relation and status filters.
- System collection lists cannot be edited, hidden, or deleted from this detail flow; repository and route tests cover them.
- Duplicate/unpublished movie additions do not mutate the list; repository tests cover both cases.
- Delete, block, report resolution, save errors, and actor switching preserve confirmation, error, and focus behavior; Playwright covers each action and a failed request.

---

### Task 1: Admin list detail and audited edits

**Files:** `supabase/functions/rewind-api/contracts/admin.ts`, `contracts/repository.ts`, `repositories/admin_lists.ts`, `http/routes/admin_lists.ts`, `admin_lists_test.ts`, `handler_test.ts`.

**Interfaces:** `getAdminListDetails(authUser, id, reportId?) -> AdminListDetailsResponse | null`; `updateAdminListDetails(authUser, id, update) -> AdminListDetailsResponse | null`.

- [x] Write repository and route tests for detail fields, report/list relationship, authorization, bad input, system lists, audit log writes, and text update.
- [x] Run focused Deno tests and confirm the new cases fail for missing methods/routes.
- [x] Implement the read and transactional update from existing tables, using strict validation and the shared audit logger.
- [x] Run focused Deno tests and typecheck.

### Task 2: Admin add-film API

**Files:** `contracts/admin.ts`, `contracts/repository.ts`, `repositories/admin_lists.ts`, `http/routes/admin_lists.ts`, `admin_lists_test.ts`, `handler_test.ts`.

**Interfaces:** `addAdminListMovie(authUser, listId, movieId) -> AdminListDetailsResponse | null`.

- [x] Write tests for append ordering, duplicate and unpublished movie rejection, missing list, system list, and audit row.
- [x] Run focused Deno tests and confirm expected failures.
- [x] Implement transaction-safe insert and refreshed detail response.
- [x] Run focused Deno tests and typecheck.

### Task 3: Shared Admin list editor screen

**Files:** `frontend/src/api/admin.api.ts`, `frontend/src/pages/AdminDashboard.tsx`, new `frontend/src/components/AdminListDetail.tsx` and CSS module, `frontend/src/components/AdminLists.tsx`, `frontend/src/i18n.ts`, focused E2E tests.

**Interfaces:** Route `/admin?view=list-detail&listId=:id` and optional `reportId=:reportId`; detail component consumes the APIs from Tasks 1–2.

- [x] Write failing UK/EN Playwright tests for reported/normal entry points, source content/geometry, edit/save/reload, add-film, report resolution, delete/block confirms, failure and mobile overflow.
- [x] Run focused Playwright and confirm it fails on the missing detail route/API/actions.
- [x] Implement one localized responsive detail component using existing Admin shell, movie catalog search, dialogs and action APIs.
- [x] Run focused Playwright, frontend typecheck, and production build.

### Task 4: Evidence update

**Files:** `docs/frontend/FIGMA_PARITY_MATRIX.csv`, `docs/frontend/FIGMA_HANDOFF.md`, `docs/project/PROGRESS.md`, this plan.

- [x] Record the source frame IDs, live API semantics, tests/captures and any unsupported source behavior.
- [x] Parse the 574-row, 16-column Figma matrix; run `git diff --check`.
- [x] Confirm no migration, production data, or deployment changed.
