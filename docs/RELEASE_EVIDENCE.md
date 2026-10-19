# Rewind — local release evidence

Оновлено **19.10.2026**. Це локальний release-evidence bundle для поточного worktree. Він підтверджує перевірені код, API, UI та локальний Compose runtime; production launch не заявляється без зовнішніх credentials, VPS, домену й HTTPS.

## Verified gates

| Область | Evidence | Результат |
| --- | --- | --- |
| Frontend type/build | `letterboxd/letterboxd-login-figma-final2`: `npx tsc --noEmit`, `npm run build` | green; latest Vite build **184 modules**, entry **310.05 kB** |
| Localization/accessibility | `tests/e2e/localization-labels.spec.ts` against rebuilt Docker runtime | UK/EN Lists/Search labels and intros, Journal byline/category, person types and poster aria-labels use locale keys; **1/1 in 4.3s**, TypeScript/Vite green |
| Home/public smoke | `tests/e2e/public-guards.spec.ts` | **6/6 passed in 13.6s** after Home partial-failure rendering and independent Lists feed/tags states |
| Community/accessibility smoke | `tests/e2e/public-guards.spec.ts tests/e2e/accessibility.spec.ts` | **11/11 passed** after independent reviewers/HQ/directory state handling |
| Social/notification smoke | `tests/e2e/social-flow.spec.ts tests/e2e/sse-reconnect.spec.ts` | **2/2 passed in 12.0s** after independent notification feed/unread-count handling |
| Profile/social smoke | `tests/e2e/profile-flow.spec.ts tests/e2e/social-flow.spec.ts` | **2/2 passed in 14.7s** after independent Public Profile followers/following request states and follow/block refresh |
| Header accessibility smoke | `tests/e2e/accessibility.spec.ts --grep "primary public routes have keyboard reachable controls"` | **1/1 passed in 4.2s** after independent unread message/notification badge requests |
| Admin dashboard targeted smoke | `scripts/verify-admin-browser.ps1 -Headed -Grep "admin can open the dashboard"` | **1/1 passed in 14.8s** after independent summary/settings handling |
| Browser regression | `npx playwright test --reporter=line` | **40 tests: 28 passed, 12 skipped, 0 failed** |
| Movie Details matrix | `tests/e2e/movie-details-responsive.spec.ts` | **1/1 passed in 2.6s**; UK/EN × 320/393/768/1440, landmarks, `aria-busy`, overflow and page errors; list-picker/rating state changes included |
| Public Lists browser flow | `tests/e2e/public-guards.spec.ts` | **6/6 passed in 14.7s**; localized catalog/discovery/detail/author/movie routes and guest guards after independent feed/tags state handling |
| Review Details flow | `tests/e2e/core-flow.spec.ts` | **1/1 passed in 7.3s**; review create/edit/delete flow remains green after like-status/rating loading/error/retry and review-card request cleanup |
| Release responsive matrix | `tests/e2e/release-responsive-matrix.spec.ts` | **1/1 passed in 11.2s**; 12 public/auth/service routes × 320/393/768/1440, one main/header/footer/h1, `0 px` overflow and no page errors |
| Admin browser | `scripts/verify-admin-browser.ps1 -Headed` | **12/12 passed (47.0s)** |
| Backend | `./mvnw.cmd -q test` on Compose MySQL | **69 tests, 0 failures, 0 errors, 0 skipped** in 37 suites |
| API contracts | `scripts/verify-contracts.ps1` | public/protected/auth/admin contract smoke green |
| Security | `scripts/verify-security.ps1` | auth, CSRF, SQLi/XSS probes and admin denial green |
| Schema | `scripts/verify-er-schema.ps1` | **38 tables / 55 foreign-key relationships** |
| Backup/restore | `scripts/verify-backup-restore.ps1` | **188 movies / 448 users / 31 migrations**, temporary data cleaned |
| Runtime | `docker compose ps` and API/Web health checks | API, Web, MySQL, Redis and Mailpit up; DB/Mailpit healthy |
| Current local port mapping | `compose.yaml`, `docker compose ps`, post-rebuild smoke | Web `127.0.0.1:3000 → nginx:80`; API `127.0.0.1:8081 → Spring:8080`; API health `200`, Web `200`, no API/Web errors in the 30-second post-start window |
| Production wiring audit | `docker compose -f compose.production.yaml config --quiet` with audit-only values; `scripts/verify-caddy.ps1` | Compose config valid; Caddyfile valid; real production env was not created |
| Production origin/media config | `mvnw.cmd -q -DskipTests compile`, Compose resolution with `.env.production.example`, PowerShell parse and nginx config review | CORS is env-driven with empty same-origin production default, production validator requires HTTPS origins for cross-origin use, and CSP allows HTTPS journal audio |
| Editorial content | `GET /api/journal/articles?language=uk|en` and `/archive` | runtime currently returns **0 published articles / 0 archive entries** for both locales; UI empty/fallback states are verified, real editorial content is still required |
| Diploma artifact | `artifacts/diploma-video/slideshow-check.png` and `rewind-diploma-demo.webm` | slideshow reviewed; WebM is **76,223 bytes** with valid EBML/WebM header `1A 45 DF A3`; local demo only |
| Hygiene | `git diff --check` and tracked-secret scan | no whitespace errors; no real secret added |

## Figma evidence

- Canonical frame-to-route inventory: [`FIGMA_HANDOFF.md`](FIGMA_HANDOFF.md).
- Chrome-only inventory follow-up: `search lists by tags (svergunova)` confirmed as node `1480:6898`, 1440×2388, and phone variant as node `1480:8527`, 393×1055; exact token/assets/pixel parity remains a view-only gap.
- Chrome-only inventory follow-up: `Search Results "journal articles"` confirmed as desktop node `1480:7549`, 1440×1149, and phone node `1480:8889`, 393×1150; both show the dark `rgba(31,31,31,1)` surface.
- Chrome-only inventory follow-up: `Search Results "lists" (svergunova)` confirmed as desktop node `1480:7490`, 1440×1518, with the dark `rgba(31,31,31,1)` surface.
- Chrome-only inventory follow-up: desktop `Search Results "tags"` `1480:7445` (1440×1024), `cast/ members` `1480:7390` (1440×1392), `reviews` `1480:7311` (1440×2176) and `films` `1480:7256` (1440×1062) were confirmed with the dark `rgba(31,31,31,1)` surface.
- Implemented visual slices include Home, Search, Lists, Profiles, Journal, Community, Review Details and mobile navigation.
- Movie Details has an API-backed responsive visual slice with `backdropUrl` fallback, credits, actions, reviews and similar films. Exact node-level parity remains unverified because the Figma MCP repeatedly returns `don't have edit access`.
- The Figma result is therefore documented as **visual alignment**, not pixel-perfect parity.
- Available visual artifacts: Lists screenshots, Movie Details screenshots at 320/393/768/1440 (`../artifacts/movie-details-*.png`), and the diploma demo materials under [`artifacts/diploma-video`](../artifacts/diploma-video).

## Release blockers

The local evidence and local production wiring audit are complete, but the following external gates remain open:

- rotate the previously exposed TMDB key and provide production TMDB credentials;
- provide production SMTP credentials, domain, VPS and HTTPS certificate;
- create `.env.production` outside Git and run `scripts/verify-production-config.ps1` against the real secure environment;
- execute production Compose, scheduler, monitoring, mail delivery and backup/restore checks on the target infrastructure;
- obtain Figma Editor access or exact frame-level export access for pixel-level parity claims.

GitHub was updated once by explicit user command after this evidence bundle was assembled: `origin/master` points to `6b5d14e` (`Make backend casing locale independent`). No further push is implied by this document.
