# Cloudflare Pages Security Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify a free Cloudflare Pages preview with anti-framing and related security headers while GitHub Pages remains production.

**Architecture:** Add a static `_headers` file to Vite's public assets, build the frontend at `/`, and publish it to a dedicated Pages preview. Validate static response headers, client route rendering, and Supabase Auth/CORS behavior before considering any production change.

**Tech Stack:** React, Vite, GitHub Actions, Cloudflare Pages Free, Supabase Edge Functions/Auth.

**Spec:** `docs/superpowers/specs/2026-11-27-cloudflare-pages-security-headers-design.md`

## Global Constraints

- Keep GitHub Pages at `https://anton5267.github.io/rewind-letterboxd/` as production.
- Do not change Supabase schema, user data, API keys, unrelated secrets, or primary Auth Site URL. The user explicitly approved adding only the exact preview origin to `REWIND_ALLOWED_ORIGINS` and four exact preview callback URLs after reviewing preview evidence.
- Use Cloudflare Free only; do not add a custom domain or paid add-on.
- Never enable preview-origin CORS/Auth redirects until the exact preview origin is known, the current list has been read, and the user explicitly approves the specific entries.

## Review Focus

- Vite must copy `_headers` into its final output: assert the output file exists and contains the exact rules.
- Cloudflare rules must apply to the SPA fallback as well as static assets: inspect response headers for all three paths.
- The restrictive CSP must not break existing external app resources: keep only `frame-ancestors 'none'` and load a public API-backed route.
- A Pages preview origin must not silently be accepted by production APIs: send a preview-origin preflight and record its exact response before proposing an allowlist update.
- Preview auth must not redirect to the current Pages site: inspect callback construction and only exercise sign-in with a user-approved test account.

---

### Task 1: Add static security headers

**Files:**
- Create: `frontend/public/_headers`
- Test: frontend production build output

**Interfaces:**
- Consumes: Vite copies files from `frontend/public` to `frontend/dist`.
- Produces: Cloudflare Pages `_headers` rules for all static URLs.

- [x] Add the design's exact response headers under one `/*` rule.
- [x] Run `npm run verify:build` and confirm `frontend/dist/_headers` contains each expected header exactly once.

### Task 2: Configure a dedicated free preview

**Files:**
- Modify only the Cloudflare Pages preview configuration for a new REWIND project.

**Interfaces:**
- Consumes: `frontend/dist`, the production Supabase URL, and the already-public publishable key.
- Produces: a Cloudflare `pages.dev` preview URL; no production alias or custom domain.

- [x] Confirm the account still has only the two existing unrelated Pages projects; leave them untouched.
- [x] Create only the REWIND preview project and use the root path `/`.
- [x] Keep the deploy on the non-production branch `codex/cloudflare-pages-security-headers`; confirm Pages Free and no production deployment in the project.

### Task 3: Verify headers and application compatibility

**Files:**
- Update: `docs/frontend/CLOUDFLARE_PAGES_PREVIEW.md` with observed URL, build inputs, and evidence.

**Interfaces:**
- Consumes: the published preview URL and current Supabase production configuration.
- Produces: a verified preview checklist and any exact-origin follow-up needed.

- [x] Read the root, SPA fallback, unknown localized path, and built JS response headers; verify the localized route renders the app-level 404 page.
- [x] Open localized routes and make public API-backed requests from the preview. After the approved allowlist update, `/uk/home` and `/uk/community/` loaded live data.
- [x] Read the Supabase Site URL and Auth redirect allowlist, compare them with callback URL construction, then add the four exact preview paths after user approval. The Site URL remains GitHub Pages. No account was created and no email sent.
- [x] Record the initial CORS rejection and apply the approved minimal origin-only change; the original GitHub Pages and localhost origins remain allowed.
- [x] Confirm the GitHub Pages production URL remains `https://anton5267.github.io/rewind-letterboxd/`; no GitHub Pages deployment or primary Supabase Site URL was changed in this task.

**Current evidence (2026-11-28):** the GitHub-connected Pages Free preview at `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev` has a verified successful application deployment from branch `codex/cloudflare-pages-security-headers` (commit `6ea9ef1`). The build uploaded 3,243 assets and parsed `_headers`. All five headers were confirmed on the root, fallback document, unknown localized path, and versioned JS; the localized not-found route rendered correctly. After the user-approved exact CORS origin and four Auth callback entries were added, preflights for preview, the production GitHub Pages origin, and four existing localhost origins returned HTTP 204. Browser API-backed home and community routes loaded real data. The Supabase Site URL and GitHub Pages production host are unchanged. No database schema or user data was changed. Cloudflare Pages has no production deployment; switching the public production host still requires separate explicit user approval. See `docs/frontend/CLOUDFLARE_PAGES_PREVIEW.md` for details.
