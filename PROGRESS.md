# Rewind — прогрес повного плану

Це робочий журнал для [повного плану розвитку](PLAN.md) і ТЗ. Оновлювати після **кожного перевіреного зрізу**: ставити `[x]` тільки коли є код, тест і відповідний наскрізний сценарій; `[ ]` означає відкриту роботу. Часткова реалізація зазначена в примітках і не робить етап завершеним.

Останнє оновлення: **17.10.2026**. Вихідна точка Git: `bf6507f`; зафіксовані зрізи охоплюють auth, каталог, профілі, списки, соціальні модулі, журнал, адмінку, rate limit/cache, health/metrics/backup, V22 індекси/N+1 (`965a610`), browser security headers/accessibility (`377cef1`), social/XSS/SQLi smoke (`e6532a0`), локальний load smoke (`8540405`), SSE reconnect (`66e2250`), backend security smoke (`e62a56`), admin browser smoke (`d7fdc99`), keyboard smoke (`0425783`), non-root API/розширений accessibility audit (`7b65a95`), production Compose overlay/secure profile (`22cc44a`), WCAG axe audit (`414234c`) і контрольований TMDB sync (`b6d5de2`). Поточні зрізи додають видалення кастомних списків, V24 podcast audio/newsletter, V25 newsletter subscriptions, V26/V27 newsletter outbox з ідемпотентністю/повторними спробами, hardening Redis cache/frontend dependencies, admin create/read/unread/delete notifications, notification filters/bulk actions, moderation queue filters/search/bulk hide, розширену authorization smoke, розширений local load matrix, актуальну ER-діаграму зі schema verifier і production deployment runbook/config validator. `AdminListIntegrationTests`, `JournalArticleIntegrationTests`, `AdminCommunicationIntegrationTests`, `AdminModerationQueueIntegrationTests`, `NewsletterIntegrationTests`, TypeScript/Vite build, Docker API/Web з Flyway 27, Redis cache verifier, security smoke і admin browser smoke пройдені; повний Maven suite після batch TMDB також пройшов: **39 тестів, 0 failures/errors**; повний Playwright після Node 22 image і повторної установки Chromium: **11 passed, 1 skipped**.

## 1. Основа проєкту й дизайн — в роботі

- [x] Ініціалізовано Git та збережено перевірені зрізи в окремих комітах.
- [x] Ключ TMDB і пароль БД прибрано з коду; локальні секрети створює `scripts/init-dev-env.ps1`, `.env` ігнорується Git.
- [ ] Ротувати раніше записаний TMDB-ключ у кабінеті провайдера; перевірити всі інші розкриті секрети.
- [ ] Отримати Editor-доступ до трьох Figma-файлів і через плагін зафіксувати затверджені desktop/mobile фрейми, стани, токени та assets. 17.10 Chrome підтвердив доступ до перегляду: Design-файл має названі Films/Lists/Search/review фрейми, обидві FigJam-дошки показують view/comment; `get_design_context` і `get_screenshot` через плагін усе ще повертають `don't have edit access`.
- [ ] Зіставити фрейми зі сторінками/компонентами, FigJam — з навігацією, ТЗ — з поведінкою.

## 2. Стабільний локальний продукт — в роботі

- [x] Flyway V5 обмежує один активний огляд на користувача й фільм; видалення огляду залишає оцінку.
- [x] Виправлено чотири DELETE 500 через транзакційні межі; HTTP перевірка повернула 204.
- [x] Публічний профіль більше не розкриває email; публічні деталі фільму доступні гостю.
- [x] Публічний профіль показує сторінкові watched, watchlist і favorites через `GET /api/users/{id}/collections/{collection}`. Маршрут відкритий тільки на читання; HTTP-сценарій підтверджує його доступність без cookie.
- [x] Обмежено page/size для основних endpoint'ів; додано базові відповіді 400/404/409.
- [x] `CoreFilmFlowIntegrationTests`, `PasswordResetIntegrationTests` і `RefreshSessionIntegrationTests` пройшли з реальною MySQL; `scripts/verify-api.ps1` перевірив cookie/CSRF, уніфікований контракт помилок для validation `400` і not-found `404`, список, оцінку, створення/редагування/видалення огляду та refresh-сесію. Після batch TMDB-зрізу повний Maven suite також підтвердив 39 тестів без failures/errors.
- [x] Додано базовий GitHub Actions CI для MySQL, Maven, TypeScript і Vite; локально виконано ті самі збірки.
- [x] Dev-профіль на чистій MySQL сам застосував міграції й імпортував 50 фільмів.
- [x] Перевірити локальний `docker compose up -d` після переходу на ECR-образи та Maven mirror. MySQL і Redis healthy, API `/actuator/health` повернув 200, Web повернув 200; API image зібрався з `BUILD SUCCESS`. Повністю чисту машину та production-параметри ще не заявляємо.
- [x] Автоматизовано Playwright-сценарій реєстрація → вхід → каталог → watchlist → оцінка → огляд → редагування → видалення огляду → видалення оцінки → прибирання з watchlist. Запуск проти Compose у Chrome: `1 passed (6.1s)`. Для Compose додано CORS origin `http://127.0.0.1:3000`.
- [x] Browser smoke на свіжому API/Vite пройшов реєстрацію → вхід → захищений профіль → `DELETE /api/profile/me` з правильним паролем: API повернув 204, logout завершився, а тестовий користувач зник із MySQL. Для браузерної локальної розробки Vite тепер змінює origin проксі, а Spring дозволяє `localhost/127.0.0.1:5174`.
- [ ] Завершити єдиний формат помилок і контрактні тести для всіх API, включно з конкурентними записами.
- [x] `ApiErrorResponse` уніфікує 400/404/409/422/500-подібні помилки з timestamp, status, error, message і path; додані validation/body/status handlers та `ApiExceptionHandlerTests`.

## 3. Спільний інтерфейс і акаунт — в роботі

- [x] Підключено маршрути профілю й списків; форми профілю приведено до контракту `/api/profile`.
- [x] Flyway V6, одноразове email-відновлення, форма нового пароля, локальний Mailpit; SMTP→лист→reset→новий login пройшов на чистій БД.
- [ ] Перенести **затверджені** Figma логотип, палітру, шрифти, UI-компоненти, header/footer і responsive стани.
- [x] Маршрути `/uk/...` і `/en/...`, перемикач мов і перенаправлення старих URL включно з reset token. У Chrome перевірено `/films` → `/uk/films`, англійський каталог/деталку та старе reset-посилання.
- [ ] Довести переклад усіх поточних і майбутніх екранів, повідомлень API та метаданих фільмів. Основні наявні маршрути вже мають словники UI; дані каталогу поки однією мовою.
- [~] Перевірити весь інтерфейс на 320px, 768px і desktop без горизонтального переповнення та з клавіатурою. Playwright підтвердив `/uk|en/home`, `/uk|en/films`, `/en/help`, `/uk/journal` на 320px без overflow; повний набір екранів і keyboard audit ще відкриті. Виправлено overflow home movie rows і footer nav.
- [x] Browser smoke перевірив `/uk/help` і `/en/help`: локалізація, footer-посилання та `document.documentElement.lang` працюють; desktop `/uk/films` не має горизонтального переповнення.
- [x] Повторний browser smoke через свіжий API `8093` і Vite `5174`: `/uk/journal` коректно показує empty state без статей, `/uk/films` показує 12 карток без overflow, `/en/help` має English heading/footer і `lang=en`. Старий процес на `8080` окремо повертав 403 для journal, тому локальний запуск має використовувати API з поточного коду.
- [x] Повний Playwright regression після TMDB/admin змін: **11 passed, 1 skipped** за 29.4 секунди; accessibility, axe, keyboard, security, core film, social і SSE сценарії пройшли.
- [x] Browser guard перевірено для `/uk/admin` без входу: маршрут перенаправляє на `/uk/home`, приватний dashboard не показується.
- [x] Playwright suite має 3 passing сценарії: core film flow, двомовні public routes на 320px без overflow і guest redirects для profile/lists/messages/notifications/admin.
- [x] Після додавання адмінського TMDB-контролю повторно пройшов guest guard Playwright: `/uk/admin` і приватні маршрути не відкриваються без входу (`1 passed`).
- [x] Dev proxy для Vite налаштовано як об'єкт із `changeOrigin: true`; CORS backend доповнено портом 5174. Це усунуло помилковий `Не вдалося зареєструватися` у браузері, коли прямий API і PowerShell уже працювали.
- [x] Auth переведено з `localStorage` на access cookie (15 хв) і відкличний refresh cookie (30 днів), HttpOnly, SameSite=Lax, Secure на HTTPS. Flyway V8 зберігає лише хеші refresh token; додано ротацію, виявлення повторного використання, CSRF-захист, logout і відкликання refresh-сесій після зміни/відновлення пароля. Maven/MySQL інтеграційні тести й HTTP-сценарії пройшли; в Chrome перевірено login → profile/lists → reload → logout.
- [x] Власний профіль показує та оновлює URL аватара разом із display name; клієнт перевіряє повний `http/https` URL. TypeScript і production build пройшли.
- [x] Власний профіль отримує й показує лічильники ratings, reviews, watched, watchlist і favorites без окремого API-запиту. MySQL-тест перевіряє ненульові значення, HTTP-скрипт — початковий контракт нового акаунта.
- [x] Власний профіль показує сторінкові історії watched, watchlist і favorites через захищені серверні колекції. HTTP-сценарій перевіряє, що доданий фільм з'являється у watchlist до видалення.
- [x] Власний профіль показує повні сторінкові історії оцінок і оглядів через `GET /api/profile/me/ratings` та `GET /api/profile/me/reviews`; MySQL-тест і HTTP-сценарій перевіряють обидва потоки.
- [ ] Завершити UX профілю та загальні стани помилок.

## 4. Фільми й пошук — в роботі

- [x] Каталог і пошук показують дані API, картки ведуть на детальну сторінку; публічну сторінку фільму перевірено у Chrome через Vite→API→MySQL.
- [x] Додано локалізовану головну `/uk/home` і `/en/home`: популярні та нові фільми, публічні списки, останні видимі огляди, loading/error/empty стани та переходи до каталогу. `HomeFeedIntegrationTests` перевірив MySQL-дані, `verify-api.ps1` — HTTP-контракти, Chrome — відображення через Vite→API→MySQL.
- [x] Базова деталка показує постер, опис, жанри, тривалість, режисерів, акторів і лише наявні зовнішні рейтинги.
- [x] Каталог підключено до `/api/movies/search`: жанр, рік, мінімальний рейтинг, сортування, пошук і пагінація; GET `/api/genres` відкритий для гостей. MySQL-тест перевірив фільтри/сортування/сторінки, HTTP-сценарій — контракт, Chrome — сторінку 2/5, комбінований фільтр та збереження URL при зміні мови.
- [ ] Повні empty/loading/error стани всіх екранів та звірка каталогу/головної з Figma. Каталог і головна вже мають ці стани, але інші екрани ще ні.
- [x] Сторінки акторів і режисерів доступні гостю через `/api/actors/{id}` та `/api/directors/{id}` і маршрути `/people/actor|director/{id}`; сторінка фільму посилається на персоналії, фільмографія має сортування. MySQL-тест та HTTP-сценарій пройшли для обох типів.
- [x] Деталка показує трейлер лише коли URL існує, інакше явний порожній стан; схожі фільми беруться зі `similar_movies`, а за відсутності зв’язків — до шести стрічок зі спільними жанрами. MySQL-тест і HTTP-перевірка підтвердили fallback без повернення самого фільму.
- [x] У UI персоналій додано фільтр жанру, що передає `genreId` до публічного API; TypeScript і production build пройшли.
- [x] Додано admin-only `POST /api/admin/movies/{movieId}/tmdb-sync`: явний `tmdbId`, V23 зовнішні ID для movies/genres/actors/directors, оновлення metadata/trailer, credits, TMDB external rating і similar links лише з локального каталогу. Додано `POST /api/admin/movies/tmdb-sync/batch` максимум на 20 пар із незалежними `SYNCED`/`FAILED` результатами та продовженням після помилки. API вимкнено за замовчуванням без `TMDB_ENABLED=true` та `TMDB_API_KEY`.
- [x] Адмінський React-екран показує для кожного фільму поле `TMDB ID`, кнопку синхронізації, стан виконання та результат із кількістю оновлених жанрів/акторів/режисерів. Клієнтний контракт додано в `admin.api.ts`; TypeScript і Vite production build пройшли.
- [x] Admin movie response тепер повертає збережений `tmdbId`, а адмінський UI відновлює його після reload і після sync. `AdminMovieIntegrationTests`, TypeScript і Vite production build пройшли.
- [x] Черга модерації тепер має серверну дію `POST /api/admin/moderation/{type}/{id}/hide`: вона перевикористовує audit-aware review/comment moderation services, прибирає елемент із черги й має кнопку в адмінському UI. `AdminModerationQueueIntegrationTests` (2 тести), TypeScript і Vite production build пройшли.
- [x] Повний `./mvnw -q test` після moderation queue actions пройшов без failures/errors; результат збережено у локальному `full-backend-after-moderation.log` (ігнорується Git).
- [x] `TmdbSyncIntegrationTests` пройшов на MySQL; Docker API перебудований із V23, Flyway провалідовав 23 міграції, health повернув 200. Після зміни повний browser набір має **11 passed, 1 skipped**, включно з axe-аудитом.
- [x] Після V23/non-root rebuild `scripts/verify-load.ps1 -Requests 200` повернув 200/2xx за 0.54 секунди, а `scripts/verify-security.ps1` знову підтвердив public 200, guest/protected 401 і login без CSRF 403. Це локальний smoke, не production load test.
- [x] Міграція V7 виправила 14 подвійно закодованих імен у старій локальній БД; браузер показав `Zoe Saldaña`, `HEX(name)` і контрольний SQL підтвердили результат.
- [~] Один фільм і batch до 20 записів синхронізуються контрольовано та перевірені `TmdbSyncIntegrationTests` на MySQL; залишаються повний імпорт каталогу, дедуплікація/якість всіх записів і ротація старого ключа провайдера.
- [ ] Звірити desktop/mobile UI з Figma. IMDb показувати лише після дозволеного джерела й доступу.

## 5. Особисті дії та списки — в роботі

- [x] У деталці доступні watched, watchlist, favorites, оцінка, створення огляду й додавання в список; API основного сценарію перевірено.
- [x] Сторінка власних списків створює список, показує елементи й видаляє фільм.
- [x] Додано `/api/movies/{id}/reviews/me`, редагування власного огляду й рейтингу в UI; Chrome підтвердив зміну тексту та оцінки 5→4 і синхронізацію з рейтингом фільму. MySQL-тест і HTTP-сценарій перевіряють оновлення та видалення огляду.
- [x] Коментарі під оглядами: Flyway V9, публічне читання, створення після входу, редагування автором, видалення автором або ADMIN; UI завантажує їх лише після натискання. `ReviewCommentIntegrationTests` перевірив права автора/іншого користувача/ADMIN у MySQL; `verify-api.ps1` пройшов create → list → edit → delete через HTTP. У Chrome створено й відредаговано коментар; рядок із HTML відображено текстом, без виконання.
- [x] Playwright перевірив кнопки видалення огляду й оцінки та стан watchlist у браузері; модерація коментарів уже підключена в адмінці.
- [x] Гість може відкрити публічний кастомний список за `/api/lists/public/{id}` і маршрутом `/uk|en/lists/public/{id}`; список показує автора і фільми у збереженому порядку, а картки головної ведуть на нього. MySQL-тест та HTTP-сценарій перевірили дані й доступ.
- [x] Власні кастомні списки у UI підтримують назву, опис, приватність/публічність та перестановку фільмів кнопками; системні списки лишаються без цих змін. MySQL-тест перевірив update і порядок, HTTP-сценарій пройшов create → 2 items → reorder → update → public detail.
- [x] Додано публічні профілі `/api/users/{id}/profile` і `/uk|en/users/{id}`: видимі огляди, публічні кастомні списки та лічильники активності без email, ролі чи службових полів. Інтеграційний тест і HTTP-сценарій перевірили контракт; головна веде на профіль автора.
- [x] Власний профіль має аватар, статистику, повну сторінкову історію системних колекцій, оцінок і оглядів; MySQL/HTTP-перевірки покривають контракти.
- [x] Додано автоматизований core browser flow; залишилися окремі browser-регресії соціальних/адмінських сторінок і візуальний UX профілю після доступу до Figma.

- [x] Адмінка отримала сторінковий список списків з кількістю елементів і дію приховування/публікації; дія записується в audit log. `AdminListIntegrationTests` пройшов на MySQL, frontend production build пройшов.
- [x] Повний `mvnw -q test` після admin lists пройшов: усі 25 тестів/сценаріїв без failures/errors; frontend production build також пройшов.
- [x] Повторний повний `mvnw -q test` після admin movie CRUD також пройшов: 25 тестів, 0 failures/errors.
- [x] Фінальний повний `mvnw -q test` після admin communications, error contract та user search/blocking пройшов: 28 тестів, 0 failures/errors.
- [x] Повний `mvnw -q test` після account deletion пройшов: 29 тестів, 0 failures/errors.
- [x] Повний `mvnw -q test` після moderation queue пройшов: 30 тестів, 0 failures/errors; TypeScript і production build також пройшли.
- [x] Повний `mvnw -q test` після site settings/V21 пройшов: 31 тест, 0 failures/errors; TypeScript і production build також пройшли.
- [x] Повторний повний `mvnw -q test` після journal category filter пройшов: 31 тест, 0 failures/errors.
- [x] Прибрано показані IDE-попередження: зайві імпорти видалено, deprecated Redis serializer замінено, JPA stream null-analysis локально анотовано; compile, 31 backend тест і frontend build пройшли.
- [x] Повторний повний `mvnw -q test` після dev CORS-зміни пройшов: 29 тестів, 0 failures/errors; frontend `npm run build` також пройшов.

## 6. Спільнота — в роботі

- [x] Підписки: Flyway V10 створює `follows` з FK, індексами, унікальністю пари та забороною self-follow. Є follow/unfollow/status, публічні пагіновані списки followers/following і UI у профілі. MySQL-тест перевіряє права та інваріанти; HTTP-сценарій перевіряє читання списку без cookie.
- [x] Вподобання оглядів: Flyway V11, унікальність user/review, public count, auth status і захищені like/unlike. Лічильник є під кожним оглядом, а авторизований користувач бачить like/unlike. MySQL-тест, HTTP-сценарій, TypeScript і production build пройшли; браузерна перевірка ще входить до загального набору регресії.
- [x] Активність: Flyway V12 зберігає події follow, rating, review і створення публічного списку. Доступні публічна сторінкова історія профілю та авторизована стрічка підписок; публічний профіль показує останні події. MySQL-тест, HTTP-сценарій, TypeScript і production build пройшли.
- [x] Популярні рецензенти: `GET /api/users/popular-reviewers` агрегує likes лише видимих оглядів одним group-by запитом, після чого завантажує публічні профілі пакетно. Блок головної веде на профілі; MySQL-тест, HTTP-сценарій, TypeScript і production build пройшли.
- [x] Теги й добірки: Flyway V13 додає нормалізовані `tags`/`list_tags`; автор списку задає до 10 тегів, публічний API фільтрує списки за slug і повертає популярні теги. Хмара тегів на головній веде до локалізованого каталогу добірок. MySQL-тест, HTTP-сценарій, TypeScript і production build пройшли.
- [x] Збережені сповіщення для нових підписок і вподобань оглядів: Flyway V14, сторінкова видача, unread/read/read-all, захист за recipient, локалізований `/notifications` і SSE-потік з повторним підключенням у клієнті. MySQL-тести та `scripts/verify-api.ps1` перевірили FOLLOW/read-all і REVIEW_LIKED; Playwright-мок розриву EventSource перевірив close → retry → нове підключення.
- [x] Налаштування отримання: Flyway V15 і захищений GET/PUT для follow/review-like подій; генерація подій перевіряє прапорці, UI дозволяє їх змінити. HTTP та MySQL перевірили значення за замовчуванням і оновлення.
- [x] Приватні direct-діалоги: Flyway V16, унікальна пара користувачів, сторінкові повідомлення, mark-read і серверна перевірка членства; `/uk|en/messages` та перехід із публічного профілю. MySQL-тест і `scripts/verify-api.ps1` перевірили створення, повторне відкриття, надсилання, читання та відмову outsider.
- [x] HQ-бейдж без платежів: Flyway V17 додає `users.is_hq`, admin-only `PUT /api/admin/users/{id}/hq`, публічний профіль повертає лише прапорець, UI показує HQ badge. MySQL-тест перевіряє призначення й відкликання; endpoint захищений загальним `/api/admin/**` правилом.
- [x] Browser social smoke: два реальні акаунти проходять register/login → follow public profile → unfollow state → logout/login → отримання follow notification. Повний Playwright набір після цього зрізу проходить **8/8**.

## 7. Журнал і службові розділи — в роботі

- [x] V25 додає приватну підписку користувача на newsletter (`GET/PUT /api/newsletter/subscription`) без повернення email у відповіді. Адмінський endpoint queue-ить опубліковану статтю категорії Newsletter/Бюлетень; одержувачами стають лише активні opt-in користувачі, дія пишеться в audit log.
- [x] V26/V27 додають `newsletter_deliveries`: унікальність article/user, PENDING/SENDING/SENT/FAILED/CANCELLED, обмежені повторні спроби й scheduled worker. `GET /api/admin/journal/articles/{id}/newsletter` повертає агреговані статуси, повторне queue-натискання ідемпотентне; admin UI має кнопку та лічильники queue/sent/failed.
- [x] `NewsletterIntegrationTests` перевіряє opt-in/opt-out, доставку тільки підписаному користувачу, ідемпотентність повторного queue та `FAILED → retry → SENT`; Docker API застосував Flyway V27. `scripts/verify-api.ps1` доповнений HTTP-перевіркою стану підписки.
- [x] Профіль React отримав двомовний перемикач newsletter, підключений до V25 API; TypeScript і production Vite build пройшли.

- [x] V20: мовні статті журналу `uk/en`, публічні list/detail endpoint-и з fallback поведінкою через language, адмінське створення/редагування/публікація з аудитом, UI `/uk|en/journal` і базовий редактор у `/uk|en/admin`; `JournalArticleIntegrationTests` та frontend build пройдені.
- [x] Журнал підтримує фільтр розділу через `GET /api/journal/articles?category=...`; UI має локалізований вибір Awards/Community/Interviews/Platform/Podcasts із тим самим language fallback. Інтеграційний тест перевіряє позитивний і порожній category result.
- [x] Додано `GET /api/journal/articles/archive` з агрегацією опублікованих матеріалів за роком/місяцем; UI показує локалізований архів, а інтеграційний тест перевіряє кількість матеріалів.
- [x] Архівні місяці стали навігацією: `GET /api/journal/articles?year=...&month=...` фільтрує публікації з мовним fallback, а UI має кнопку очищення фільтра; інтеграційний тест перевіряє поточний місяць.
- [x] Повторний повний `mvnw -q test` після архіву пройшов: 31 тест, 0 failures/errors; frontend `tsc --noEmit` і production build також пройдені.
- [x] Додано локалізовані службові маршрути `/help`, `/contact`, `/rules`, `/privacy`, `/film-data`, `/delete-account` і робочі footer-посилання; TypeScript та production build пройдені.
- [x] V24 додає `journal_articles.audio_url`, адмінський URL аудіо, podcast-плеєр на сторінці статті та локалізовані Podcasts/Newsletter фільтри. Повний backend (`mvnw -q test`), `JournalArticleIntegrationTests`, TypeScript/Vite build і Docker API зі схемою Flyway 24 пройдені; відправку бюлетеня винесено в окремі V25–V27 зрізи.
- [x] Допомога, контакти, правила, приватність і дані фільмів мають локалізовані службові маршрути та footer-посилання.
- [x] Видалення акаунта стало реальним захищеним flow: DELETE `/api/profile/me` вимагає поточний пароль, відкликає refresh-сесії й каскадно видаляє дані; UI додає пароль, попередження та вихід. `AccountDeletionIntegrationTests` перевірив неправильний/правильний пароль і відсутність користувача, frontend build пройшов.
- [x] Додано About/Credits, офіційний логотип TMDB і потрібне повідомлення про джерело; прибрано хибний підпис IMDb у футері. Точний дизайн ще залежить від Figma.

## 8. Повна адмінка — в роботі

- [x] V18: аудит адміністративних дій, dashboard із агрегованими лічильниками, керування HQ і базовий UI `/uk/admin` та `/en/admin`; `AdminAuditIntegrationTests`, backend compile і frontend build пройдені.
- [x] V19: приховування коментарів із публічного API, адмінські list/hide/unhide/delete endpoints, аудит дій і UI модерації коментарів; `ReviewCommentIntegrationTests` та frontend build пройдені.
- [x] Підключено наявну серверну модерацію оглядів до `/uk|en/admin`: сторінковий список, hide/unhide, reason і оновлення стану; frontend TypeScript і production build пройдені.
- [x] Додано admin paged `GET /api/admin/movies` і список фільмів у dashboard; `AdminMovieIntegrationTests` та frontend build пройдені.
- [x] Адмінський dashboard тепер створює, редагує та видаляє фільми через наявні API; форма має локалізовані підписи, URL-постер, дату, рейтинг і підтвердження видалення. `AdminMovieIntegrationTests` перевіряє create → update → delete, TypeScript і production build пройшли.
- [x] Додано admin-only сторінковий огляд діалогів і сповіщень з агрегованою кількістю повідомлень, статусом прочитання та ID учасників; email і пароль не повертаються. `AdminCommunicationIntegrationTests` перевірив MySQL-запити, TypeScript і production build пройшли.
- [x] Admin communications тепер мають `DELETE /api/admin/conversations/{id}` і `DELETE /api/admin/notifications/{id}` з ADMIN-захистом та audit log; dashboard має кнопки, а інтеграційний тест перевіряє каскадне видалення повідомлень.
- [x] Повторний повний `mvnw -q test` після admin communication management пройшов: 31 тест, 0 failures/errors; frontend TypeScript і production build пройдені.
- [x] Dashboard, користувачі/HQ, огляди й коментарі мають базові admin API/UI та аудит.
- [x] Users у dashboard отримали пошук за username/email/display name і activate/deactivate з аудитом; `AdminAuditIntegrationTests` перевіряє обидва переходи, TypeScript і production build пройшли.
- [x] Додано `GET /api/admin/moderation/queue`: об'єднує немодеровані огляди й коментарі в сторінкову чергу з типом, автором, текстом і часом; dashboard показує її окремим блоком. `AdminModerationQueueIntegrationTests` перевіряє обидва типи записів у MySQL.
- [x] Додано Flyway V21 і admin-only `GET/PUT /api/admin/settings`: whitelist `site_name`, `default_locale`, `maintenance_mode`, `journal_enabled`, валідація значень і audit log; dashboard дозволяє змінювати їх. `AdminSettingsIntegrationTests` перевіряє MySQL update та відмову для невідомих/некоректних значень.
- [x] `scripts/verify-admin-browser.ps1` готує disposable ADMIN fixture у dev MySQL і перевіряє browser flow: login → dashboard → user search → admin movie create/delete. Тест пройшов **1/1**; fixture видаляється після запуску.
- [~] Розширити admin UI для списків, повідомлень і сповіщень до повного керування; кастомні списки мають видалення, сповіщення — create/read/unread/delete, server-side filters за типом/станом/отримувачем і bulk read/delete. Moderation queue тепер має type/search filters, selection і bulk hide; відкритими лишаються ширше покриття серверних прав та regression flows.
- [x] Admin notifications отримали `POST /api/admin/notifications` для створення з перевіркою recipient/actor/review, `PATCH /api/admin/notifications/{id}/read|unread`, audit actions і локалізовані кнопки в dashboard. `AdminCommunicationIntegrationTests`, TypeScript/Vite, Docker API/Web і `verify-admin-browser.ps1` (створення notification у браузері) пройшли.
- [x] Admin notifications отримали серверні фільтри `type/read/recipientId`, `PATCH /api/admin/notifications/read-all` і `DELETE /api/admin/notifications` з транзакційними bulk діями та audit metadata. Інтеграційний тест перевіряє фільтрацію, масове прочитання й видалення; TypeScript/Vite, Docker API/Web і `verify-admin-browser.ps1` пройшли. Код у `06407b6`.
- [x] Admin lists отримали `DELETE /api/admin/lists/{id}` для кастомних списків із каскадним очищенням items/tags та audit log; системні списки видаляти заборонено. `AdminListIntegrationTests`, TypeScript і production build пройшли.
- [x] Moderation queue отримала server-side `type/query` фільтри, пошук за текстом/username, UI-вибір елементів і `POST /api/admin/moderation/bulk-hide` з обмеженням до 50 елементів, reason і повторним використанням індивідуальних audit-aware moderation rules. `AdminModerationQueueIntegrationTests`, повний backend, TypeScript/Vite, Docker API/Web і admin browser smoke пройшли. Код у `7d052c0`.
- [~] Блокування, черга модерації, аудит дій і налаштування сайту вже мають серверні дії; authorization smoke тепер охоплює кожен mapping admin-контролерів, а відкритими лишаються ширші moderation regression flows.

## 9. Якість і публічний реліз — в роботі

- [x] Додано configurable auth rate limit для login/register/forgot-password/reset-password із 429 + `Retry-After`; unit test перевіряє квоту та розділення endpoint-ів.
- [x] Додано optional Redis cache profile: compose піднімає Redis 7, API використовує Redis TTL 10 хв для гостьової деталки фільму й очищає кеш після admin update/delete; local tests працюють з `spring.cache.type=none`, compose config проходить.
- [x] Додано Actuator health/metrics з публічним health і захищеними metrics та відтворювані `scripts/backup-dev.ps1`/`restore-dev.ps1`; runtime health повернув 200, metrics без auth — 401, backup перевірено через реальний MySQL контейнер із `mysqldump --single-transaction --no-tablespaces`, відновлення — у тимчасову БД із 30 таблицями та подальшим cleanup.
- [x] Compose runtime перевірив Redis health (`redis-cli ping` → `PONG`) і запуск API з Redis service; `scripts/verify-cache.ps1` підтвердив гостьову деталку HTTP 200, Redis key `movieDetails::50`, TTL 599 секунд, `missDelta=1` і `hitDelta=3`. Додано no-arg конструктор `MovieCardResponse`, щоб Jackson Redis serializer коректно читав кешований `MovieDetailsResponse`; два послідовні запити й cache verifier тепер повертають 200.
- [x] Перевірено індекси й N+1 для основних read paths: Flyway V22 додав складені індекси для lists/list_items/reviews/ratings/movie_actors; `@EntityGraph` і fetch-план для movie details завантажують пов'язані дані одним запитом. На реальному MySQL `EXPLAIN` вибрав `idx_reviews_movie_visible_created`, `idx_lists_public_type_updated`, `idx_list_items_list_position`, `idx_ratings_user_updated` і `idx_movie_actors_movie_cast`; чистий Compose застосував V22, API health 200, details 200, Redis cache і 3 Playwright сценарії пройшли.
- [x] Додано browser security headers у Nginx (`CSP`, `nosniff`, `SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`). Playwright accessibility smoke перевіряє 7 публічних маршрутів на named controls, один видимий `h1`, mobile overflow і keyboard focus; окремий тест перевіряє 3 основні public routes без positive tabindex.
- [x] Розширено accessibility smoke на 7 public routes: landmarks `header/main/footer`, один `h1`, послідовність заголовків, alt для кожного зображення та href для кожного посилання. Після API rebuild повний набір пройшов **10 passed, 1 skipped**.
- [x] Security browser smoke перевіряє React escaping для review payload із `<img onerror>`, відсутність діалогу/XSS і пошук із SQL-подібним введенням без 500/alert; повний набір проходить **8/8**.
- [x] Додано `scripts/verify-load.ps1`: 200 паралельних guest-запитів до каталогу, деталки фільму, жанрів і журналу/архіву на Compose повернули `200=200` за 2.61 секунди; це розширена smoke-перевірка локального runtime, не production load test.
- [x] Додано `scripts/verify-security.ps1`: public catalog/health повертають 200, guest profile/admin і metrics — 401, звичайний авторизований користувач отримує 403 на кожному mapping admin-контролерів і write-операціях (users/HQ, movies/TMDB, reviews/comments, lists, moderation, notifications, conversations, journal/newsletter, settings), login без CSRF — 403. Це backend security smoke для локального runtime; повний penetration/load audit ще відкритий.
- [x] API production-like image тепер працює від non-root `appuser` (uid/gid 10001). Compose rebuild підтвердив `id=appuser`, health 200, security smoke і Redis cache smoke; browser набір після rebuild — **10 passed, 1 skipped**.
- [x] Додано `compose.production.yaml` і `.env.production.example`: окремі MySQL/Redis volumes без published database ports, non-root/read-only API, secure cookies, Redis, SMTP і production error policy. `docker compose ... config --quiet` пройшов, production API та web images зібрані успішно; стек навмисно не запускався з прикладовими секретами.
- [x] Додано `DEPLOYMENT.md`, `scripts/verify-production-config.ps1`, `scripts/backup-production.sh` і `scripts/restore-production.sh`: runbook описує VPS/DNS/HTTPS reverse proxy, secrets, rollout/rollback і restore drill; validator на secure test env перевірив HTTPS, сильні secrets, приватні DB/Redis/API, read-only API та loopback web binding; POSIX scripts пройшли shell syntax check у Redis-контейнері.
- [~] Залишаються глибші SQLi/XSS, behavior regression для moderation, production load та перевірка повного відновлення у тимчасову БД.
- [x] Backup/restore перевірено фактично: `backup-dev.ps1` створив dump, `restore-dev.ps1` відновив його в тимчасову схему, контрольний запит повернув `50` movies і `21` Flyway migration, після чого тимчасову схему видалено. Основна БД не змінювалась.
- [x] Додано `@axe-core/playwright` і повний WCAG 2 A/AA аудит для 7 публічних маршрутів; axe повернув 0 violations. Повний Playwright набір після цього має **11 passed, 1 skipped**; admin сценарій окремо лишається перевіряти fixture-скриптом.
- [x] Оновлено production-залежності до Axios `1.20.0`, React Router `7.18.4`, `follow-redirects` `1.16.1` і `form-data` `4.0.6`; Docker web image переведено на Node `22-alpine`, щоб відповідати engine `@axe-core/playwright`; Docker API отримав BuildKit cache для Maven. `npm ci`, TypeScript, Vite build, Docker web build і повний Playwright після міграції — **11 passed, 1 skipped**. `npm audit --omit=dev` повертає **0 production vulnerabilities**. Повний dev-аудит окремо лишається відкритим: npm audit quick endpoint повертає `400`, тому advisory не вигадую і не застосовую небезпечний `--force`.
- [~] Базову доступність, keyboard focus, mobile overflow, browser security headers, non-root runtime і admin/social browser flows перевірено; залишаються глибші SQLi/XSS, права, production load та VPS/HTTPS.
- [~] Production-like конфігурація, runbook, приватні DB/Redis volumes і backup/restore scripts підготовлені. Залишаються Linux VPS, реальний домен/HTTPS, production secrets, monitoring/backup schedule і публічний запуск.

## 10. Захист і презентація — в роботі

- [ ] Звірка з затвердженими Figma-фреймами та UX-сценаріями, дизайн-система, прототипи.
- [x] Створено актуальну migration-backed ER-діаграму в `ER_DIAGRAM.md` для 33 прикладних таблиць і self-reference `similar_movies`; `scripts/verify-er-schema.ps1` на Compose перевіряє newsletter outbox та foreign-key relationships.
- [ ] Демодані, фінальна відеопрезентація й точна Figma-звірка ще відкриті.

## Негайний наступний крок

1. Розширити production load/security checks і перевірити сценарій відновлення у тимчасову БД.
2. Розширити backend security/load checks та зберегти сценарій відновлення у тимчасову БД.
3. Перевірити пакетний TMDB import/update на контрольному наборі й додати звіт якості каталогу.
4. Після Editor-доступу зафіксувати точні Figma-фрейми, tokens і assets; до цього не підміняти макети припущеннями.
