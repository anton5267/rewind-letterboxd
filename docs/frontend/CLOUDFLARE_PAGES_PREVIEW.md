# Cloudflare Pages candidate

Cloudflare Pages Free is connected to `anton5267/rewind-letterboxd` with `master` as the production branch. The configured build uses the production Supabase URL and the root (`/`) Vite base path. The project has the default domain `https://rewind-site-preview.pages.dev/`; no custom domain or paid feature is configured.

## Current evidence — 28 November 2026

- Cloudflare Pages Free on `master` responds HTTP 200 at `/uk/home/` and returns all five intended headers: `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- PR #23 (`9b55d04`) added only the exact origin `https://rewind-site-preview.pages.dev` to the Edge API CORS allowlist; no Pages wildcard was added. `rewind-api` is ACTIVE v71 with `verify_jwt=false`. Production preflight returns HTTP 204 for both the Cloudflare Pages origin and `https://anton5267.github.io`; Cloudflare's `GET /api/genres` returns HTTP 200 with 17 genres.
- Read-only browser smoke on Cloudflare Pages shows the Ukrainian login and forgot-password pages. `/uk/films?q=Dune` returns eight TMDB candidates on page 1 of 57; guest actions link to login. No form was submitted, no email was sent, and no film was imported.
- Supabase Auth now has 12 exact redirects: the existing four GitHub Pages paths, four existing branch-preview paths, and four stable Cloudflare paths (`/uk/login/`, `/en/login/`, `/uk/reset-password/`, `/en/reset-password/`). The existing Site URL remains `https://anton5267.github.io/rewind-letterboxd/`.
- GitHub Pages continues to respond HTTP 200, but its responses lack all five project-level headers; the Pages `_headers` file is not applied by GitHub Pages. Cloudflare is now a working protected preview against production Supabase, while GitHub Pages remains the canonical URL with the unchanged Auth Site URL.
- PR #25 (`a60fddd`) merged the versioned stable-host fix and CI regression check. The Cloudflare dashboard build command is saved as `node frontend/scripts/build-cloudflare-pages.mjs`; production deployment `51838325` completed successfully with that command. Live `robots.txt` and `sitemap.xml` now point to `https://rewind-site-preview.pages.dev/`; `/` and `/uk/home/` return HTTP 200 with all five security headers. GitHub Pages remains canonical with the existing Auth Site URL; Cloudflare canonical-host selection remains a separate product decision.

These checks did not change database schema, movie records, user content, or user accounts. Auth redirect allowlist changes are limited to the four exact Cloudflare paths above.
