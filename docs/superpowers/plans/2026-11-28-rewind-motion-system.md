# REWIND motion system implementation plan

## Constraints

Follow `docs/superpowers/specs/2026-11-28-rewind-motion-system.md`. Keep Figma geometry and data behavior unchanged. CSS only; no dependency. The implementation must honor keyboard interaction and reduced motion.

## Task 1 — Add focused motion regression and shared surface behavior

**Files:**
- Create `frontend/tests/e2e/motion-surfaces.spec.ts`
- Edit `frontend/src/global.css`
- Edit `frontend/src/pages/Home.tsx` and `Home.module.css`
- Edit `frontend/src/pages/GlobalSearch.tsx` and `GlobalSearch.module.css`
- Edit `frontend/src/pages/PublicLists.tsx` and `PublicLists.module.css`

**Steps:**
1. Write a fixture-only Playwright test that loads Home with a movie card and public list, then asserts a desktop hover transform/shadow, keyboard `:focus-within` response, reduced-motion suppression, and zero horizontal overflow at 393px.
2. Run the new test and confirm it fails because the shared interaction is not present.
3. Define shared duration/easing tokens and `.rewindMotionSurface` in global CSS. Apply it to eligible Home movie cards, Search film/list/article cards, and all public list cards.
4. Provide the shared hover/focus-within affordance only for hover-capable devices; disable its transform, shadow, and transition explicitly for reduced motion.
5. Run the focused Playwright spec and `npm run verify:build`.

**Acceptance:** the focused test passes all pointer, keyboard, reduced-motion, and viewport assertions; typecheck/build pass; no package dependency changes.

## Task 2 — Record implementation evidence

**Files:**
- Edit `PLAN.md`
- Edit `docs/operations/RELEASE_EVIDENCE.md`

**Steps:**
1. Record the exact changed surfaces and test/build results, distinguishing fixture verification from live Figma/production acceptance.
2. Keep full visual parity and remaining release gates open unless independently proven closed.

**Acceptance:** the plan/evidence reflects only observed results and the broader REWIND objective remains accurately represented.
