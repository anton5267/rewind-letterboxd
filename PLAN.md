# Rewind — план завершення

### Поточний Figma checkpoint — власний Profile mobile shell

- Raw frame `896:1838` підтверджує, що на телефоні власний профіль використовує contextual hero без верхнього logo/menu header: controls мають 44×44 px і починаються на y=48, а avatar — 120×120 px на y=190. `Header` тепер приховує лише desktop/mobile logo та menu для `/profile`, залишаючи bottom navigation доступною; `Profile.module.css` задає full-bleed identity stage, виміряні controls/avatar bounds і не змінює API-backed sections/forms.
- Profile variants `122:176`, `175:619`, `363:289`, `363:411`, `153:180` і `175:177` мають спільний five-tab rail `Profile / Films / Watchlist / Likes / Lists`. Runtime rail тепер використовує ці п’ять локалізованих destinations; Ratings, Reviews і Following залишаються нижче як API-backed sections, без вигаданих endpoints.
- `profile-alignment.spec.ts` тепер перевіряє shell bounds і five-tab rail на 393 px разом із UK/EN, collection switching, retry, legacy posters, focus і no-overflow: **10/10** після Docker web rebuild. `npm run verify:build` — PASS, 218 modules.

Наступний блок: перевірити окремі Films/Lists/Reviews/Following/Watchlist/Likes raw variants і звірити їх із наявними API-backed Profile/PublicProfile sections, не додаючи вигаданих endpoint’ів.

### Контрактний gap — Admin reported/edit variants

- Raw frames `1389:3464`, `1343:3799`, `1319:5033`, `1317:4617`, `1315:4313`, `1342:4028`, `1390:3326`, `1319:5889`, `1342:3273`, `1342:3470` і `1343:4118` описують reported lists/comments/reviews, edit forms, complaints, block/delete/resolved states та history of changes.
- Поточні `admin.api.ts` і backend admin controllers мають moderation hide/unhide, list visibility/delete, movie/review/comment actions та audit logs, але не мають report/complaint entities, list/comment/review report endpoints, edit-history contracts чи block/resolution mutations. UI для цих frames не додається на підставі статичних Figma текстів; спочатку потрібен погоджений backend contract.

### Поточний Figma checkpoint — PublicProfile desktop

- Raw frames `238:596`, `122:176` і `175:619` уточнили desktop geometry: full-bleed hero 1440×1020, avatar 265×265, identity title 58 px, section headings 24 px, profile rail 1200×79 і six-column poster cards 174×260 із 31 px gap. Runtime `PublicProfile.module.css` тепер використовує ці виміряні значення на ширинах від 1024 px; mobile rules і API states не змінювалися.
- Додано `public-profile-desktop-figma.spec.ts`; разом із `public-profile-design-flow.spec.ts` targeted run пройшов **2/2** після Docker web rebuild. Наступними залишаються окремі Profile variants, Service/About і Admin reported/edit frames.

### Наступний checkpoint — власний Profile desktop

- Raw `363:289`/`363:411` підтвердили той самий editorial shell для власного профілю: 1020 px identity stage, 265 px avatar, 58 px name, 1200×79 navigation rail і 174×260 poster slots. `Profile.module.css` тепер має desktop-only rules та переносить rail перед overview через CSS order, не змінюючи API, форми чи mobile layout.
- Назви й роки карток залишені видимими для живого API та keyboard contract. `profile-alignment.spec.ts` після Docker rebuild пройшов **10/10**; наступний крок — Profile edit/avatar variants та Service/About raw frames.

### Поточний checkpoint — About desktop

- Raw frame `1011:1915` підтвердив 1440×818 hero, 58 px title, 24 px intro, 1200 px content rail і перший editorial heading на y=713. `About.module.css` тепер має full-bleed desktop hero та overlap content rail, збережено локалізований текст, TMDB attribution і mobile no-overflow.
- Додано `about-figma.spec.ts`; після Docker rebuild він пройшов **1/1** на 1440 і 393 px. Наступними залишаються Service/About variants `1162:*`/`1176:*` та Admin reported/edit frames.

### Поточний checkpoint — Service editorial variants

- Raw frames `1062:1993`, `1122:2497`, `1162:2193`, `1162:2305`, `1164:2398`, `1164:2679`, `1164:2790`, `1176:2515` підтвердили спільний 1440×818 hero, 58 px title, 24 px lead і 1200 px editorial rail. Help, Contact, Rules, Privacy, Film Data та Account Deletion тепер рендерять route-specific секції з відповідною кількістю рядків, розділювачами й локалізованим текстом; API не змінювався.
- `service-pages-responsive.spec.ts` розширено: desktop rail geometry, кількість секцій, UK/EN і 393 px no-overflow пройшли **3/3** після Docker web rebuild. Наступний блок — Auth/Journal та решта доступних Figma variants.

### Поточний checkpoint — Journal feed desktop

- Raw frames `604:967`, `604:1074`, `604:1172`, `604:1275`, `604:1380` та `1494:5387`/`1494:5182`/`1494:5287` підтвердили спільний full-bleed hero 1440×818 і перший feature cover 513×612 на x=120/y=212. Desktop feature text починається на x=748, а наступні editorial covers мають rail x=120, 444×408 і крок близько 576 px (y=995, 1571). `Journal.module.css` тепер має ці stage/row geometry; API articles, archive, category select, pagination, UK/EN і phone layout не замінювалися статичними Figma fixtures.
- `journal-design-flow.spec.ts` перевіряє hero/feature/row geometry, article route та 393 px no-overflow: **2/2** після Docker web rebuild. Наступним залишаються Journal archive/newsletter variants і Admin reported/edit frames.

### Regression checkpoint — 22.10.2026

- GitHub `CI / verify (push)` для `d703d63` зелений: backend, frontend build/typecheck і HTTPS proxy checks пройшли.
- Локальний повний frontend запуск: **128 passed, 2 failed, 12 skipped із 142**. Два failures — відомі Community retry сценарії в незакоміченій користувацькій `frontend/src/context/FollowActionsContext.tsx`; 12 skips — admin fixture сценарії без локального fixture. Усі інші Journal/Auth/Profile/PublicProfile/Service/Admin доступні сценарії пройшли.
- Backend повторено з Compose MySQL через `DB_URL=jdbc:mysql://127.0.0.1:3307/...` і пароль із локального середовища: **87 passed, 0 failures/errors/skips**. `.env`, база й користувацькі dirty files не змінювалися.

Оновлено 22.10.2026. Після Search/CI checkpoint розпочато повний node-by-node Figma audit: кожен наступний UI-блок реалізується тільки після перевірки конкретного frame context і screenshot, а не за припущеннями. Завершені блоки цього проходу: Popular Reviewers desktop/phone `1480:5486`/`1480:7698`, Community desktop/phone `605:1112`/`1517:4931`, Journal Lists 4/5/6 desktop `1494:5387`/`1494:5182`/`1494:5287`, Home desktop guest/member `1413:6471`/`1413:6263`, mobile guest/member `1411:3473`/`1327:3210`, Popular Lists desktop/mobile `1480:5390`/`1480:7927` і Public Profile desktop/phone `238:596`/`825:1378`. Після повторного raw-node review Home guest hero скориговано до 1440×844 і 393×320, з 58/24 px заголовком та Figma-підтвердженою mobile CTA; member hero та API-backed rows збережено. Глобальна навігація також приведена до raw Figma Group 26 (1440×106) і Navigation (393×92). Для Journal підтверджено editorial hero і three-column article rows; Lists 5/6 є alternate static-content variants і не замінюють API. Для Popular Lists — frame-specific heroes, cards, controls і pagination; для Public Profile — центрований desktop identity hero, state rail, mobile avatar/name geometry та live anchors. Auth mobile family `944:1582`/`944:1828`/`944:1887` тепер має окремий 393 px canvas, back control, безпечний tab order і локалізований sign-in footer. Figma frame `361:778` для 404 доданий як локалізований routed state з error-композицією, кнопкою повернення та no-overflow перевіркою. Наступний блок обирається лише після concrete-node review.

## Виконано

- Figma Design copy `BDO9GO1oscOeUTcu4VXVKA` доступна через plugin; для реалізації використані metadata, context, screenshots і assets конкретних nodes.
- Доведені Journal article, desktop/mobile Auth, Service/About, Admin dashboard і desktop/mobile PublicProfile structure. Декоративний `⋯` у JournalArticle прибрано.
- Service desktop `1062:1993` повторно звірений: full-bleed 818 px hero, centered title/lead і alternating information rows застосовані спільно до Help, Contact, Rules, Privacy, Film Data та Account Deletion; responsive route suite 1/1.
- Admin Dashboard `1178:2466`/settings `1404:4076` повторно звірені: desktop hero/workspace тепер має 1020 px Figma geometry і 272 px avatar; API-backed admin sections не змінювалися.
- Auth `605:2173–2176` і mobile `944:1582`/`944:1828`/`944:1887` повторно звірені по raw node geometry: desktop forms мають 627 px поля, 94 px inputs, 89 px actions і Figma card heights; phone canvas має 393×852, back x32/y52, 290 px fields та окремі Login/Register/Forgot vertical anchors. Додано видимий `Or` divider без зміни reset API. `auth-responsive.spec.ts`, password-validation і completion-focus разом пройшли 12/12.
- Home guest `1413:6471`/`1411:3473` повторно звірений без старої 764/142 px гіпотези: raw Figma має 1440×844 desktop artwork і 393×320 phone artwork, із заголовком SF Pro Display Bold 58/24 px у координатах 335/42 × 706/106. Desktop keeps the artwork-only composition; phone keeps the raw 85×32 `Get Started` control at x154/y239. Runtime зберігає локальний artwork, live release/list data та header registration path. `home-list-cards.spec.ts` пройшов 3/3 після Docker web rebuild.
- Global navigation raw review: Figma Group 26 is 1440×106 on desktop and the mobile Navigation instance is 393×92. `Header.module.css` now uses 106 px desktop header and a 92 px boxed mobile bottom navigation; the existing responsive menu, contextual transparent headers, focus return and route semantics remain unchanged. `editorial-layout.spec.ts --grep "header stays readable"` passed 2/2 after Docker rebuild.
- Home member feed labels now follow the raw mobile frame: `Popular on Rewind`, `Latest news`, `Popular reviews this week` and `Popular Lists`, with UK/EN translation keys and the same live API sections. `home-list-cards.spec.ts` passed 3/3 after the rebuilt Docker web image.
- Public Profile phone `825:1378` raw geometry is now explicit: contextual back/search controls start at y=50, the 120 px avatar is centered at y=190, and the 26 px name follows at y=317. The global mobile header is hidden on this route so it cannot cover the frame; long display names remain wrapped without horizontal overflow. `public-profile-design-flow.spec.ts` passed 1/1 and `route-transition.spec.ts` passed 8/8.
- Admin dashboard `1178:2466` raw descendants confirm a 1200 px workspace rail at x=120 and 365 px metric cards arranged in three columns. Runtime now uses the 1200 px desktop shell, 28 px inner metric padding and three-column cards with Figma-height 233 px while keeping all six live API counters. `service-pages-responsive.spec.ts` passed 2/2 after Docker rebuild.
- Admin Settings `1404:4076` raw geometry confirms a 1200×734 workspace with 38 px radius. The desktop settings panel now uses that shell, 41 px rounded inputs and a three-column field grid while preserving the four real API keys and save/retry behavior. `service-pages-responsive.spec.ts` passed 2/2 after the Docker rebuild.
- Admin User List frames `1218:2982`/`1260:3404` confirm the centered title, 402 px search group and 1200 px table rail. The live `AdminUsers` section now uses that desktop shell while retaining row actions, pagination, profile details and API-backed empty/loading/error states; `service-pages-responsive.spec.ts` passed 2/2 after Docker rebuild.
- Admin User Profile `1237:4369` raw descendants confirm a 1200×829 detail card and two 516×501 history/activity cards. The selected-user panel now follows those desktop rails with centered header, wide detail card and 501 px overview cards while preserving live profile actions and focus return; `service-pages-responsive.spec.ts` passed 2/2 after Docker rebuild.
- Admin Reviews `1310:3108` raw descendants confirm translucent 1200 px review cards with 38 px radius, a 417 px editorial text column, 84 px card rhythm and 429 px minimum card height. `AdminReviews` now exposes that two-column card layout with live rating, visibility state and moderation action; UK/EN filter and API states remain intact. `service-pages-responsive.spec.ts` passed 2/2 after rebuilding the Docker web image.
- Admin Comments `1342:3589` raw descendants confirm the same 1200 px translucent rail with 38 px cards, 417 px text column, 84 px rhythm and 249 px minimum comment cards. `AdminComments` now follows that shell with live author/content, visibility state and moderation action; API states and localization remain intact. `service-pages-responsive.spec.ts` passed 2/2 after rebuilding the Docker web image.
- Admin Lists `1344:5249` raw descendants confirm 1200 px translucent cards with 38 px radius, 417 px text column, 84 px rhythm and 393/364 px content states. `AdminLists` now follows that two-column shell with live owner/items/visibility and list actions; API, confirmation and localization remain intact. `service-pages-responsive.spec.ts` passed 2/2 after rebuilding the Docker web image.
- Admin Moderation `1399:3300` raw descendants confirm a single 1200×673 moderation workspace. `AdminModerationQueue` now uses that translucent rounded shell with its live filter form, selection, bulk hide and queue states preserved. `service-pages-responsive.spec.ts` passed 2/2 after rebuilding the Docker web image.
- Admin Moderator Logs `1404:3804` raw descendants confirm 1200 px translucent audit cards with 38 px radius, 348 px lead state, 293 px follow-up rows and 84 px rhythm. `AdminAuditLogs` now follows those card rails with localized audit actions and pagination preserved. `service-pages-responsive.spec.ts` passed 2/2 after rebuilding the Docker web image.
- Auth artwork збережено локально в `frontend/src/assets/figma/`; тимчасових Figma URL у runtime-коді немає.
- Home/Search, Lists, Movie, Review, Profile, Community, Messages і Notifications зберігають реальні API, UK/EN, loading/error/empty/retry, клавіатуру й focus management.
- Lists landing має Figma-композицію без дубльованого feed rail під hero; усі чотири feed-и доступні через section-level `View all` links, а локалізований hero і API-backed секції збережені.
- Global Search на телефонах має шість локалізованих швидких переходів із frame `1480:8432`; list cards і tag wrapping звірені з `1480:8804` та `1480:8767`. Tag search `1480:6898`/`1480:8527` додатково звірений: mobile title/count order and poster rail now match the frame; desktop asset parity remains open until Figma quota returns. Додатковий reference `1480:6217` підтвердив 160 px ширину mobile show-results control; native select збережено для keyboard/URL semantics і вирівняно до цієї геометрії.
- Global Search phone frame `1480:8594` додатково звірений: mobile hero slider trigger тепер фокусує той самий native category select; targeted alignment suite пройшов 4/4 після Docker web rebuild.
- Journal search frames `1480:7549`/`1480:8889` уточнені: desktop article grid має близько 20 px Figma column gap, phone article cards зберігають 361×149 cover rail, 20 px radius, live API content і native category semantics. `global-search-alignment.spec.ts` пройшов 4/4 у UK/EN після Docker web rebuild.
- Journal Article `844:1547` повторно звірено по raw nodes: API-backed сторінка тепер має 909 px hero frame, заголовок до 58 px, метадані над cover rail 1126×642 і окремий dark content block із відступом 251 px, без вигаданого автора чи статичного Figma-тексту. `journal-design-flow.spec.ts` перевіряє desktop bounds і no-overflow; audio, retry, language fallback та API contract збережені.
- Films frames `1413:12611` (1440 px), `1480:9187` (393 px) і variant `1480:7843` тепер звірені по геометрії: desktop posters 174×260 із 31 px row gap і 20 px radius; phone rail має 79×116 posters, 15 px gaps і 10 px radius, локальний hero asset та компактний `Year › Rating › Genre` control. Mobile Films header прозорий і не перекриває frame; keyboard-safe filter behavior, URL, native selects і API contract збережені. Після Docker web rebuild `search-controls.spec.ts` пройшов 9/9, `detail-header.spec.ts` — 3/3, а `editorial-layout.spec.ts --grep "header stays readable"` — 2/2.
- Власний Profile mobile frame `896:1838` повторно звірений по raw subtree: hero отримав 44 px gear/more controls, а Favorite Films, Recent Activity і Recent Reviews тепер мають реальні API-backed стани; меню має Escape/outside close і повернення фокуса. `profile-alignment.spec.ts` пройшов 10/10 після Docker web rebuild.
- User Lists mobile frames `1480:9542`/`1480:9606` уточнено: existing `/films` add flow тепер має localized mobile search-style `Add a film` control з 44 px target, а в редакторі дія стоїть між description і tags як у metadata sheet; desktop Browse films label, API і keyboard order збережені. `list-owner-flow.spec.ts` пройшов 2/2 після Docker web rebuild.
- Public Lists follow-up: mobile tagged poster rail clip-иться в 138 px container, щоб не перекривати title link; desktop feed toolbar залишено доступним для back/filter flow; landing frames `1480:4983`/`1480:8280` більше не показують дубльований feed rail під hero, а section-level `View all` links зберігають навігацію до всіх feed-ів. `list-discovery-controls.spec.ts` 4/4 пройшов після Docker web rebuild.
- Movie Details desktop frames `39:2`/`61:244` тепер підтверджені inventory та canvas; застосовано full-bleed dark hero, poster/content geometry, Rating/Cast sections і dark similar/review rails. Mobile contract лишився окремо перевіреним.
- Person/Actor desktop `545:676`/`551:705` підтверджений inventory та canvas; застосовано centered identity hero, 265 px avatar і 1200 px six-column filmography rail. Separate produced feed потребує API, тому не вигаданий.
- Person/Actor phone `721:1085` підтверджений inventory та browser preview; застосовано 120 px avatar, компактний back/filter toolbar, 465 px hero і чотириколонкову poster grid. Sort/genre filters лишилися доступними через mobile control; `producer-flow.spec.ts` 2/2.
- GitHub Actions переведені на актуальні Node 24 based majors: `checkout@v7`, `setup-java@v6`, `setup-node@v7`; runner зафіксовано на `ubuntu-24.04`, щоб прибрати migration annotation для `ubuntu-latest`.
- `verify-admin-browser.ps1` читає Compose project label із `docker inspect` JSON і працює у Windows PowerShell 5.1.
- Локальні `api` і `web` images перебудовані; основний DB volume та `.env` збережені.

## Актуальні перевірки

- `npm run verify:build`: PASS, TypeScript + Vite, 218 modules.
- Journal Article targeted regression: **5/5 passed** across article language/audio accessibility and Figma frame geometry after rebuilding the Docker web image. The full frontend baseline remains 123 passed, 2 known Community retry failures, 12 admin skips because of the unrelated dirty context file.
- Playwright: latest full local run **123 passed, 2 failures, 12 skips** across 137 scenarios; `scripts/verify-admin-browser.ps1` then passed **12/12** with cleanup. The two remaining standard-run failures are isolated to the user's uncommitted `FollowActionsContext.tsx` change; Films, Journal Search, detail header, route-transition and Public Lists guard targeted checks are green.
- Backend: **87/87 passed**, failures/errors/skips 0, ізольована MySQL 8.4.
- PASS: API, contracts, security, password reset, Redis cache, HTTP concurrency, load, ER schema, backup/restore, production template config, Caddy та Compose config.

Точні результати й межі доказу — у [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md), Figma mappings — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md).

## Доставка

- Guest Home raw geometry correction: commit `22d4b78`; [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39723605654) PASS.
- Shared navigation geometry: commit `84e4167`; [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39724012017) PASS.
- Home feed label alignment: commit `c56242a`; [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39724308023) PASS. Full local frontend regression after these changes: 123 passed, 2 known Community retry failures from the user's uncommitted `FollowActionsContext.tsx`, 12 admin skips covered by the browser wrapper.
- Journal Article Figma geometry: commit `d68eeec`; [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39725805058) PASS. Public Profile phone geometry: commit `8ce4419`; [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39726412078) PASS.
- UI/assets/harness: commit `33f8082`.
- Локальні release results: commit `f48713a`.
- [GitHub CI / verify для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s.
- Search/CI maintenance: commit `ea037f0`, [CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s; runner pin/docs commit `0b22904`, [CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s.
- Auth mobile cleanup: commit `42b8e3b`, [CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275), 1m52s; backend, frontend build/typecheck і Caddy validation зелені.
- Latest regression evidence: commit `00f9f43`, [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39707346272); only release documentation changed, and unrelated local files remained unstaged.
- Admin browser wrapper: `scripts/verify-admin-browser.ps1` passed 12/12 with a disposable fixture and cleanup.
- Global Search Figma alignment: commit `cda3126`, [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409); mobile slider trigger now focuses the native category select, targeted alignment 4/4.
- Profile mobile hero/activity: commit `115bd45` adds Figma-aligned gear/more controls and the existing `/users/:id/activity` feed to own Profile; targeted `profile-alignment.spec.ts` 10/10 and `npm run verify:build` PASS. GitHub CI run `39710281853` is green.
- User Lists mobile add-film alignment: commit `b2511f1` adds the localized search-style mobile control for frames `1480:9542`/`1480:9606`; build and `list-owner-flow.spec.ts` 2/2 PASS. [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39711299541) is green.
- Public Lists catalog landing alignment: commit `2d40abc` removes the duplicate landing feed rail while preserving section-level feed links; `list-discovery-controls.spec.ts` 4/4 and `npm run verify:build` PASS. [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39719191200) is green.
- Public Lists journey regression update: commit `04723b8` moves the cross-locale tag → list → author → movie guard to the Figma landing's section-level `View all` flow; targeted list/public guards passed 10/10. [GitHub CI / verify](https://github.com/anton5267/rewind-letterboxd/actions/runs/39720126166) is green.
- Diploma artifacts і локальний `AGENTS.md` залишилися поза commits.

## Поза цією ціллю

- Production VPS, домен, TLS, SMTP/TMDB secrets, monitoring і реальний restore drill на сервері.
- Публікація погодженого Journal-контенту. Код лишається API-backed; Figma-тексти не підміняють production data.
- Загальна pixel-perfect заява для всіх 250+ top-level Figma frames. У документації фіксуються лише перевірені конкретні frames; автоматична та browser-регресія підтверджує поведінку всіх реалізованих маршрутів.

## Межі безпеки роботи

Не змінювати diploma video artifacts, локальний `AGENTS.md`, бази, backups, `.env`, Figma raw references і кеші. Backend змінювати лише за підтвердженим функціональним дефектом; migrations не переписувати. Public routes й API залишаються сумісними; `ProfileReview.moviePhotoUrl` nullable.

### Featured Lists desktop/mobile follow-up — 22.10.2026

- Raw frame `1480:5839` підтверджує 1440×3565 canvas, content start y=572, 1200 px rail та три poster-led cards 326×249 із 112 px gaps.
- `PublicLists` має окремий `teamFeed` contract для Featured Lists: desktop hero/card rhythm відповідає raw bounds, а mobile зберігає один стовпець і full-bleed hero без горизонтального overflow.
- Live `/api/lists/public/team`, UK/EN, loading/error/empty/retry, links і keyboard semantics не змінені.
- `public-lists-featured-figma.spec.ts` пройшов **2/2**; `npm run verify:build` PASS (218 modules) після Docker web rebuild.

### Popular Lists desktop/mobile follow-up — 22.10.2026

- Raw frames `1480:5390` and `1480:7927` підтверджують 1200 px desktop rail, 1200×339 editorial rows від y=813 та phone rail x=16..377 із 361 px cards, 323×116 poster strips і 12 px row rhythm.
- `PublicLists.module.css` тепер вирівнює feed shell, heading/card y-rhythm і compact poster rail для `feed=popular`; API, sort/filter links, UK/EN і keyboard semantics збережено.
- `public-lists-popular-figma.spec.ts` разом із Featured Lists suite пройшов **4/4** після Docker web rebuild; `npm run verify:build` PASS.

### Public List detail desktop/mobile follow-up — 22.10.2026

- Raw frames `1480:6071` / `1480:6134` and phone `1480:9302` / `1480:9353` підтверджують 818 px detail hero, 1200 px desktop rail, 174×260 six-column posters та 361 px phone rail із 79×116 four-poster rows.
- `PublicList` тепер відповідає цим bounds, зберігаючи live detail/like/tag API, information dialog, focus return, contextual navigation та locale behavior.
- `public-list-detail-figma.spec.ts` і `list-mobile-header.spec.ts` пройшли **14/14**; `npm run verify:build` PASS (218 modules).
### Наступний raw-блок — Popular Reviews `1480:4880` (22.10.2026)

- Перечитано локальний raw subtree: desktop hero 1440×486, content rail 1200 px від x=120, reviewer group 1200×180, avatars 80×80, review cards 1200×315 з poster slot 175×262 і 38 px card rhythm.
- `PopularReviews.module.css` тепер має окремий desktop contract для цих bounds; mobile правила, API, UK/EN, loading/error/empty/retry і keyboard links збережено.
- Додано контрольний `popular-reviews-figma.spec.ts`: desktop bounds і phone no-overflow, **2/2 passed** після Docker web rebuild.
- Наступний raw audit: вибрати наступний видимий frame з конкретним route/API контрактом; reported/edit admin variants залишаються documented contract gap.
### PublicProfile mobile long-name follow-up — 22.10.2026

- Raw frame `825:1378` підтверджує identity rail x=16..377 (361 px), avatar 120×120 на x=136.5/y=190 і title anchor y=317.
- `PublicProfile.module.css` обмежує mobile identity copy 361 px і зберігає anywhere wrapping для довгих display names; API, actions, localization і contextual header не змінені.
- `public-profile-design-flow.spec.ts` тепер перевіряє bounds довгого title та avatar після повторного route load; разом із desktop suite пройшло **2/2**.

### Global Search desktop all-results follow-up — 22.10.2026

- Raw frame `1480:6991` confirms a 1440 px desktop canvas, 1200 px rail, film row x=120/y=377 with six 174×260 posters, and review cards x=120/y=692 sized 1200×315 with 175×262 poster slots.
- Desktop `GlobalSearch` keeps category controls keyboard-accessible in the DOM while removing the duplicate visual tab/section bands, places film metadata over the poster rail, and matches the review card rhythm. Live search API, localization and mobile behavior remain unchanged.
- `global-search-desktop-figma.spec.ts` plus `global-search-alignment.spec.ts` passed **5/5** after Docker web rebuild; `npm run verify:build` passed (218 modules).

### Global Search desktop empty-state follow-up — 22.10.2026

- Raw frame `1480:5809` confirms the no-match card at x=450/y=377 with 540×166 bounds beneath the shared matches heading.
- Desktop empty state now uses that centered 540×166 shell; its localized copy and Back to home link remain live and keyboard-accessible, while phone empty-state rules stay unchanged.
- `global-search-desktop-figma.spec.ts` now covers both all-results and no-match variants; the suite passed **2/2** after Docker web rebuild.

### Global Search desktop lists-tab follow-up — 22.10.2026

- Raw frame `1480:7490` confirms two 1200×339 editorial list cards at y=377 and y=754, with a 446×260 five-poster preview at x=154/y=421 and a 66 px body gap.
- The desktop lists tab now uses measured 339 px cards, 38 px row rhythm, 20 px radius and the existing real list preview/description data; navigation, localization, keyboard tabs and mobile rules remain unchanged.
- `global-search-desktop-figma.spec.ts` plus `global-search-alignment.spec.ts` passed **7/7**; `npm run verify:build` PASS (218 modules).
