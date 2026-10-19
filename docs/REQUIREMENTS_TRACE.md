# Rewind — відповідність поточного коду отриманому ТЗ

Стан історичної таблиці нижче — 16.10.2026. Джерело вимог: [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md). Технічна карта і фактичні API: [PROJECT_MAP.md](PROJECT_MAP.md); результати HTTP перевірки: [API_AUDIT.md](API_AUDIT.md). Статус «є в API» не означає, що функція доступна на сайті. Статус «не знайдено» означає, що реалізації немає у відповідному історичному baseline, а не що пункт вилучено з ТЗ.

## Актуальний verified snapshot — 19.10.2026

Цей блок має пріоритет для оцінки поточного стану коду; історичні таблиці нижче збережені для трасування початкового аудиту.

| Вимога | Поточний перевірений стан | Доказ / що ще відкрито |
| --- | --- | --- |
| Реєстрація, вхід, reset password | **Працює в API та UI** | Cookie auth, CSRF, refresh rotation, Mailpit reset flow через `/auth/forgot-password` і `/auth/reset-password`; потрібні лише Figma parity та production SMTP monitoring. |
| Головна: популярне, останні перегляди, відгуки, списки, журнал | **Працює в API та UI** | Home має popular/new films, recent watched, popular reviews/lists/reviewers/tags і локалізований latest-journal block; public feeds виключають деактивованих авторів; точна Figma visual parity та ширші social browser-регресії відкриті. |
| Каталог, пошук, фільтри, пагінація | **Працює в API та UI** | Genre/year/rating/sort/page, details, actors/directors/producers and filmographies, trailer/external rating, public-list catalog server pagination, loading/error/retry; producer slice verified by `ProducerIntegrationTests` + browser flow. TMDB scheduler/data-quality batch і Figma parity відкриті. |
| Watched/watchlist/favorites, ratings, reviews | **Працює в API та UI** | Core Chrome flow і MySQL integration tests; стабільна review pagination, mutation locks; ширші browser UX-регресії відкриті. |
| Коментарі до оглядів | **Працює в API та UI** | CRUD/moderation, pagination, visibility filters, active-author privacy filter, admin queue/bulk hide; ширше moderation regression coverage відкрите. |
| Профіль, налаштування, списки | **Працює в API та UI** | Own/public profiles, account social-links CRUD/display, server pagination, loading/error/retry/empty, mobile flow; повна локалізація динамічних даних і Figma parity відкриті. |
| Публічні списки/профілі | **Гостьовий read flow працює** | `permitAll` public collections/lists, profile browser flow, active-user guard для profile/network/activity/list catalog/detail, 320/768/1280px overflow checks; exact Figma visual/social UX audit відкритий. |
| Соціальні функції | **Основний scope працює** | Follow/like/activity/tags, notifications/SSE, messages, HQ, stable pagination, user blocking with follow/message guards, public-list likes with recently-liked/team feeds; ширші social/browser-регресії відкриті. |
| Журнал і службові сторінки | **Основний scope працює** | Journal/archive/server-paged catalog/podcast/newsletter/help/legal/admin editor; відкрита повна локалізація довільного editorial content і production SMTP monitoring. |
| Адміністрування | **Основний scope працює** | Paged users/lists/reviews/comments/movies/conversations/notifications/articles/audit, moderation/settings; UI керує ролями USER/ADMIN, server guard не дозволяє self-removal або втрату останнього активного ADMIN, причина відмови локалізована в UI; headed Chrome **12/12**, ширше UI-покриття відкрите. |
| Безпека й якість | **Локально перевірено** | V31 schema **38 tables / 55 FKs**, producer/blocking/list-like integrations green, повний MySQL suite **69/0/0/0 у 37 класах**, producer browser flow 1/1, 12/12 admin Chrome у credentialed середовищі, WCAG/axe, backup/restore **188|448|31**, OpenAPI **156/127**; production capacity і VPS/HTTPS відкриті. |
| Дизайн, бренд, адаптивність | **Visual alignment локально завершено** | Responsive matrix на 320/393/768/1440px, bilingual UI, accessibility/overflow evidence, diploma materials і локальний WebM demo готові; Chrome inventory підтвердив desktop Global Search `1480:7490`/`7445`/`7390`/`7311`/`7256`, search-by-tags `1480:6898`/phone `1480:8527` та journal-search `1480:7549`/phone `1480:8889`. Figma Editor access і pixel-perfect parity відкриті. |

## Поточна доказова база

> Таблиця нижче — **історичний baseline станом на 16.10.2026**. Вона збережена для трасування початкового аудиту й не повинна використовуватися як поточний статус. Для release-рішень authoritative є verified snapshot вище, `PLAN.md`, `PROGRESS.md` і `RELEASE_EVIDENCE.md`.

- `mvnw.cmd -q test` із Compose MySQL `127.0.0.1:3307`: **69 tests, 0 failures, 0 errors, 0 skipped** у 37 класах; producer + TMDB sync regression green. Після V31 schema verifier підтвердив **38 tables / 55 foreign keys**, backup/restore — **182|428|31**.
- Full Playwright suite: **28 passed, 12 skipped, 0 failed**; producer flow — **1/1**, Journal design flow — **1/1**; admin suite skipped without dedicated E2E credentials, а credentialed headed run має **12/12**.
- API health `UP`; свіжі API/Web logs без `ERROR|Exception|connect() failed`; `git diff --check` без помилок.
- Детальні дати й команди збережені у [PROGRESS.md](PROGRESS.md), короткий статус — у [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) та [PLAN.md](../PLAN.md).

| Вимога | Поточний стан | Деталі / наступна точка інтеграції |
| --- | --- | --- |
| Реєстрація й вхід | **Працює в API та UI** | `/api/auth/register`, `/login`; React `/register`, `/login`. Валідацію і стани помилок треба зіставити з Figma. |
| Скидання пароля через email | **Лише UI** | `/forgot-password` показує форму, але потрібного backend endpoint-а й повного email/reset сценарію немає. |
| Каталог і пошук за назвою | **Працює частково** | `/films` показує першу сторінку та шукає за назвою. Картка фільму не відкриває деталі, UI пагінації немає. |
| Жанр/рік/рейтинг, сортування | **Є в API, немає в UI** | `/api/movies/search` приймає `genreId`, `year`, `minRating`, `sort`, `page`, `size`. Потрібні елементи інтерфейсу каталогу. |
| Деталі фільму, актори, режисери, жанри, трейлер, зовнішній рейтинг | **Є в API, немає сторінки** | `/api/movies/{id}` повертає розширену інформацію; для неї потрібен маршрут і React-екран. Наявність полів у кожному фільмі залежить від даних. |
| Схожі фільми | **Підтримка в схемі та API** | `similar_movies` існує, але демо seed його не наповнює; у UI блока немає. |
| Переглянуто, watchlist, улюблене | **Є в API, немає підключеного UI** | Системні списки створюються при реєстрації, API змінює їх; дії видалення наразі дають 500. |
| Оцінка 1–5 | **Є в API; UI компонент не підключено** | Додавання оцінки перевірено; видалення повертає 500. |
| Огляди: створення, зміна, видалення | **Є в API, немає підключеного UI** | Створення перевірено, видалення повертає 500. Публічний GET списку оглядів наразі вимагає JWT. |
| Коментарі до оглядів | **Немає бекенду; UI лише заготовка** | Немає таблиці й API. `Comments.tsx`/`comments.api.ts` написані, але не змонтовані і звертаються до відсутніх endpoint-ів. |
| Власний профіль, налаштування | **Є в API; UI не підключено і має розбіжний контракт** | `/api/profile/me`, зміна даних/пароля та системні списки є. `Profile.tsx` не має маршруту та використовує несумісний `/users/me` для оновлення. |
| Кастомні списки | **Є в API; UI не підключено** | Створення й додавання елемента перевірено. `UserLists.tsx` не має маршруту; видалення елемента дає 500. |
| Публічні списки/профілі | **Частково в API** | Є публічні картки списків і `GET /users/{id}`, але GET списків захищений JWT, читання елементів чужого списку не реалізовано. Публічний профіль не охоплює всю активність з ТЗ. |
| Адміністрування | **Частина API, UI немає** | Є API фільмів, користувачів і модерації відгуків. Dashboard, коментарі, списки, соціальні модулі, черга/логи модерації та налаштування сайту відсутні. |
| Дизайн, бренд, адаптивність | **Початковий UI, чекає Figma** | Реальні екрани й дефекти верстки описані в `FIGMA_HANDOFF.md`; при вузькому viewport є горизонтальне переповнення. |
| Пагінація, loading/empty/error | **Частково** | Backend повертає Spring `Page`, але каталог не дає перейти на інші сторінки; повний набір станів для екранів ще не реалізований. |
| Ролі і захист доступу | **Базові механізми є; потрібен аудит** | Spring Security/JWT і `USER`/`ADMIN` присутні. Поточний `GET /users/{id}` використовує `PublicUserResponse` без email; це закріплено MockMvc-регресією в `PublicProfileIntegrationTests`. Ширший authorization/SQLi/XSS audit і production hardening залишаються відкритими. |
| Продуктивність і масштабування | **Не підтверджено** | Є JPA репозиторії, але немає доказів виконання вимог до кешування, навантаження, профілювання запитів чи роботи в масштабі. |

## Розширені UX/UI сценарії з ТЗ

| Сценарій | Стан реалізації |
| --- | --- |
| Головна з популярним, активністю, відгуками, списками, історіями/новинами/обговореннями | Окремої головної немає; `/` веде на `/films`. Агрегації та соціальна активність не реалізовані. |
| Категорії фільмів, щотижневі блоки, пошук-модалка | Частково є загальний каталог/пошук; персоналізованих і тижневих блоків немає. |
| Рекомендовані/командні/вподобані списки, теги | Немає потрібних моделей, вибірок і екранів. |
| Хаб користувачів, популярні рецензенти, HQ | Немає відповідних публічних API й екранів. |
| Актор, режисер, продюсер та фільмографія | Актори/режисери є в даних фільму; окремих сторінок/API фільмографії та моделі продюсерів немає. |
| Публічний профіль: likes, following/followers, графік, статистика | Повного публічного профілю та соціальних моделей немає. |
| Сповіщення, прив'язка соцмереж, блокування користувачів | Немає. |
| Journal, статті, подкасти, бюлетень/архів | Немає. |
| Службові сторінки, правила, безпека, видалення акаунта, локалізація | У поточному UI лише декоративний footer; сторінок, функцій і мультимовності немає. |
| Figma-прототипи, дослідження, логотип/дизайн-система, відеоролик | Це окремі дизайн-артефакти за ТЗ. Посилання та фінальні матеріали ще очікуються. |

## Розбіжність наданої ER-діаграми й поточної БД

Прикріплений у розмові малюнок показує ранню концепцію з `user_movie_lists` і `users.bio`. Актуальні міграції використовують `lists` + `list_items`, мають `users.display_name`, інші уточнення та додану підтримку TMDB поряд з IMDb. Для змін схеми слід брати міграції V1–V4 як фактичний стан, а текстове ТЗ та ER-зображення — як вимоги, які треба узгоджувати з майбутніми макетами й новими матеріалами.

## Відомі блокери користувацьких сценаріїв

У живому API відтворено HTTP **500** для чотирьох DELETE дій: видалення елемента кастомного списку, елемента системного списку, оцінки та огляду. Точні кроки й межі діагнозу є в [API_AUDIT.md](API_AUDIT.md). Перед запуском цих дій у UI їх треба виправити й повторно перевірити.
