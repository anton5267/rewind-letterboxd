# Rewind — поточний прогрес

## Regression checkpoint — 01.11.2026 (current)

- `npm run verify:build`: passed (TypeScript + Vite, 251 modules). Technical check only.
- Docker full Playwright suite after the latest code changes: 154 passed, 0 failed, 12 skipped; all skips are Admin cases requiring a disposable fixture. Separate `scripts/verify-admin-browser.ps1 -BaseUrl http://127.0.0.1:8081`: 12 passed, no skips; exact cleanup confirmed 0 disposable ADMIN fixtures. Logs: `artifacts/visual-audit-20261101/playwright-full-final.log`, `playwright-admin-fixture-rerun.log`.
- Backend tests on isolated tmpfs MySQL: 90 tests, 0 failures/errors/skips, BUILD SUCCESS (`backend-regression.log`).
- API, security, contracts, password reset, ER schema, cache, HTTP concurrency, backup/restore into a temporary DB, synthetic production config, and Caddy checks all passed. Temporary restore data/backup and Admin fixtures were cleaned.
- Full-suite findings were fixed before rerun: stale Admin title selectors, invalid desktop year being written to the URL, and focus behavior after responsive live-filter submission. Targeted Docker regression fixes: 4/4.
- Compose config is valid; web/API respond 200, API health UP, DB/Redis healthy. Current web image `sha256:cab8ec4d91c177f728bd0c67d949009af4a1f13e939cc8445251b61d84472b1c`; API image `sha256:800f5b48d04f938285ad8e998fb085cddf25eed263bc7ec74e2981dc1a9559f6`. `.env` SHA256 unchanged (`90122BAAF73CC76047D7D3239CC5CD8B6E300CD8F816C355212051AA29969820`); named DB and Redis volumes retained.
- Figma `1260:4840` remains unreadable through current source screenshot/context (1×1 screenshot and context timeout); excluded alternate `1494:6790` was not substituted. Admin Movies parity remains unconfirmed. Moderation `1399:3300` is a whole-frame API gap per designer; ordinary moderation queue remains its separate feature.
- Remaining delivery work: scoped diff review, commits, push, and green `CI / verify (push)`. Build and tests do not establish blanket visual parity; see [release evidence](../operations/RELEASE_EVIDENCE.md#final-regression-and-docker-checkpoint--01112026).

Оновлено 01.11.2026. Ціль активна: завершити Figma-аудит наявних маршрутів, регресію, локальний Docker і доставку в GitHub із зеленим CI. Повне завершення ще не підтверджене.

## Поточний стан

- Admin Moderation `1399:3300`: дизайнер підтвердив, що gap охоплює весь Figma-екран; не додавати часткову імітацію чи `More Users` redirect. Наявна API-черга модерації лишається окремою функцією. Рішення занесено в матрицю/handoff/release evidence.

- Films Discovery `1480:6235`/`1480:7843`: додано ізольовану перевірку 503 → retry для фільмів/жанрів, Enter і повернення фокусу, усіх чотирьох фільтрів та API query params; Playwright1/1, `verify:build` пройшов. Docker daemon/API зараз зупинений, отже це fixture-поведінка, без live smoke чи нової візуальної заяви. [Evidence](../operations/RELEASE_EVIDENCE.md#films-discovery-api-recovery-filters-and-keyboard-focus--01112026).

- Auth Entry `605:2173`/`922:1788`: свіжі Figma source captures зіставлено з `/auth`. Виправлено desktop card/footer вертикальні anchors і opacity підписів; phone anchors залишилися без змін. Playwright UK/EN ×320/393/600/720/768/1024/1440 —14 комбінацій без overflow; обидва переходи перевірено в кожній комбінації. Парні capture UK desktop1440/EN phone393. Це runtime/композиційне приймання; повний pixel diff не заявляю. OAuth/Remember me лишаються контрактними gaps. [Evidence](../operations/RELEASE_EVIDENCE.md#auth-entry-desktop-phone-composition-and-existing-routes--01112026).

- Search: за рішенням користувача no-match `1480:5809`/`1480:8856` тепер має локалізоване Back to home; Enter відкриває `/uk/home` або `/en/home`. Desktop empty-секція x450/y377/540px, populated rail y377. Довгі назви без постера обмежено в межах картки, повна назва доступна через accessible name. Ізольовані browser tests8/8 на Vite, ширини320–1440, UK/EN, категорії, retry, focus; парні fixture screenshots393/1440. `verify:build` пройшов як технічна перевірка. Docker Desktop відновлено, web clean rebuild; Search/Journal/Popular/Films на оновленому Docker21/21. Повний Docker Playwright158/158 без skips; три точні залишкові USER fixtures від попередніх невдалих спроб видалені через API.
- Search expanded All `1480:7083`/`1480:8934`: Figma source re-fetched; expanding now reveals categories from the initial API response and preserves the phone100×149 poster rail. Live API UK desktop1440/phone393: no overflow, one request size6, correct category URL, focus to first revealed section, page errors0. `dune` currently has no live matches; populated query `d` has no Tags/Journal data. Captures and content-height limits are in release evidence. `verify:build` passed technically; Search alignment E2E6/6 passed on Source Vite. Historical note superseded by the final current-code regression checkpoint above.
- Journal `844:1547` і Popular Reviews: цільовий browser suite4/4; стаття росте разом із cover/content, reviewer link перевірено. Live Journal feed порожній; це не підтвердження багатого контенту макета.

- Popular Reviews `1480:4880`: повторно отримано Figma context/screenshot і оновлено desktop заголовковий рядок, щоб перша картка починалася на y733, а постер на y764 (Figma anchors). Source Vite + Docker API desktop1440/phone393: 6 авторів і4 відгуки, More має чинний `/community/reviewers` href, page errors0 та overflow0; телефонна композиція адаптивна, але окремий phone READY screenshot прихований. Pagination/footer з живими даними закінчуються вище за повний приклад Figma, а API дає менше авторів; це data/content length gap. Парні viewport/full captures і виміри в `artifacts/visual-audit-20261030/popular-reviews-live/`. `verify:build` та targeted Playwright2/2 на source Vite пройшли; це технічна/runtime перевірка, не повне візуальне погодження.

- Admin Lists `1344:5249`: повторно отримано context і screenshot (1440×3238). Із чинного `createdAt` додано локалізовану дату “Створено”/“Created” — Figma-підпис “Year” у прикладах фактично містить повну дату. Desktop typography збільшена відповідно до кадру, API-поля/actions не розширювалися. Source Vite: ізольована contract fixture на UK1440 та EN393, дата/owner/опис і Hide перевірені, overflow0; targeted Playwright1/1 та build пройшли. Capture пара збережена в `admin-lists-created-date-fixture/`; вона не є live data evidence. Reported Lists/Likes/Edit лишаються API gaps.

- Admin Lists/Reviews responsive follow-up: Playwright expanded to UK/EN ×320/393/600/720/768/1024/1440; all14 fixture cases per route passed, no overflow. Targeted suite2/2; evidence and fixture screenshots linked in Release Evidence.

- Admin Reviews `1310:3108`: fresh Figma context/screenshot1.11; desktop картку вирівняно за 1200×429, текстову колонку417px і метадані з x720, дата й rating стоять поруч. Перевірено UK1440 та EN393 через isolated contract fixture; кнопки чинної модерації збережені, reported/edit/likes/comments gaps не підмінялися. Цільовий Playwright1/1 пройшов, `verify:build` пройшов технічно. Парні fixture screenshots — `artifacts/visual-audit-20261101/admin-reviews-layout-fixture/`; це не live-data чи full-frame acceptance.

- Owner Profile Reviews `363:289`/`1023:1867`: fresh matched Docker captures at1440/393; card, section and poster anchors align, mobile overflow0. Removed Edit/Delete from list cards per Figma; actions remain on the single-review detail state. Real API one review vs three Figma samples. Focused Playwright1/1 and build passed. A full suite was stopped at user direction before completion and is deferred until implementation closure.

- All Films `1480:4797`/`1480:9187`: refreshed Figma screenshots; matched browser captures at1440/393. Desktop 1200px content x120, six columns/36 live records; phone 4×6 grid x16/y228.25, 24 live records. Count pill is a searchable field, and sort remains in the compact filter row so existing capabilities survive the updated visual composition. Search/sort URL, phone Escape/focus return, no page errors and no overflow at320/393/600/720/768/1024/1440. `verify:build` passed (technical only); no automated suite run. Figma sample count/art intentionally differ from API.

- Films Discovery `1480:6235`/`1480:7843`: fixed phone review grid to match source's two stacked, full-width cards. Matched 393 capture: cards x16/y635 and y784, 361×125; Crew Picks heading y944. Desktop capture: 1200px content at x120, six popular slots, eight recent films, four 584×234 review cards. UK/EN runtime, focus outline, no page errors, and widths320/393/600/720/768/1024/1440 without overflow. Pair at `artifacts/visual-audit-20261028/films-discovery-final-1440.png` and `...-393.png`. Missing API posters, global watched count and Crew Picks feed remain data gaps. Build passes as technical evidence; injected loading/error/retry and complete keyboard traversal remain open; no automated suite run.

- Admin Dashboard 1178:2466 refreshed to1440×1605. Desktop1440 and phone393 live Docker captures in UK/EN show personal API metrics separately from platform counters; duplicated list metric is represented once, unsupported session/growth remain unavailable. Platform API rendered six live counters; no browser errors or horizontal overflow. Exact disposable ADMIN8852 was removed. Pair: `artifacts/visual-audit-20261028/admin-shared/dashboard-current-{uk,en}-{1440,393}.png`. No Dashboard source change; prior build passes technically. Full tests and other Admin working-content frames remain open.


- Admin Movies source mapping: refreshed READY 1260:4840 is hidden with a blank screenshot; visible 1494:6790 is ALTERNATE and excluded; 1260:3772 remains an unresolved profile-chrome Films grid, not an established Admin catalog. Existing supported /admin?view=movies stays intact; no parity claim/new endpoint. Exact source discrepancy documented in the matrix and handoff.

- Admin Movies live Docker: catalog/editor checked at1440/393 with disposable ADMIN; section x120/1200 and x16/361, editor form x156/1128 and x37/319, no horizontal overflow or page errors. Current API rows/controls display; captures linked from the candidate matrix. Runtime geometry evidence only because selected READY editor1260:4840 is hidden with a blank screenshot. Exact fixture cleanup count0. No API/source change or suite run; `verify:build` passed technically.

- Admin Users responsive fixture: source-Vite UK/EN ×320/393/600/720/768/1024/1440, targeted1/1; all14 cases no overflow, search/user/profile action visible. Paired fixture captures and limits documented; not live-data parity.

- Movie Details Dune `560:1003`/`61:244`: fresh phone/desktop Figma screenshots; source-Vite fixture checked UK/EN ×320/393/600/720/768/1024/1440,14/14 without overflow. Plot/poster order, natural plot/storyline growth and section order verified. Pair captures and limitation noted; Docker/API down, so no live data or image parity claim.

- Admin Users READY `1218:2982`: corrected duplicate shell/content title to Users + User List and made search match the 402px icon-pill while preserving submit behavior. Source Vite with Docker API checked at1440/393; desktop table x121/1198, mobile card rail x16/361, no overflow or page errors. Search returned the disposable fixture; 50 real rows/page retained. Paired captures are in `admin-shared/admin-users-final-{1440,393}.png`. Add User/edit/delete capabilities remain a contract mismatch; clarification requested, no API operation fabricated. `verify:build` passed; no suite run.

- Admin Comments READY `1342:3589`: refreshed Figma source and checked live Docker at1440/393. Desktop section x120/1200; phone x16/361; 50 real API records/page, no overflow or page errors. Current hide/delete moderation actions are supported. Likes/replies/edit and report records are absent from API; the Figma “View Reported Comments” CTA remains an API gap; do not route it to the unmoderated queue. Captures: `admin-shared/admin-comments-live-{1440,393}.png`; no source/API change or full suite run.

- Admin Reviews READY `1310:3108`: refreshed Figma context/screenshot and compared the existing 1440/393 runtime pair. Current API-backed rows show movie, author, text, rating/date and visibility with supported Hide/Restore/Delete. Per designer decision, unsupported Reported/Edit actions stay out; likes/comments counts and report records remain API gaps. Runtime pair: `admin-content/reviews-loaded-uk-{1440,393}.png`. No source change in this block. The final current-code regression is recorded in the 01.11 checkpoint above.

- Admin User Profile READY `1237:4369`: added display-name/avatar-URL editing and real API ID using the existing PATCH/DTO; identity, status/role/HQ, audit history and activity remain API-backed. Matched screenshots: `admin-user-profile/user-profile-uk-{1440,393}.png`; panel1200×829 at1440, activity card516×501, no overflow at320/393/600/720/768/1024/1440. Save persisted; invalid name and simulated500 preserve entered values; EN labels checked, page errors0 and fixture cleanup0. Email update/delete-user/last-activity/file upload/custom notifications remain gaps. `verify:build` passes (technical only); no full suite or Docker rebuild.

- Admin Moderator Logs READY `1404:3804`: refreshed Figma source and aligned the repeated activity heading, date/action labels and single page title using existing audit/user APIs. Source-Vite + Docker API produced three real disposable audit rows; desktop first card1200×348 at x120, phone card361×456.8 at x16, no overflow/page errors, EN labels present. Pair: `artifacts/visual-audit-20261030/admin-logs/admin-logs-uk-{1440,393}.png`. No READY phone frame; keyboard/retry/pagination not repeated. `verify:build` passes technically; no full suite or Docker rebuild.

- Admin Settings READY `1404:4076`: refreshed Figma and removed the duplicate Site settings heading; the page now has one localized General Settings title. Four existing API settings at1440/393, workspace1200×734 desktop and327px inner phone, no overflow/page errors, EN labels. Pair: `admin-settings/admin-settings-uk-{1440,393}.png`. Time zone/logo/policies/limits/colors/font/cache/backup remain API gaps; the large blank region reflects those omitted fields. Build passes technically; no full suite or Docker rebuild.

- Home guest `472:492`/`1411:3473`: refreshed Current-Copy screenshots; Docker app captured at exact1440/393. Major section order, responsive behavior, no page errors/overflow. Desktop is182px shorter than frame and phone20px taller; live news is empty and list/poster results differ from Figma samples, so no pixel-parity claim. Pair: `artifacts/visual-audit-20261028/home-person/home-current-uk-{1440,393}.png`. No code change or build/test in this inspection.

- Home list cards/retry: 3/3 Playwright пройшли на Docker. Свіжий screenshot `1413:6471` повернув 1×1, тому ці тести підтверджують поведінку, не відповідність геометрії Figma.

- Review Details і release responsive matrix: повторний Playwright 2/2; UK/EN довгий контент і mobile RatingSheet/Escape/focus на 320/393/480/768/1440, а також 14 маршрутів на 320/393/768/1440 без overflow. Знімки 393/1440 — тестові API fixtures, не нове Figma-приймання; phone frame `1480:9249` прихований.

- Історичний перший full run:64 passed/94 failed; після серії реалізацій і оновлень сценаріїв новий повний прогін29.10 має158/158 passed. Окремий перший Docker прогін поточної серії мав144/158 через застарілі селектори після редизайну; це збережено як історичний failed run.

- Додаткова перевірка після першого full run: Profile 10/10, navigation/Admin/community 19/19, list mobile header/dialog 12/12, Movie/Person 6/6; новий повний Docker suite158/158 закрив ці регресійні сценарії.

- Погоджені чотири інформаційні Service-сторінки додано на спільному компоненті: Terms, Conditions, Safety Notice, HQ Accounts. UK/EN,56 перевірок ширини без overflow, клавіатура й активна навігація; парні393/1440 screenshots. Тексти не обіцяють непідтриманих платних/HQ функцій. Нових API немає. Останній build251 — технічна перевірка.
- Додатково перевірено читабельні captions288cases, колекції профілів90cases, Settings focus720/767/768 і справжні password/displayName Save, Search/Journal categories52cases та NotFound10cases. Точні докази в Release evidence; це не повна регресія.


- Figma MCP доступний. Основу визначає START HERE `5321:8872`: **167 READY**, включно зі станами; це не167 маршрутів. Історичні268 кандидатів збережено, альтернативні колекції виключено. Джерело дизайну й runtime-докази розділено у [матриці](../frontend/FIGMA_SCREEN_CANDIDATES.md).
- Inter normal/italic з кирилицею збережено локально. Перед глобальним підключенням показано font-only Home desktop/mobile; браузер підтвердив кириличні гліфи Inter без підміни. Спільний mobile/tablet перехід —767/768.
- За відповідями дизайнера компактна спільна Admin-оболонка застосована до всіх12 розділів. Підписана навігація, горизонтальний mobile rail, активний/сфокусований пункт видимі. Dashboard показує особисті API-лічильники, одну картку створених списків і поточну середню оцінку; платформа окремо. Непідтримані часові метрики позначено недоступними.96 звичайних geometry cases та15 simulated200% text cases без document overflow; це не повне приймання вмісту всіх Admin frames.
- Create List — самостійна mobile сторінка й локальна чернетка до Save. Після підтвердженого Save відкривається owner read-only `/lists?list=<id>&mode=view`, короткий успіх та явні Edit/Add film. Private/public, частковий збій додавання й Retry, невалідний ID перевірено. При помилці форма й дані зберігаються.
- Auth/Service, Search/Films/Reviews, Lists/Journal та Profile/social пройшли окремі поточні runtime-блоки UK/EN з реальними API й парними screenshots. Actor desktop отримав погоджений baked фон5340:4508 без повторного crop; phone Person має власну навігацію й Back під час loading/error. Специфічний F1 phone artwork лишається data gap. Не всі READY frame/state мають закриту композицію; точні API/data gaps лишаються відкритими в матриці.
- Спільний modal hook блокує фон через inert, утримує фокус і повертає його. Реальні Followers sheet та MovieActionSheet перевірено; native OS Share, реальна екранна клавіатура й нативний200% zoom не заявляються як перевірені.
- Admin loading24cases/text20030cases та owner-review detail Save/Delete/Retry/ownership перевірено; placeholders профілів identity6cases без overflow. Остання інтеграційна `verify:build` пройшла TypeScript/Vite,251 modules. Це технічна перевірка. Backend на ізольованій MySQL:90 tests,0 failures/errors/skips. Docker API/web чисто перебудовано й оновлено; .env і DB volume збережені. Повторний повний browser run158/158 без skips. Окремий Admin12/12 без skips, API/security/contracts/cache/concurrency/reset/ER/backup-restore/Caddy/config scripts пройшли. Backend `c7cb26a` та UI `aba9e03` уже в origin/master; CI / verify для `aba9e03` успішний. Поточні тести й документація ще потребують фінального commit/push та повторного CI.

Докази й обмеження: [Release evidence](../operations/RELEASE_EVIDENCE.md), [Figma handoff](../frontend/FIGMA_HANDOFF.md). Парні знімки та JSON — в ігнорованому `artifacts/visual-audit-20261028/`.

## Далі

- Person actor/director: refreshed Actor READY `545:676`/`551:705`/`721:1085` and Director `547:904`/`731:1085`/STATE `736:1339`; matched live Docker1440/393 captures for real API actor85 and director19. Hero/avatar/content anchors measured, no overflow or page errors. Sparse filmography, absent biography/secondary credits and actor phone F1 art remain API/data gaps; no Figma samples were copied. Pair: `artifacts/visual-audit-20261028/home-person/{actor-85,director-19}-uk-{1440,393}.png`. No code/build/tests in this inspection; expanded biography remains unpopulated.

The earlier full regression evidence below is historical for a prior implementation checkpoint. Per the current sequencing, repeat the full suite only after the remaining implementation blocks are closed.

1. Усунути збої браузерного набору й повторити full suite; окремо всі обов’язкові Admin-сценарії без skips.
2. Full Playwright158 tests із disposable ADMIN fixture, окремі Admin-сценарії й scripts API/security/contracts/reset/schema/cache/concurrency/backup/config/Caddy; виправити фактичні збої.
3. Docker UI/API smoke, scoped review/commits/push і зелений CI. Матриця268 тепер містить конкретні докази або API/data/render/component gaps; це не blanket pixel-perfect погодження.

## Погоджені межі

Усі12 Admin links; mobile PublicProfile Search; прямий Login/Register; Contact `anonimua910@gmail.com`; nullable `ProfileReview.moviePhotoUrl`. Цільовий шрифт Inter замінює попередню домовленість про системний fallback. Реальні API мають пріоритет; нових endpoints/DTO/migrations заради макетів не додавати. OAuth/Remember me/phone recovery, ranked state, окремі Featured/Crew feeds, відсутні profile/person/Admin поля й Journal rich content лишаються документованими gaps. Недоступні matched-width перевірки й попередній PublicList/Ranked виняток не перетворюються на parity claim. Незв’язані дипломні артефакти, локальний AGENTS.md, secrets, backups і references — поза commits; VPS/production deployment окремо.


### Admin shell heading hierarchy — 30.10.2026

Fresh READY sources `1218:2982`, `1237:4369`, and `1344:5249`: only Dashboard keeps the shell “Workspace” heading; content routes use their own heading. Lists localizes “All Lists”, User Profile keeps its generic heading screen-reader accessible. All 12 direct links remain. Paired UK runtime screenshots captured at1440/393 using Source-Vite + live Docker API. All 12 links remain; active route is visible, no horizontal overflow or page errors. Content behavior and full parity remain open.


### Admin Moderation `1399:3300` — 30.10.2026

Re-fetched current Figma. Designer decision: treat the complete `1399:3300` Moderation screen as an API gap. No partial `More Users` route or report fields/actions. Existing moderation queue is separate supported behavior; UK1440/393 runtime pair documents the gap and does not claim frame parity.

### Admin content routes responsive capture — 30.10.2026

Source-Vite + live Docker API, UK1440/393 captures for Reviews, Comments and Movies: `artifacts/visual-audit-20261030/admin-content-routes/`. At desktop each content section is x120/width1200; at phone x16/width361. Active Admin navigation remained visible, page `scrollWidth` matched the viewport and browser page errors were0. Screenshots show API-backed rows and supported actions, not full Figma parity. The disposable fixture used long generated names and records without posters; this makes some text wrapping and placeholder artwork unsuitable as content-quality evidence. Reviews report/edit and Comments reported/edit actions stay documented API gaps. `npm run verify:build` passed after heading updates (technical check only); full regression is still pending.

- Docker local refresh (01.11): clean API/web image rebuild succeeded; Compose restarted only app services after resolving an exact workspace-owned Vite port conflict. Web and API health returned200/UP, DB and Redis healthy, `.env` hash unchanged and named data volumes present. Prior image IDs and rollback tags are recorded in Release Evidence. This is infrastructure smoke only; final suite/release checks remain pending.
