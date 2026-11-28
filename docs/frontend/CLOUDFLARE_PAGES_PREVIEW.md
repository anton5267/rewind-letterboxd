# Cloudflare Pages candidate

Cloudflare Pages Free is connected to `anton5267/rewind-letterboxd` with `master` as the production branch. The configured build uses the production Supabase URL and the root (`/`) Vite base path. The project has the default domain `https://rewind-site-preview.pages.dev/`; no custom domain or paid feature is configured.

## Current evidence — 28 November 2026

- The `master` deployment at commit `0786531` responds with HTTP 200 on `/` and `/uk/home/`.
- A read-only API preflight from `https://rewind-site-preview.pages.dev` returns HTTP 403 (`Origin is not allowed`). The production alias therefore cannot yet replace GitHub Pages for browser-to-API use.
- That current production deployment lacks `X-Frame-Options`, `Content-Security-Policy: frame-ancestors 'none'`, and `Permissions-Policy`. GitHub Pages also does not allow project-level response-header configuration.
- The separate preview deployment from `codex/cloudflare-pages-security-headers` loads the REWIND home page and returns all five intended headers: `X-Frame-Options`, `Content-Security-Policy` with `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`. The browser console showed no errors or warnings.
- The preview origin is already allowed by the API and Supabase Auth callback settings. The production Pages origin has not been added to either allowlist; the Supabase Site URL remains the GitHub Pages URL.

`frontend/public/_headers` is included in the current release candidate so Cloudflare Pages will apply the same rules to production after the branch is merged and its deployment succeeds. This file does not change GitHub Pages response headers. Keep GitHub Pages as the canonical URL until the Pages production deployment, exact-origin API/CORS behavior, and Supabase Auth redirects are verified together. No user or movie data was changed for these checks.
