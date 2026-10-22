# Rewind — план завершення

Оновлено 22.10.2026. Після Search/CI checkpoint розпочато повний node-by-node Figma audit: кожен наступний UI-блок реалізується тільки після перевірки конкретного frame context і screenshot, а не за припущеннями. Завершені блоки цього проходу: Popular Reviewers desktop/phone `1480:5486`/`1480:7698`, Community desktop/phone `605:1112`/`1517:4931`, Journal Lists 4/5/6 desktop `1494:5387`/`1494:5182`/`1494:5287`, Home desktop guest/member `1413:6471`/`1413:6263`, mobile guest/member `1411:3473`/`1327:3210`, Popular Lists desktop/mobile `1480:5390`/`1480:7927` і Public Profile desktop/phone `238:596`/`825:1378`. Для Journal підтверджено editorial hero і three-column article rows; Lists 5/6 є alternate static-content variants і не замінюють API. Для Home — локальні original artworks, hero/CTA geometry та live API-backed poster rows; для Popular Lists — frame-specific heroes, cards, controls і pagination; для Public Profile — центрований desktop identity hero, state rail, mobile avatar/name geometry та live anchors. Auth mobile family `944:1582`/`944:1828`/`944:1887` тепер має окремий 393 px canvas, back control, безпечний tab order і локалізований sign-in footer. Figma frame `361:778` для 404 доданий як локалізований routed state з error-композицією, кнопкою повернення та no-overflow перевіркою. Наступний блок обирається лише після concrete-node review.

## Виконано

- Figma Design copy `BDO9GO1oscOeUTcu4VXVKA` доступна через plugin; для реалізації використані metadata, context, screenshots і assets конкретних nodes.
- Доведені Journal article, desktop/mobile Auth, Service/About, Admin dashboard і desktop/mobile PublicProfile structure. Декоративний `⋯` у JournalArticle прибрано.
- Service desktop `1062:1993` повторно звірений: full-bleed 818 px hero, centered title/lead і alternating information rows застосовані спільно до Help, Contact, Rules, Privacy, Film Data та Account Deletion; responsive route suite 1/1.
- Admin Dashboard `1178:2466`/settings `1404:4076` повторно звірені: desktop hero/workspace тепер має 1020 px Figma geometry і 272 px avatar; API-backed admin sections не змінювалися.
- Auth mobile `944:1582`/`944:1828` повторно звірений у browser preview: login/register/reset family тепер використовує standalone canvas із back-кнопкою, без глобальної mobile navigation, а Login має Figma sign-in footer; desktop header/footer та API/auth contracts збережені. `auth-responsive.spec.ts` пройшов 1/1.
- Auth artwork збережено локально в `frontend/src/assets/figma/`; тимчасових Figma URL у runtime-коді немає.
- Home/Search, Lists, Movie, Review, Profile, Community, Messages і Notifications зберігають реальні API, UK/EN, loading/error/empty/retry, клавіатуру й focus management.
- Lists landing знову має доступну feed navigation і локалізований hero після повної регресії.
- Global Search на телефонах має шість локалізованих швидких переходів із frame `1480:8432`; list cards і tag wrapping звірені з `1480:8804` та `1480:8767`. Tag search `1480:6898`/`1480:8527` додатково звірений: mobile title/count order and poster rail now match the frame; desktop asset parity remains open until Figma quota returns. Додатковий reference `1480:6217` підтвердив 160 px ширину mobile show-results control; native select збережено для keyboard/URL semantics і вирівняно до цієї геометрії.
- Global Search phone frame `1480:8594` додатково звірений: mobile hero slider trigger тепер фокусує той самий native category select; targeted alignment suite пройшов 4/4 після Docker web rebuild.
- Власний Profile mobile frame `896:1838` повторно звірений по raw subtree: hero отримав 44 px gear/more controls, які ведуть до наявної форми `Profile details` або безпечного виходу; меню має Escape/outside close і повернення фокуса. `profile-alignment.spec.ts` пройшов 8/8 після Docker web rebuild.
- Public Lists follow-up: mobile tagged poster rail тепер clip-иться в 138 px container, щоб не перекривати title link; desktop feed toolbar залишено доступним для back/filter flow. `list-discovery-controls` 3/3 і `public-guards` 6/6 пройшли після Docker web rebuild.
- Movie Details desktop frames `39:2`/`61:244` тепер підтверджені inventory та canvas; застосовано full-bleed dark hero, poster/content geometry, Rating/Cast sections і dark similar/review rails. Mobile contract лишився окремо перевіреним.
- Person/Actor desktop `545:676`/`551:705` підтверджений inventory та canvas; застосовано centered identity hero, 265 px avatar і 1200 px six-column filmography rail. Separate produced feed потребує API, тому не вигаданий.
- Person/Actor phone `721:1085` підтверджений inventory та browser preview; застосовано 120 px avatar, компактний back/filter toolbar, 465 px hero і чотириколонкову poster grid. Sort/genre filters лишилися доступними через mobile control; `producer-flow.spec.ts` 2/2.
- GitHub Actions переведені на актуальні Node 24 based majors: `checkout@v7`, `setup-java@v6`, `setup-node@v7`; runner зафіксовано на `ubuntu-24.04`, щоб прибрати migration annotation для `ubuntu-latest`.
- `verify-admin-browser.ps1` читає Compose project label із `docker inspect` JSON і працює у Windows PowerShell 5.1.
- Локальні `api` і `web` images перебудовані; основний DB volume та `.env` збережені.

## Актуальні перевірки

- `npm run verify:build`: PASS, TypeScript + Vite, 218 modules.
- Playwright: latest full local run **118 passed, 2 failures, 12 skips** across 132 scenarios; `scripts/verify-admin-browser.ps1` then passed **12/12** with cleanup. The two standard-run failures are isolated to the user's uncommitted `FollowActionsContext.tsx` change; `list-mobile-header.spec.ts` passed 12/12 and the transient EN-only case passed 6/6 on repeat.
- Backend: **87/87 passed**, failures/errors/skips 0, ізольована MySQL 8.4.
- PASS: API, contracts, security, password reset, Redis cache, HTTP concurrency, load, ER schema, backup/restore, production template config, Caddy та Compose config.

Точні результати й межі доказу — у [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md), Figma mappings — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md).

## Доставка

- UI/assets/harness: commit `33f8082`.
- Локальні release results: commit `f48713a`.
- [GitHub CI / verify для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s.
- Search/CI maintenance: commit `ea037f0`, [CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s; runner pin/docs commit `0b22904`, [CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s.
- Auth mobile cleanup: commit `42b8e3b`, [CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275), 1m52s; backend, frontend build/typecheck і Caddy validation зелені.
- Latest regression evidence: commit `00f9f43`, [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39707346272); only release documentation changed, and unrelated local files remained unstaged.
- Admin browser wrapper: `scripts/verify-admin-browser.ps1` passed 12/12 with a disposable fixture and cleanup.
- Global Search Figma alignment: commit `cda3126`, [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39708297409); mobile slider trigger now focuses the native category select, targeted alignment 4/4.
- Profile mobile hero actions: current local change adds Figma-aligned gear/more controls backed by existing profile form/logout actions; targeted `profile-alignment.spec.ts` 8/8 and `npm run verify:build` PASS. Commit/push pending after this checkpoint.
- Diploma artifacts і локальний `AGENTS.md` залишилися поза commits.

## Поза цією ціллю

- Production VPS, домен, TLS, SMTP/TMDB secrets, monitoring і реальний restore drill на сервері.
- Публікація погодженого Journal-контенту. Код лишається API-backed; Figma-тексти не підміняють production data.
- Загальна pixel-perfect заява для всіх 250+ top-level Figma frames. У документації фіксуються лише перевірені конкретні frames; автоматична та browser-регресія підтверджує поведінку всіх реалізованих маршрутів.

## Межі безпеки роботи

Не змінювати diploma video artifacts, локальний `AGENTS.md`, бази, backups, `.env`, Figma raw references і кеші. Backend змінювати лише за підтвердженим функціональним дефектом; migrations не переписувати. Public routes й API залишаються сумісними; `ProfileReview.moviePhotoUrl` nullable.
