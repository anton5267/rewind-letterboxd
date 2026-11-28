# Cloudflare Pages Preview Status

## Scope

Cloudflare Pages is a separate preview only. GitHub Pages remains the production frontend, and Supabase remains the production backend. No Cloudflare custom domain or paid feature is configured.

## Git-connected Pages preview

- Project: `rewind-site-preview` (Cloudflare Pages Free).
- Preview branch: `codex/cloudflare-pages-security-headers`.
- Stable branch URL: <https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev>.
- Successful deployment: `c675891a-de7e-4f33-81fb-f696ee440f43`, commit `583f180`.
- Build uploaded 3,243 assets; Cloudflare parsed one valid `_headers` rule.
- The project has no production deployment. Its configured production branch is `master`; the first `master` deployment was cancelled before publishing.
- GitHub Pages remains the production URL: <https://anton5267.github.io/rewind-letterboxd/>.

The older `rewind-pages-preview` project is a separate empty direct-upload project and is not used. It has been left untouched.

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

## Pages response and browser evidence (2026-11-28)

Read-only checks against the stable branch URL returned all five configured headers on `/`, `/404.html`, and a deliberately unknown localized path (`/uk/__codex-preview-not-found__/`). The unknown path returns HTTP 404; opening it in a browser renders the Ukrainian REWIND not-found page. The root and the fallback document return HTTP 200. The preview also sends `X-Robots-Tag: noindex` on the root and fallback document.

The Pages dashboard build log reports Node 22.23.4, 426 modules, 3,243 uploaded files, and a successful deployment. The Git-connected deployment is a branch preview and is not the GitHub Pages production deployment.

## Supabase compatibility evidence

A production Edge API OPTIONS preflight was sent with the current Pages preview's exact origin (`https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev`). It returned HTTP 403 and `Origin is not allowed`; an earlier check against `https://rewind-pages-preview.pages.dev` also returned HTTP 403. The current deployed allowlist therefore does not include the preview origin. No allowlist change has been made. Browser API-backed behavior from the preview remains unverified until this is addressed.

The public Supabase Auth settings endpoint returned HTTP 200 with `Access-Control-Allow-Origin` matching the preview origin. A read-only dashboard check confirmed that the production Site URL remains `https://anton5267.github.io/rewind-letterboxd/` and the current redirect allowlist has only these four exact URLs:

- `https://anton5267.github.io/rewind-letterboxd/uk/login/`
- `https://anton5267.github.io/rewind-letterboxd/en/login/`
- `https://anton5267.github.io/rewind-letterboxd/uk/reset-password/`
- `https://anton5267.github.io/rewind-letterboxd/en/reset-password/`

For a preview auth flow, the app constructs callback URLs at the preview origin with the same four paths (`/uk/login/`, `/en/login/`, `/uk/reset-password/`, `/en/reset-password/`). They are not currently on the Supabase redirect allowlist. No auth redirect setting has been altered; do not create accounts or send email for this preview check.

Opening `/uk/home` confirms the app shell renders, but data sections show “Не вдалося завантажити головну сторінку” while the Edge API origin remains blocked. This is consistent with the failed CORS preflight; a successful browser API-backed flow has not been verified.

## Next steps

1. Decide whether to authorize adding only `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev` to the deployed Supabase Edge API origin allowlist (`REWIND_ALLOWED_ORIGINS`) and the four exact preview auth callback URLs listed above. These are production Supabase security configuration changes; do not apply them until explicitly approved.
2. After any authorized allowlist change, verify browser API calls and the auth callback from the preview. Keep the production Site URL and GitHub Pages hosting unchanged.
