# Rewind — докази перевірок

Оновлено 24.10.2026, Europe/Berlin. Документ містить історичні release checkpoints і наступні targeted перевірки; повний фінальний regression нового UI ще потрібний. Production VPS не розгорнуто.

## Раніше записаний локальний checkpoint

### Review Details phone More — 24.10.2026

Phone `1480:9249` now exposes an authenticated-only `More` button at the Figma control position and opens the existing movie `RatingSheet`, with localized review author subtitle. Existing movie-rating and review-like API calls remain in use. Phone inline rating/date and like action are hidden; desktop controls remain. `npm run verify:build` passed (TypeScript + Vite, 229 modules). Manual guest preview at393×932 measured back x16/y50/35×35, `document.body.scrollWidth === 393`, and verified phone rating/like controls are hidden. The authenticated dialog behavior was verified in the subsequent browser pass below; phone `More` activation and sheet geometry remain open for final responsive review. No tests were run, and no backend, database or Docker state changed.

An authenticated Vite source preview then opened the shared RatingSheet without changing rating/like data. The sheet rendered the localized author subtitle; focus started on Done, Tab/Shift+Tab stayed within the dialog, and Escape closed it and restored focus to the desktop Rate trigger.

The mobile sheet was then manually reviewed in a 393×852 browser viewport using the local review row plus ephemeral auth/rating response fixtures. Runtime More measured x342/y50/35×35, matching frame `1480:9249`; modal x16/y489/361×328, card x16/y536/361×206, Done x16/y761/361×56. Raw `1480:9407` group is x16/y488.6/361×328.4, within subpixel rounding. At320×852, modal is288×328 and Done remains visible; body width stays320. Moving the dialog through a portal put it above the fixed bottom navigation, which had covered Done before the fix. Keyboard interaction retained focus within the sheet and Escape returned it to More. No rating or like mutation was performed. `npm run verify:build` passed after the change; no tests were run.

| Gate | Результат | Доказ / межа |
| --- | --- | --- |
| Frontend build | PASS | `npm run verify:build`: TypeScript без помилок, Vite 218 modules |
| Full browser suite | **123 passed; 2 failures; 12 skips** | Latest 22.10.2026 run: 137 scenarios, 5.2 min. The two remaining failures are the Community retry cases caused by the user's uncommitted `FollowActionsContext` change, which converts failed relationship reads into `false` instead of exposing the tested Retry controls. Films, Journal Search, detail header, route-transition and Public Lists guard checks are green. The 12 skips are covered separately by the disposable admin wrapper below. |
| Films geometry/filter/header targeted suites | **9 + 3 + 2 passed; 0 failures** | After Docker web rebuild, `search-controls.spec.ts` covers the `1413:12611`/`1480:9187` poster geometry and `1480:7611` filter behavior: desktop 174×260/20 px, phone 79×116/10 px, 15 px gaps, 215 px filter summary, focus restore and no overflow. `detail-header.spec.ts` confirms contextual back and bottom navigation at 320/393 px while the Figma Films header logo/Menu stay hidden (3/3); editorial header check passed 2/2. |
| Journal search alignment suite | **4 passed; 0 failures** | After Docker web rebuild, `global-search-alignment.spec.ts` verifies `1480:7549`/`1480:8889` in UK/EN, including the 361×149 phone article cover, 20 px card radius, API-backed title/excerpt and native category URL/keyboard behavior. |
| Backend suite | **87 passed** | Latest host reports: 40 current XML files dated 22.10.2026 08:33–08:34 Berlin, failures/errors/skips 0, Compose MySQL on `127.0.0.1:3307`. The earlier count of 89 included a stale suffixed two-test poster report from 20.10, duplicating current cases. Reports do not record the checked Git revision. |
| API smoke | PASS | OpenAPI 159 operations; auth, profiles, films, lists, reviews, comments, social, messages, notifications, newsletter і cleanup |
| Contract smoke | PASS | Public/protected routes, privacy fields, role guards, CRUD і nullable responses |
| Security smoke | PASS | CSRF, guest/admin guards, hostile query payloads, metrics protection |
| Password reset | PASS | Generic response, Mailpit delivery, one-time token, session revocation, new login |
| Cache / concurrency / load | PASS | Redis miss/hit/TTL; concurrent lists/ratings/reviews/comments/preferences/follows/likes; 20 requests across 8 endpoints, all 200 |
| ER schema | PASS | 38 tables, 55 foreign-key relationships |
| Backup/restore | PASS | Dump restored to a unique temporary schema; counts `203|438|31`; schema and temporary dump cleaned |
| Production template | PASS | Synthetic temporary env: HTTPS origin, strong placeholders, private DB/Redis/API, read-only API/web, loopback web port |
| Caddy / Compose | PASS | Caddy valid; development Compose config valid; clean API/web image builds |
| Local Docker runtime | PASS | `/actuator/health` 200, `/uk/community/reviewers` 200; API/web rebuilt, DB volume and `.env` preserved. Живий contract повернув `reviewCount`, `watchedCount`, `listCount` |
| CI workflow maintenance | PASS | `ubuntu-24.04`, `checkout@v7`, `setup-java@v6`, `setup-node@v7`; latest UI checkpoint `cda3126` passed GitHub CI run [39708297409](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409) |

Перший повний browser run завершився 123/125. Він виявив реальні regressions у Lists: hero втратив очікувані UK/EN «Колекції фільмів / Film collections», а landing CSS приховав feed navigation через `display:none`. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Поточний Figma-audit блок Popular Reviewers: перший full run виявив, що release matrix неправильно очікував mobile Back-link на desktop, хоча у frame є desktop header. Перевірку обмежено шириною phone (`<=720 px`); цільова matrix пройшла, а повторний повний frontend run завершився 115 passed. Backend contract для трьох reviewer metrics перевірено окремо і в повному наборі; реалізація використовує групові запити, а не запит на кожного рецензента.

Community members frames `605:1112` (1440 px) and `1517:4931` (393 px) were re-read through Figma context and screenshots. The route now has the same hero, featured/popular rails, and full member-list order while retaining live API identities, directory search/pagination, and accessible follow actions. Static Figma poster strips are not used as fabricated member data. `npm run verify:build` passed (216 modules); `community-follow.spec.ts` passed 10/10 when rerun after one transient browser-start failure. GitHub CI run 39614762671 for the preceding Popular Reviewers commit passed.

Journal List 4 `1494:5387` was verified with Figma context and screenshot before its CSS change. The API-backed feed now follows the compact Journal hero, a 612 px feature cover, and editorial three-column rows at desktop. Archive/category controls and pagination remain available with real data. `npm run verify:build` passed (216 modules); journal design flow and retry passed, including a 393 px no-horizontal-overflow assertion.

Journal List 5/6 `1494:5182`/`1494:5287` were read separately. They confirm the same route with alternate static article and image fixtures, including an 818 px artwork hero. The released API-backed List 4 composition remains the applicable implementation; no fixture content or temporary Figma asset URL was introduced.

Journal Article `844:1547` was then re-read from the local raw export. The route now follows the verified desktop shell: a 909 px hero frame, 58 px heading target, 1126×642 cover rail, and a dark content block beginning at y=909 with a 251 px editorial inset. The implementation keeps the Journal API contract and uses the article's real `coverUrl`; the Figma frame's static three-image collage and author copy are not fabricated when the API does not provide them. After the Docker web rebuild, `journal-design-flow.spec.ts` and `editorial-accessibility.spec.ts` passed 5/5, including audio retry focus, language fallback, mobile overflow and exact desktop bounds.

Guest Home desktop `1413:6471` was re-read from the local raw node export after the earlier 764 px interpretation. The frame has a 1440×844 artwork rectangle and a centered SF Pro Display Bold 58 px heading at x335/y706; runtime now uses that geometry with the verified local artwork and no undefined decorative CTA. `npm run verify:build` passed (218 modules); the rebuilt Docker web image passed `home-list-cards.spec.ts` 3/3. The remaining guest feed sections still need their own frame-by-frame review.

Member Home desktop `1413:6263` was reviewed separately and uses `frontend/public/images/home-hero-member.jpg`, a 948 px header-underlaid hero, target 58 px title/24 px subtitle and six 174×260 px API-backed poster slots. `npm run verify:build` passed (216 modules); the rebuilt Docker web image passed the Home suite 3/3, including an authenticated mocked-session assertion. Other feed sections still require individual frame review.

Guest Home mobile `1411:3473` was re-read from raw nodes: the artwork is 393×320, the centered SF Pro Display Bold heading is 24 px at x42/y106, and the `Get Started` control is 85×32 at x154/y239. Runtime now uses that geometry, four live 79×116 poster tiles and the existing API-backed sections. The rebuilt Docker web image passed `home-list-cards.spec.ts` 3/3; `npm run verify:build` passed (218 modules). Remaining feed sections require separate frame review.

Global navigation was then compared against the raw Figma header nodes: desktop Group 26 is 1440×106 and the mobile Navigation instance is 393×92. Runtime now uses a 106 px desktop header and 92 px boxed mobile bottom navigation while preserving contextual transparent headers and focus behavior. After the Docker web rebuild, `editorial-layout.spec.ts --grep "header stays readable"` passed 2/2.

Home member section headings were aligned to the raw `1327:3210` text nodes (`Popular on Rewind`, `Latest news`, `Popular reviews this week`, `Popular Lists`) through dedicated UK/EN keys; API-backed content and state handling were untouched. `home-list-cards.spec.ts` passed 3/3 on the rebuilt Docker web image.

Member Home mobile `1327:3210` was checked separately. Its 320 px artwork hero, centered 24 px heading/12 px copy, New on Rewind heading and four live 79×116 poster tiles follow the frame while preserving the API-backed news, review and list sections. `npm run verify:build` passed (216 modules); the rebuilt Docker web image passed `home-list-cards` 3/3 with an authenticated mocked session.

Popular Lists desktop/mobile `1480:5390`/`1480:7927` were checked with their Figma screenshot/context. The feed now has the desktop 628 px image hero, 58 px heading and 1200×339 rows with 174×260 five-poster stacks, plus the 183 px mobile hero, contextual top controls, single 361 px card column and pagination. It retains API-backed lists and accessible targets. `npm run verify:build` passed (216 modules); `list-discovery-controls.spec.ts` passed 3/3 and `list-mobile-header.spec.ts` passed 12/12 at 320, 393, 600, 720 and 768 px in UK and EN.

Public Profile desktop `238:596` was reviewed directly in the Figma canvas. Its centered identity header and profile-state rail are now reflected in the live route without altering API content or mobile layout. `npm run verify:build` passed (216 modules); `route-transition.spec.ts` ran after the change. The original photographic hero asset remains pending Figma quota rather than being replaced by an unrelated image.

Public Profile phone `825:1378` was re-read from raw nodes: the contextual toolbar begins at y=50, the 120 px avatar is centered at y=190, and the 26 px identity name begins at y=317. The global mobile header is hidden only for `/users/:id` so it does not cover these controls; the bottom navigation, API-backed sections and keyboard anchors remain. The new geometry fixture passed 1/1, route transition coverage passed 8/8, and a deliberately long display name stayed within the 393 px viewport.

Поточний Search етап: targeted Global Search 4/4; нові UK/EN сценарії перевіряють shortcuts, URL, 361 px list cards, п’ять 79 px posters, багаторядкові tags і no-overflow. Додатковий reference `1480:6217` звірений по raw hierarchy; mobile show-results select вирівняний до 160 px, native semantics збережені. Повний набір зріс до 127. Admin wrapper спочатку зупинився до створення fixture через Docker template quoting у Windows PowerShell 5.1; після переходу на `docker inspect` JSON пройшов 12/12 і прибрав disposable fixture.

Після повторної перевірки Figma `1480:8527` mobile tag search cards now render the title/count before the poster rail, with 16 px radius and a 138 px poster area. `list-discovery-controls.spec.ts` пройшов 3/3; desktop original imagery remains pending Figma Starter quota.

Останній повний browser run після Public Lists landing update завершився **123 passed, 2 failures і 12 skips** у 137 сценаріях. Обидва failures — Community retry scenarios, які залежать від незакоміченої локальної зміни `frontend/src/context/FollowActionsContext.tsx`; у committed baseline ці стани мають показувати Retry. Films geometry/filter, Journal Search alignment, detail header, route-transition і Public Lists guard targeted suites пройшли без failures; весь `list-mobile-header.spec.ts` пройшов 12/12.

Backend host regression was rerun with the Compose MySQL credentials loaded only into the process environment. All 87 current tests passed with zero failures, errors, or skips; `.env`, schema and Docker volumes were not changed. The originally recorded 89 was corrected after excluding a stale duplicate poster report.

The disposable admin browser wrapper was rerun after the latest frontend changes: `scripts/verify-admin-browser.ps1` completed **12/12 passed in 42.8s**, then removed its temporary ADMIN fixture. Combined with the standard run, 130 browser scenarios are green across the two isolated runs; the two remaining standard-run failures are the user's uncommitted Community context change described above.

Public Lists follow-up fixed two concrete responsive/accessibility regressions: mobile tagged cards now clip the compact poster stack to the 138 px Figma rail, and desktop feed pages keep their route-level back/filter toolbar available. After rebuilding the Docker web image, `list-discovery-controls.spec.ts` passed 3/3, `public-guards.spec.ts` passed 6/6 (including the cross-locale tag → list → author → movie journey), the release viewport matrix passed 1/1, and the WCAG axe audit passed 1/1.

The catalog landing frames `1480:4983`/`1480:8280` were then compared against the rebuilt runtime at 1440 and 393 px. The duplicate feed rail below the hero was removed from the landing route; section-level `View all` links still reach team, popular, recently-liked and recent feeds, with API-backed content and localized copy unchanged. The updated `list-discovery-controls.spec.ts` passed 4/4 after the Docker web rebuild, including no-overflow checks at both widths.

Admin dashboard `1178:2466` was re-read from raw descendants. Its workspace begins at x=120 with 1200 px width; the metric rail uses a 28 px inset, three columns of roughly 365 px cards and 233 px card height. The runtime now follows that desktop shell without replacing its six live API counters or any admin actions. After rebuilding Docker web, `service-pages-responsive.spec.ts` passed 2/2.

Admin Settings `1404:4076` was then checked from raw descendants: its workspace is 1200×734 at x=120 with a 38 px radius and 41 px field controls. The runtime uses that desktop shell and three-column grid for the four API-backed settings, preserving save, validation and retry behavior. The rebuilt Docker web passed `service-pages-responsive.spec.ts` 2/2.

Admin User List frames `1218:2982`/`1260:3404` were checked next. The live users section now centers its title, constrains the search group to 402 px and keeps the 1200 px data rail with the existing row actions, pagination and profile panel. After the Docker web rebuild, `service-pages-responsive.spec.ts` passed 2/2.

Admin User Profile `1237:4369` was checked from raw descendants as well: the selected-user card is 1200×829 and its history/activity cards are 516×501. The runtime detail panel now follows those desktop rails while keeping profile mutations, overview API data and focus restoration. The rebuilt Docker web passed `service-pages-responsive.spec.ts` 2/2.

Admin Reviews `1310:3108` was checked from raw descendants: review cards are 1200 px wide with a 38 px radius, a 417 px left editorial column, an 84 px vertical rhythm and a 429 px minimum height. `AdminReviews` now renders live movie/user/content, rating, visibility and moderation controls in that two-column shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Comments `1342:3589` was checked from raw descendants: comment cards use the same 1200 px translucent rail, 38 px radius, 417 px left column and 84 px rhythm with a 249 px minimum height. `AdminComments` now renders live author/content, visibility and moderation controls in that shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Lists `1344:5249` was checked from raw descendants: list cards use a 1200 px translucent rail, 38 px radius, 417 px left column and 84 px rhythm with 393/364 px content states. `AdminLists` now renders live owner/items, visibility and list actions in that two-column shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Moderation `1399:3300` was checked from raw descendants: the queue uses one 1200×673 workspace with a 38 px radius. `AdminModerationQueue` now renders its live filters, selection, bulk hide and pagination inside that shell. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Admin Moderator Logs `1404:3804` was checked from raw descendants: audit cards use a 1200 px translucent rail, 38 px radius, 348 px lead state, 293 px follow-up rows and 84 px rhythm. `AdminAuditLogs` now follows those rails with localized actions and pagination. After rebuilding the Docker web image, `service-pages-responsive.spec.ts` passed 2/2.

Global Search phone frame `1480:8594` exposed a missing slider control in the mobile hero. The new localized button focuses the existing native `Show results for` select, preserving keyboard and URL behavior; after rebuilding the Docker web image, `global-search-alignment.spec.ts` passed 4/4 and the combined Search targeted run passed 11/11. Commit `cda3126` passed GitHub CI run [39708297409](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409).

Profile mobile frame `896:1838` exposed missing hero actions and Recent Activity content. The new 44 px gear button focuses the existing Profile details form, the more menu exposes that same form and logout, and the activity section uses the existing `/users/:id/activity` API with loading/error/empty/retry/pagination states. Escape and outside click close the menu and restore focus to its trigger. After rebuilding the Docker web image, `profile-alignment.spec.ts` passed 10/10 and `npm run verify:build` passed. Commit `115bd45` is pushed and GitHub CI run `39710281853` is green.

User Lists phone frames `1480:9542`/`1480:9606` show a search-style add-film affordance before the populated item rail and between description/tags in the metadata sheet. The existing `/films` route now renders a localized `Add a film` label and search icon on mobile while preserving the desktop Browse films label, API-backed list actions and keyboard order. After rebuilding the Docker web image, `list-owner-flow.spec.ts` passed 2/2.

Movie Details desktop `39:2`/`61:244` додатково перевірені через local Figma inventory і canvas. Реалізація тепер має full-bleed dark hero, 811 px backdrop, 275 px poster, desktop Rating/Cast rails і dark similar/review sections; `movie-mobile-alignment.spec.ts` та responsive suite пройшли 5/5.

Person/Actor desktop `545:676` і phone `721:1085` перевірені через local inventory та browser preview. Реалізація має full-bleed identity hero, 265 px desktop avatar, 120 px mobile avatar, compact mobile back/filter toolbar і 1200 px desktop або чотириколонкову mobile filmography grid; producer-flow suite пройшов 2/2 разом із API-backed navigation та mobile filter toggle.

Auth `605:2173–2176` і mobile `944:1582`/`944:1828`/`944:1887` перевірені через raw geometry та Chrome: desktop 627 px form width, 94 px inputs, 89 px actions і route-specific cards; phone 393×852 має back x32/y52, 290 px controls і Login/Register/Forgot anchors. Додано `Or` divider у Forgot без API зміни. `auth-responsive.spec.ts`, password-validation і completion-focus пройшли 12/12; `npm run verify:build` PASS (218 modules).

Mobile Auth footer тепер рендерить лише порожній `contentinfo` landmark, щоб приховані desktop-посилання не потрапляли в keyboard tab order. Release responsive matrix повторно пройшла 1/1 на 320/393/768/1440 px; до неї додано unknown-route 404 state.

Figma 404 frame `361:778` реалізовано як локалізований fallback route: великий 404 hero, error copy, Back to home CTA і responsive no-overflow. Matrix перевіряє UK copy та `/uk/home` link на 320/393/768/1440 px; оригінальний Figma image fill не використовувався, бо asset не доступний у локальній копії.

Останній Auth cleanup commit `42b8e3b` пройшов [GitHub CI run 39700140275](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275) за 1m52s: backend tests, frontend build/typecheck і Caddy validation завершилися успішно.

Початкові backend спроби проти основної dev DB не зараховані: вони отримали access denied через host credentials. Фінальний результат отриманий на чистій ізольованій MySQL з CI credentials; основну БД не змінювали.

## Figma та UI

- Design copy: `BDO9GO1oscOeUTcu4VXVKA`.
- У цьому проході concrete context/screenshots додатково використані для Popular Reviewers desktop/phone `1480:5486`/`1480:7698`; попередній checkpoint охопив Search shortcuts, Lists, Journal article, Auth desktop/mobile, Help, About, Admin dashboard і Public Profile phone.
- Service desktop `1062:1993` повторно перевірений у Figma canvas: Help-style full-bleed 818 px hero, centered title/lead і alternating detail rows тепер спільні для шести service routes. `service-pages-responsive.spec.ts` пройшов 1/1.
- Admin desktop `1178:2466`/`1404:4076` повторно перевірений через local raw inventory: hero/workspace geometry має 1020 px і 272 px avatar, а admin API tables/settings залишилися без контрактних змін. Geometry check пройшов 1/1.
- Auth raster assets збережені локально; runtime не містить тимчасових Figma asset URLs.
- Повний browser suite перевірив UK/EN, 320/393/600/720/768/1440 responsive cases, keyboard/focus, loading/error/empty/retry, admin fixture і poster compatibility.

Точні mappings і межі pixel parity — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md). Загальна pixel-perfect відповідність усім top-level frames не заявляється без окремого screenshot comparison кожного frame.

## GitHub CI

- UI/assets/harness commit: `33f8082`.
- Release documentation commit: `f48713a`.
- [`CI / verify (push)` run 39557098972](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s. Backend tests, frontend build/typecheck і Caddy validation зелені.
- Search/CI maintenance commit: `ea037f0`; [`CI / verify (push)` run 39560672726](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726): PASS, 1m44s. Runner pin/docs commit `0b22904`; [run 39560950893](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893): PASS, 1m36s, без annotations. Нові action majors та `ubuntu-24.04` виконані успішно.
- Latest PublicProfile overflow fix commit `4e3eada`: [CI / verify (push) run 39703800234](https://github.com/anton5267/rewind-letterboxd/actions/runs/39703800234) PASS.
- Public Lists catalog landing alignment commit `2d40abc`: [CI / verify (push) run 39719191200](https://github.com/anton5267/rewind-letterboxd/actions/runs/39719191200) PASS; `list-discovery-controls.spec.ts` 4/4 and frontend build/typecheck passed.
- Public Lists journey regression update commit `04723b8`: [CI / verify (push) run 39720126166](https://github.com/anton5267/rewind-letterboxd/actions/runs/39720126166) PASS; the cross-locale tag → list → author → movie guard follows section-level `View all`, and list/public guard targeted coverage passed 10/10.
- Journal Article geometry commit `d68eeec`: [CI / verify (push) run 39725805058](https://github.com/anton5267/rewind-letterboxd/actions/runs/39725805058) PASS. Public Profile phone geometry commit `8ce4419`: [CI / verify (push) run 39726412078](https://github.com/anton5267/rewind-letterboxd/actions/runs/39726412078) PASS.
- Історичний checkpoint перед поточним UI-проходом: [GitHub CI для `f0df409`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39485802412).

### PublicProfile desktop Figma follow-up — 22.10.2026

Raw frames `238:596`, `122:176` і `175:619` були повторно прочитані з локального Figma archive. Desktop route тепер має виміряні 1440×1020 full-bleed hero, 265×265 avatar, 58 px identity title, 1200×79 profile rail, 24 px section headings і 174×260 poster cards у шість колонок із 31 px gap. API-backed profile data, avatar fallback, mobile geometry, localization і accessibility не змінювалися; оригінальний Figma photo fill не вигадувався без локального asset.

Перевірки після `docker compose build web` та `docker compose up -d web`: `npm run verify:build` — PASS (218 modules), `public-profile-design-flow.spec.ts` + `public-profile-desktop-figma.spec.ts` — **2/2**, no horizontal overflow.

### Own Profile desktop Figma follow-up — 22.10.2026

Raw own-profile frames `363:289`/`363:411` confirm a 1020 px identity stage, 265 px avatar, 58 px name, 1200×79 profile rail and 174×260 collection poster slots. `Profile.module.css` applies those desktop measurements from 1024 px and reorders the rail before overview with CSS order; API-backed content, visible film titles/years, forms, focus behavior and mobile rules remain intact.

After the Docker web rebuild, `npm run verify:build` passed (218 modules) and `profile-alignment.spec.ts` passed **10/10** across UK/EN, retry/error, legacy poster, keyboard and no-overflow checks.

The related Profile variants `122:176`, `175:619`, `363:289`, `363:411`, `153:180` and `175:177` share a five-tab `Profile / Films / Watchlist / Likes / Lists` rail. The runtime rail now switches the existing watched/watchlist/favorites API states and keeps Ratings, Reviews and Following as live sections below it; no new endpoint or fixture data was added. The same suite passed **10/10** after the Docker web rebuild, including UK/EN collection switching.

The raw admin reported/edit frames (`1389:3464`, `1343:3799`, `1319:5033`, `1317:4617`, `1315:4313`, `1342:4028`, `1390:3326`, `1319:5889`, `1342:3273`, `1342:3470`, `1343:4118`) were checked against the repository contract. They require report/complaint entities, edit history and block/delete/resolution mutations that are absent from both `admin.api.ts` and backend controllers. Existing hide/unhide moderation and audit logs cannot safely stand in for those operations; implementation waits for an approved API contract.

### Own Profile mobile shell follow-up — 22.10.2026

Raw frame `896:1838` was re-read from the local archive. The phone route now uses a full-bleed identity stage without the global logo/menu header; its 44×44 gear/more controls start at y=48 and the 120×120 fallback avatar is centered at y=190. The bottom navigation, live profile sections, edit/logout menu, localization and focus behavior remain unchanged. After rebuilding Docker web, `profile-alignment.spec.ts` passed **10/10** and `npm run verify:build` passed (218 modules). Separate Films/Lists/Reviews/Following/Watchlist/Likes variants remain the next raw-node audit.

### About desktop Figma follow-up — 22.10.2026

Raw frame `1011:1915` confirms the About composition: 1440×818 full-bleed hero, 58 px title, 24 px intro, a 1200 px editorial rail and the first heading at y=713. `About.module.css` now uses that measured desktop overlap shell from 721 px; localized copy, TMDB attribution and mobile overflow behavior remain intact. The original photo fill is not fabricated without a local asset.

After the Docker web rebuild, `npm run verify:build` passed (218 modules) and `about-figma.spec.ts` passed **1/1** at 1440 and 393 px.

### Service editorial variants — 22.10.2026

Raw service frames confirmed the shared 1440×818 hero, 58 px title, 24 px lead, 1200 px content rail and 22/20 px editorial typography. `ServicePage` now uses route-specific localized sections for Help, Contact, Rules, Privacy, Film Data and Account Deletion, with no API or asset contract changes. After rebuilding Docker web, `service-pages-responsive.spec.ts` passed **3/3**, covering hero/nav, desktop section counts and rails, and UK/EN 393 px no-overflow.

The same Docker pass exposed a fixed-header interception in the admin user detail Close action. Scoping the Figma-aligned absolute control to its detail header restored the keyboard focus-return contract; `editorial-accessibility.spec.ts --grep "admin user detail"` passed **1/1**.

### Journal feed desktop — 22.10.2026

Raw Journal list frames confirmed the 1440×818 full-bleed stage, 513×612 feature cover at x=120/y=212, feature text rail at x=748, and the following 444×408 covers at the 576 px editorial rhythm. The desktop CSS now follows that geometry while retaining live API articles, archive/category controls, pagination, localization and the existing mobile composition. After rebuilding Docker web, `journal-design-flow.spec.ts` passed **2/2**, including the 393 px no-overflow check.

### Full regression — 22.10.2026

Push `d703d63` passed GitHub `CI / verify (push)`. The local frontend suite completed with **128 passed, 2 failed and 12 skipped out of 142**: both failures are the pre-existing Community retry scenarios covered by the user's uncommitted `FollowActionsContext.tsx`, and the skips require the unavailable admin fixture. The backend suite was rerun against the Compose MySQL service on port 3307 and completed **87/87 passed** with no failures, errors or skips; no `.env`, database or user-owned dirty files were changed.

## Збереження даних

- Основні Docker volumes не видалялися; `down -v` не виконувався.
- Browser/API verification створювали лише disposable accounts/data й виконували cleanup.
- Diploma video artifacts, локальний `AGENTS.md`, `.env`, backups, caches і raw Figma references не включаються в release commits.

## Межа релізу

Локальні перевірки не підтверджують production infrastructure. VPS, domain/TLS, real SMTP/TMDB credentials, monitoring і restore drill на цільовому сервері виконуються окремо за [DEPLOYMENT](DEPLOYMENT.md). Відсутність погодженого Journal content не блокує код: Journal залишається API-backed.
### Popular Reviews desktop Figma check — 22.10.2026

- Raw source: local archive frame `1480:4880`.
- Implemented: 1440×486 hero, 1200 px rail at x=120, 1200×180 reviewer group, 80×80 reviewer avatars, 1200×315 review cards, and 175×262 poster slots.
- Verification: `npm run verify:build` PASS (218 modules); `npx playwright test tests/e2e/popular-reviews-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.
- Contract: live review/reviewer APIs, localization, focusable links and mobile overflow behavior remain unchanged.
### PublicProfile mobile identity check — 22.10.2026

- Raw source: local frame `825:1378`.
- Implemented: 361 px mobile identity rail (x=16..377), safe long-name wrapping, and preserved 120×120 avatar at x=136.5/y=190.
- Verification: `npm run verify:build` PASS (218 modules); `public-profile-design-flow.spec.ts` + `public-profile-desktop-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.

### Featured Lists Figma check — 22.10.2026

- Raw source: local archive frame `1480:5839`.
- Implemented: 1200 px desktop content rail, y=572 content start, three 326×249 cards with 112 px gaps, and a phone-safe full-bleed hero under the `team` feed variant.
- Verification: `npm run verify:build` PASS (218 modules); `npx playwright test tests/e2e/public-lists-featured-figma.spec.ts` PASS (**2/2**); Docker web image rebuilt and restarted.
- Contract: live `/api/lists/public/team`, localization, focusable links and loading/error/empty/retry states remain unchanged.

### Popular Lists Figma check — 22.10.2026

- Raw sources: local archive frames `1480:5390` and `1480:7927`.
- Implemented: 1200 px desktop rail, 1200×339 rows at the measured y-rhythm, 361 px phone cards, and 323×116 compact poster strips.
- Verification: `npm run verify:build` PASS (218 modules); `npx playwright test tests/e2e/public-lists-popular-figma.spec.ts tests/e2e/public-lists-featured-figma.spec.ts` PASS (**4/4**); Docker web image rebuilt and restarted.
- Contract: live `/api/lists/public/popular`, sorting/filter links, localization, focus and retry states remain unchanged.

### Public List detail Figma check — 22.10.2026

- Raw sources: local archive frames `1480:6071`, `1480:6134`, `1480:9302` and `1480:9353`.
- Implemented: 818 px desktop hero, 1200 px detail rail, six 174×260 desktop posters, and 79×116 four-poster phone rows.
- Verification: `npm run verify:build` PASS (218 modules); `npx playwright test tests/e2e/public-list-detail-figma.spec.ts tests/e2e/list-mobile-header.spec.ts` PASS (**14/14**); Docker web image rebuilt and restarted.
- Contract: live detail/like/tag APIs, information dialog focus return, contextual navigation and UK/EN behavior remain unchanged.

### Global Search desktop all-results Figma check — 22.10.2026

- Raw source: local archive frame `1480:6991`.
- Implemented: 1200 px desktop rail, six 174×260 film posters at y=377, and 1200×315 review cards at y=692 with 175×262 poster slots; duplicate visual tab/section bands are removed while accessible controls remain.
- Verification: `npm run verify:build` PASS (218 modules); `npx playwright test tests/e2e/global-search-desktop-figma.spec.ts tests/e2e/global-search-alignment.spec.ts` PASS (**5/5**); Docker web image rebuilt and restarted.
- Contract: live search API, keyboard category navigation, localization, existing mobile variants, and no-overflow behavior remain unchanged.

### Global Search desktop empty-state Figma check — 22.10.2026

- Raw source: local archive frame `1480:5809`.
- Implemented: centered 540×166 no-match shell at x=450/y=377 under the matches heading.
- Verification: `npx playwright test tests/e2e/global-search-desktop-figma.spec.ts` PASS (**2/2**) after Docker web rebuild.
- Contract: localized empty copy, Back to home link, keyboard semantics, API error/retry behavior, and mobile layout remain unchanged.

### Global Search desktop lists-tab Figma check — 22.10.2026

- Raw source: local archive frame `1480:7490`.
- Implemented: 1200×339 list cards at y=377/y=754, 446×260 five-poster previews at x=154/y=421, 38 px card rhythm and 20 px card radius.
- Verification: `npm run verify:build` PASS (218 modules); combined Global Search desktop/alignment tests PASS (**7/7**) after Docker web rebuild.
- Contract: live list search data, owner/count/description content, keyboard category tabs, localization and mobile layout remain unchanged.

### Global Search desktop reviews-tab Figma check — 22.10.2026

- Raw source: local archive frame `1480:7311`.
- Verification: `global-search-desktop-figma.spec.ts` plus `global-search-alignment.spec.ts` PASS (**8/8**) for all, no-match, lists and reviews variants after Docker web rebuild; `npm run verify:build` remained PASS (218 modules).
- Contract: live review API data, links, nullable poster/avatar fallbacks, keyboard category tabs, localization and mobile behavior remain unchanged.

### Global Search responsive and live Figma follow-up — 22.10.2026

- Sources: live Chrome Figma canvas `1480:7549` (Journal Search,1440×1149), plus local raw all/empty/lists/reviews frames. Live `get_design_context` and `get_screenshot` MCP calls returned `Unknown tool`; browser canvas access works. Full variables/assets export and exact shared header/footer parity are not claimed.
- Corrected: visible native desktop category selection; keyboard tabs reveal on focus; metadata anchored to posters; proportional previews; natural card/empty heights for long localized content; responsive Journal cards with219px covers,347px minimum,20px radius and22/20px title/excerpt.
- Current verification: **23/23 passed**, no skips, after Docker web rebuild: `global-search-desktop-figma.spec.ts`, `global-search-alignment.spec.ts`, `global-search-responsive.spec.ts`, `search-controls.spec.ts`, `journal-design-flow.spec.ts`. The responsive fixture checks UK/EN at320/393/600/720/768/1024/1100/1101/1440px, long titles/copy, document/card bounds and actual keyboard/pointer targets. TypeScript/Vite passed (218modules); Docker web image rebuilt and restarted with existing volumes preserved.
- The earlier geometry-only empty-state check counted a166px outer box while content escaped it. That result does not prove content fit; the new suite checks message/action containment and allows natural height.
- PLAN and PROGRESS are consolidated to current status and one work order; detailed historical evidence remains here. Backend report totals corrected to87 after excluding a stale duplicate two-test report; this audit did not rerun backend tests.

### UserLists desktop implementation / test deferral — 22.10.2026

- Live Figma Chrome review: empty `1480:5333` and populated `1480:5182`; raw confirms 818 px hero,1200 px editor rail from y713,588 px columns with24 px gap,79 px fields,515 px textarea and195 px rows with91×134 posters. The mapped hero image already exists locally as `/images/search-hero-desktop.png`.
- Implemented: responsive desktop composition, natural content heights, picker below editor, focus/scroll return for selection (including same-ID), Cancel and deletion. Existing CRUD/public checkbox/tags/remove/reorder and mobile add-film routes are retained. Persisted ranked-state/extra view APIs are not added.
- Build: TypeScript/Vite PASS (218 modules); Docker web image rebuilt/restarted without touching volumes. The authenticated local Chrome page was visually compared with Figma. No new final regression claim is made.
- User instruction changed during the first owner-flow run: do not write/run tests until the whole redesign is complete. That run was interrupted; two existing owner scenarios had already finished with disposable-account cleanup. The uncommitted new UserLists spec was removed. Further local test runs and intermediate pushes (which trigger CI tests) are deferred to the final phase.
- Earlier Search delivery `ea121af`: GitHub CI completed successfully before this instruction; run https://github.com/anton5267/rewind-letterboxd/actions/runs/39836480216 . UserLists changes remain local for ongoing design work.

### Profile Authentication and original backdrops — 22.10.2026

- Sources: Authentication `251:549` and PublicProfile `238:596` opened in live Chrome Figma; raw descendants supply geometry, image hashes, the y628 flat Authentication background and password field positions. Mapped Babylon/Whiplash originals were copied to stable frontend paths; provenance is in FIGMA_HANDOFF. The blurred Authentication overlay is approximated with a gradient; SF Pro Display parity is not claimed.
- Implemented: `/profile?settings=authentication`, localized three-field password form using the existing API payload, client confirmation, pending focus return after slow profile loading, and links to real profile/avatar-URL/social/newsletter/delete sections. Fixed input CSS specificity so the 79 px/radius37 desktop and 56 px mobile fields override the overview form styles. No backend contract changed.
- Build/view evidence: `docker compose build web` PASS using `npm run build` (220 modules); `docker compose up -d --no-deps web` completed. Chrome views covered desktop1440 and phone393/320 with UK/EN; the Avatar URL link returned focus to `profile-avatar-url`. No password values were entered or submitted. No tests or new TypeScript check ran for this block, and no commit/push was made.
- Additional CSS changes make Profile/PublicProfile/PublicList poster grids and Featured/Popular Lists previews proportional at intermediate widths. They are included in the web build; their complete visual width pass remains pending. Historical geometry/test results above do not cover these new changes. All tests remain deferred until the redesign is complete.

### Profile backgrounds, About/Help and shared navigation — 22.10.2026

- Live Figma canvas: own phone Profile`896:1838`, public phone`825:1378`, About`1011:1915`, Help`1062:1993`, Header`251:612` and Footer`251:625`. Raw descendants provided exact image/crop and geometry mappings. Own/public phone backgrounds now use distinct Babylon/Whiplash originals; public collection links preserve query/hash and heading focus. Standalone collection variants and overview composition remain unfinished.
- About now contains eight localized editorial sections and its original hero crop. Help contains six alternating illustrated rows, three guide cards and14 byte-identical mapped assets. Shared ServiceNavigation uses existing real routes; contrast and intermediate-width grid defects were fixed. Account Deletion links to the existing settings form; no deletion was performed.
- Header uses the original184×30 logo and five desktop links with an Account disclosure retaining notifications/messages/settings/admin/locale/logout. Footer uses five24px primary links, current TMDB attribution and real service routes. Auth footer is visible on desktop and hidden on phone. Exact vector/font parity is not claimed; native SVG export was attempted but no download was obtained.
- Build: `docker compose build web` PASS, Vite222 modules; `docker compose up -d --no-deps web` completed with existing volumes retained. Chrome: About1440EN from hero through footer; Help1440UK all six rows/three cards,768UK hero/first row and320EN hero/navigation/first illustrations; own/public profile393; public URL-selected Watchlist focused its collection heading; Account disclosure opened and Escape returned focus to its trigger.
- This served build predates the new PublicProfile overview, the later LinkedIn icon correction and guest auth-return fix. Those changes need a subsequent build/view. No tests, typecheck, commit or push ran in this block. Historical suites do not cover this code; all tests remain deferred until the redesign is complete.
- Independent source review found a guest navigation defect: opening Account Settings or Account Deletion lost the requested Profile query/hash during login. Profile now passes router `state.returnTo`; Login accepts only the exact localized Profile pathname, preserves query/hash and otherwise keeps its Films fallback. Absolute/protocol-relative paths, backslashes, control characters and other routes are rejected. Source reviewed; authenticated guest-return flow has not yet been exercised in the browser.

### PublicProfile overview implementation — 22.10.2026

- Sources: raw238:596/825:1378 and their overview children. Order now Favorites → Activity → Recent Reviews → Following → Lists. Existing full collections/statistics/social/liked reviews remain accessible below. Favorites and review previews start with4/2 items; activity retains real pagination/expansion. Hero metrics use actual watched/following/followers counts.
- Poster hydration uses movie details for activity and visible review details for reviews, bounded photo cache, in-flight deduplication, stale-response guards and retry; hidden/missing reviews are unavailable without bypassing visibility. WATCHED activity is typed/localized. No fake ratings, duplicate posters, new endpoints or fixture content were introduced.
- Independent source review corrected mobile list layout to heading→full-width strip from831:1537, retaining genuine three API previews. The six navigation buttons below831:1568 and standalone collection layouts are still pending. Tablet hero alignment is stable; desktop keeps avatar starty274.
- `docker compose build web` PASS (Vite226 modules); `docker compose up -d --no-deps web` completed. This build includes the LinkedIn icon and guest auth-return fixes. Chrome393UK showed hero, empty favorites/lists, activity/review fallbacks and following;1440EN showed desktop hero;320EN URL-selected Watchlist displayed the real entry and focus on `public-profile-collections-title`. The viewed account has no poster URLs/favorites/public lists; populated preview visual fidelity is not proven by this pass.
- No tests/typecheck/commit/push. No account/follow/block/delete mutation, database/volume deletion or fixture cleanup performed. All tests remain deferred; overall design coverage is incomplete.

### PublicProfile lower mobile navigation — 22.10.2026

- Live Figma `831:1568` opened and visually read; raw overrides confirm Films/Watchlist/Likes/Lists/Following/Followers in six361×32 rows with5px gap, radius37, #282828 and11px labels. Runtime retains that order/appearance with44px targets for accessibility. Lists uses the generic label rather than My lists on another member's profile.
- Added real query/hash navigation, collection-page reset and focus handling for direct network-heading anchors. Existing section URLs and browser-history behavior remain available. These links currently reach the live sections; they do not prove completion of the separate standalone collection variants.
- Docker web build PASS (Vite226); web recreated with `--no-deps`, volumes retained. Chrome393UK showed all six links; Following updated the URL and focused `public-profile-following`. Chrome320EN displayed all six labels without clipping after the final rebuild. No tests/typecheck/commit/push or data mutations.

### PublicProfile separate collection/list views — 22.10.2026

- Raw phone frames845:1679/861:1474/863:2474/863:2717 establish toolbar at50, content at123 and361px rail. Live Figma Watchlist861:1474 was opened and visually read alongside Films/Likes neighbors. Lists retains the previous real API card composition; unsupported user-rating stars are not fabricated from movie averages.
- Added `view=collection` with the existing collection parameter, and `view=lists`. Desktop retains identity/rail and isolates the selected content; phone hides identity/rail and shows a44px toolbar with four proportional79×116 posters/15px column gaps. Filters opens the real roving collection tabs; Back restores overview. Legacy query/hash-only URLs keep their existing overview sections. Hidden sections leave the accessibility tree, while links/data/retry/pagination remain available in the selected view.
- Docker web build PASS (Vite226), web recreated with `--no-deps`, existing volumes retained. Chrome393EN Watchlist showed its actual entry/fallback, Filters expanded, pointer selected Likes, then ArrowLeft restored Watchlist and focused its selected tab. Chrome320UK showed empty Lists with its own toolbar;1440EN showed the isolated six-column desktop collection rail. Populated grids/lists, complete width coverage and all error/retry states are not proven by these views. An initial Tab/Right attempt did not switch the collection; the later explicit selected-tab ArrowLeft observation confirms only that interaction.
- No tests/typecheck/commit/push or data mutations. Own collection variants and network/settings coverage remain open; overall goal remains incomplete.

### Own Profile collection/review views — 22.10.2026

- Live Figma1015:3356 was visually read with own overview/Reviews/Likes/Lists neighbors; this exposed remaining hero-metric and own-list-card gaps. Raw1015:2131 (Films) confirms standalone toolbar50/content123. Raw1015:3356/4508 (Watchlist/Likes),1017:1841 (Lists) and1023:1867 (Reviews) retain avatar120/y190, identity stage to496, nav/y531, heading/y606 and content/y646. Own Lists still has live text links; its poster-card composition is pending.
- Implemented own `view=collection`/`view=reviews`, query-based collection selection and copied-link/history support. Films uses a phone toolbar/four proportional posters; Watchlist/Likes/Reviews retain identity/nav and isolate their selected section. Real review posters/content/date, nullable/legacy fallback, pagination/retry and all original settings/auth flows remain. View Back restores overview; identity editing clears view before focusing its form. WATCHED activity now retains its film link.
- Chrome exposed an early footer and a visible horizontal nav scrollbar; final CSS gives explicit views100vh, hides the scrollbar and keeps inset keyboard focus. Views retain44px controls and natural content heights. No unavailable bio/extra fields or ratings are fabricated.
- Docker web build PASS (Vite226), web recreated with `--no-deps`, data volumes retained. Chrome393EN own Watchlist showed retained identity/nav and empty collection;320UK showed the genuine Send Help review poster/card, then navigation to Films updated query/hash and focused its collection heading. Final Films screenshot showed the compact toolbar, actual fallback entry and no early footer. Desktop Watchlist rail/empty state was also viewed, but full desktop/mobile parity and populated multi-row grids are not proven.
- No tests/typecheck/commit/push or data mutations. Own Lists/network/settings and overall frame coverage remain unfinished.

### Own Lists, hero totals and network — 22.10.2026

- Raw1017:2157 confirms361×189 list cards with18/24px padding,325px heading and116px poster strip. Added ProfileListCard using existing authenticated list-items API, genuine item count and up to five previews, loading/retry and empty-list fallback. Requests have cleanup guards, owner dependencies and no persistent private-data cache. Cards load only for overview/Lists; existing public/private list destinations remain.
- Hero now shows actual watched/following/followers totals and network links; unknown totals show a dash with retry. Statistics moved below the main overview and the old favorite-preview anchor remains available. Corrected equal metric-label heights, link-color specificity and the overview nav scrollbar after Chrome review.
- Following/Followers now use separate query views, existing APIs/pagination/stale guards and a page-scoped FollowActionsProvider. UserFollowRow adds a scoped profileNetwork presentation and optional settlement callback to refresh totals/pages. The user's dirty FollowActionsContext was read and reused, never edited. Network table watched/list/likes metrics lack API fields and are not fabricated. Source review caught the required Provider before serving the new rows.
- Docker web build PASS (Vite228), web recreated with `--no-deps`, volumes retained. Chrome393UK showed the aligned hero totals, Favorites first and the true empty Followers route with heading focus. Chrome320EN showed real populated and empty own-list cards with counts/posters. No follow/unfollow mutation was performed; populated network rows, settlement refresh, error/retry cases and complete responsive/frame parity remain unverified.
- No tests/typecheck/commit/push. Own overview poster activity/review preview and extra-section ordering, network variants and settings remain open; overall goal remains active.

- Network follow-up in the same block: live Figma1023:3020 confirms phone follower/following subtitles. Existing follow-status already exposes these totals, so profileNetwork rows now hydrate them with request cleanup, identity guards and retry. This does not resolve the separate desktop watched/list/likes metric contract. The final Docker228 build includes this hydration and the own Lists Create link to the existing editor; populated network metadata/actions remain unexercised.
- Additional Chrome follow-up: desktop Lists heading was partially covered by the106px fixed header. Own desktop section/heading scroll margin is now122px, and the final view showed the complete focused heading below the header. Mobile Create uses the existing localized New list label; an initial missing-key label was corrected. No additional regression claim.

### Own overview and Contact composition — 22.10.2026

- Own source: desktop238:865 and phone896:1838 raw plus exported phone reference. Overview now orders Favorites4, poster activity4, recent reviews2, Following and one list preview; mobile has four tabs and six lower links. Extra full sections render for explicit views/legacy hashes. Current own rating uses the existing rating/me API with cleanup/actor guards and retry, without a private response cache; activity events do not invent historical scores. Nullable/legacy review-poster compatibility remains. List preview uses existing metadata/items and the desktop poster-left/details-right composition.
- Manual Chrome393UK: four tabs, real activity/review poster, current4/5 score, Recent reviews link → full Reviews with heading focus. Chrome1440EN: review card with175px poster and real score, one list preview with title/count on the right, Statistics Ratings link → full Ratings with heading focus. This does not verify all populated/error/loading states or the complete width matrix.
- Figma MCP get_design_context Contact1122:2497 succeeded with full code, screenshot and assets. The next Privacy1164:2679 request returned the Starter-plan call limit. No plan/subscription change. Downloaded Contact hero was byte-identical to existing search-hero-desktop.png; reused it. Original divider SVG downloaded to a stable local runtime path; no temporary asset URLs in application code.
- Contact body now has an introduction, three semantic lists, original dividers and22/20px desktop type. Shared service rail uses24px desktop type with44px targets; real supported routes retained. Unverified example email destinations and archived-board link are absent; the page states that the team address is not yet published, pending user confirmation. Copy and extra navigation reflect available functionality, so exact content parity is not claimed.
- Docker web build PASS (Vite229 modules); final manifest list3f1bfec74885df4050d81852359a983bb171f62ef894708412bd828e3469fb03. Web recreated with --no-deps; no DB/API/env/volume changes. Chrome1440EN/UK Contact hero/rail/body reviewed,320UK body/navigation reviewed; keyboard Tab from Help to Film Data showed visible focus. Full shared-sidebar width coverage and exact fonts/vectors remain open.
- No tests, typecheck, commit, push or account/data mutations. Privacy and remaining Profile/settings/Service/frame coverage are unfinished; overall goal stays active.

### Privacy editorial body and tablet Header — 22.10.2026

- Privacy1164:2679 opened in live Chrome and visually read at25/50%, correlated with raw intro2696/y713 and five sections2694/2755/2759/2763/2767. MCP request was quota-limited; no claim of a successful Privacy context export. Implemented one editorial rail with intro, semantic ordered lists3/4 and five sections, preserving existing policy copy where applicable and adapting unsupported settings/recommendation/analytics claims to actual app functionality. Profile details and Delete account links use existing form anchors; no new API or privacy controls.
- Contact/Privacy share editorial CSS and the original local divider. Chrome1440EN Privacy body and393UK/768UK body/hero reviewed. Profile details link navigated to /profile#profile-identity-form-title and the settled AX state confirmed heading focus. Account deletion was not submitted. These observations do not prove the full responsive matrix or exact copy/font parity.
- Chrome768UK exposed the old tablet Header's horizontal navigation scrollbar. Removed the duplicated legacy nav/unused CSS;721–1023px now adapts the existing five-link desktop rail and Account menu. Its menu breakpoint is721px. Chrome768/721UK: all five entries visible, Account popup contains real routes, Escape returns focus to Account. Resizing an open popup721→720 closes it and focuses the mobile Menu trigger. Guest/admin/unread-rich and light-header variants remain unreviewed for this change.
- Docker web build PASS (Vite229 modules), latest manifest listdc9aa82002391307111f22e9049b6a600f94af3d566a590c779a41591a055f50; web recreated with --no-deps. No tests/typecheck/commit/push, DB/env/volume changes or user-data mutations. Remaining Profile/settings, Rules/Film Data/Account Deletion and full frame coverage remain active work.

### Remaining Service document bodies — 22.10.2026

- Live Chrome/raw sources: Rules1164:2790 (nine sections, ordered prohibited list4); Film Data1162:2305 (separate intro/attribution, two sections); Account Deletion1176:2515 (four sections, ordered effects list4). Replaced the remaining numbered/alternating card renderer with shared editorial composition and removed its unused CSS. First content begins at the713px desktop target, headings22/body20, genuine local divider reused. English page headings now match frame names.
- Film Data keeps TMDB attribution and real TMDB/Contacts links. Source's30-hour update promise is omitted: the actual scheduler is opt-in and does not establish that deadline. Automatic duplicate merging and paid-subscription cancellation are not advertised; account deletion copy refers to current account/follow/session functionality. No backend/API changes.
- Chrome1440EN reviewed Rules body/list, Film Data intro/sections/links and Deletion body/CTA. Chrome320UK reviewed all three bodies with wrapping/semantic lists and preserved navigation. Deletion CTA navigated to the existing profile anchor; settled AX confirmed focus on profile-delete-form-title. No deletion/password/account mutations performed. Full width/state coverage and exact font/copy parity remain unproven.
- Docker web build PASS (Vite229), final manifest lista3f7630b302a615c74193d5e0e3d5a03e418637abd212658cb8aaf4b166b69fe; web recreated with --no-deps. Tests/typecheck/commit/push remain deferred under the user instruction. Overall redesign goal remains active.

### Profile settings views and mobile composition — 22.10.2026

- Sources: live Chrome/raw Profile251:430, Avatar/Banner251:660 and mobile Settings1043:2125 (live393×1905); Connections341:3207 raw and visible neighboring frame. MCP251:430 request confirmed the continuing Starter call limit. Existing mapped Babylon original reused; no new static assets or Figma source changes.
- Generalized ProfileAuthentication into ProfileSettingsShell and added settings=profile/avatar/connections alongside the existing authentication route. Desktop retains1200px rail/four tabs,588px fields,79px controls and mapped hero. Profile shows read-only username/email, editable displayName and real Favorites. Avatar has a543px preview with265px current image/initial and URL form; social view keeps existing URL fields. Mobile Profile has flat toolbar/compact rows, Favorites,90px avatar in158px panel and social forms. Unsupported profile fields/banner upload/OAuth controls are absent; no overall frame parity claim.
- Normal overview no longer displays settings forms; existing hash URLs conditionally mount the legacy forms. Gear and generic Header/service settings links now open Profile settings. Name/avatar updates send separate PATCH fields, preserving the other draft; ProfileService.updateMyProfile null guards confirm the existing partial-update contract. No backend changes or mutation execution.
- Chrome393UK reviewed Profile/Authentication/Avatar/Social navigation and heading focus. Chrome320UK reviewed full username/email wrapping and rounded password controls. Chrome1440EN reviewed Profile fields/Favorites, Avatar preview, Authentication controls and keyboard Tab to Confirm new password. Returning to overview showed the intended headings without settings forms; opening the legacy delete hash focused its heading. No password values entered and no save/delete actions submitted.
- Manual review caught clipped read-only email and password CSS specificity leakage; outputs now wrap, and settings input selectors override legacy Profile form styling. Final Docker web build PASS (Vite229); manifest list26c1755950161f08d720570fb2d8eb5e790009f318ce3cbf73c297605f910076, web recreated with --no-deps. No tests/typecheck/commit/push or DB/env/volume changes. Full tablet/width/error/retry/save states, network variants, Public overview follow-ups and remaining full-file coverage are open.
### Public network review and Contact address confirmation — 24.10.2026

- The user confirmed `anonimua910@gmail.com` as Rewind's public support contact. Contact now renders the address as a visible `mailto:` link in UK/EN; Chrome accessibility trees confirmed the link destination in both locales. No email was sent and no other Figma/example destination was published.
- `npm run build` PASS (Vite229 modules). Docker Desktop was started after reboot; rebuilt web image digest `sha256:ee7d040cb6ccae34ac4c36005ff2a0186dc3eb2698c10ec5660d293c834fed7a`. Started the existing Compose API dependencies and containers using the existing `.env` and DB volume; no migration was needed (schema at version31). Docker does not report an explicit DB volume change; DB container is healthy. Web/API/Redis/Mailpit and DB are now running.
- Chrome confirmed Contact content and email link UK/EN. A populated Public Following page (`/uk/users/7748?view=following`) loaded real network data: heading focus, desktop back link, target name and follow-status counts, and the follow action are visible. No follow/block/message actions were activated. The earlier ID1092 in the previous local DB snapshot is unavailable in this current instance; a populated profile was located from the live community directory instead.
- No tests/typecheck/commit/push or account/data mutations. Full profile variants, remaining frames and final regression remain open; overall redesign remains active.

### Public network mobile More sheet implementation — 24.10.2026

- `UserFollowRow` now includes the phone More trigger and the `1033:5681` member sheet with existing follow/unfollow, block/unblock and member navigation actions. Block status and changes use existing endpoints; no API/backend contract was added. Escape/focus trap uses the shared dialog hook. UK/EN strings and retry/error feedback are included. Action retry also waits for focus restoration; block is disabled while a follow mutation is active.
- Source review caught and fixed a CSS cascade that overrode phone-trigger visibility. Network refresh after an action is deferred one frame so the dialog trap can restore focus before a row may be removed. `npm run build` PASS (Vite229 modules). Docker web rebuilt/recreated; the later PublicProfile alignment rebuild produced final image digest `sha256:5f9c335d9434d37fc30ea33b5b40847e253be195d0429965bbdf9cae3e6f496c`. Existing API/DB/Redis/Mailpit containers stayed running; no env, database, volume, or account data changed.
- Chrome screenshot and accessibility snapshot show a real populated guest Public Following row at desktop width. The action is the expected direct Follow link; the authenticated More sheet is unavailable in this guest session. The current viewport did not allow mobile sheet/focus visual review, so those criteria remain unverified; no follow/block mutation was activated. No tests/typecheck/commit/push; tests remain deferred until the redesign ends.

### PublicProfile phone overview alignment and responsive capture — 24.10.2026

- Raw frame `825:1378` places the phone H1 at y=317, avatar at x=136/y=190/120×120, and Favorites heading `825:1414` at y=590. The live public profile H1 measured y=317. The Favorites heading previously measured y=649 because a phone top profile rail added 59 px; the raw phone variant instead has six lower navigation links. Hiding that extra top rail at <=620px moves the heading to y=591 (1 px rounding difference), leaving the lower links and explicit collection views intact.
- Chromium screenshots plus read-only layout measurements (no test assertions or mutations) covered PublicProfile overview and Following at 320/393/600/620/621/720/768/1024/1440 px. At every width, document scrollWidth equaled viewport width. UK/EN 393 phone screenshots localized the Favorites heading and retained all six lower section links. Phone overview and guest network row screenshots were visually inspected; actual actor-specific More sheet remains unreviewed because this local browser session is a guest.
- `npm run build` PASS (Vite229 modules). Docker web image rebuilt/recreated with digest `sha256:5f9c335d9434d37fc30ea33b5b40847e253be195d0429965bbdf9cae3e6f496c`. API/DB/Redis/Mailpit remained running; no DB, `.env`, volume or account changes. No tests, typecheck, commit or push.

### Global Search phone Empty copy and geometry — 24.10.2026

- Compared local Figma phone frame `1480:8856` (393×852) with `/en/search?q=zzznomatchesrewind`. Updated UK/EN empty heading/helper copy to the mapped design and constrained the phone heading rail to 270 px so English breaks as “There were no matches” / “for your search term.” White Back to home CTA remains visible. Search input and category selector remain available for keyboard and pointer users; Figma's frame does not show the input, so this is retained as an explicit accessibility/design difference pending a better mapped interaction.
- Chromium manual viewport captures/read-only geometry at EN/UK393, EN320 and EN1440 showed no horizontal overflow. At EN393, heading measured x61.5/y357.8/w270/h53.75 and CTA y476.9/h32, close to the raw reference's two-line copy and CTA placement. No Playwright test runner or mutations were used.
- `npm run build` PASS (Vite229 modules); Docker web rebuilt and recreated with `--no-deps`, image digest `sha256:009f169af5818b8703532cf4a8655074c3023aae64e0908a3de79c89602f5b03`. API/DB/Redis/Mailpit stayed running. No DB volume, `.env`, account data, test files, commit or push changed.

### Global Search All phone / Films desktop frame review — 24.10.2026

- Compared raw `1480:8934` All phone top against the 393 px Docker route: hero end y187, input y120, match divider y220, first poster y267. Runtime layout matches; poster slots are 79×116. The mobile slider trigger focused the native category select. Query `film` returned 152 film/101 review rows from the local test-like database, so content parity is not claimed.
- Compared raw `1480:7256` Films desktop with `/en/search?q=Avatar&tab=films`: search field 400×44 at x520/y210, match control x120/y280/w1200, posters begin x120/y377 at 174×260 with 31 px gap. Runtime matched. Read-only Chromium widths 320/393/600/720/768/1024/1440 had document width equal to viewport.
- No code/data change in this frame review. Builds and Docker image evidence are recorded in the preceding entry; no tests or account/API mutations were made.

### Home guest phone frame review — 24.10.2026

- Compared raw `1411:3473` and Docker `/en/home`: 393×320 hero; H1 at x42.5/y106 with 308 px width; `Get Started` at x154/y239, 85×32; first live poster row x16/y368 with four 79×116 slots. Layout aligned at 393 px; EN320/393 and UK393 had no horizontal overflow. Current posters/feeds remain API-backed; local API contains test-like review/list content, so only layout is claimed.
- No code, API, DB or account data changed. Member Home `1327:3210` requires authenticated verification. No tests were written or run.

### Public Following responsive and keyboard review — 24.10.2026

- Read-only Docker Chromium review of `/uk/users/7748?view=following`; the local API returns test-like `social_race_...` data, so this is layout/interaction evidence only. At393px, heading and row start y123, row rail is361px, avatar40px, member link and guest Login/Follow link are44px high. At320px rail is288px.
- Captures at320/393/600/720/768/1024/1440 showed document scrollWidth equal to viewport width. Tab order moved through bottom navigation, Back, member link and login action; interactive targets were44px. Guest state intentionally has no More trigger. Authenticated More sheet and focus return remain open.
- No code, API, DB or account data changed. Build and tests were not run; no user-state mutation was performed.

### Person frame responsive review — 24.10.2026

- The earlier Docker capture below was stale and has been superseded by the decoded raw nodes and current Vite/Chromium source preview. The full `decoded/nodeChanges.json` does contain the Person raw nodes; only a dedicated screenshot/focused subtree export is absent.
- Raw phone anchors are avatar y190, H1 y317, divider y534 and first poster x16/y582/79×116/radius10. At393px current runtime measures avatar x136.5/y190/120×120, H1 y317, section title y542 and poster x16/y582.2/79×116. Desktop raw anchors are avatar y234, H1 y511, divider y992 and poster x120/y1092/174×260/radius20; runtime at1440 measures x457.5/y234/265×265, H1 y511 and poster x120/y1091.9/174.2×260.2. No horizontal overflow at320/393/600/720/768/1024/1440.
- `npm run verify:build` passed TypeScript and Vite (229 modules). Local API data are test-like, so evidence covers layout/responsiveness only; other Person frames and the unavailable Films Produced feed remain open. No tests, API, DB, account data or Docker were changed.

### Public List information sheet responsive/focus review — 24.10.2026

- Read-only Docker Chromium review of `/en/lists/public/19606`; local list title/tag are test-like, so evidence is limited to layout and interaction. At393px the sheet was361px wide and showed owner, likes, tags and Done. Opening focused Done; Escape closed it and restored focus to the `List information` trigger.
- Captures320/393/600/720/768/1024/1440 had document width equal to viewport. Existing route/actions were preserved; no like or other mutation was activated.
- No code, API, DB or account data changed. Build and tests were not run.

### Service/About responsive width review — 24.10.2026

- Read-only Docker Chromium navigations covered `/en/{help,contact,rules,privacy,film-data,delete-account,about}` at320/393/600/720/768/1024/1440 px. At all captures `documentElement.scrollWidth` equaled the viewport width. UK pages at393px displayed localized page headings for every route.
- Service navigation naturally changes from a mobile multi-row layout at <=620px, to tablet rail at721–1023px, to desktop side rail from1024px; the visible heading/nav bounds remained within the viewport. This is responsive/overflow evidence, not a fresh frame-by-frame body comparison or full focus/state review.
- No code, API, DB or account data changed. No test runner/build was run.

### Auth intermediate-width layout repair — 24.10.2026

- Manual Docker captures exposed a shared mobile CSS defect: at600px the form was83px wide and at720px it collapsed to0px because card padding used viewport width after the card was capped at393px. Changed the padding calculation to cap its input at the phone card width. On local Vite, Login/Register/Forgot were manually measured at320/393/394/500/600/720/721/768/1440: widths now268px at320,290px at393–720,627px from721; document width equals viewport on every capture. Login keyboard sequence at600 reaches Back, Email, Password, Forgot password and submit; no form was submitted. Matched per-route Figma screenshots are absent from the local archive, so no full frame parity claim.
- First `npm run verify:build` exposed pre-existing TypeScript errors in current Profile additions: RetryNotice call sites omitted required styling, one optional className was not string-safe, and an overview label comparison was unreachable. Added a ProfileListCard alert style, supplied Profile settings alert classes, and localized navigation labels directly. Second `npm run verify:build` passed TypeScript and Vite (229 modules).
- No Playwright tests/test files were written or run. No API, DB, `.env`, account data or Docker container changes. Figma MCP session for the exact Auth node was unavailable due reauthentication; current check used local implementation behavior and the existing frame mapping.

### Home guest feed and responsive rail follow-up — 24.10.2026

- Read live Figma phone frame `1411:3473`, its local full-size 393×2265 PNG export and archived raw hierarchy. Guest phone now renders new-film posters, feature card, review poster rail, popular review/list/reviewer sections and recent Journal in the frame order. The content stays sourced from existing APIs; nullable poster/avatar URLs keep fallbacks, reviewer counts render only when the current response supplies them, and the design’s static watched-total is omitted. New guest copy and More/register links have UK/EN translations.
- Manual Chrome viewport review at320/393/600/720/768/1024/1440 found no document overflow. At720–1024 the member poster rail previously widened the whole document; changing its overflow to an internal horizontal rail fixed the measured scroll width. Guest runtime comparison could not be completed because the available Chrome session stayed authenticated at both `localhost` and `127.0.0.1`; no logout or account mutation was attempted.
- `npm run verify:build` passed TypeScript and Vite (229 modules). No tests were written or run. No backend, API contract, DB, `.env`, or Docker container changed.

### Member Home phone frame follow-up — 24.10.2026

- Raw frame `1327:3210` is393×2463; hero320px, New posters y368, Popular posters y567, Latest News y726/y775 card, four review cards from y1009, Popular Lists y1760/y1800 and Recent News heading y2074. Live Figma Chrome selected the corresponding phone frame. Local member runtime at393 aligns first headings/posters within8–11px; mobile API Journal is currently empty, so the lower populated-feed geometry is not verified. Local mobile Journal cards are limited to the first result and Home requests four popular reviews as shown in the phone frame.
- Chrome responsive measurement (after the internal poster-rail overflow fix): document scroll width matched client width at320/393/600/720/768/1024/1440. `npm run verify:build` passed TypeScript/Vite (229 modules). Full Figma frame export did not complete; no tests or backend/API/DB/Docker changes.

### Authenticated Public Following More sheet — 24.10.2026

- Read-only Chrome view `/en/users/7748?view=following` at393×852. Opened the populated row’s More sheet; visible actions are Follow, Block, Go to member and Done. Done receives initial focus; Tab wraps to Follow and Shift+Tab wraps to Done; Escape closes and returns focus to the More trigger. No follow/block action was selected. Content is test-like local data; evidence covers sheet layout and keyboard focus only.
- Viewport was restored to default. No tests, build, API/DB mutation or Docker action in this substep.

### Public Followers empty phone view — 24.10.2026

- Read-only Chrome capture at393×852 showed the phone toolbar and localized Followers empty message; heading at y122 and section at y123. `documentElement.scrollWidth` equaled `clientWidth` (378 CSS px; viewport includes the 15 px classic scrollbar). This is a local empty state only, with no matching Figma screenshot or populated/paginated response evidence.

### Public Following subtitle copy — 24.10.2026

- Compared Figma phone frame `1023:3020` directly in the open Figma Chrome canvas with local `/en/users/7748?view=following`. The frame places follower/following counts on the row's second line with English copy `{followers} followers, following {following}`. Updated `UserFollowRow` to use the same order with API-sourced counts and a separately localized Ukrainian phrase. No data or API contract changed.
- `npm run verify:build` passed TypeScript and Vite (229 modules). After restarting the stopped Vite process, Chrome EN393 rendered `1 follower, following 0`; UK393 rendered `Підписників: 1 · Підписок: 0` from the local API response. Values are test-like local data; no mutation was performed. Figma MCP session creation returned `UNAUTHORIZED`/reauthentication required; the visible live canvas and existing mapping supplied the reference instead.
- No tests were written or run. Docker and DB were not modified.
- Contract review confirms `/api/users/{id}/followers` and `/following` return identity-only `PublicUserResponse`; count values exist on protected `/follow-status`. The subtitle is shown only after that authorized request. Guest rows retain the handle, since adding per-row requests would be an N+1 pattern and no public-count contract was approved.

### PublicProfile source preview — 24.10.2026

- Used an isolated headless Chromium page against the current Vite source preview at `127.0.0.1:5173`; did not run the test runner or change application/backend data. UK PublicProfile overview `825:1378` at393 px measured H1 y317 and Favorites y591, matching the raw frame y317/y590 within1px. Widths320/393/600/720/768/1024/1440 had document width equal to viewport.
- Guest Following phone `1023:4597` source view had a display-name-only row and no fabricated count/handle. Across320/393/600/720 the row was288/361/568/672px wide, with 44px-high member and Follow links; desktop widths768/1024/1440 had 50px follow targets and no document overflow. UK/EN guest routes loaded.
- A transient DOM-only long-name stress inspection at320/393/600/720 wrapped the row name (row heights85/68/65/65px), preserved the44px Follow target and produced no horizontal overflow. This checks CSS layout only; the synthetic name did not verify a real API displayName or its computed accessible label. Page reloaded afterward, restoring original content.
- Keyboard Tab traversal at393 px reached bottom navigation, Back, member link and Follow, each with a visible computed outline; member/action controls were44px high. The long-name run did not persist and no mutation was made.
- The older `localhost:3000` Docker page showed a handle line that is absent from the current Vite source. Treat Docker as a stale visual build for this comparison; do not claim current source parity from that container until the final planned rebuild. Docker, DB, `.env`, API data and volumes were not changed.
- `npm run verify:build` passed earlier in this worktree (TypeScript + Vite,229 modules). No tests were written or run. Figma MCP remains `UNAUTHORIZED`; the local archive lacks a PublicProfile/network PNG and focused subtree, so this evidence is geometry/runtime review, not exact screenshot parity.

### PublicProfile collection source review — 24.10.2026

- Opened `/uk/users/7748?view=collection&collection=watched` at393px: current API returned its real empty state; collection filter was expanded without any data mutation. Watchlist had one API-backed movie; its poster URL rendered the existing initial fallback, so this local item does not prove populated-poster parity with Figma.
- Phone filter is a localized horizontal `tablist`. ArrowRight from Watched selected Watchlist, preserved focus on the selected tab, and updated the URL to `collection=watchlist`. Width review at320/393/600/720/768/1024/1440 kept `documentElement.scrollWidth === innerWidth`; the selected collection remained URL-backed. Runtime data is test-like and its empty/populated composition differs by viewport/data, so frame content parity remains open.
- No API/DB change or tests. This extends the current-source Vite review; it does not update Docker or replace required authenticated own-Profile/settings checks.

### Desktop Profile network row — 24.10.2026

- Read raw Figma `363:411` subtree and selected matching live canvas. Text nodes confirm name 24px/27px and subtitle 18px/20px; avatar stack is80px with110px row pitch; follow action frame is50×50 with34×34 icon. Updated shared `profileNetwork` CSS to these measurements and preserved phone 40px avatars/44px targets.
- `npm run verify:build` passed TypeScript and Vite (229 modules). Chrome1440 visually inspected the updated populated public Following row. Own Profile Following is empty in the local DB; public fixture is test-like geometry evidence only.
- Reference metrics for Watched/Lists/Likes are absent from `PublicUserResponse`, so they remain unrendered. No tests, API/DB mutations or Docker rebuilds were performed.

### Profile network subtitle variants — 24.10.2026

- Reused the existing `getFollowStatus` response cached by `FollowActionsContext` for authenticated row counts; removed the component's second per-member request. Relationship retry refreshes the count state as well.
- Rows without an available authorized count now omit the secondary line instead of showing a username fallback. This matches the no-count phone variants `1023:4597`/`1033:5458`; the populated authenticated `1023:3020` variant keeps the localized count line. Failed status loads retain an accessible retry message.
- `npm run verify:build` passed TypeScript and Vite (229 modules). Manual Chrome1440 review showed the populated row and `1 follower, following 0` using local test-like data; no action was activated. Tests, API/DB mutations and Docker changes were not performed.
- Opened live Figma canvas `1023:4597` at 393×852: visible rows contain a display name only and separate More and Follow actions; adjacent `1033:5681` shows the member sheet. Figma MCP `create_session` again returned reauthentication-required. The local archive contains no saved network screenshot, so this visual read confirms structure/actions but not pixel-level matching.

### PublicProfile live-frame/source-data check — 24.10.2026

- Reopened live Chrome Figma at `825:1378`; frame dimensions are393×2355 and the visible profile identity uses a member photo plus the name “Jeremy B.”
- The isolated Vite source preview `/uk/users/7748` loaded local API data with a generated test display name and `avatarUrl: null`, so `ResilientImage` correctly showed the initial-letter fallback. This identity cannot verify reference photo crop, actual API avatar rendering, or the long-name case.
- No app/API/DB mutations, tests or Docker rebuild. Keep avatar crop and long-name behavior as open checks until a stable profile fixture includes a real avatar URL; overall Figma parity remains unclaimed.

### Global Search phone All grid correction — 24.10.2026

- Live Figma `1480:8934` is a393×2801 frame. Existing raw/Chrome mapping sets the search hero end at y187, query input at y120, match row at y221, and four 79×116 poster slots at y267.
- Corrected the mobile All variant from the previous 100×149 horizontal carousel to a four-column grid. Manual Vite/Chromium captures at320/393/600/720/768/1024/1440 showed `scrollWidth === viewport width`; at393 poster bounds were x16/110/204/298, y267.3, 79×116. Local API result names/posters are test-like or unavailable, so this verifies layout only.
- `npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/DB mutations, Docker rebuild, commit or push.

### Shared Header/Footer manual capture — 24.10.2026

Manual Vite/Chromium EN1440 capture of `/en/home` compared against live Figma `251:612` and `251:625`: header height106px, logo x323.5/y33/184×30, nav x582.5/y26/412×44, search x1069.5/y26/47×44. Footer top x0/y3460.3; logo x143/y3523.3, social icons centered around x657/708/758 at relative y133, copyright x120 at relative y191. Account disclosure opened by Enter (`aria-expanded=true`); Escape closed it and restored focus to its trigger. Existing width captures at320/393/600/720/768/1024/1440 had no horizontal overflow. These are base desktop geometry/keyboard checks only; complete responsive/footer variants and exact vector/font parity remain open. No source changes or tests in this pass; Vite preview was stopped afterward.

### Shared navigation responsive widths — 24.10.2026

Read-only manual Chromium captures of `/en/help`, `/en/login`, and `/en/journal` at320/393/600/720/768/1024/1440 showed no horizontal document overflow on the loaded routes. On Help, footer height adapts from359px at320,303px at393,287px at600/720,256px at768, and265px at1024/1440 as its links wrap. On Login, footer is hidden through720px and visible from768px, matching its current route-specific CSS. Header switches from the64px mobile shell through720px to106px desktop/tablet shell at768px. Journal had no overflow where loaded, but its API content remained empty in this local session, so its footer position/content was not treated as visual proof. No code or test files changed; no tests were run.

### Own Profile phone alignment — 24.10.2026

Compared the saved frame PNG `896:1838` with an authenticated local Vite source preview using the existing browser session. The raw node landmarks are avatar x136/y190 at120×120, identity y317, metrics y427, content surface y496, tabs `896:2051` y531, and Favorite Films heading y606. The mobile CSS now sets the hero stage and metrics rhythm to those positions; current capture measured avatar x136.5/y190, identity y317, metrics y427, hero bottom y496, tabs y531, heading y607. Read-only width captures at320/393/600/720/721/768/1024/1440 had no horizontal overflow. Profile actions opened with Enter; Escape closed the menu and returned focus to its trigger. Local API content differs from the populated design frame and uses the existing initials fallback; unsupported bio/location and Figma-only counts were not fabricated. `npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/DB changes, or Docker rebuild.

### Own Following phone reference review — 24.10.2026

Re-read live Figma frames `1023:3020` and `1023:4597` and their local raw nodes. Both are393×852: centered `Following` title x165/y59/62×17, back/filter controls x16/x342 at y50/35×35, network content beginning y123, fixed bottom navigation y760×92. `1023:3020` includes relationship-count subtitles and `1023:4597` omits them. The authenticated local API currently has no Following rows, so it cannot verify populated row layout; existing code keeps the empty state and real API contract. No data was added or mutated, and no tests/Docker actions were run.

### Auth phone frame geometry — 24.10.2026

EN source-preview captures at393px manually compared with Figma Login `944:1582`, Register `944:1828`, and Forgot `944:1887`. Login landmarks: title y169, inputs y364/438 at290×45, Forgot y494, CTA y538 at290×56, social y670, footer y740. Register: two-line EN title y101, fields y290/364/438, CTA y538, social y670, footer y738. Forgot: title y351, description y392, input y464, CTA y539, divider y713, create link y740. Main landmarks are within about1px. Shorter UK Register title correctly fits one line and moves following controls upward. Login keyboard traversal reaches Back, both fields, Forgot, submit, and account link with visible focus. This is manual geometry/keyboard evidence, not a screenshot diff or test. The password-eye action is confirmed in the live Figma frame and implemented with accessible UK/EN labels; exact SVG/vector parity with Figma remains unverified because no local glyph export is available. Desktop, reset/error/loading/success variants remain open. No tests or data were changed.

Follow-up from the live frame: accessible show/hide password controls are implemented on Login and Register. `npm run verify:build` passed TypeScript/Vite; manual Chromium 393×852 confirmed the eye control inside the password input, keyboard reachability, and no horizontal overflow. The Login frame also has Remember me, but current backend always issues persistent cookies and has no session-only preference across refresh. Repository `AGENTS.md` says not to change backend contracts solely to imitate a frame, so no inert checkbox or backend migration is included. Earlier temporary Remember-me code was removed before any API request, DB change, or Docker update. Tests remain deferred.

### Forgot Password geometry follow-up — 24.10.2026

Manual source-preview screenshots at393×852 and1440px confirm the decorative lock and return controls are present and the phone layout has no horizontal overflow. At393px the lock is89×102 at x150/y213 by manual comparison with the live Figma frame; CSS was shifted2px left to align its center with the frame. Back is30×30 at x32/y52; title y351, description y392, email x52/y464 at290×45, submit y539 at290×56, divider y713 and create link y740. Desktop screenshot confirms the centered lock and desktop return control; full desktop content extends below this capture viewport. Figma node mapping is corrected in `FIGMA_HANDOFF`: Register/Forgot/Login/create-account nodes are distinguished, and `915:1774` is a reset button component rather than a full Reset page frame. `npm run verify:build` passed after this 2px CSS-only adjustment (typecheck + Vite, 229 modules). No tests, Docker, API or data changes.


### Lists catalog API/design audit — 24.10.2026

Read-only Figma PNG/raw 1480:4983 comparison found that design order is Featured → Popular this week → Recently liked → Crew lists → Popular tags. Runtime shows Featured → Popular → Recently liked → Recent → tags. The existing /team endpoint returns public lists by active HQ users and currently supplies Featured; there is no separate curated Featured or Crew contract. No UI/API change made because relabeling Recent or duplicating /team would invent semantics. The user approved preserving current feeds and documenting this design/API gap. Tests deferred; no API/data/Docker changes.

Movie Details mobile frame `560:1003`: source-preview Chrome at 393 px shows two API-backed Recent Reviews cards and a localized `All reviews` control. Expanding it reveals remaining items from the current API page plus its pagination; collapsing restores the two-card preview. Mouse and Enter keyboard interaction were checked, including accessible expanded/collapsed state. Code also shows the control when a page has only two cards but API pagination has more pages; that exact data shape was not available in the local fixture. This keeps the existing API contract and real content; the local initials avatar is used because the review response has no avatar URL. `npm run verify:build` passed after the conditional edge-case adjustment; manual mobile render and interaction were inspected. Tests remain deferred; no data/API/Docker changes.

Person poster ratio correction, 24.10.2026: decoded local raw nodes `545:707` and `725:1097` confirm desktop174×260/radius20 and phone79×116/radius10. This checkpoint is superseded by the later Person phone/desktop frame review. No tests, API/data/Docker changes.

Own Profile phone collection review, 24.10.2026: Figma canvas nodes `1015:3356` (Wants to see), `1015:4508` (Liked), and `1017:1841` (Lists) were read alongside local raw. In the authenticated Vite source preview, the 393 CSS-pixel canvas uses the exact shared hero landmarks: bottom y496, nav y531, collection section heading y608; the first Lists card is x16/y647/361×189 versus raw x16/y646/361×189. The current account has no Watchlist entries, one Favorite, and system Lists; populated Figma content therefore remains an API data variance. At a 393-wide viewport with the Windows classic scrollbar, `window.innerWidth=393` but layout `clientWidth=378`; previous `100vw` hero overflowed by15px. Changed mobile Profile hero sizing to include the page padding without `100vw`; the desktop full-bleed canvas keeps its full viewport composition while clipping at the layout edge. Read-only responsive checks found `scrollWidth === clientWidth` at CSS widths320/393/600/720/768/1024/1440. `npm run verify:build` PASS. No tests, API/data/Docker mutations, or commits.

Own Profile Reviews phone `1023:1867` follow-up, 24.10.2026: local source preview at393 CSS px shows heading y607 (raw y606) and the first review card x16/y647/361×208 (raw x16/y646/361×208). The local API returns one review, while the frame shows a second card; no review content was fabricated. This checks one populated geometry only; empty/error/retry and other review counts remain open. No tests or API/data changes.

Own Profile desktop hero `238:865` follow-up, 24.10.2026: live Figma canvas at16% showed a centered vertical avatar/name/metrics stack. The source preview at a1440px layout viewport previously placed flex children in one row; `.hero` now stacks them. Chrome measured the initials avatar x588/y274/265×265 versus raw frame x587/y274; phone content width393 retains avatar x137/y190, identity y317, metrics y427 and hero bottom y496. Read-only responsive viewport pass at320/393/600/720/768/1024/1440 reported no document horizontal overflow. A live screenshot of `1023:4597` at84% showed about65px row pitch; restored/retained the matching65px CSS after rejecting a stale handoff note claiming80px. `npm run verify:build` passed TypeScript and Vite (229 modules). No tests, API/data/Docker changes.

Profile Settings phone `1043:2125` follow-up, 24.10.2026: live Figma frame is393×1905. Source preview at a393px content width shows the settings title centered at y≈107, profile section interior x34/w325, and Avatar preview x34/y756/325×158. The username/display-name rows now have45px minimum pitch matching the handoff measurement; local email wraps within its read-only field. At320px content width the field interior is252px and the Avatar panel remains158px high; document width equals viewport content width at both sizes. The frame includes bio/location/pronoun/reply and upload/OAuth controls without current API contracts; they remain documented gaps. `npm run verify:build` passed TypeScript and Vite (229 modules). No tests/API/data/Docker changes.

24.10.2026 Settings phone toolbar: localized Cancel / Settings / Save controls target only the active existing form; Profile Save changes display name only. Avatar and social links retain separate save actions. `npm run verify:build` passed (TypeScript + Vite, 229 modules). Tests and Docker smoke remain deferred per active redesign plan.
Manual Settings source preview (Vite): at393 and320 CSS px the toolbar title centers near y107, content starts at y147, and document scrollWidth equals clientWidth. At320 the labels scale to14px with visible gaps. Local profile content used read-only; no form was submitted. Final TypeScript/Vite build passed (229 modules); no tests were run.

### Global Search Films phone manual review — 24.10.2026

Local Figma PNG/raw for `1480:8594` compared with a Vite preview using a real local API response (`q=the`, six films). At393px the first poster row is x16/110/204/298, y267, 79×116; second row begins y402. Category Select is x217/y222/160×32, and a keyboard ArrowDown changed `films` to `users` and updated the URL while keeping focus. EN/UK labels were checked. Read-only widths320/393/600/720/768/1024/1440 all had `scrollWidth === clientWidth`; at320 poster slots scale to60.8×89.2, while desktop1440 has six 174.2×260.2 columns. API titles/posters differ from the static Dune design data, so this confirms layout and behavior only. No source changes, tests, build, Docker, API mutations or DB changes in this pass.

### Global Search Lists phone manual review — 24.10.2026

Local raw frame `1480:8804` defines a results group at x16/y267/361×402 with two361×189 cards at y267 and480, 24 px vertical gap. Each card has a322×116 five-poster preview (79×116 items offset61px). Vite source preview on local API data measured card rectangles x16/y267/361×189.25 and x16/y480.25/361×189.25; preview is325×116.7. The API returned one preview film per list, so only the real poster renders. Keyboard focus followed by Enter opened `/en/lists/public/10434`, showing its API title and no overflow. Widths320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The local archive has no Search Lists frame PNG and Figma MCP session creation returned UNAUTHORIZED/re-authentication required; five-poster visual comparison remains open. No source changes, tests, build, Docker, API mutations or DB changes.

### Global Search Tags phone manual review — 24.10.2026

Local raw `1480:8767` gives a361×32 search input at x16/y120, match rail x16/y222, and tag rows beginning y267; seven Figma pills have31px height and wrap across three design rows. Vite preview used the real API query `e2e` (four long `e2e-tag-*` results): pills measure146.8×31 and wrap into two rows at393px/four rows at320px. EN/UK category text was inspected; a focused tag activated with Enter and loaded its localized public-list route. Widths320/393/600/720/768/1024/1440 had no horizontal overflow. The source archive has no Tags frame PNG and Figma MCP returned re-authentication required; different API text explains the row-count difference, and screenshot parity remains open. No source changes, tests, build, Docker, API mutations or DB changes.
PublicProfile source preview: `npm run verify:build` passed (TypeScript + Vite, 229 modules). Manual overview and populated Following widths320/393/600/720/768/1024/1440: document `scrollWidth` equals `clientWidth` after retaining full-bleed hero and clipping page overflow. At393 the one real local Following row is x16/y123/346×65. Public Followers remains empty in this local API account, so populated pagination is not evidenced. No tests or Docker changes.

### PublicProfile desktop canvas review — 24.10.2026

Live Figma canvas `238:596` was inspected alongside the Vite/Chromium preview at1440px. Runtime anchors: hero1440×1020; centered avatar/fallback x587.5/y274/265×265; profile navigation x120/y1105/1200×79; first content rail x120/y1269/1200px. Hero, centered identity/metrics, full-width navigation and section sequence visually match the frame structure. Responsive read-only capture at320/393/600/720/768/1024/1440 retains `scrollWidth === clientWidth`. The local API has no profile avatar/favorite posters and returns test-like activity; image and populated-content parity remain unverified. No focused desktop subtree/PNG exists, so this is a visual composition review, not a pixel-perfect claim. No code, API, DB, Docker or tests changed.

### PublicProfile populated Followers row — 24.10.2026

Read-only API lookup found one existing public network relation: user7749 has follower7748. At393px the guest `?view=followers` row measures x16/y123/361×65, with40px avatar and44px follow target; at1440px it measures x120/y1421/1200×110, with80px avatar and50px action. Width review320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The API page has one record, so pagination is not evidenced. The local Chrome session is a guest (`GET /api/users/me` returned401); authenticated own-profile variants remain inaccessible in this session. No login, data mutation, source change, build, test or Docker action was performed.

Journal desktop hero follow-up, 24.10.2026: Reopened live Figma frame `1494:5387` (1440×3561) and current Vite source at1440px. UK pill measured x120/y132/147×42; the content rail begins x120/y212 and spans1200px. Responsive source review at320/393/600/720/768/1024/1440 had `scrollWidth === clientWidth`. The local API returns zero articles and zero archive entries, so this evidence covers the title, shell, empty state and rail start only; populated feature/card imagery and row rhythm remain open. No code, API, data, Docker or test changes.

### ReviewDetails desktop composition — 24.10.2026

Frame `1480:6826` follows the mapped desktop hero: poster275×411 at x120/y538, title58px at x450/y601, action card251×170 at x1069/y653, and copy in a581px column. Follow-up corrected the liked-members section to its raw landmarks: surface y1215, divider y1300, heading y1318, avatars80×80 at y1400 with86px pitch, footer y1640. Poster/action radii and trailer sizing were aligned too. Phone/tablet rules were not changed. Manual geometry review at1440 and no-overflow review at320/393/600/720/768/1024; `npm run verify:build` passed (TypeScript + Vite,229 modules). Local API content is test-like and poster/backdrop URLs are null, so evidence covers structure/layout only. Empty-liker state and populated production imagery remain open. No tests, API/data/Docker changes.

### ReviewDetails phone populated composition — 24.10.2026

Compared frame `1480:9249` with a browser-only fixture built from the local Figma text and metadata. Before adjustment the author and review copy were5px low and the liked-members section was32px low; a hard-coded grid row was creating excess vertical track space. Removed that explicit row, tightened the mobile metadata-to-author spacing and moved the liker rail into the content flow. At393×932, author is x156/y323, review copy x156/y351.5, trailer x16/y434/120×30, liked surface y678.7, heading x16/y721.7, and first avatar x16/y762.4/40×40, matching the Figma anchors within1px. The liker row's side padding no longer offsets the avatars; its keyboard focus outline remains visible. Manual source review at320/393/600/720/768/1024/1440 found no horizontal overflow. The intercepted fixture did not change app data. `npm run verify:build` PASS (typecheck + Vite,229 modules); tests, API, Docker and database were not changed in this pass. Populated production imagery and empty-liker behavior remain open.

### Home guest phone feed follow-up — 24.10.2026

Clean guest source-preview capture was compared with Figma `1411:3473`. At393px, Popular Reviews starts at y993 and the single visible API-backed review card is x16/y1033.5/361×168; Popular Lists starts at y1244.5. Recent News starts at y1891.7 while the local Journal API is empty (raw frame y1876), so that lower section's populated geometry remains unverified. The phone guest feed now shows one review card; desktop and authenticated member layout remain unchanged. Manual Chromium widths320/393/600/680/681/720/768/1024/1440 had no horizontal overflow; UK route opened. `npm run verify:build` passed (TypeScript + Vite, 229 modules). No tests, Docker/API/DB changes.

### Own Profile network mobile empty state — 24.10.2026

Live canvas frame `1023:3020` is the populated own Following variant at393×852: its first rows begin y123, the Back/filter visuals are35px circles, and fixed bottom navigation begins y760/h92. On the authenticated local account, `/uk/profile?view=followers` returns zero rows. Current-source preview at393px measured the empty message x16/y123/361×23, Back target x16/y50/44×44, and navigation x0/y760/393×92; the same route in English at320px had empty message x16/y123/288×23.2. Both widths had `scrollWidth === clientWidth`; Back keyboard focus shows a visible outline. Mobile Films/network toolbar now paints the Figma-sized35px circles inside44px hit targets; filter button remains operable and exposes the existing collection tabs. `npm run verify:build` PASS (TypeScript + Vite,229 modules). No tests were run, and no API/database records or Docker state changed. The account has0 Followers, so populated own follower rows/pagination remain unverified.


**User Lists phone populated rail — 24.10.2026.** Frame `1480:9606` підтверджує 79×116 posters, 161px row pitch та 36px remove/reorder actions; на393px runtime bounds: rail x34, row343×116, poster79×116, action group78px. На320px row лишається у viewport без horizontal overflow. Mobile reorder handle підтримує ArrowUp/ArrowDown і викликає чинний reorder endpoint; ручний огляд на ephemeral API fixture не змінював БД. Live Figma Prototype inspector для frame не містить заданих interactions, тож metadata sheet trigger не встановлений.
pm run verify:build PASS; жодні тести не запускалися.
### Global Search filter target — 24.10.2026

- Source: local read-only Figma raw frame `1480:8934` and its 393×2801 PNG. Back and Filter background layers measure35×35px at y50; UI controls retain44×44px target areas.
- Change: mobile Filter background now paints a35px circle inside its existing44px button. Keyboard focus outline and native category-select focus behavior remain in the same control.
- Verification: `npm run verify:build` PASS (TypeScript and Vite; 229 modules). CSS preserves the44×44px control and focus outline while its centered radial background matches the raw35×35px Figma layer. The available browser was at desktop width, where the mobile control is hidden, so a Chrome mobile screenshot remains pending. Figma MCP connection currently requires reauthentication. No tests run.
