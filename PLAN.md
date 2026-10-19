# Rewind — актуальний робочий план

Оновлено **19.10.2026**. Ціль: довести Rewind до вимог [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md), доступних Figma-макетів, перевірених наскрізних сценаріїв і готового public-release. Працюємо кодом; тести використовуємо після змін як доказ, а не як заміну реалізації.

## Поточний verified state

- Backend: **69 тестів, 0 failures, 0 errors, 0 skipped** у 37 test classes.
- Database: Flyway **V1–V31**, schema **38 tables / 55 foreign keys**.
- API: **156 operations / 127 paths**, включно з public `GET /api/producers/{id}`; Compose health `UP`.
- Frontend: TypeScript/Vite build (**184 modules**, entry **310.05 kB**), Web/API containers rebuilt and healthy.
- Runtime smoke: повний Playwright — **28 passed, 12 skipped, 0 failed**; producer flow — **1/1**, Journal design flow — **1/1**; admin headed smoke — **12/12** у середовищі з E2E credentials.
- Final frontend regression: **40 tests — 28 passed, 12 skipped, 0 failed**; після нього окремо підтверджені axe audit, desktop header keyboard focus і profile flow — **1/1**.
- Movie Details matrix: targeted `movie-details-responsive.spec.ts` — **1/1** для UK/EN × 320/393/768/1440, з `0 px` overflow, landmarks, `aria-busy=false` і без page errors.
- Release responsive matrix: **1/1** для 12 public/auth/service routes × 320/393/768/1440; overflow `0 px`, landmarks і page errors green.
- Latest regression evidence: headed admin browser suite — **12/12 за 47.9s**; повторний Surefire із явними локальними Compose credentials — **69 tests, 0 failures, 0 errors, 0 skipped** у 37 reports; API/Web containers `running`, health і Web — `200`, API/Web logs за останні 20 хвилин без `ERROR|Exception`. Порожній-парольний запуск не зараховано.
- Notification/SSE hardening: `SecurityConfig` дозволяє лише внутрішній `DispatcherType.ASYNC` dispatch для завершення SSE; після API rebuild реальний headed social flow — **1/1**, admin smoke — **12/12**, health/API/Web — `200`. Під час restart був короткий web `connect() failed`, після готовності API нових runtime `ERROR|Exception` немає.
- Backup/restore: **188 movies / 448 users / 31 migrations** у тимчасовій БД після останнього disposable verification run.
- Останні кодові зрізи: Home/Lists/Search/MovieDetails/Profile/PublicProfile/Community presentation; окремий API-backed Review Details route за mobile Figma frames; Journal/JournalArticle/Person і Notifications/Messages переведені на спільні visual tokens із локалізованими станами та fallback текстами; V31 додав продюсерів у TMDB sync, movie details і filmography route. Точна відповідність усім Figma-екранам не заявляється.
- UI hardening: Register, Forgot Password і Reset Password мають mutation lock, локалізований loading state та гарантований reset у `finally`; auth announcements мають коректні ARIA roles; Reset Password, ServicePage, About, Home, Community, Notifications, AdminDashboard, AdminMovies, AdminArticles, AdminNotifications, shared admin collections, error boundary, Comments і PublicProfile presentation переведені на CSS Modules/classes; Home CSS очищено до однієї responsive-структури з focus/retry стилями, Community — до одного Figma dark cascade, Lists mobile breakpoints нормалізовані, а Profile CSS syntax audit виправлений; private Profile отримав узгоджені form labels/IDs, dark surfaces, mutation busy states і mobile controls; Person filter flow зберігає surface під час запиту та має окремий genre state, Search має незалежний genre/catalog state, Community має незалежні effects для reviewers/HQ/directory; Home має незалежні states для popular/newest/reviews/lists/reviewers/tags/recent watched/journal; Header — незалежні unread message/notification counters, Notifications — незалежні feed/unread states і retry для mark-one/mark-all, AdminDashboard — незалежні summary/settings states, PublicProfile — незалежні followers/following states і retry, Messages — незалежні direct-target/sidebar/mark-read states, Movie Details — незалежні movie/reviews states, а list picker/rating/own-review, Public List feed/tags/like-status, Review Details і review-card like-status мають visible loading/error/empty/retry states із request cleanup; остання frontend TypeScript-перевірка завершилась exit 0, Vite build — **184 modules**, entry **310.05 kB**, після завершення code/design етапу headed admin/backend regression теж green.
- GitHub: за прямою командою користувача поточний verified стан один раз запушено в `origin/master` — commit `75f9d26` (`Complete Figma-driven UI and reliability pass`); наступні push без окремої команди не виконувати.

Останній code/design pass: Movie Details mobile 320–700px тепер використовує фактичний 64px fixed-header offset без зайвого top gap; усі public-list tag links у `PublicLists`, `PublicList` і `PublicProfile` будуються через спільний Unicode-safe slug helper, узгоджений із backend `TagService`; `PublicLists` також нормалізує ручні/case-variant `?tag=` значення перед запитом; shared `ResilientImage` дає runtime image-error fallback для poster/avatar surfaces і backdrop layers Movie Details, Public List та Review Details; приватний і Public Profile collection tabs мають коректний tab/tabpanel semantics; `App.tsx` має route-level lazy loading із локалізованим Suspense fallback, entry chunk зменшено **500.20 → 309.70 kB**; Java IDE warning cleanup у `ProfileService`, `ReviewService`, `GlobalSearchService` (проблемні method-reference/generic descriptors прибрані явними lambda/typed loops, unused imports прибрані); admin operation-error isolation для Movies/Articles/Comments/Conversations/Lists/Users/Reviews/Notifications/Moderation; localized moderation reason і explicit reason contract у moderation API client; landmark/busy hardening для Films Search, Global Search і Lists navigation; retry semantics для list/review likes і PublicProfile follow/block mutations; Global Search empty-tab `aria-controls` guard і named Comments landmark. API endpoint і Figma reference contract не змінювалися. TypeScript/Vite, backend clean compile, headed admin smoke і повний backend suite green; code/design verification завершено, зовнішній Figma/production sign-off лишається відкритим.

## Порядок наступної роботи

### 0. Figma inventory і документаційна база — поточний старт

- [x] У `docs/FIGMA_HANDOFF.md` додано canonical matrix `Figma frame → node ID/size → React route → статус → evidence → gap`.
- [x] Зафіксовано Chrome-only reference та повторюваний MCP blocker `don't have edit access`; без Editor-доступу не заявляємо pixel-perfect parity.
- [x] Визначено фактично завершені зрізи: Home, Search, Lists, Profiles, Journal, Community, Review Details і mobile navigation.
- [x] Shared foundation audit: global tokens, focus/reduced-motion rules, header/mobile navigation/footer surfaces і generic overflow guard узгоджені без нових assets/packages.
- [~] Movie Details має завершений API-backed responsive visual alignment і matrix evidence; exact Figma parity лишається непідтвердженою через відсутній node-level доступ.
- [x] Після Movie Details пройдено доступний UI matrix, targeted responsive/accessibility checks і зібрано [`docs/RELEASE_EVIDENCE.md`](docs/RELEASE_EVIDENCE.md); залишкові gaps — лише зовнішні content/production/Figma gates.
- [x] Documentation structure normalized: `docs/README.md` пояснює source-of-truth, `docs/PROJECT_MAP.md` більше не містить застарілого pre-regression стану, generated directories та `artifacts/` явно відділені від вихідного коду.

Поточна позиція після нормалізації: локальні функціональні та responsive visual slices завершені, а доступний Figma inventory зібраний. Наступні обґрунтовані зміни залежать від зовнішніх входів: реального UK/EN editorial content, Figma Editor/export access або production credentials/VPS. До їх появи не вигадуємо assets, контент чи secrets і не розширюємо Backend/API лише заради дизайну.

### 1. Локальний UX і основні браузерні сценарії — перевірена база

- [x] Профіль і списки: loading/error/retry/empty стани, mutation locks і responsive layout завершені; headed browser flows підтверджують create → edit → delete, 320 px без overflow, fault-injection retry items і повернення з порожньої останньої сторінки.
- [x] Social: headed flow підтверджує follow → notification → unread badge, follower/network/activity, block → message guard → unblock; PublicProfile очищає stale network/activity state, оновлює мережу після block/unblock і показує mutation busy states.
- [x] Public lists: headed flow підтверджує discover → tag/feed → detail → author profile → movie detail, UK/EN route switch і keyboard activation; cleanup disposable public-list account проходить після refresh CSRF.
- [x] Admin: headed suite підтверджує users, lists, comments/reviews, notifications, conversations, journal, audit, messages, moderation, movies і dashboard mutation flows, включно з retry та поверненням з останньої сторінки після дій — **12 passed (32.4s)**.
- [x] Після коду оновлено [`docs/PROGRESS.md`](docs/PROGRESS.md) та [`docs/IMPLEMENTATION_CHECKLIST.md`](docs/IMPLEMENTATION_CHECKLIST.md) фактичними результатами.
- [x] Header/editorial hardening: світла/темна шапка без перекриттів, горизонтальна навігація з автоматичним показом keyboard focus, незалежний retry архіву, reset пагінації журналу без stale-page запиту, fallback/error headings і довгі тексти. Видимий Chrome — **11/11**, уточнена перевірка overflow — **5/5 (23.7s)**; TypeScript/Vite (**165 modules**), Web rebuild, health `UP` і `git diff --check` green. Нові error/role/long-content сценарії використовують ізольовані API fixtures, не створюють даних у БД.
- [x] Producer filmography: Flyway V31 додав `producers` і `movie_producers`; TMDB credits sync зберігає producer credits, movie details показує посилання, а `/people/producer/:id` має сортування й genre filter. `ProducerIntegrationTests` + `TmdbSyncIntegrationTests`, повний Maven **69/0/0/0 у 37 класах**, producer browser flow **1/1**, Journal design flow **1/1**, повний Playwright **28 passed / 12 skipped**, schema **38/55**, OpenAPI **156/127**, backup/restore **182|428|31**; GitHub не оновлювався.

### 2. Двомовність і редакційний контент

- [x] UI має UK/EN маршрути, статичні labels і fallback для відомих enum/category значень.
- [x] Public journal list/detail/archive мають server-side per-slug fallback перекладу.
- [x] Поточні Journal/JournalArticle/Person мають trim-aware fallback для порожніх title/category/content/name; підписи Journal і social-сторінок додані обома мовами.
- [x] Journal design slice: темний Figma editorial feed із cover artwork, category/date, title/excerpt, `Read`, byline, thumbnail та адаптивними 320/768 станами; `journal-design-flow.spec.ts` і `editorial-layout.spec.ts` green.
- [ ] Перед релізом звірити реальний редакційний контент UK/EN, зображення та аудіо; UI fallback не замінює відсутнього перекладу статті.

Постійне правило: новий UI одразу отримує обидва словникові ключі; нові dynamic fields — явний fallback, коли текст відсутній.

### 3. Повна візуальна звірка — наступний етап

- [x] У Chrome знайдено конкретні frame links для Lists і mobile Search; вони збережені в `docs/FIGMA_HANDOFF.md`. Не вимагати Editor-доступ як умову роботи з уже доступними для перегляду матеріалами.
- [~] Доступний desktop/mobile inventory, typography/layout evidence і названі app-flow frames зафіксовано в `FIGMA_HANDOFF.md`; Chrome підтвердив desktop Search Results nodes `1480:7490`/`7445`/`7390`/`7311`/`7256`, search-by-tags `1480:6898` і phone `1480:8527`. Exact tokens/assets і pixel-level visual audit залишаються обмежені view-only доступом.
- [x] Lists/Search/MovieDetails/PublicProfile slices зіставлені з перевіреними Chrome frames або visual references; responsive screenshots і runtime matrix збережені, без вигаданих assets/mock data.
- [~] Усі доступні названі app-flow frames мають route/status/gap у matrix; повний frame-by-frame pixel audit неможливий без Figma Editor/node-level export access.
- [x] Journal frames зіставлено й перенесено; знайдено конкретні Profile/User Profile frames (`1413:9302`, `1413:11582`, `1494:6089`) і перенесено підтверджений dark profile slice: hero, stats/distribution, poster collections, activity/reviews та social actions. Targeted profile/public/social E2E — **8/8**, точна parity всіх довгих frames все ще не заявляється.
- [x] Home frames зіставлено й перенесено: registered/guest desktop (`1413:6263`, `1413:6471`) і mobile (`1327:3210`, `1411:3473`) variants; `Home.module.css` має dark canvas, centered hero, poster rows і review/list panels. Chromium screenshot audit на desktop/390px green; точна parity всіх variants все ще не заявляється.
- [x] `Popular Reviews (svergunova phone)` (393×1265) уточнено за Chrome reference: public review DTO тепер повертає poster фільму й avatar автора, `Home` та Global Search використовують poster/avatar-led cards із fallback, а ranked IDs гідратуються одним bulk fetch graph без per-card lazy queries. Backend/frontend compile, Vite **167 modules**, API/Web rebuild, health і runtime JSON/UI check green; повний E2E не запускався.
- [x] Review Details frames `1480:9249` (393×932) і `1480:9407` (393×852) перенесено в реальний `/reviews/:id`: публічний endpoint повертає movie/author/likes/liker avatars, UI має backdrop hero, poster, author, rating, review text, trailer й like action, а review cards ведуть на деталку. Backend compile, Vite **170 modules**, API/Web rebuild, runtime API та Chrome desktop/mobile 393×852 check green; повний E2E не запускався.
- [x] Mobile navigation зіставлено з нижньою панеллю frame `1480:9249`: на ширині до 720 px довга горизонтальна desktop-навігація замінена на fixed `Home / Search / Add / Journal / Profile`, активний route підсвічується, а другорядні та account/admin дії доступні у верхньому меню. Chrome 393/320 px підтвердив усі п'ять пунктів і `0 px` horizontal overflow; довгі review title/username додатково отримали безпечне перенесення.
- [x] Films/Search frames зіставлено: desktop `1413:12611` і phone `1480:9187`; `Search.module.css` має dark teal/amber hero, compact filters і poster grid за reference. Після змін public/accessibility browser slice — **11/11**; exact parity ще не заявляється.
- [x] Lists catalog frame уточнено за desktop `1480:4983` (1440×3816): `PublicLists` отримав центрований teal/black hero, gold CTA, feed/tag surfaces і збережені poster-stack cards. Після Web rebuild `public-guards + accessibility` — **11/11**, Vite **165 modules**; exact parity Featured/Popular/mobile variants ще не заявляється.
- [x] Public list detail frame `1480:6071` (1440×2033) уточнено: `PublicList.module.css` має dark hero/body/footer composition, poster grid і gold actions; `public-guards.spec.ts` — **6/6** після rebuild. Exact pixel parity не заявляється.
- [x] Ranked/detail frame `1480:6134` (1440×2033) отримав спільний detail treatment: перший доступний movie poster використовується як затемнений hero backdrop, а poster cards показують стабільну позицію 1…N; backend `ListType` не розширювався без відповідного продуктового контракту. `public-guards + accessibility` — **11/11**.
- [x] Crew lists profile frame `1480:9718` (393×1546) уточнено: public-profile lists endpoint тепер batch-повертає до 3 preview movies та `itemCount`, а `PublicProfile` показує poster-stack cards, правильну UK/EN pluralization, повний набір tag links і responsive dark surface. `tsc`, backend compile, Vite/Docker rebuild і runtime API/UI check green; повний E2E після presentation/data-shape slice не запускався.
- [x] Mobile visual pass: `UserLists`, `PublicList`, `PublicLists`, `Search` і `Community` ущільнені для 320/340/380/400/560 px — коротші hero, full-width actions, горизонтальний feed rail, stacked state cards, long-label wrapping і безпечні poster/directory layouts. TypeScript/Vite **165 modules**, Docker Web rebuild green; targeted public mobile smoke — **1/1 (13.3s)**.
- [x] Movie Details visual refinement: hero використовує `backdropUrl` із `photoUrl` fallback, credits/actor roles, mobile hero/review/actions мають wrapping/stacking правила, focus states і 320–340 px guard. TypeScript/Vite **170 modules**, full Playwright regression і окремий UK/EN × 320/393/768/1440 matrix green; exact Figma node/pixel parity залишається зовнішнім gap.
- [x] Create-list frame `1480:5333` (1440×2160) уточнено: `UserLists` отримав teal/amber hero, двоколонкову desktop-форму, textarea для опису, локалізований visibility hint, live preview empty-state і mobile collapse. `list-owner-flow.spec.ts` — **2/2**, `public-guards + accessibility` — **11/11**, TypeScript/Vite **165 modules**, Docker Web rebuild green.
- [x] Create-list populated frame `1480:5182` (1440×3856) доведено: вибраний список перемикає hero на назву, create/edit режими не змішуються, poster rows мають fallback/meta/remove/reorder actions, а loading/error/empty стани мають окремі доступні cards. Повторні owner/public/accessibility flows — **2/2 + 11/11**.
- [x] Lists mobile visual alignment: за Chrome reference frames `1480:8280` (Lists catalog, 393×1809), `1480:9542` (Create your list, 393×852) і `1480:9446` (Public list detail, 393×852) додано compact hero/rails, двоколонкові catalog cards, sheet-style create/edit surfaces, poster rows і чотириколонкову detail poster wall. `npx tsc --noEmit`, Vite/Docker Web build і responsive smoke `320/393/768 × 3 routes` green, overflow **0 px**; GitHub не оновлювався.
- [x] Community frames зіставлено: desktop `1413:13364` і phone `1480:7698`; `Community` має dark hero, avatar rows, searchable directory та responsive states. `public-guards + accessibility` — **11/11**, Vite **165 modules**; exact parity не заявляється.
- [x] Global Search Results frames `1480:8934`, `1480:8856`, `1480:8804`, `1480:8767`, `1480:8594`, desktop lists `1480:7490`, search-by-tags desktop `1480:6898`/phone `1480:8527`, і journal articles desktop `1480:7549`/phone `1480:8889`: `/api/search/global` і `/uk|en/search` покривають films/users/lists/tags/cast-crew/reviews/journal, а `tab` query відтворює окремі films/lists/tags/no-matches states із responsive dark surface та переходами на реальні сторінки. Дані проходять public/active visibility rules; mock-результатів немає.

Остання відома MCP-відмова `don't have edit access` не означає, що браузерний перегляд недоступний. Не вигадувати точні параметри чи підтвердження parity.

Документ передачі: [`docs/FIGMA_HANDOFF.md`](docs/FIGMA_HANDOFF.md).

### 4. Production readiness — після надання зовнішніх даних

- [x] Локальний production wiring audit завершено: `compose.production.yaml config --quiet` valid з audit-only values, `verify-caddy.ps1` повертає `Valid configuration`, а відсутній `.env.production` зафіксований validator-ом як blocker.
- [ ] Ротувати раніше розкритий TMDB key і перевірити всі secrets.
- [ ] Отримати production TMDB/SMTP credentials, домен, VPS і HTTPS certificate.
- [ ] Заповнити `.env.production` поза Git, пройти `verify-production-config.ps1` на реальному secure env.
- [ ] Запустити production Compose overlay, scheduler з bounded batch, monitoring і backup schedule.
- [ ] Перевірити реєстрацію, reset email, catalog, lists, social, moderation, обидві мови та restore drill на production-like середовищі.

Runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### 5. Фінальний реліз і захист

- [x] Зібрати local clean release evidence bundle: [`docs/RELEASE_EVIDENCE.md`](docs/RELEASE_EVIDENCE.md) фіксує build, API contracts, browser smoke, schema, backup/restore, accessibility/security і зовнішні blockers; production sign-off окремо не заявляється.
- [x] Переглянуто дипломні матеріали, slideshow evidence і локальний WebM recording: файл 76,223 bytes має валідний EBML/WebM header `1A 45 DF A3`; recording/slideshow залишаються локальним demo evidence, не production/Figma parity доказом.
- [x] Перевірити `git diff --check`, статус, секрети та список файлів; warnings стосуються лише LF→CRLF, whitespace errors відсутні.
- [x] Показати користувачу підсумок змін і відкритих blockers.
- [ ] Зробити **один** commit/push лише після його команди.

## Правила роботи

1. Не переписувати Flyway V1–V4; зміни БД — тільки новою міграцією.
2. Не скидати й не перезаписувати чужі незакомічені зміни.
3. Спочатку реалізувати код, потім запускати targeted verification і лише після завершення зрізу — повний regression.
4. Публічні responses не повинні розкривати email, службові поля або дані деактивованих авторів.
5. Пагінація має бути server-side, зі стабільним tie-breaker; фільтри починаються з першої сторінки.
6. Кожен новий текст UI має UK/EN label; кожна mutation має loading/error/lock стан.
7. Не пушити GitHub без прямої команди користувача.

## Definition of done

Ціль можна закрити тільки коли:

- локальні функціональні вимоги з [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md) мають код і наскрізний доказ;
- основні user flows пройдені browser → API → MySQL;
- Figma parity або чесно підтверджена неможливість через відсутній доступ;
- production runbook виконаний на реальному secure env або явно заблокований відсутніми credentials;
- documentation summary відповідає фактичному стану;
- користувач погодив фінальний push.

Детальні докази та історія змін: [`docs/PROGRESS.md`](docs/PROGRESS.md). Короткий checklist: [`docs/IMPLEMENTATION_CHECKLIST.md`](docs/IMPLEMENTATION_CHECKLIST.md). Вимоги: [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md).
