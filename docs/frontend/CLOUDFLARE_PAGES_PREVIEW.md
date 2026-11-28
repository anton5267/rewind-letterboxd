# Cloudflare Pages Preview Status

## Scope

Cloudflare Pages is a separate preview only. GitHub Pages remains the production frontend, and Supabase remains the production backend. No Cloudflare custom domain or paid feature is configured.

## Preview project

- Project: `rewind-pages-preview`
- URL: <https://rewind-pages-preview.pages.dev>
- Deployment status: project created; static build upload is pending.
- Production URL: <https://anton5267.github.io/rewind-letterboxd/>

## Separate Worker deployment observed on 2026-11-28

The Cloudflare dashboard also shows a different project named `rewind-letterboxd` under **Workers**, with a Production build at <https://rewind-letterboxd.antonlistva47.workers.dev>. This is not the Pages preview project above. The visible build settings show no build command, `npx wrangler deploy` as the deploy command, and `/` as the root directory.

Read-only HTTP checks of that Worker returned:

- `/`: HTTP 200, but the HTML points to `/src/main.tsx`, so it is serving the source entrypoint instead of the Vite production bundle.
- `/uk/` and `/404.html`: HTTP 404.
- The five intended security headers are absent on `/`.
- Supabase Edge API preflight from this Worker origin returns HTTP 403, `Origin is not allowed`.

This Worker build is not a valid substitute for the Pages preview and has not been changed by this task. Keep GitHub Pages as the actual REWIND production frontend.

## Build evidence

- Frontend typecheck and Vite production build passed.
- The build was configured for `/` and the current production Supabase Edge API.
- Prerender generated 2,966 public catalog routes, 60 noindex app route shells, `sitemap.xml`, and `robots.txt`.
- Localized UA and EN root shells passed their verifier.
- `frontend/dist/_headers` exists and contains the intended Cloudflare Pages rules for clickjacking protection, MIME sniffing, referrer policy, and unused device APIs.
- `frontend/dist/404.html` exists as the SPA fallback.

## Supabase compatibility evidence

A production Edge API OPTIONS preflight was sent with the preview's exact origin. It returned HTTP 403 and `{"message":"Origin is not allowed"}`. The deployed allowlist currently does not include `https://rewind-pages-preview.pages.dev`. No allowlist change has been made.

The public Supabase Auth settings endpoint returned HTTP 200 with `Access-Control-Allow-Origin: https://rewind-pages-preview.pages.dev`, so the endpoint itself accepts the preview origin. Its public response does not expose the Auth redirect allowlist. That allowlist has not yet been read back. Do not test or alter Auth redirect settings until the dashboard value can be inspected. Do not create accounts or send email for this preview check.

## Next steps

1. Use a working Pages deployment path. The dashboard folder uploader rejects the 3,000+ file build (its UI limit is 1,000); local Wrangler cannot deploy without `CLOUDFLARE_API_TOKEN`.
2. Upload the verified build to this preview and inspect headers on `/`, `/404.html`, and a versioned asset.
3. Review the exact Supabase CORS and Auth redirect changes needed. Keep production origin unchanged; obtain explicit approval before changing production Supabase security settings.
4. Open a localized route and verify its public API calls from the preview.
