# Rewind — контрольний чекліст

Цей файл — короткий навігатор по великому плану. Детальні докази, дати, команди й відкриті ризики залишаються у [PROGRESS.md](PROGRESS.md). Позначка `[x]` ставиться тільки після коду, тесту й наскрізної перевірки; `[~]` означає частково виконаний етап.

- [~] **18.10.2026, user lists UX hardening:** окремий retry для помилки завантаження елементів списку, mutation-lock для create/update і локалізований saving state. `npx tsc --noEmit` і Vite build (**150 modules**) пройшли; headed browser verification ще відкрита.
- [x] **18.10.2026, public-list catalog pagination:** `/lists/discover` отримав server-side pagination по 12 записів, retry/error/loading states, reset на першу сторінку після tag filter та UK/EN accessible controls. Headed Chrome E2E створює 13 public lists і проходить перехід `Сторінка 1 з N` → `Сторінка 2 з N`, cleanup disposable account — **1 passed (4.6s)**. GitHub не оновлювався.
- [x] **18.10.2026, journal pagination:** public Journal передає `page` у API, скидає page state для нових фільтрів/мови/архіву, має stale-state cleanup і UK/EN accessible controls. Headed Chrome E2E для двох server-page payloads — **1 passed (2.9s)**; TypeScript, Vite і Docker Web rebuild пройшли. GitHub не оновлювався.
- [x] **18.10.2026, user blocking:** V29 `user_blocks`, захищені block-status/block/unblock API, public-profile UK/EN controls, cleanup взаємних follows і блокування follow/direct-message interaction. `BlockingIntegrationTests` — **1/1**, schema — **35 tables / 51 foreign keys**, OpenAPI — **150 operations / 122 paths**, Docker API/Web rebuild і health `UP`. GitHub не оновлювався.
- [x] **18.10.2026, фінальний backend regression після V29:** Compose MySQL Maven suite — **66/0/0/0 у 35 test classes**; перевірено, що заблоковані старі діалоги приховані з Inbox і повертаються після unblock. GitHub не оновлювався.
- [x] **18.10.2026, backup/restore після V29:** `verify-backup-restore.ps1` підтвердив **155|363|29** (movies|users|Flyway migrations) у тимчасовій БД і cleanup; production validator без реального `.env.production` залишається відкритим.
- [x] **18.10.2026, V30 list likes and feeds:** додано `list_likes`, idempotent like/unlike/status API, recently-liked/team public-list feeds, like counts і UK/EN controls. `ListLikeIntegrationTests` — **1/1**, TypeScript/Vite, Docker API/Web rebuild, runtime feeds `200`. GitHub не оновлювався.
- [x] **18.10.2026, V30 feed hardening:** popular public lists ранжуються за активними лайками, а public-list catalog має стабільний `updatedAt DESC, id DESC`; targeted `ListLikeIntegrationTests`, Docker API rebuild і runtime `popular/recently-liked` `200` пройшли. GitHub не оновлювався.
- [x] **18.10.2026, public-list detail UX:** автор списку веде на public profile, а теги стали клікабельними локалізованими фільтрами; `tsc`, Vite **150 modules**, Docker Web rebuild і web routes `200` пройшли. GitHub не оновлювався.
- [x] **18.10.2026, фінальна перевірка після V30:** Maven **68/0/0/0 у 36 test classes**, schema **36 tables / 53 foreign keys**, OpenAPI **155 operations / 126 paths**, backup/restore **167|379|30**, API `UP`, web `200`. GitHub не оновлювався.
- [x] **18.10.2026, journal locale fallback:** mixed-language public journal list/archive використовують per-slug server-side fallback і `publishedAt DESC, id DESC`; `JournalArticleIntegrationTests` — **3/3**, runtime API journal/archive `200`. GitHub не оновлювався.
- [x] **18.10.2026, inactive-user public privacy:** усі основні публічні read-path’и фільтрують деактивованих авторів: profile/collections/lists/network/activity, recent/popular reviews, popular reviewers, public-list catalog/detail, liked reviews і comments; раніше видані password-reset tokens для inactive user також invalid. `PublicProfileIntegrationTests` — **5/5**, `PasswordResetIntegrationTests` — **2/2**, Maven compile, Docker API rebuild, health `200`, OpenAPI `200`, runtime log без помилок. Міграція не потрібна, GitHub не оновлювався.
- [x] **18.10.2026, admin account safety and role management:** backend guard блокує self-deactivation/self-demotion і видалення останнього активного ADMIN через deactivate або role update; перевірка активних ADMIN серіалізована pessimistic write lock; AdminUsers має USER/ADMIN role select і локалізовані причини відмови. `AdminAuditIntegrationTests` — **3/3**, TypeScript/Vite, Docker API/web, health і web shell пройшли. GitHub не оновлювався.
- [~] **18.10.2026, Inbox visibility:** додано backend unread counter для приватних діалогів і спільні Header badges для unread messages/notifications з 30-секундним refresh. Також додано watched activity і Home recently-watched block. Компіляція, Docker rebuild і Compose health пройшли; окремий headed browser сценарій ще треба додати до наступного social зрізу.
- [x] **18.10.2026, V28 account social links:** власний профіль отримав захищений social-links CRUD, public profile — display без email/службових полів; ER-діаграма, карта проєкту й schema verifier синхронізовані. Compose підтвердив Flyway V28, **34 tables / 49 foreign keys**, backup/restore — **146|347|28** (movies|users|migrations). GitHub не оновлювався.
- [x] **18.10.2026, OpenAPI runtime fix:** springdoc **3.0.1** узгоджено зі Spring Boot 4 після реального `NoSuchMethodError` на `/v3/api-docs`; Maven package і Docker API rebuild пройшли, `/v3/api-docs` повертає **147 operations / 120 paths**, health — `UP`. GitHub не оновлювався.
- [x] **18.10.2026, social-links UX hardening:** Retry відновлює значення в полях, платформи локалізовані UK/EN і мають доступні labels; бекенд whitelist-ить чотири підтримані платформи. TypeScript, Vite build, Maven compile, Docker rebuild, API `UP` і web `/uk/profile` **200** пройшли. GitHub не оновлювався.
- [x] **18.10.2026, API smoke cleanup:** `verify-api.ps1` після повного core flow видаляє створених disposable-користувачів через account-delete API; повторний запуск підтвердив cleanup двома `204` і не залишив нових verify-акаунтів.
- [x] **18.10.2026, Home journal block:** додано локалізований блок останніх матеріалів журналу з category/title/excerpt, empty state і переходом до повного журналу. TypeScript, Vite build, Docker web rebuild, Journal API UK/EN і web `/uk/home` **200** пройшли.
- [x] **18.10.2026, Home journal contract:** API smoke перевіряє public Journal `200`/`content`; повторний повний сценарій і cleanup пройшли.

## Етапи

- [~] **1. Основа й дизайн** — Git, карта проєкту й локальні перевірки готові. Remote CI має відомий інфраструктурний збій: `mvnw` був без executable-прапорця; виправлення підготовлено локально. Відкриті: один великий sync у GitHub, ротація старого TMDB-ключа, Editor-доступ Figma і точна parity-перевірка.
- [~] **2. Стабільний локальний продукт** — Compose, Flyway 30, API error contract, DELETE-виправлення, core browser flow і MySQL integration tests готові. Додано конкурентне створення огляду: один запис перемагає, другий отримує HTTP 409; rating upsert і list-like upsert використовують атомарний MySQL `INSERT IGNORE`/`ON DUPLICATE KEY UPDATE`. `verify-contracts.ps1` і concurrency smoke покривають поточний public/protected/authenticated/admin контрактний зріз; окремі edge-case endpoint-и та production runtime ще відкриті.
- [~] **3. Інтерфейс і акаунт** — UK/EN маршрути, cookie auth, reset, профіль, account social links, server-paged списки та адаптивні messages готові. Профіль/list routes мають explicit loading/error/retry/empty стани й mutation locks; ролі, notification/activity enums і відомі genre/category values мають двомовні labels із fallback; headed profile flow перевіряє own/public collection end-to-end. Відкриті: повна локалізація довільних редакційних даних, UX профілю й повний responsive-аудит.
- [~] **4. Фільми й пошук** — home, каталог, фільтри, деталка, персоналії, рекомендації та admin TMDB import/sync/quality report готові. MovieDetails має окремий loading/error/retry для основного запиту. Відкриті: реальний контрольований batch після надання ключа, scheduler і Figma parity.
- [~] **5. Особисті дії та списки** — watched/watchlist/favorites, ratings, reviews, comments і public lists підключені; Home/discover має popular, recently-liked і HQ/team public-list feeds з idempotent list likes; own/public lists мають server pagination з tie-break за `updatedAt DESC, id DESC`, а movie reviews — за `createdAt DESC, id DESC`; MovieDetails блокує повторні action/review mutations і має controls пагінації відгуків; public profile додатково показує пагіновані liked reviews з виключенням hidden. Відкриті: повний browser UX-аудит профілю та списків.
- [~] **6. Спільнота** — follows, likes, public liked reviews/lists, popular review/list feeds і Community hub з popular reviewers, paged active HQ members та searchable all-user directory, activity, tags, notifications/SSE, paged messages і HQ готові. Notification UI має loading/error/retry/empty, mutation locks, optimistic rollback, локалізовані дати та mobile pagination regression; public profile network/activity тепер має server pagination, loading/error/retry та двомовні accessibility labels. Відкриті: ширші social browser regression flows.
- [~] **7. Журнал і службові сторінки** — journal, archive, podcast audio, newsletter, legal/help pages і admin editor готові; public Journal/JournalArticle мають loading/error/retry/empty states, відомі dynamic category values локалізовані. Відкриті: повна редакційна локалізація та production SMTP monitoring.
- [~] **8. Адмінка** — dashboard, users/HQ, movies, lists, communications, notifications, journal editor, moderation, settings і audit готові. Users, lists, reviews, comments, movies, conversations, notifications, articles і audit logs мають серверну UI-пагінацію; moderation, фільтри та видалення останнього запису сторінки проходять у браузері. Поточний headed Chrome suite: **12/12**. Відкрите ширше UI-покриття всіх адмінських дій.
- [~] **9. Якість і реліз** — Redis cache, rate limits, health/metrics, backups, restore drill, актуальна schema **36/53**, security headers, axe/keyboard, non-root image, production overlay, Caddy HTTPS reverse-proxy example, expanded browser/API XSS/SQLi matrix, **20/20 local load smoke across 8 endpoint groups за 0.16s** і offline dev dependency audit готові. Відкриті: production capacity, VPS/HTTPS execution.
- [~] **10. Захист і презентація** — ER-діаграма, інструкція, робоча документація, детермінований movie seed, disposable fixtures і локальний WebM screen recording готові; Figma parity та постійний demo-user dataset ще відкриті.

## Останній перевірений зріз

- **18.10.2026, full frontend regression після enum localization і Docker Web rebuild:** видимий Google Chrome — **15 passed, 12 skipped, 0 failed (58.4s)**; skipped — 12 admin fixture tests без `E2E_ADMIN_*`, які проходять окремим admin script. Accessibility/WCAG, core, localization, retry, profile/lists, guards, security, social і SSE flows — green.
- **18.10.2026, admin regression після того самого Docker Web rebuild:** visible `verify-admin-browser.ps1 -Headed` — **12 passed (34.1s)**; усі admin pagination/mutation flows green.
- **18.10.2026, contract/concurrency smoke:** `verify-contracts.ps1` пройшов public/protected/auth/admin і core CRUD matrix; `verify-http-concurrency.ps1` пройшов concurrent list/rating/review/comment/notification/follow/like writes з очікуваним 200,409 для duplicate review і без duplicate state.
- **18.10.2026, schema/cache gates:** `verify-er-schema.ps1` — **36 tables / 53 foreign keys**; `verify-cache.ps1` — Redis movie-details TTL **599s**, miss delta **1**, hit delta **3**.
- **18.10.2026, backup/restore:** `verify-backup-restore.ps1` відновив dump у тимчасову БД і підтвердив актуальний після V30 зріз **167|379|30** (movies|users|Flyway migrations), cleanup виконано. Production validator залишено відкритим без реального `.env.production`.
- **18.10.2026, auth/core API:** `verify-password-reset.ps1` пройшов Mailpit one-time reset/revocation/new login; `verify-api.ps1` повторно пройшов core CRUD, privacy, refresh replay, social, lists, ratings, reviews, comments і notifications.
- **18.10.2026, diploma video preparation:** додано `DIPLOMA_VIDEO_SCRIPT.md` із 7–9-хвилинним storyboard, таймкодами, evidence-командами, secret-safety та cleanup інструкціями.
- **18.10.2026, diploma visual artifact:** headed Chromium зняв 6 реальних public frames у `artifacts/diploma-video/frames`; додано autoplay `index.html` slideshow. Початковий encoder був невдалим, але пізніший recorder fix створив валідний WebM, зафіксований окремим newest evidence.

- **18.10.2026, dynamic enum fallbacks:** локалізовано ролі `ADMIN/USER`, відомі notification types і activity types; невідомі activity values мають явний UK/EN fallback. `tsc --noEmit`, Vite build і visible `dynamic-localization.spec.ts` — **1 passed (3.4s)**.

- **18.10.2026, Figma access audit:** `get_design_context` із `figma-design-to-code` для `orb73jiLJnIsZNCRtJsWgS:0:1` знову повернув `don't have edit access` (debug UUID `ace43c6c-85d2-4227-9b0c-b3f6c8208f75`); exact parity/assets не заявляються.

- **18.10.2026, Java diagnostics:** clean Maven compile перекомпілював **241 source files**, `BUILD SUCCESS`, без javac warning/deprecation output; IDE-specific Problems не вигадуються за відсутності окремого IDE report.

- **18.10.2026, production handoff:** додано `Caddyfile.example` і runbook commands; Compose shape підтвердив `read_only` API, secure cookies, private DB/Redis/API та loopback web `127.0.0.1:8088`. Caddy/VPS не запускалися локально.

- **18.10.2026, розширений local load:** `verify-load.ps1` перевірив 200 паралельних GET до 8 public/health endpoint-груп — **200/200 HTTP 200 за 0.62s**; production VPS load не заявляється.

- **18.10.2026, public retry states:** `Journal`, `JournalArticle` і `Person` мають локалізований retry після HTTP/API помилки; headed `journal-retry.spec.ts` — **1 passed (2.9s)**, accessibility/WCAG — **5 passed (23.2s)** після Docker Web rebuild. Невдалий запуск із root-каталогу не зараховано, повторено з frontend-каталогу.

- **18.10.2026, власні списки — loading/mutation states:** `UserLists` очищає stale items, показує loading/empty стани та блокує паралельні remove/reorder; актуальний headed Chrome після Docker Web rebuild — **2 passed (6.9s)** для list-owner/profile, окремий затриманий list loading assertion — **1 passed (4.7s)**. `tsc --noEmit`, Vite build і API/Web log scan пройшли.

- **18.10.2026, фінальна notification/admin перевірка:** видимий Google Chrome `verify-admin-browser.ps1 -Headed` — **12/12 за 33.1s**; повний Maven/Surefire на Compose MySQL — **60/0/0/0** у 33 reports; Flyway schema version 27, API/Web logs без runtime errors, тимчасові `*-current.log` відсутні. GitHub не оновлювався.

- **18.10.2026, повторний security/load smoke:** `verify-load.ps1 -Requests 200` — **200/200 HTTP 200 за 0.68s**; `verify-security.ps1` — **12/12** SQLi/XSS payload-комбінацій, guest `401`, non-admin **14 read + 34 write `403`**, CSRF `403`. Тестові дані очищено, GitHub не оновлювався.

- **18.10.2026, динамічна локалізація жанрів:** API genre names локалізуються в каталозі, MovieDetails і фільмографії; `tsc`, Vite build, Docker Web rebuild і headed Chrome `dynamic-localization.spec.ts` — **1 passed (3.3s)**. GitHub не оновлювався.

- **18.10.2026, profile empty state:** власні списки мають локалізований empty state; `tsc`, Vite/Docker Web build і headed `profile-flow.spec.ts` — **1 passed (7.9s)**, own/public collection і mobile overflow пройшли. GitHub не оновлювався.

- **18.10.2026, локалізовані дати:** `formatDateTime` використовує `uk-UA`/`en-US` у messages, admin audit logs і conversations; `tsc`, Vite/Docker Web build та headed admin suite — **12 passed (36.9s)**. GitHub не оновлювався.

- **18.10.2026, auth/journal accessibility:** Journal list/detail category localization завершена; `/en/login` 7px mobile overflow виправлено через auth `box-sizing`/responsive card rules. Повторний headed accessibility suite — **5 passed (27.1s)**, GitHub не оновлювався.

- **18.10.2026, admin audit labels:** action/target enum-и локалізовано для UK/EN із fallback; `tsc`, Vite/Docker Web build і headed admin suite — **12 passed (39.7s)**. GitHub не оновлювався.

- **18.10.2026, повтор після перерваного headed запуску:** активного Playwright-процесу не залишилося; `verify-admin-browser.ps1 -Headed` у Google Chrome — **12 passed (33.6s)**; повний Maven/Surefire — **60/0/0/0** у 33 класах. Тимчасових `*-current.log` не було, GitHub не оновлювався.

- **18.10.2026, фінальна повторна перевірка admin/notification зрізу:** visible Google Chrome `verify-admin-browser.ps1 -Headed` — **12 passed (35.1s)**; Maven/Surefire з Compose MySQL — **60/0/0/0** у 33 класах. API health `UP`, свіжі API/Web logs без `ERROR|Exception|connect() failed`, тимчасові `*-current.log` відсутні, `git diff --check` без помилок. GitHub не оновлювався.

- **18.10.2026, повторний HTTP contract smoke:** `verify-contracts.ps1` підтвердив public `200`, guest protected `401`, authenticated `200/204`, non-admin admin `403`, review/comment/social/newsletter/message flows і cleanup; `public/protected contract smoke passed`. GitHub не оновлювався.

- **18.10.2026, розширений public accessibility audit:** 16 public/service/auth маршрутів перевірені headed Chrome — **5 passed (23.6s)**; виправлено forgot-password mobile overflow і auth `<main>` landmark. Перевірки охопили keyboard, overflow, security headers, landmarks, image alternatives і WCAG axe. GitHub не оновлювався.

- **18.10.2026, повний frontend headed regression:** **13 passed, 12 skipped, 0 failed (50.0s)**; core/list-owner/profile/public-guards/security/social/SSE flows пройшли, admin fixture suite окремо — **12/12**. GitHub не оновлювався.

- **18.10.2026, release hygiene:** Java `mvnw -q -DskipTests compile` — успішно; tracked secret scan без реальних credentials. Production validator очікувано відмовився без `.env.production`; фіктивний production launch не створювався.

- **18.10.2026, backend API payload matrix:** `verify-security.ps1` перевірив 4 SQLi/XSS payloads на 3 public query endpoints — **12/12 HTTP 200**, плюс guest `401`, non-admin `403` і CSRF `403`. `Backend security smoke passed`; GitHub не оновлювався.

- **18.10.2026, diploma/demo materials:** створено `DIPLOMA_MATERIALS.md` із demo script, architecture slide outline, evidence table та обмеженнями перед public launch; README/PLAN посилаються на файл. GitHub не оновлювався.

- **18.10.2026, категорії журналу:** відомі backend category values у `Journal` локалізуються UK/EN dictionary із fallback для невідомих значень. Після Docker Web rebuild public accessibility suite — **5 passed (17.5s)**, включно з `/uk/journal`, mobile/keyboard/WCAG checks.

- **18.10.2026, dev dependency audit:** Vite оновлено до **7.3.7**, `@vitejs/plugin-react` — до **5.2.0**; offline npm audit — **0 vulnerabilities**. `tsc`, Vite/Docker Web build, headed security (**1 passed, 7.7s**) і admin smoke (**12 passed, 35.9s**) пройшли. Online npm audit quick endpoint окремо повертає 400 через registry endpoint retirement.

- **18.10.2026, XSS/SQLi browser matrix:** `security.spec.ts` перевіряє review/comment escaping і 4 query payloads (`OR 1=1`, `DROP TABLE`, `UNION`, `<script>`) без dialog/alert або UI error; headed Chrome — **1 passed (5.2s)**. GitHub не оновлювався.

- **18.10.2026, статичні UI labels:** admin article language options/list, TMDB import hint і public profile `HQ` badge локалізовані через UK/EN dictionary. `tsc --noEmit`, Vite build і headed admin Chrome smoke — **12 passed (34.1s)**. Повна редакційна локалізація динамічних category values ще відкрита.

- **18.10.2026, audit enum fallback:** невідомі `audit action/target` тепер мають UK/EN fallback labels замість сирих backend-кодів; `npx tsc --noEmit`, Vite production build і headed admin regression пройшли — **12/12 за 32.6s**, fixture очищено. GitHub не оновлювався.

- **18.10.2026, journal category localization:** додано UK/EN mapping для `Новини`/`News`; після Docker Web rebuild headed public accessibility/WCAG suite — **5/5 за 25.7s**, TypeScript і Vite build пройшли.

- **18.10.2026, responsive regression:** public accessibility smoke тепер перевіряє 320px і 768px на 15 маршрутах; headed WCAG suite — **5/5 за 27.9s**.

- **18.10.2026, desktop responsive baseline:** public smoke тепер перевіряє 320px, 768px і 1280px на 15 маршрутах; headed WCAG suite — **5/5 за 30.0s**.

- **18.10.2026, backend regression:** повний Maven/MySQL suite — **60/0/0/0 у 33 класах**, Flyway `27`; API `UP`, current 15-minute API log scan чистий.

- **18.10.2026, profile UX:** newsletter settings отримали loading/error/retry; headed owner profile + list flow — **2/2 за 8.5s**, Docker Web rebuild, TypeScript і Vite build пройшли.

- **18.10.2026, full headed regression:** після profile UX зміни — **15 passed, 12 skipped, 0 failed за 1.0m**; admin fixture smoke окремо — **12/12**.

- **18.10.2026, legacy navigation:** `/` тепер веде на `/uk/home`; public guards — **3/3 за 6.7s** після Docker Web rebuild.

- **18.10.2026, TMDB scheduler:** додано opt-in oldest-first catalog crawl з batch cap 20 і per-movie isolation; scheduler test **1/1**, повний backend suite **61/0/0/0 у 34 класах**. Production provider key/scheduler run не заявляються.

- **18.10.2026, scheduler deployment docs:** `DEPLOYMENT.md` описує rotation-before-enable, bounded interval/batch і контрольований first run; реальний provider/VPS execution не заявляється.
- **18.10.2026, production validator hardening:** `verify-production-config.ps1` перевіряє узгодженість TMDB/scheduler flags, реальний provider key і безпечні batch/interval межі; PowerShell parse check і `git diff --check` пройшли.
- **18.10.2026, production Compose wiring:** API service явно отримує всі `TMDB_SCHEDULER_*` змінні; Compose config на безпечному test env і `mvnw -DskipTests compile` пройшли.
- **18.10.2026, public profile privacy regression:** MockMvc доводить, що `GET /api/users/{id}` не віддає email; `PublicProfileIntegrationTests` — **3/3**.
- **18.10.2026, diploma recording:** headed Chrome створив `artifacts/diploma-video/rewind-diploma-demo.webm` розміром **76,223 bytes**; `node scripts/capture-diploma-video.mjs` повторно пройшов, WebM/EBML header перевірено.
- **18.10.2026, demo data audit:** `seed_50_real.sql` і dev-only seed guard перевірені як локальне наповнення порожнього каталогу; `tmdb_seed_50.py` проходить Python 3.11 `py_compile` і не містить ключа, бо читає `TMDB_API_KEY` з environment. Постійні demo users не додаються; disposable fixtures очищаються після перевірок.
- **18.10.2026, контрольний rerun:** `verify-admin-browser.ps1 -Headed` підтвердив **12/12 за 34.1s**, а повний Maven/MySQL suite підтвердив **61/0/0/0** у 34 Surefire reports.
- **18.10.2026, security rerun:** `scripts/verify-security.ps1` повторно підтвердив public/guest/auth matrix, CSRF rejection, 12 SQLi/XSS payload requests і всі admin mappings з очікуваними статусами; production security/load ще не заявляються готовими.
- **18.10.2026, load rerun:** `scripts/verify-load.ps1` підтвердив **20/20** локальних HTTP smoke requests до 8 endpoint-груп за **0.16s**; production capacity не підміняється цим результатом.
- **18.10.2026, production release-gate:** `compose.production.yaml config --quiet` пройшов із безпечним audit env; приватність DB/Redis/API, read-only API, secure cookie і loopback web binding підтверджені. Додано `scripts/verify-caddy.ps1` для відтворюваної container-based syntax validation; VPS certificate/reverse-proxy smoke ще не виконані.
- **18.10.2026, Caddy validation:** контейнер `caddy:2-alpine` підтвердив `Caddyfile.example` як **Valid configuration**; залишаються лише фактична certificate issuance і VPS reverse-proxy smoke.
- **18.10.2026, Caddy formatting:** Caddyfile вирівняно до canonical tab indentation; повторний `verify-caddy.ps1` повернув **Valid configuration** без format warning.
- **18.10.2026, schema documentation audit (до V28):** Compose MySQL підтвердив Flyway **V1–V27** і **33 таблиці**; `PROJECT_MAP.md` виправлено, щоб не описувати поточну БД як Flyway 4/V1–V21. Поточний після-V28 зріз зафіксовано вище.
- **18.10.2026, Figma access rerun:** точний Design node `orb73jiLJnIsZNCRtJsWgS`, `node-id=0:1`, знову повернув від Figma MCP **don't have edit access**; parity не вигадується без Editor-доступу.
- **18.10.2026, frontend/artifact rerun:** `npm run build` зібрав **148 modules**, `npx tsc --noEmit` пройшов; WebM diploma artifact — **76,223 bytes**, 6 frames.
- **18.10.2026, contract/concurrency rerun:** public/protected/authenticated HTTP contract smoke пройшов; concurrent writes для списків, reorder, оцінок, оглядів, коментарів, сповіщень, follow/like дали очікувані `200/204/409` і успішні post-read checks.
- **18.10.2026, global UI failure state:** додано `AppErrorBoundary` із двомовним `role=alert` fallback і reload action; TypeScript/Vite build пройшли, headed public guards — **3/3**.
- **18.10.2026, full frontend rerun:** після Error Boundary headed suite підтвердив **16 passed, 12 skipped, 0 failed за 1.0m**; admin fixture suite залишається окремим і вже має 12/12.
- **18.10.2026, admin dashboard states:** додано loading/error/retry для dashboard summary/settings і stale-response guard; TypeScript/Vite build пройшли, headed admin suite — **12/12 за 34.0s**.
- **18.10.2026, comments loading state:** `Comments` отримав retry та request-id guard проти stale responses; TypeScript/Vite build і headed core/social flows — **2/2 за 8.4s**.
- **18.10.2026, genre loading states:** `Search` і `Person` тепер показують локалізований alert/retry при недоступному `/genres`; TypeScript/Vite build і headed accessibility/localization suite — **6/6 за 32.3s**.
- **18.10.2026, CI hardening:** `.github/workflows/ci.yml` обмежено `contents: read`, додано job timeout 15 хвилин; `git ls-files --stage mvnw` підтвердив executable mode `100755`.
- **18.10.2026, CI HTTPS gate:** workflow доповнено Docker-кроком `caddy:2-alpine caddy validate` для `Caddyfile.example`, щоб proxy syntax перевірялася на push/PR.
- **18.10.2026, SSE hardening:** async timeout/access-denied handling для SSE виправлено; headed reconnect — **1/1 за 8.3s**, повний backend suite — **61/0/0/0 у 34 класах**, свіжі API logs clean.
- **18.10.2026, MovieDetails stale-response fix:** request-generation guard для `loadMyReview` закриває race після delete; security test **3/3**, повний headed suite — **16 passed, 12 skipped, 0 failed за 1.1m**.

- **18.10.2026, production readiness:** `verify-production-config.ps1` пройшов на одноразовому локальному test fixture без створення реального `.env.production`; `verify-backup-restore.ps1` відновив dump у тимчасову БД і підтвердив **119|250|27** (movies|users|Flyway migrations), cleanup виконано. GitHub не оновлювався.

- **18.10.2026, API quality smoke:** `verify-contracts.ps1` пройшов public/protected/authenticated контрактний сценарій; `verify-http-concurrency.ps1` пройшов конкурентні записи й перевірки дублів; `verify-load.ps1` після compatibility fix для Windows PowerShell 5.1 повернув **20/20 HTTP 200 за 0.19s**. Security smoke — успішний; GitHub не оновлювався.

- **18.10.2026, локалізація notification enum labels:** `AdminNotifications` показує UK/EN labels для `FOLLOW` і `REVIEW_LIKED` у create/filter/list UI та має fallback для невідомих типів. `tsc --noEmit`, Vite і Docker Web rebuild пройшли; headed admin smoke — `passed`, failed tests — 0. Compose API health — `UP`, runtime logs без `ERROR`/`Exception`; чинний backend suite — **60/0/0/0** у 33 класах. GitHub не оновлювався.

- **18.10.2026, browser regression:** повний headed Playwright — **13 passed, 12 skipped, 0 failed (49.2s)**; окремий `verify-admin-browser.ps1 -Headed` — **12 passed (35.0s)**. Moderation fixture тепер фільтрує власні review/comment markers, тому admin smoke стабільний при накопичених локальних даних.

- **18.10.2026, public profile contract:** виправлено відсутній `permitAll` для `GET /api/users/{id}/lists`; `PublicProfileIntegrationTests` — **3/0/0**, headed `profile-flow.spec.ts` — **1 passed (7.6s)**. Guest profile більше не показує помилку public lists, а 320px own/public overflow і довгі username перевірені. Повний MySQL suite — **60/0/0/0** у 33 класах. GitHub не оновлювався.

- **18.10.2026, profile browser flow:** `profile-flow.spec.ts` пройшов у headed Chrome — **1 passed (7.4s)**: watched → власний профіль/API → logout → публічний профіль без cookie → cleanup; own/public профілі перевірені на 320px без горизонтального overflow. Довгі username тепер переносяться в `PublicProfile`; `tsc --noEmit`, Vite і Docker Web build пройшли. GitHub не оновлювався.

- **18.10.2026, review pagination:** додано стабільне сортування відгуків `createdAt DESC, id DESC`, UI-пагінацію `MovieDetails` з локалізованими controls і fallback після видалення останнього запису сторінки. `ReviewPaginationIntegrationTests` підтвердив 11 записів як сторінки 10 + 1; `tsc --noEmit`, Vite, Docker API/Web build і visible Chrome `core-flow.spec.ts` — **1 passed**. Повний MySQL suite — **59/0/0/0** у 33 класах. GitHub не оновлювався.

- **18.10.2026, MovieDetails UX:** додано окремий loading/error/retry для деталей фільму та блокування повторних watchlist/rating/list/review mutations із локалізованими progress labels. `tsc --noEmit`, Vite і Docker Web build пройшли; visible Chrome `core-flow.spec.ts` — **1 passed**. Backend не змінювався; попередній повний MySQL suite був **58/0/0/0**. GitHub не оновлювався.

- **18.10.2026, social pagination:** `FollowIntegrationTests` — **2/0/0**, включно з 17 follower records на сторінках 8/8/1 без повторів; SQL підтвердив `createdAt DESC, id DESC`. `tsc --noEmit`, Vite build і Docker API/Web build пройшли; visible Chrome `social-flow.spec.ts` — **1 passed**, full backend — **58/0/0/0** у 32 класах. GitHub не оновлювався.
- **18.10.2026, профілі та user lists:** `PublicProfileIntegrationTests` — **2/0/0**, full backend — **57/0/0/0** у 32 класах; `tsc --noEmit` і Vite build пройшли; перебудований Compose runtime і visible Chrome owner-list flow — **1 passed (6.2s)**. GitHub не оновлювався.

- **18.10.2026, notification slice:** видимий `verify-admin-browser.ps1 -Headed` пройшов **12/12 (41.6s)**; повний Maven/Surefire suite на MySQL 8.4 — **56 tests, 0 failures, 0 errors, 0 skipped** у 32 класах. Accessibility label пагінації — `notificationsPagination`; GitHub не оновлювався.

- **17.10.2026, видалення власного списку:** додано `DELETE /api/lists/{listId}` для власника кастомного списку. Чужий користувач отримує відмову, системні WATCHED/WATCHLIST/FAVORITES видаляти не можна; MySQL каскадно очищає `list_items`, `list_tags` і пов'язану активність. `MovieListDeletionIntegrationTests`: **1 тест, 0 failures/errors**.
- **UI списків:** додано UK/EN підтвердження, блокування повторного запиту, success/error стани та захист від застарілої відповіді items після зміни вибору. TypeScript і Vite build пройшли. Новий Playwright flow у видимому Chrome: реєстрація → створення публічного списку з тегами → видалення → перевірка `/api/lists/my` → видалення тестового акаунта, **1 passed (6.8s)**. SQL після cleanup: 0 fixture users/lists/items; API без runtime ERROR.
- **Адмінські users/lists:** обидва блоки винесено з монолітного dashboard у компоненти з серверною пагінацією, loading/error/retry/empty станами, захистом від stale response і блокуванням повторних mutation. User search скидає сторінку; list delete з єдиного рядка останньої сторінки повертає на попередню. MySQL pagination test на 55 користувачах: **1 passed**; headed admin browser smoke: **4 passed (15.7s)**. SQL cleanup: 0 disposable admin/list E2E users; runtime API без ERROR.
- **Адмінські comments/reviews:** обидва блоки винесено у незалежні компоненти з серверною пагінацією, фільтром видимості, loading/error/retry/empty станами, stale-response guard і блокуванням повторної moderation mutation. Якщо приховування прибирає останній рядок відфільтрованої непершої сторінки, UI повертається на попередню. `EntityGraph` прибирає N+1 для автора/фільму. MySQL test на 51 review + 51 hidden comment пройшов; headed admin Chrome suite: **5 passed (28.7s)**.
- **Адмінські movies:** CRUD і TMDB import/sync/quality винесено з монолітного dashboard в `AdminMovies`; список читає сторінки по 50, має loading/error/retry/empty стани, stale-response guard і повертається зі спорожнілої другої сторінки. `tsc`, Vite і Docker Web build пройшли; headed browser suite: **6 passed (24.8s)**. API log без ERROR, SQL cleanup підтвердив 0 disposable users/movies.
- **Адмінські conversations:** список і delete винесено в `AdminConversations` із серверною пагінацією, loading/error/retry/empty станами, stale-response guard та поверненням після видалення останнього діалогу другої сторінки. Після Docker Web rebuild headed browser suite: **7 passed (24.8s)**.
- **Адмінські notifications:** create/read/unread/delete, server filters і bulk actions винесено в `AdminNotifications`; UI має сторінки по 50, applied filter state, loading/error/retry/empty стани та fallback після delete. Серверне сортування тепер `createdAt DESC, id DESC`; MySQL-тест із 51 однаковим timestamp підтвердив відсутність пропусків/повторів. Headed browser suite: **8 passed (28.7s)**.
- **Адмінські journal articles:** редактор винесено в `AdminArticles`; список завантажує сторінки по 50 та має loading/error/retry/empty стани. Сортування стабілізовано як `updatedAt DESC, id DESC`; MySQL-тест створив 51 статтю з однаковим timestamp і підтвердив повне покриття двох сторінок. TypeScript/Vite і Docker API/Web build пройшли; видимий Google Chrome suite: **9 passed (33.1s)**.
- **Адмінські audit logs:** журнал дій винесено в `AdminAuditLogs`; список має сторінки по 50 та loading/error/retry/empty стани. Сортування стабілізовано як `createdAt DESC, id DESC`; MySQL-тест створив 51 запис з однаковим timestamp. Docker API/Web build і видимий Google Chrome suite пройшли: **10 passed (37.2s)**.
- **Приватні повідомлення:** UI розділяє loading/error/retry/empty стани діалогів і повідомлень, підтримує сторінки діалогів та старіших повідомлень, блокує повторну відправку й не має overflow на 320px. Backend має стабільні `updatedAt/createdAt DESC, id DESC` і одним update позначає прочитаними всі записи. MySQL test: 101 повідомлення, сторінки 50/50/1, 0 непрочитаних; видимий Chrome suite: **11 passed (37.1s)**.
- **Попередній backend regression:** після owner list delete, moderation/admin pagination та message hardening було **55 tests, 0 failures, 0 errors, 0 skipped** у 32 test classes; актуальний результат — **56/0/0/0** у записі notification slice вище.
- **17.10.2026, черга модерації:** відтворено пропуски/повтори на 260 коментарях зі спільним timestamp. `AdminModerationQueueRepository` тепер робить `UNION ALL` і спільні `ORDER BY created_at, item_type, id` / `LIMIT` / `OFFSET` у MySQL; ліміт вибірки перших 250 рядків і старі дубльовані repository-запити прибрано. JDBC бачить зміни JPA в поточній транзакції після flush. Targeted MySQL suite: **5 тестів, 0 failures/errors**.
- **UI черги:** окремий компонент із пагінацією, loading/error/retry, очищенням вибору при зміні сторінки/фільтра, захистом від застарілих відповідей і поверненням на попередню сторінку після bulk hide. `verify-admin-browser.ps1 -Headed` у видимому Chrome: **2 passed**, включно з 51 коментарем, тестовим HTTP 503 → retry і приховуванням останнього елемента/всієї сторінки. TypeScript, Vite і Docker API/Web build пройшли; SQL підтвердив 0 залишених fixture users/movies/comments.
- **Діагностика:** локальне `.vscode/settings.json` переведено з `disabled` у `automatic` для Java null analysis. Це не доказ нульових Problems; актуальний список IDE ще треба звірити. Масового вимкнення аналізу більше немає.
- `PLAN.md` містить активну ціль; дозволені користувачем уточнення вимог записуються в `PROJECT_REQUIREMENTS.md`. У `FIGMA_HANDOFF.md` виправлено суперечність про підключення плагіна й позначено старий візуальний аудит як історичний. Доступ до Figma цього разу повторно не перевірявся.

Нижче — попередні перевірені зрізи. Поточний повний backend regression перевірений як **68/0/0/0** у 36 test classes; старі записи з 67/66/65/61/60/59/58/57/56/55 тестами та 11 browser flows залишаються історичними.

- `CoreFilmFlowIntegrationTests`: конкурентне створення одного review дає **1 успіх + 1 HTTP 409**, у БД залишається один запис; створення використовує атомарний MySQL `INSERT IGNORE` без duplicate-key warning у runtime log.
- `CoreFilmFlowIntegrationTests`: два одночасні rating upsert проходять без duplicate-key error і залишають один запис з останнім значенням.
- `CoreFilmFlowIntegrationTests`: паралельні custom/system list-item, follow і review-like writes залишають по одному зв’язку через ідемпотентні native inserts.
- Notification preferences тепер створюються атомарним `INSERT IGNORE`, а конкурентний перший read використовує current/pessimistic read; два перші паралельні PUT не дають duplicate-key або snapshot 500.
- Browser security: review/comment `<img onerror>` payload не створює DOM image або dialog; catalog/admin SQL-подібний пошук не дає 500.
- Admin moderation: review і comment окремо приховуються з moderation queue.
- Compose HTTP flow: `scripts/verify-api.ps1` за замовчуванням ходить на `127.0.0.1:8081` і проходить auth/catalog/lists/rating/review/comment/social/refresh сценарії.
- `scripts/verify-contracts.ps1` пройшов розширений public/protected contract smoke: public catalog/journal/lists/tags/reviews/popular reviewers, guest 401 guards, authenticated profile update/password change/re-login, private conversation/message/read lifecycle, social/newsletter/notifications, notification preferences/read-all, watched/watchlist/favorites і rating create/delete, non-admin 403 для admin routes, follow і review-like lifecycle, public user collections та comment/review lifecycle.
- `scripts/verify-http-concurrency.ps1` пройшов через Compose API: паралельні list-item/system-list/rating/follow/like writes залишають один зв'язок, reorder дає валідний порядок, два comment writes зберігаються окремо, а перші notification preference/read-all і review writes проходять без 500 (`200 + 409` для review); cleanup видаляє тестового користувача та його дані.
- Comments UI використовує серверну пагінацію: headed `core-flow` створює 21 коментар, перевіряє 20 на першій сторінці, переходить на `Сторінка 2 з 2` і бачить 21-й коментар; повний сценарій редагування/видалення огляду після цього проходить **1/1 за 8.6s**.
- Той самий headed `core-flow` додатково перевіряє редагування й підтверджене видалення власного коментаря через UI; після delete коментар зникає зі сторінки, сценарій завершується **1/1 за 7.5s**.
- Auth browser coverage тепер містить реальний Mailpit password-reset flow: одноразовий token, локалізована форма `/uk/reset-password` і login з новим паролем — **1/1 за 4.6s**.
- Повний headed frontend suite після додавання reset flow: **17 passed, 12 skipped, 0 failed**, 29 test cases у 12 файлах; окремий admin fixture suite — **12/12**.
- Social browser smoke тепер покриває notification preference mutation і persistence після reload разом із follow→notification flow — **1/1 за 6.8s**.
- Core browser smoke тепер також покриває review like/unlike toggle у власному review card — **1/1 за 9.6s**.
- Окремий HTTP/Mailpit verifier password reset повторно пройшов: generic response, delivery, one-time link, old-session revocation і login з новим паролем.
- Profile browser flow додатково перевіряє UI account deletion: confirm, redirect на локалізовану home та захищений redirect назад на login; виправлено logout/route-guard race — **1/1 за 9.3s**.
- Profile browser flow також перевіряє зміну пароля, logout із `passwordChanged=1` і повторний login новим паролем перед видаленням акаунта — **1/1 за 9.8s**.
- `scripts/verify-cache.ps1` сумісний із Windows PowerShell 5.1; актуальний Compose smoke підтвердив Redis TTL **599s**, miss delta **1**, hit delta **3**. Повний Maven suite з Compose credentials: **68/0/0/0 у 36 reports**.
- Черга модерації сортується стабільно за `createdAt → type → id`; інтеграційний тест використовує унікальний маркер, тому не залежить від кількості старих локальних smoke-даних. Повний Maven suite після цього виправлення: **47 тестів, 0 failures/errors**.
- Повторний повний `./mvnw.cmd -q test` після notification preference hardening: **47 тестів, 0 failures/errors**; після перевірки `target/` видалено як generated output.
- Frontend cleanup: прибрано невикористані `Rating.tsx` і дубль `ForgotPassword.module.tsx`, About TMDB disclaimer переведено через UK/EN dictionary; порожні root/resource `package-lock.json` без npm-проєкту прибрані, справжній frontend lockfile залишено. Journal, public list/profile/person/article отримали явні loading/error/empty стани й захист від stale race condition при зміні фільтрів, мови та маршрутів; `npm ci`, TypeScript, Vite build і локальний Playwright public-route smoke (1 passed) пройшли.
- Робоче дерево очищено від локальних логів, Maven/Vite build artifacts, Playwright reports і тимчасових IDE-каталогів. `target/` може з'являтися після Maven-збірки як ігнорований generated output; його можна безпечно відтворити `mvnw.cmd`. Відновлення виконується `mvnw.cmd`, `npm ci` та командами з `RUN_LOCAL.md`.
- Прибрано startup debug `Users count` і зупинено застарілі локальні Spring-процеси на 8080/8082; їхні логи видалені. Актуальний локальний runtime перевірено через Compose API на 8081.

## Наступна черга

1. Закрити залишкову локалізацію довільних dynamic values і error/empty/loading стани незалежних від Figma екранів.
2. Розширити production-like load/security matrix і перевірку bulk moderation прав.
3. Після Editor-доступу зафіксувати точні Figma desktop/mobile фрейми, tokens, assets і screenshots.

## Команди перевірки

```powershell
./mvnw.cmd -q -DskipTests compile
./scripts/verify-security.ps1
./scripts/verify-load.ps1
./scripts/verify-admin-browser.ps1
cd letterboxd/letterboxd-login-figma-final2
npm run build
npx playwright test
```

## Figma blocker

Плагін підключений, але три надані файли зараз доступні лише для перегляду/comment. `get_design_context` і screenshots повертають `don't have edit access`, тому точні токени й assets не вигадуються до Editor-доступу.
