# Cloudflare Pages Preview Status

## Scope

Cloudflare Pages is a separate preview only. GitHub Pages remains the production frontend, and Supabase remains the production backend. No Cloudflare custom domain or paid feature is configured.

## Git-connected Pages preview

- Project: `rewind-site-preview` (Cloudflare Pages Free).
- Preview branch: `codex/cloudflare-pages-security-headers`.
- Stable branch URL: <https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev>.
- Verified successful application deployment: `c39db1f6-0bcf-4833-8e03-527f1b7b65ed`, commit `6ea9ef1` (documentation-only update after the initial header build `583f180`).
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

Read-only checks against the current stable branch URL returned all five configured headers on `/`, `/404.html`, a deliberately unknown localized path (`/uk/__codex-preview-not-found__/`), and a versioned JS bundle. Statuses were 200 for `/`, `/404.html`, and JS; 404 for the unknown path. Opening that path in a browser renders the Ukrainian REWIND not-found page. The preview also sends `X-Robots-Tag: noindex` on the root, fallback document, and JS bundle.

The Pages dashboard build log reports Node 22.23.4, 426 modules, 3,243 uploaded files, and a successful deployment. The Git-connected deployment is a branch preview and is not the GitHub Pages production deployment.

## Supabase compatibility evidence

A production Edge API OPTIONS preflight from the preview initially returned HTTP 403 and `Origin is not allowed`. After explicit user approval, `REWIND_ALLOWED_ORIGINS` was created with the existing default allowlist preserved (`https://anton5267.github.io`, localhost and 127.0.0.1 on ports 5173 and 5174) and only the exact preview origin appended: `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev`. Post-change preflight checks for all six origins returned HTTP 204 with matching `Access-Control-Allow-Origin` values. No other origin was added.

The public Supabase Auth settings endpoint returned HTTP 200 with `Access-Control-Allow-Origin` matching the preview origin. A read-only dashboard check confirmed that the production Site URL remains `https://anton5267.github.io/rewind-letterboxd/` and the current redirect allowlist has only these four exact URLs:

- `https://anton5267.github.io/rewind-letterboxd/uk/login/`
- `https://anton5267.github.io/rewind-letterboxd/en/login/`
- `https://anton5267.github.io/rewind-letterboxd/uk/reset-password/`
- `https://anton5267.github.io/rewind-letterboxd/en/reset-password/`

After explicit user approval, the four matching preview callback URLs were added to the Auth redirect allowlist, bringing it from four to eight exact URLs:

- `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev/uk/login/`
- `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev/en/login/`
- `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev/uk/reset-password/`
- `https://codex-cloudflare-pages-secur.rewind-site-preview.pages.dev/en/reset-password/`

The primary Site URL remains the GitHub Pages URL. No user was created, no email was sent, and no password or API key was changed.

After the CORS update, browser checks of `/uk/home` and `/uk/community/` loaded data from the existing production API. The homepage showed current TMDB-backed film cards; the community page showed existing user listings. This confirms the preview's browser-to-API path works. Auth callback configuration now matches the code's constructed URLs; an end-to-end sign-up/reset email flow was intentionally not initiated.

The live GitHub Pages URL still returns HTTP 200 but does not emit these five security headers. Cloudflare Pages remains a no-cost preview project with **no production deployment**. Moving the production host from GitHub Pages to the `pages.dev` URL would be a separate public hosting change and has not been performed.

## Next steps

1. Decide whether to keep GitHub Pages as production (headers will remain preview-only) or explicitly approve moving production hosting to the Cloudflare Pages URL. GitHub remains the source repository and Supabase the backend either way.
