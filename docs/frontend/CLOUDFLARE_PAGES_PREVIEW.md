# Cloudflare Pages candidate

Cloudflare Pages Free is connected to `anton5267/rewind-letterboxd` with `master` as the production branch. The configured build uses the production Supabase URL and the root (`/`) Vite base path. The project has the default domain `https://rewind-site-preview.pages.dev/`; no custom domain or paid feature is configured.

## Current evidence — 28 November 2026

- The Cloudflare Pages Free project automatically deployed `master` commit `2195564` after PR #18. Its stable URL responds with HTTP 200 and serves all five configured headers: `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and the camera/microphone/geolocation `Permissions-Policy`.
- GitHub Pages deploy run `46100046958` also succeeded for commit `2195564`; the canonical site responds with HTTP 200. GitHub Pages does not apply `frontend/public/_headers`, so it still lacks the project-level anti-framing and permissions headers.
- Supabase `rewind-api` is ACTIVE v70. Read-only CORS preflight from `https://anton5267.github.io` returns HTTP 204, and the specific Cloudflare branch preview `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev` also returns HTTP 204. The stable alias `https://rewind-site-preview.pages.dev` returns HTTP 403 (`Origin is not allowed`), so it is not yet usable for browser-to-API calls.
- Supabase Auth currently keeps the GitHub Pages Site URL and has eight exact redirect entries: four GitHub Pages login/reset paths and four for the temporary Cloudflare branch preview. The stable Cloudflare Pages alias has no callback entries yet.

## Separate Workers Builds — 28 November 2026

- The repository is also connected to a static-assets-only Cloudflare Worker named `rewind-letterboxd`. Its production build on `master` uses `npx wrangler deploy`; the latest `master` build for commit `2195564` completed successfully.
- Its branch-preview setting used `npx wrangler preview` from repository root without a Wrangler `previews` block, so branch builds failed before creating a preview. This Worker is separate from the Pages project and is not required for the GitHub Pages + Supabase production path.
- Disabled **Builds for Preview branches** for this Worker on 28 November. Production Worker builds remain enabled; Cloudflare Pages remains the preview host and its check passed for PR #19 commit `cb6f65c`.
- This does not fix the missing stable Pages CORS/Auth allowlists and does not make the Cloudflare Pages host the canonical production URL.

Keep GitHub Pages as the canonical URL until the stable Cloudflare origin is allowed by the API and its four localized Auth callbacks are configured, then verify the browser login/reset and API flows together. No user or movie data was changed for these checks.
