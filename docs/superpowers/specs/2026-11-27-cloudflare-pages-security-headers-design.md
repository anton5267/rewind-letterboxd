# Cloudflare Pages Preview and Security Headers

## Intent

Keep GitHub Pages and Supabase as REWIND production. Use a free Cloudflare Pages project only to verify response headers and the real application on a preview URL, then decide whether it is suitable for a future production move.

## Goals

- Add anti-framing, MIME-sniffing, referrer, and unused-device protections to static REWIND responses on Cloudflare Pages.
- Verify those headers on the document, static assets, and SPA fallback response.
- Check that the preview can call the production Supabase Edge API and that Auth callback URLs remain valid.
- Keep all work within Cloudflare Free and avoid editing either existing Cloudflare project.

## Non-goals

- Do not change the production domain or replace GitHub Pages.
- Do not alter Supabase data, schema, credentials, or account security settings.
- Do not publish preview data or add sample records.

## Constraints

- The current production origin remains `https://anton5267.github.io/rewind-letterboxd/`.
- Cloudflare Pages `_headers` applies to static responses; it does not change Supabase Edge API responses.
- The API currently allowlists GitHub Pages and localhost origins. The Pages preview origin must be tested explicitly before any origin-list change.
- Supabase Auth redirect rules must be read back before considering any preview callback changes.
- Do not choose a paid Cloudflare plan, add a custom domain, or switch production routing.

## Approaches

1. **Dedicated Cloudflare Pages preview (chosen):** add a static `_headers` file and deploy a separate preview project from the REWIND frontend. This directly tests Cloudflare's header behavior while preserving the current production host.
2. **Cloudflare proxy in front of GitHub Pages:** defer. It changes production DNS/routing before the preview proves compatibility and is outside the authorized preview phase.
3. **Leave headers unresolved on GitHub Pages:** rejected as the final result because GitHub Pages cannot attach custom response headers.

## Design

Use `frontend/public/_headers` so Vite copies Cloudflare's header rules into its static output. Apply `X-Frame-Options: DENY`, `Content-Security-Policy: frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a Permissions-Policy disabling camera, microphone, and geolocation. The CSP is intentionally limited to the `frame-ancestors` directive so it does not restrict REWIND's existing scripts, images, TMDB assets, or Supabase API calls.

Create or use only a dedicated free Cloudflare Pages project and keep its preview hostname separate from GitHub Pages. Run the production-equivalent frontend build with Cloudflare's root path. Check CORS and Auth redirects from the preview. If either requires a production allowlist change, make the smallest exact-origin change only after preview evidence is available; do not change the production site URL or hosting route.

## Acceptance

- Free Pages preview is reachable and the site renders localized routes.
- Required headers appear on the root document, a versioned asset, and an SPA fallback.
- Public Supabase API calls return a matching CORS allow-origin for the preview; authenticated callback routes stay on the preview when tested.
- Current GitHub Pages remains the production site and no paid Cloudflare feature is enabled.
