# Rewind — поточний стан

## Останній Figma checkpoint — власний Profile mobile shell

- Raw `896:1838` повторно підтверджено: mobile `/profile` має full-bleed identity hero без верхнього logo/menu header, 44×44 gear/more controls на y=48 і centered 120×120 avatar на y=190. Додано route-specific `mobileProfile` header state; bottom navigation, API data, localization, forms і focus behavior збережені.
- Raw variants `122:176`, `175:619`, `363:289`, `363:411`, `153:180` і `175:177` додатково підтвердили five-tab rail `Profile / Films / Watchlist / Likes / Lists`; rail now switches the existing watched/watchlist/favorites API-backed collection states while Ratings/Reviews/Following sections remain available below.
- `profile-alignment.spec.ts` розширено geometry і five-tab collection-switch assertions для 393 px; після `docker compose build web`/`up -d web` targeted suite пройшов **10/10**, `npm run verify:build` — PASS (218 modules).

Наступний конкретний audit — окремі raw Profile variants Films/Lists/Reviews/Following/Watchlist/Likes і їхня відповідність доступним API-backed sections.

### Виявлений контрактний gap — Admin reported/edit variants

Raw frames `1389:3464`, `1343:3799`, `1319:5033`, `1317:4617`, `1315:4313`, `1342:4028`, `1390:3326`, `1319:5889`, `1342:3273`, `1342:3470` і `1343:4118` потребують report/complaint records, edit history, block/delete/resolved mutations. У `admin.api.ts` та backend немає відповідних endpoints/entities; наявні moderation hide/unhide і audit APIs не є сумісним контрактом. Цей UI gap залишено явно зафіксованим, без вигаданих кнопок, даних чи API.

## Останній Figma checkpoint — PublicProfile desktop

- Raw frames `238:596`, `122:176` і `175:619` перевірені по descendants: desktop hero має 1440×1020, avatar 265×265, identity title 58 px, section headings 24 px, profile rail 1200×79, а poster grid — шість колонок 174×260 із 31 px gap. `PublicProfile.module.css` тепер має ці desktop rules від 1024 px; mobile Figma geometry, API-backed content, localization і focus behavior збережені.
- Додано `frontend/tests/e2e/public-profile-desktop-figma.spec.ts`. Після `docker compose build web` і `docker compose up -d web` targeted `public-profile-design-flow.spec.ts` + desktop geometry suite пройшли **2/2**; `npm run verify:build` — PASS, 218 modules.

## Наступний checkpoint — власний Profile desktop

- Raw frames `363:289`/`363:411` підтвердили власний profile shell: 1020 px identity stage, 265 px avatar, 58 px identity name, 1200×79 profile rail і 174×260 poster slots. `Profile.module.css` отримав desktop-only geometry від 1024 px; CSS order ставить rail перед overview, а API-backed sections/forms та mobile rules залишаються без зміни.
- Видимі назви й роки collection cards збережені для accessibility та keyboard contract. Після Docker web rebuild `profile-alignment.spec.ts` пройшов **10/10**, включно з UK/EN, retry, legacy posters, focus і no-overflow; desktop geometry assertions додані у цей suite.

## Поточний checkpoint — About desktop

- Raw frame `1011:1915` перевірений по descendants: 1440×818 hero, 58 px title, 24 px intro, 1200 px content rail і перший editorial heading на y=713. `About.module.css` тепер має desktop full-bleed hero та overlap content rail; локалізований copy, TMDB attribution і mobile no-overflow залишилися.
- Додано `frontend/tests/e2e/about-figma.spec.ts`. Після Docker web rebuild geometry/no-overflow test пройшов **1/1** на 1440 і 393 px; `npm run verify:build` — PASS, 218 modules.

## Поточний checkpoint — Service editorial variants

- Raw service frames `1062:1993`, `1122:2497`, `1162:2193`, `1162:2305`, `1164:2398`, `1164:2679`, `1164:2790` і `1176:2515` підтвердили 818 px full-bleed hero, 58 px title, 24 px lead, 1200 px rail і alternating editorial rows. `ServicePage` тепер має route-specific Help, Contact, Rules, Privacy, Film Data та Account Deletion секції з локалізованим UK/EN copy; API та existing navigation не змінювалися.
- `service-pages-responsive.spec.ts` після Docker web rebuild пройшов **3/3**: hero/nav, desktop section rail/counts і mobile 393 px no-overflow.
- Паралельно виправлено позиціонування кнопки Close в admin user detail: вона тепер відноситься до detail header, тому fixed header не перехоплює клік під час focus-return сценарію. `editorial-accessibility.spec.ts --grep "admin user detail"` після Docker rebuild — **1/1**.

## Поточний checkpoint — Journal feed desktop

- Raw Journal frames `604:967`, `604:1074`, `604:1172`, `604:1275`, `604:1380` і `1494:5387`/`1494:5182`/`1494:5287` підтвердили full-bleed 1440×818 hero, 513×612 feature cover на x=120/y=212, feature text rail x=748 та наступні 444×408 covers із кроком близько 576 px. Runtime зберігає API-backed articles, archive, category filtering, pagination, audio/link semantics і mobile layout; Figma static content не підміняє production data.
- Після Docker web rebuild `journal-design-flow.spec.ts` пройшов **2/2**, включно з 1440 hero/row geometry і 393 no-overflow.

## Regression checkpoint — 22.10.2026

- Push `d703d63` має зелений GitHub `CI / verify (push)`.
- Повний frontend regression: **128 passed, 2 failed, 12 skipped із 142**. Обидва failures належать до відомої незакоміченої користувацької `FollowActionsContext.tsx`; skips — admin fixture сценарії без локального fixture. Решта доступних UI сценаріїв пройшла.
- Повний backend regression у правильному Compose MySQL профілі: **87 passed, 0 failures/errors/skips**. Перший host-запуск із порожнім `DB_PASSWORD` не є кодовим результатом; повторний запуск використовував локальний Compose port 3307 і пройшов повністю.

Оновлено 22.10.2026. Основний release checkpoint і Search/CI maintenance етап доставлені в GitHub; після них розпочато повний Figma audit по конкретних nodes. Завершений Popular Reviewers `1480:5486`/`1480:7698` має реальні reviewer metrics, desktop/mobile geometry, повні 127 browser-сценарії та 87 backend-тестів. Community `605:1112`/`1517:4931` переведений на Figma hero, featured/popular rails і member-list composition; справжні API profiles та follow interactions збережені. Home desktops `1413:6471` (guest) і `1413:6263` (member) отримали перевірені local original artworks, hero geometry, typography й member poster rows. Після повторного raw-node review guest Home виправлено до 1440×844 desktop і 393×320 mobile hero з 58/24 px заголовками; невизначені decorative CTA elements прибрано, а live API sections збережено. Mobile guest `1411:3473` та member `1327:3210` мають власні Figma heroes, чотири справжні poster previews і порядок API-backed секцій. Popular Lists `1480:5390`/`1480:7927` тепер має окремі desktop/mobile hero, контекстні controls, Figma-sized poster cards і pagination з реальними API lists. Auth mobile family `944:1582`/`944:1828`/`944:1887` перевірена на 393×852, включно з Back, standalone canvas, sign-in footer і tab-order. 404 frame `361:778` тепер доступний як локалізований route state з no-overflow перевіркою на 320/393/768/1440 px. Робочий порядок — [PLAN](../../PLAN.md), детальні результати — [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Структура та документація

- Backend розташований у `backend/`, frontend — у `frontend/`; Compose, CI, Caddy та scripts використовують актуальні шляхи.
- Документація зведена до навігаційних guides без дублювання вимог. Raw Figma references, backups, secrets і generated evidence залишаються поза Git.
- Кореневий `.gitignore` тепер ігнорує лише `/figma/`, тому потрібні runtime assets у `frontend/src/assets/figma/` можуть бути доставлені.

## Реалізація

- Movie, Review, Home/Search, Lists, Profile/PublicProfile, Community, Messages і Notifications мають responsive стани, UK/EN, клавіатурну навігацію та реальні API. PublicProfile `238:596`/`825:1378` повторно звірений: desktop отримав центрований identity hero і state rail, phone має 120 px avatar, 26 px name, 44 px controls і safe wrapping довгих імен. Оригінальний desktop photographic asset ще очікує доступу Figma quota.
- Guest Home raw geometry correction: `1413:6471` показує 1440×844 artwork, а `1411:3473` — 393×320 artwork; заголовок має 58 px desktop/24 px phone і розміщений по центру в x335/y706 та x42/y106. `frontend/src/pages/Home.module.css` та `home-list-cards.spec.ts` тепер перевіряють ці bounds після Docker rebuild; API data flow і mobile header navigation не змінені.
- Global navigation raw geometry correction: desktop Figma Group 26 має 1440×106, а mobile Navigation instance — 393×92. `Header.module.css` тепер використовує 106 px desktop header і 92 px boxed bottom navigation на phone; contextual transparent headers, menu focus trap і route semantics збережені. `editorial-layout.spec.ts --grep "header stays readable"` пройшов 2/2 після Docker rebuild.
- Home member section labels now match `1327:3210`: `Popular on Rewind`, `Latest news`, `Popular reviews this week` and `Popular Lists` have dedicated UK/EN keys; existing API loading, error, empty and retry states are unchanged. `home-list-cards.spec.ts` пройшов 3/3.
- Public Profile phone `825:1378` повторно звірено: contextual toolbar має y=50, avatar 120×120 — y=190, ім'я — y=317; global mobile header приховується лише на `/users/:id`, а bottom navigation та profile API лишаються. Довге display name переноситься без overflow. `public-profile-design-flow.spec.ts` 1/1 і `route-transition.spec.ts` 8/8 зелені.
- Admin dashboard `1178:2466` додатково розібрано по raw descendants: workspace x=120/width=1200, metric cards мають три колонки, 28 px inner inset і 233 px height. Runtime зберігає шість реальних API counters, але тепер рендерить їх у Figma-подібному rail. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Settings `1404:4076` перевірено по raw geometry: workspace 1200×734, radius 38 px, inputs 41 px. Runtime використовує desktop shell і триколонкову сітку для чотирьох реальних API settings, без вигаданих Figma-полів; save/retry та mobile contract збережені. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin User List `1218:2982`/`1260:3404` повторно звірено: title centered, search group 402 px, data rail 1200 px. `AdminUsers` отримав цей desktop shell без зміни live actions, pagination, profile details і state handling. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin User Profile `1237:4369` перевірено по raw geometry: selected profile card 1200×829, history/activity cards 516×501. Detail panel тепер має centered header і ці desktop rails, а API actions, overview data, Escape/focus return залишилися. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Reviews `1310:3108` перевірено по raw geometry: translucent review cards 1200 px wide, radius 38 px, 417 px text column, 84 px rhythm і мінімум 429 px висоти. Live review cards тепер мають окремі identity/text та rating/moderation колонки; API, visibility filter, UK/EN і keyboard actions збережені. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Comments `1342:3589` перевірено по raw geometry: translucent cards 1200 px wide, radius 38 px, 417 px text column, 84 px rhythm і мінімум 249 px висоти. Live comment cards тепер мають окремі author/content та visibility/moderation колонки; API, filter, UK/EN і keyboard actions збережені. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Lists `1344:5249` перевірено по raw geometry: translucent cards 1200 px wide, radius 38 px, 417 px text column, 84 px rhythm і 393/364 px content states. Live list cards тепер мають окремі owner/items та visibility/actions колонки; API, confirmation, UK/EN і keyboard actions збережені. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Moderation `1399:3300` перевірено по raw geometry: єдиний translucent workspace 1200×673 з radius 38 px. Queue тепер має цей desktop shell для live filters, selection, bulk hide та retry/loading states; API й accessibility збережені. `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Admin Moderator Logs `1404:3804` перевірено по raw geometry: translucent audit cards 1200 px wide, radius 38 px, lead height 348 px, follow-up rows 293 px і 84 px rhythm. Audit actions, локалізація та pagination збережені; `service-pages-responsive.spec.ts` пройшов 2/2 після Docker rebuild.
- Старі profile reviews отримують nullable `moviePhotoUrl`; frontend сумісний і з попередньою відповіддю API.
- Journal зберігає API-backed feed/archive/article/audio/newsletter. У mobile article прибрано декоративний control без дії. List 4 desktop `1494:5387` повторно звірено через Figma screenshot/context: compact hero та editorial 3-column rows застосовано до реальних статей без заміни їх Figma fixtures.
- Journal Article `844:1547` додатково перевірено по raw node geometry: hero frame має 909 px, title target — 58 px, cover rail — 1126×642, а content block починається на 909 px із 251 px editorial inset. Runtime залишається API-backed: одна `coverUrl` використовується як реальне зображення, Figma static collage/author text не підміняють production data. `journal-design-flow.spec.ts` і `editorial-accessibility.spec.ts` разом пройшли 5/5 після Docker web rebuild.
- Login/Register/Forgot/Reset використовують спільну desktop/mobile Figma-композицію з локальними assets.
- Auth frames `605:2173–2176`, `944:1582`, `944:1828` і `944:1887` повторно звірені по raw geometry: desktop 627 px form width, 94 px fields, 89 px actions і route-specific card heights; phone 393×852 має back x32/y52, 290 px controls та окремі Login/Register/Forgot anchors. Forgot отримав Figma `Or` divider, а API, password validation і keyboard flow не змінені. `auth-responsive.spec.ts` + password-validation + completion-focus пройшли 12/12.
- Help, Contact, Rules, Privacy, Film Data, Account Deletion та About отримали структуровані responsive layouts.
- Service desktop `1062:1993` повторно звірений через Figma screenshot/raw geometry: hero збільшено до 818 px, title/lead центровано, detail cards переведено у широкі alternating editorial rows; `service-pages-responsive.spec.ts` пройшов 1/1 для всіх шести service routes.
- Admin dashboard отримав Figma hero/workspace/metrics, зберіг усі users/movies/reviews/comments/lists/moderation/activity/audit/settings actions.
- Lists landing відповідає catalog frames `1480:4983`/`1480:8280`: feed rail під hero прибраний, а чотири API-backed feed-и залишені доступними через section-level `View all` links; локалізований hero, loading/error/empty states і keyboard semantics збережені.
- Global Search отримав mobile shortcuts із шістьма реальними routes, а list/tag results — Figma-aligned poster stack і перенесення тегів без horizontal overflow. Додатковий mobile reference `1480:6217` звірений по raw hierarchy: show-results native select має 160 px trigger geometry без втрати keyboard/URL semantics.
- Global Search phone `1480:8594` тепер має Figma slider trigger у hero; він фокусує native `Show results for` select і не додає окремого API чи дубльованої навігації. `global-search-alignment.spec.ts` після rebuild web пройшов 4/4.
- Journal search `1480:7549`/`1480:8889` повторно звірений: desktop article columns отримали 20 px Figma gap, phone article cover rail має 361×149 і 20 px radius, а category select, live API content та overflow behavior залишилися доступними. `global-search-alignment.spec.ts` пройшов 4/4 для UK/EN.
- Films frames `1413:12611`/`1480:9187`/`1480:7843` звірені по raw geometry і browser canvas: desktop 174×260 posters із 31 px row gap/20 px radius, phone 79×116 із 15 px gaps/10 px radius, локальний hero asset і `Year › Rating › Genre` summary. Mobile Films header прозорий, filter open/close повертає фокус, URL/native selects/API залишилися без breaking changes. Після Docker web rebuild `search-controls.spec.ts` пройшов 9/9, `detail-header.spec.ts` — 3/3, `editorial-layout.spec.ts --grep "header stays readable"` — 2/2.
- Власний Profile mobile `896:1838` отримав Figma-aligned 44 px gear/more controls у hero та Recent Activity з уже наявного social API. Gear прокручує до форми даних профілю, more відкриває редагування або logout; activity має loading/error/empty/retry, локалізацію і pagination. `profile-alignment.spec.ts` пройшов 10/10 після Docker web rebuild.
- User Lists mobile `1480:9542`/`1480:9606` отримав Figma-подібний localized search-style `Add a film` control: у metadata editor він стоїть між description і tags, перед item rail веде до існуючого `/films` flow; desktop label, API і keyboard order не змінені. `list-owner-flow.spec.ts` пройшов 2/2 після Docker web rebuild.
- Public Lists follow-up прибрав mobile tagged-card hit-area overlap: compact poster stack тепер обрізається в 138 px Figma rail, desktop feed зберігає доступний back/filter toolbar, а landing більше не має дубльованої feed navigation під hero. `list-discovery-controls.spec.ts` 4/4 пройшов після Docker web rebuild; `public-guards.spec.ts` 6/6, release matrix 1/1 і WCAG axe 1/1 залишилися зеленими.
- Tag search mobile `1480:8527` повторно звірений у Figma: заголовок і кількість тепер стоять над poster rail, картка має 16 px radius і 138 px poster area; targeted list discovery tests 3/3 passed.
- Movie Details desktop `39:2`/`61:244` знайдені в локальному Figma inventory й повторно відкриті в canvas: застосовано dark full-bleed hero, 811 px backdrop, 275 px poster, desktop Rating/Cast rails і dark six-column content rail; targeted Movie Details tests 5/5 passed.
- Person desktop `545:676` перевірений у canvas та inventory: hero став full-bleed із 265 px centered avatar, а filmography отримала 1200 px six-column rail; API-backed single feed збережено без вигаданого Films Produced.
- Person phone `721:1085` звірений із локальним inventory та browser preview: додано 120 px centered avatar, compact back/filter toolbar, 465 px identity hero і four-column poster grid; sort/genre controls відкриваються через mobile Filters. `producer-flow.spec.ts` пройшов 2/2.
- Admin Dashboard `1178:2466`/settings `1404:4076` повторно звірені по raw geometry: desktop identity/workspace hero збільшено до 1020 px із 272 px avatar; existing admin tables and settings remain API-backed. `service-pages-responsive.spec.ts` admin geometry check пройшов.
- Auth mobile `944:1582`/`944:1828` повторно звірений у Chrome: Login/Register/Forgot/Reset family отримала standalone canvas, 24 px back control, hidden global mobile header/nav/footer, Figma sign-in footer and 393 px no-overflow contract. `auth-responsive.spec.ts` пройшов 1/1; desktop route structure не змінено.
- Для mobile Auth footer залишено лише порожній landmark без прихованих focusable links; `release-responsive-matrix.spec.ts` після цього пройшов 1/1 на 320/393/768/1440 px.
- CI використовує `ubuntu-24.04`, `actions/checkout@v7`, `actions/setup-java@v6` і `actions/setup-node@v7`, прибираючи Node 20/deprecated action та runner migration warnings.
- Admin browser wrapper більше не залежить від ламкого Docker Go-template quoting у Windows PowerShell 5.1.

## Перевірка 21.10.2026

| Gate | Результат |
| --- | --- |
| Frontend typecheck/build | PASS; 218 modules |
| Playwright | Latest local full run **123 passed, 2 failures, 12 skips** across 137 scenarios; disposable admin wrapper then passed **12/12**. Both remaining standard-run failures are caused by the user's uncommitted `FollowActionsContext.tsx` change. Journal Article targeted suite passed **5/5** after the latest Docker rebuild; Films, Journal Search, detail header, route-transition and Public Lists guard targeted checks are green. Movie Details WCAG axe rerun 1/1 after contrast fix. |
| Backend Maven | Historical release checkpoint **87 tests**; latest 22.10.2026 local Compose-MySQL run **89 passed**, 0 failures/errors/skips |
| Local Docker | API health 200, web 200; images перебудовані зі збереженням DB/`.env` |
| API/contracts/security/reset | PASS |
| Redis/concurrency/load/schema | PASS; 38 tables, 55 foreign keys |
| Backup/restore | PASS в окремій тимчасовій schema, cleanup виконано |
| Production template/Caddy/Compose | PASS |
| GitHub CI | [PASS для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972), 1m53s |

Search/CI maintenance commit `ea037f0`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s. Runner pin/docs commit `0b22904`: [GitHub CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s. Runs підтвердили 87 backend-тестів, frontend typecheck/build, Caddy, нові action majors і `ubuntu-24.04`.

Auth mobile footer cleanup commit `42b8e3b`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275), 1m52s. Backend tests, frontend build/typecheck і Caddy validation зелені.

Latest regression evidence commit `5e449af`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39706799280). The push contains documentation only; no unrelated local files were staged.

User Lists mobile add-film alignment commit `b2511f1`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39711299541). The change preserves the existing `/films` route and list API.

Public Lists catalog landing alignment commit `2d40abc`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39719191200). The duplicate landing feed rail was removed while section-level feed links, API content and localization remained intact; `list-discovery-controls.spec.ts` passed 4/4.

Public Lists journey regression update commit `04723b8`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39720126166). The cross-locale tag → list → author → movie guard now follows section-level `View all`; list/public guard targeted coverage passed 10/10.

Admin wrapper rerun: `scripts/verify-admin-browser.ps1` passed 12/12 and cleaned its disposable fixture; no database volume or `.env` changes were made.

Admin gate evidence commit `00f9f43`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39707346272).

Global Search Figma alignment commit `cda3126`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409); mobile slider trigger and native category focus verified by `global-search-alignment.spec.ts` 4/4.

Перший full browser run виявив два дефекти Lists: втрачений локалізований hero text і приховану feed navigation. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Наступний Search run додав 2 двомовні сценарії. Targeted Global Search дав 4/4; повний standard run — 115 passed із 12 очікуваними admin skips, окремий wrapper — 12/12, разом усі 127 унікальних сценаріїв без skips. Перший запуск wrapper виявив quoting-дефект до створення fixture; після JSON fix сценарії пройшли, fixture видалено.

Current Figma audit commits are pushed in order: `22d4b78` (guest Home raw hero, CI run [39723605654](https://github.com/anton5267/rewind-letterboxd/actions/runs/39723605654)), `84e4167` (shared navigation, CI run [39724012017](https://github.com/anton5267/rewind-letterboxd/actions/runs/39724012017)) and `c56242a` (Home feed labels, CI run [39724308023](https://github.com/anton5267/rewind-letterboxd/actions/runs/39724308023)); all are green. The latest local full frontend run is 123 passed, 2 known Community retry failures from the user's uncommitted `FollowActionsContext.tsx`, and 12 admin skips covered by the browser wrapper.

## Figma

Plugin читає структуру, screenshots, assets, variables і context конкретних вузлів design copy `BDO9GO1oscOeUTcu4VXVKA`. Додатково перевірені Search phone `1480:8432`, lists `1480:8804` і tags `1480:8767`; раніше використані Journal article `844:1547`, Auth, Help `1062:1993`, About `1011:1915` і Admin dashboard `1178:2466`. Повний mapping і чесні межі точності — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).

## Зовнішні залежності

Production VPS/domain/TLS, SMTP/TMDB credentials, monitoring, server restore drill і погоджений Journal content залишаються окремою інфраструктурною фазою. Вони не блокують завершення коду та локальної регресії.
### Popular Reviews raw alignment — 22.10.2026

Raw frame `1480:4880` was re-read from the local Figma archive. The desktop route now uses the measured 486 px hero, 1200 px content rail at x=120, 1200×180 popular-reviewer group with 80 px avatars, and 1200×315 review cards with 175×262 poster slots. The runtime still renders live `/users/popular-reviewers` and `/reviews/popular` data, localized links and all loading/error/empty/retry states; no Figma fixture text or new endpoint was added. `popular-reviews-figma.spec.ts` passed **2/2** at 1440 and 393 px after rebuilding the web container; `npm run verify:build` passed with 218 modules.
