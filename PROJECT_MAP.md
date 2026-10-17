# Rewind — карта проєкту

Актуалізовано 17.10.2026 за кодом, локальними збірками, MySQL інтеграційними тестами та HTTP сценаріями. Зовнішня папка `rewind-master` є обгорткою архіву; корінь Maven лежить тут. Git історія вже контрольована; CI і production deployment ще не додані. `target/`, frontend `dist/`, `node_modules/` і `src/.vs/` — локальні артефакти, а не вихідний код.

Надане замовником ТЗ збережено в [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md), а порівняння вимог із кодом — у [REQUIREMENTS_TRACE.md](REQUIREMENTS_TRACE.md).

## 1. Що це і як частини спілкуються

Rewind — каталог фільмів із обліковими записами, особистими оцінками, відгуками та списками. Бекенд: Java 17, Spring Boot 4.0.1, Spring MVC, Security, JPA, MySQL, Flyway, JWT. Фронтенд: React 18, TypeScript, React Router 6, Axios, Vite 5. Дані для демо зібрані з TMDB у готовому SQL файлі.

```mermaid
flowchart LR
    Browser[React / Vite :5173] -->|Axios HTTP /api + HttpOnly cookies| API[Spring Boot :8080]
    API --> Security[SecurityConfig + JwtAuthFilter]
    Security --> Controllers[Controllers]
    Controllers --> Services[Services]
    Services --> Repositories[Spring Data JPA repositories]
    Repositories --> MySQL[(MySQL :3306)]
    Flyway[Flyway V1–V20] --> MySQL
    Seed[seed_50_real.sql] --> MySQL
```

| Де шукати | Призначення |
| --- | --- |
| `pom.xml`, `mvnw.cmd` | Залежності та запуск Maven/JDK 17 |
| `src/main/java/com/rewind/rewind/RewindApplication.java` | Вхідна точка Spring, при старті друкує кількість користувачів |
| `src/main/java/com/rewind/rewind/{auth,user,movie,list,rating,review,profile,admin,comment,message,notification,journal,...}` | Функціональні модулі бекенду; у більшості є `controller`, `service`, `repo`, `entity`, `dto` |
| `src/main/java/com/rewind/rewind/security/` | Правила доступу, перевірка JWT, BCrypt |
| `src/main/resources/application.yml` | База, Flyway, JPA, пошта, JWT |
| `src/main/resources/db/migration/` | Послідовні SQL міграції V1–V20 |
| `src/main/resources/seed_50_real.sql`, `tmdb_seed_50.py` | Готове демо наповнення і його генератор |
| `letterboxd/letterboxd-login-figma-final2/src/App.tsx` | Реальні маршрути фронтенду |
| `letterboxd/letterboxd-login-figma-final2/src/api/` | Axios клієнт і виклики API |
| `letterboxd/letterboxd-login-figma-final2/src/context/AuthContext.tsx` | Вхід/вихід і перевірка сесії через HttpOnly cookies |
| `RUN_LOCAL.md` | Команди локального запуску, health/metrics і backup/restore |
| `scripts/backup-dev.ps1`, `scripts/restore-dev.ps1` | Відтворюваний дамп і відновлення MySQL |

### Ключові потоки

1. **Реєстрація:** `AuthController` → `UserService.register` перевіряє унікальність email/username, хешує пароль BCrypt, створює `USER`; `SystemListService` створює WATCHLIST, WATCHED і FAVORITES. Поле `displayName` спочатку дорівнює username.
2. **Вхід і доступ:** `UserService.login` перевіряє пароль і створює коротку cookie-сесію з відкличним refresh token. HttpOnly cookies додаються браузером автоматично; `JwtAuthFilter` на кожному запиті перевіряє access token, заново читає користувача з БД і бере актуальну роль/активність звідти.
3. **Каталог:** `MovieController` повертає сторінку карток, `MovieSearchController` будує JPA specification для назви, року, мінімальної оцінки, жанру й сортування. `MovieDetailsService` збирає жанри, режисерів, акторів, зовнішні оцінки, схожі фільми й прапорці поточного користувача.
4. **Власні дії:** системні списки зберігають переглянуте/бажане/улюблене. `RatingService` зберігає оцінку 1–5 і SQL запитом перераховує середнє в `movies.rating`. `ReviewService` створює текст+оцінку й синхронізує її з `ratings`.
5. **Профіль і адміністрування:** `ProfileService` читає власні списки та 10 останніх оцінок/відгуків, змінює display name/avatar/пароль. Адміністратор керує фільмами, користувачами й модерацією відгуків.

## 2. Дані й міграції

V1 створює 14 таблиць: `users`, `movies`, `actors`, `directors`, `genres`, зв'язки `movie_actors`, `movie_directors`, `movie_genres`, `lists`, `list_items`, `reviews`, `ratings`, `external_ratings`, `similar_movies`. Основні зв'язки: один користувач має списки/відгуки/оцінки; один список має елементи з фільмами; фільм має жанри, акторів, режисерів, зовнішні оцінки та зв'язки зі схожими фільмами.

| Міграція | Ефект |
| --- | --- |
| `V1__baseline.sql` | Базова схема та ключі; `ratings` має унікальну пару `(user_id, movie_id)`, `list_items` — `(list_id, movie_id)` |
| `V2__baseline.sql` | Умовно додає `movies.imdb_id` і `trailer_url`, якщо їх немає; у новій схемі V1 вони вже є |
| `V3__add_display_name_to_users.sql` | Додає `users.display_name` |
| `V4__align_reviews_and_ratings.sql` | Додає оцінку й поля модерації до `reviews`, TMDB до enum зовнішніх оцінок, розширює точність `movies.rating` |

`spring.jpa.hibernate.ddl-auto=validate`: Hibernate перевіряє схему, але не створює її. Flyway запускається при старті. SQL seed не є міграцією: його треба імпортувати окремо. Він містить 50 фільмів, жанри, акторів, режисерів, 50 зовнішніх TMDB оцінок і зв'язки; `similar_movies` він не наповнює. Локальна БД зараз має 50 фільмів, версію Flyway 4 і нуль користувачів. `movies.rating` у цих фільмів початково `null`, бо це середнє **користувацьких** оцінок, а TMDB зберігається окремо.

Генератор `tmdb_seed_50.py` звертається до TMDB `/configuration`, `/movie/popular`, деталей і credits; він формує `seed_50_real.sql`. У файлі генератора є API ключ. Під Python 3.11 синтаксичний розбір падає на рядку 141 через вкладений f-string; готовий SQL файл від цього не залежить.

## 3. Повна карта HTTP API

Запущений `/v3/api-docs` показує **50 операцій**. `P` = без токена, `U` = потрібен користувач, `A` = потрібен ADMIN. Позначення відображають фактичний `SecurityConfig`, а не коментарі в контролерах. Для сторінок відповідь — Spring `Page` з масивом `content`, метаданими сторінки й `totalElements`.

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| P | `POST /api/auth/register`, `POST /api/auth/login` | Створення користувача; JWT |
| P | `GET /api/movies`, `GET /api/movies/search`, `GET /api/movies/{id}` | Каталог, пошук, деталі |
| U | `GET /api/movies/{id}/details`, `GET /api/movies/{movieId}/status/me` | Деталі-аліас; власні прапорці та оцінка |
| U | `POST`, `DELETE /api/movies/{movieId}/watchlist` | Додати/забрати зі списку бажаного |
| U | `POST`, `DELETE /api/movies/{movieId}/watched` | Позначити/скасувати перегляд |
| U | `POST`, `DELETE /api/movies/{movieId}/favorite` | Додати/забрати з улюбленого |
| U | `PUT`, `DELETE /api/movies/{movieId}/rating`; `GET /api/movies/{movieId}/rating/me` | Власна оцінка |
| U | `GET`, `POST /api/movies/{movieId}/reviews` | Список видимих відгуків і створення; GET теж захищений |
| U | `PATCH`, `DELETE /api/reviews/{reviewId}` | Зміна/видалення власного відгуку |
| U | `GET /api/lists/my`, `GET /api/lists/public`, `POST /api/lists` | Власні списки, каталог публічних списків, створення; `/public` теж захищений |
| U | `PATCH /api/lists/{listId}` | Зміна свого CUSTOM списку |
| U | `GET`, `POST /api/lists/{listId}/items`; `DELETE /api/lists/{listId}/items/{movieId}` | Елементи власного списку |
| U | `PUT /api/lists/{listId}/items/reorder` | Порядок елементів CUSTOM списку |
| U | `POST /api/lists/{listId}/movies`; `DELETE /api/lists/{listId}/movies/{movieId}` | Аліаси для frontend клієнта |
| U | `GET`, `PATCH /api/profile/me`; `PUT /api/profile/me/password` | Власний профіль, його редагування, зміна пароля |
| U | `GET /api/profile/me/watched`, `/watchlist`, `/favorites` | Сторінки власних системних списків |
| P | `GET /api/users/{id}`, `GET /api/users/me` | Перший відкритий усім; `/me` без токена повертає 401 у самому handler |
| A | `POST /api/admin/movies`; `PUT`, `DELETE /api/admin/movies/{id}` | Створення, редагування, видалення фільму |
| A | `GET /api/admin/users`, `GET`, `PATCH /api/admin/users/{id}` | Пошук, перегляд і редагування користувачів |
| A | `POST /api/admin/users/{id}/activate`, `/deactivate` | Активація/деактивація |
| A | `GET /api/admin/reviews`; `POST /api/admin/reviews/{id}/hide`, `/unhide`; `DELETE /api/admin/reviews/{id}` | Модерація відгуків; UI підключено до dashboard |
| P | `GET /api/journal/articles`, `GET /api/journal/articles/{slug}` | Публічний журнал із мовним fallback |
| A | `GET`, `POST`, `PUT /api/admin/journal/articles` | Редактор і публікація статей із аудитом |
| A | `GET /api/admin/dashboard`, `GET /api/admin/audit-logs` | Лічильники та журнал адміністративних дій |
| A | `GET /api/admin/comments`; `POST /api/admin/comments/{id}/hide`, `/unhide`; `DELETE /api/admin/comments/{id}` | Модерація коментарів; UI підключено до dashboard |
| U | `GET`, `POST /api/conversations`; `GET`, `POST /api/conversations/{id}/messages`; `POST /api/conversations/{id}/read` | Приватні діалоги й повідомлення |
| U | `GET`, `PUT /api/notifications/preferences` | Налаштування сповіщень |

Пошук приймає `q`, `genreId`, `tag`, `year`, `minRating`, `sort`, `page`, `size`. Сортування: `newest`, `oldest`, `rating_desc`, `rating_asc`, `title_asc`; search обмежує розмір сторінки до 1–50. Базовий каталог сортує за ID спадно. DTO запитів і відповідей лежать поряд із відповідними модулями; ключові форми: реєстрація `{username,email,password}`, оцінка `{rating}`, відгук `{content,rating}`, створення списку `{name,description,isPublic}`, перестановка `{orderedItemIds}`.

Операційні endpoint-и: `GET /actuator/health` і `/actuator/health/{liveness|readiness}` відкриті для перевірки сервісу; `/actuator/metrics` потребує авторизації. У Compose Redis вмикається через `SPRING_CACHE_TYPE=redis`, а локальні тести використовують `spring.cache.type=none`.

Без авторизації поточний API повернув 200 для каталогу, пошуку, деталей та OpenAPI, 403 для `/api/lists/public`, `/api/movies/1/reviews` і `/api/profile/me`, 401 для `/api/users/me`. Ці статуси перевірені HTTP запитами; інші операції звірені з контролерами та security rules, але не проходили окремий наскрізний сценарій.

## 4. Фронтенд: що видно в браузері

`main.tsx` монтує `BrowserRouter` + `AuthProvider` + `App`. У `App.tsx` є тільки такі маршрути:

Актуальні локалізовані маршрути мають префікс `/uk` або `/en`: `/home`, `/films`, `/films/:id`, `/profile`, `/lists`, `/lists/discover`, `/lists/public/:id`, `/users/:id`, `/people/:type/:id`, `/notifications`, `/messages`, `/journal`, `/journal/:slug`, `/admin`, а також auth-маршрути. Старі URL перенаправляються на `/uk/...`.

Для майбутнього перенесення макетів, поточного вигляду екранів і відповідності Figma фреймів файлам див. [FIGMA_HANDOFF.md](FIGMA_HANDOFF.md).

| URL | Компонент | Стан |
| --- | --- | --- |
| `/` | redirect | Перекидає на `/films` |
| `/films` | `Search` | Завантажує першу сторінку каталогу й шукає за назвою; картки не відкривають деталі, пагінації в UI немає |
| `/login` | `Login` | Викликає `/auth/login`, зберігає JWT, переводить на `/films` |
| `/register` | `Register` | Викликає `/auth/register`; після успіху пропонує перейти на login |
| `/forgot-password` | `ForgotPassword` | Форма є, але `/auth/forgot-password` у бекенді відсутній |

`Header` показує Films, Journal та login/register або logout; для ADMIN доступна адмін-панель. Logout відкликає cookie-сесію. `Footer` має декоративні посилання без `href`. Логотип фактично зберігається як `public/logo.png.png`, і компоненти звертаються саме до нього. Font Awesome підключено з CDN у `index.html`.

| Написаний, але не підключений код | Стан контракту з API |
| --- | --- |
| `pages/Profile.tsx` + `api/profile.api.ts` | Профіль підключений до `GET/PATCH /profile/me` і `PUT /profile/me/password`; публічні колекції та статистика читаються окремо |
| `pages/UserLists.tsx` + `api/lists.api.ts` | `/lists`, `/lists/discover`, `/lists/public/:id` підключають власні й публічні списки, теги та порядок елементів |
| `components/Rating.tsx` + `api/ratings.api.ts` | Оцінка працює на сторінці фільму; відсутня оцінка нормалізується як `null` |
| `pages/Comments.tsx` + `api/comments.api.ts` | Коментарі відображаються в контексті огляду; публічний список виключає приховані модерацією записи |
| `auth/ForgotPassword.module.tsx` | Другий, неімпортований варіант екрана відновлення; робочий сценарій використовує `POST /auth/forgot-password` і одноразовий reset token |

Axios бере base URL із `VITE_API_URL` із fallback на `http://localhost:8080/api`; авторизація працює через HttpOnly cookies і `/users/me`. `tsconfig.json` має `strict: false`; команда `vite build` сама не запускає `tsc`, тому обидві перевірки виконуються окремо.

## 5. Локальний стан і перевірки

На цьому комп'ютері є JDK 17, Docker контейнер `rewind-mysql` (MySQL 8.4, порт 3306), запущені API на 8080 та Vite на 5173. Команди перезапуску й локальні змінні середовища — у `RUN_LOCAL.md`. Без них конфігурація БД у `application.yml` може не збігатися з Docker користувачем.

| Перевірка 16.10.2026 | Результат |
| --- | --- |
| `mvnw.cmd -q -DskipTests package` під Java 17 | Пройшла |
| `mvnw.cmd -q test` з локальними параметрами БД | Пройшла; єдиний тест піднімає Spring context; Flyway підтвердив 4 міграції |
| `npx tsc --noEmit` | Пройшла |
| `npm run build` | Пройшла, Vite зібрав 99 модулів |
| HTTP smoke check | Каталог, пошук, фільм за ID, OpenAPI та правила доступу відповідають як описано вище |
| Python 3.11 `ast.parse(tmdb_seed_50.py)` | Помилка синтаксису на рядку 141 |

Зелена збірка й context test **не** доводять, що всі функції API або непідключені екрани працюють. У проєкті немає змістовних інтеграційних API тестів і frontend тестів.

Пізніший тестовий сценарій через живий API підтвердив реєстрацію, вхід, створення списку, додавання фільму, оцінку й відгук. Чотири операції видалення повернули **500**: CUSTOM елемент, системний елемент, оцінка й відгук. Точні результати та очищення тестових даних — у [API_AUDIT.md](API_AUDIT.md).

Оновлення 17.10.2026: після цього аудиту транзакційні DELETE виправлені; `scripts/verify-api.ps1` і MySQL інтеграційні тести перевіряють реєстрацію → список → оцінку → огляд → редагування → видалення. Додані V5–V20, cookie auth, локалізовані маршрути, профілі, соціальні функції, повідомлення, HQ, адмін-аудит, модерація коментарів і журнал.

## 6. Конкретні проблеми та межі поточного стану

1. **Неповний користувацький шлях:** UI не має сторінки фільму, профілю, оцінок, власних і публічних списків, відгуків, адміністратора. Багато функцій є тільки в API. Відновлення пароля показане в UI, але endpoint-а немає; mail/reset налаштування в YAML поки ніде не використовуються.
2. **Публічний перегляд не збігається з задумом:** security вимагає токен для GET відгуків і GET `/lists/public`, попри їхні назви/коментарі. Для публічного списку є лише картка; endpoint перегляду чужих елементів відсутній.
3. **Дані та безпека:** `GET /api/users/{id}` відкритий і повертає email. У вихідних файлах зберігаються пароль БД, demo JWT secret та TMDB API ключ; їх слід прибрати з репозиторію перед публікацією. Login не перевіряє `isActive` перед видачею токена, хоча фільтр потім блокує доступ деактивованому користувачу.
4. **Цілісність відгуків/оцінок і видалення:** чотири DELETE дії вище відтворено з HTTP 500; ймовірна спільна причина — derived delete methods без транзакції в сервісах. `ReviewService` записує review, rating і середнє без спільної сервісної транзакції. Схема дозволяє кілька review одного користувача до одного фільму, але rating лише один; видалення одного review намагається видалити й rating. Адміністративне видалення review, на відміну від користувацького, rating не змінює.
5. **Дрібніші backend дефекти:** `AdminReviewService.list` ігнорує фільтр лише за `movieId` або лише за `userId`, якщо `hidden` не заданий. `MovieListService.reorderMyListItems` перевіряє довжину й належність ID, але не унікальність; повтор ID може залишити частину елементів без нового порядку. Вхідні `page/size` у більшості контролерів не нормалізовані, на відміну від пошуку.
6. **Операційні прогалини:** SQL seed імпортується вручну; Python генератор не розбирається під Python 3.11. Немає контейнерного опису всього застосунку, CI, deployment config чи тестового покриття функцій. `.gitignore` не виключає `node_modules`, `dist` і `.vs` фронтенду, якщо архів перетворити на Git репозиторій.

Ця карта потрібна як точка входу для наступних змін: спочатку вибрати користувацький сценарій, потім звірити його React компонент/API клієнт → контролер/DTO → сервіс/репозиторій → таблиці/міграції → реальна HTTP поведінка. Межі й невизначеність наведені прямо, щоб не сприймати сам факт компіляції за завершення функції.
