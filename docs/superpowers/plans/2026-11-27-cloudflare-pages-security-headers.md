# Cloudflare Pages Security Headers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify a free Cloudflare Pages preview with anti-framing and related security headers while GitHub Pages remains production.

**Architecture:** Add a static `_headers` file to Vite's public assets, build the frontend at `/`, and publish it to a dedicated Pages preview. Validate static response headers, client route rendering, and Supabase Auth/CORS behavior before considering any production change.

**Tech Stack:** React, Vite, GitHub Actions, Cloudflare Pages Free, Supabase Edge Functions/Auth.

**Spec:** `docs/superpowers/specs/2026-11-27-cloudflare-pages-security-headers-design.md`

## Global Constraints

- Keep GitHub Pages at `https://anton5267.github.io/rewind-letterboxd/` as production.
- Do not change Supabase schema, data, secrets, or primary Auth Site URL.
- Use Cloudflare Free only; do not add a custom domain or paid add-on.
- Never enable preview-origin CORS/Auth redirects until the exact preview origin is known and the current list has been read.

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
- [ ] Open a localized route and make a public API-backed request from the preview. **Blocked by current production Edge API preflight:** HTTP 403, `Origin is not allowed` for the exact preview origin.
- [x] Read the Supabase Site URL and Auth redirect allowlist and compare them with callback URL construction. The primary URL is still GitHub Pages; all four preview callback URLs are currently absent, so auth from preview is not yet allowed. No account was created and no email sent.
- [x] Record the exact CORS rejection and prepare the minimal origin-only change; keep production hosting unchanged. Applying the allowlist change requires explicit user approval.
- [x] Confirm the GitHub Pages production URL remains `https://anton5267.github.io/rewind-letterboxd/`; no Pages deployment or Supabase configuration was changed in this task.

**Current evidence (2026-11-28):** the GitHub-connected Pages Free preview at `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev` deployed successfully from branch `codex/cloudflare-pages-security-headers` (initial code commit `583f180`; documentation update `ed04e15`). Its build uploaded 3,243 assets and parsed the `_headers` file. All five headers were confirmed on `/`, `/404.html`, and an unknown localized route; the browser rendered the Ukrainian not-found page for that route. The homepage shell renders, but API-backed sections show a load error. Supabase Edge API preflight returns HTTP 403 with `Origin is not allowed`. Auth's Site URL is still GitHub Pages and all four preview callback paths are absent from the exact redirect allowlist. No Supabase configuration, schema, data, secrets, or GitHub Pages production deployment was changed. See `docs/frontend/CLOUDFLARE_PAGES_PREVIEW.md` for details.
