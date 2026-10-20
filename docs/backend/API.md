# Rewind — HTTP API

Карта основних контрактів, звірена 20.10.2026 з controllers, DTO та `security/SecurityConfig.java`. Повний машинний інвентар — runtime `/v3/api-docs`; його попередні counts і результати HTTP перевірок зберігаються лише у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md).

`P` — доступ без автентифікації, `U` — потрібен користувач, `A` — потрібен ADMIN. Публічний доступ не вимикає CSRF для mutation-запитів. Сесія використовує HttpOnly cookies; власність ресурсів і block/role guards додатково перевіряються сервісами.

Помилки application API мають JSON-контракт `timestamp`, `status`, `error`, `message`, `path` з `config/ApiExceptionHandler`. Захищені операції можуть повернути security `401/403` до входу в контролер. Для Spring `Page` відповідь містить `content`, метадані сторінки й `totalElements`; окремі endpoints повертають масиви або одиничні DTO.

## Auth

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| P | `POST /api/auth/register`, `POST /api/auth/login` | Створення користувача; JWT |
| P | `GET /api/auth/csrf`; `POST /api/auth/refresh`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password` | CSRF bootstrap, ротація/відкликання refresh, одноразове відновлення пароля; mutation-запити зберігають CSRF захист |

## Catalog

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| P | `GET /api/movies`, `GET /api/movies/search`, `GET /api/movies/{id}` | Каталог, пошук, деталі |
| P | `GET /api/movies/{id}/details` | Публічний alias повних деталей; auth додає власний контекст |
| U | `GET /api/movies/{movieId}/status/me` | Власні watched/watchlist/favorite прапорці та оцінка |
| P | `GET /api/actors/{id}`, `GET /api/directors/{id}`, `GET /api/producers/{id}` | Публічна filmography з sort/genreId; movie details links to all three crew types |
| U | `POST`, `DELETE /api/movies/{movieId}/watchlist` | Додати/забрати зі списку бажаного |
| U | `POST`, `DELETE /api/movies/{movieId}/watched` | Позначити/скасувати перегляд |
| U | `POST`, `DELETE /api/movies/{movieId}/favorite` | Додати/забрати з улюбленого |
| U | `PUT`, `DELETE /api/movies/{movieId}/rating`; `GET /api/movies/{movieId}/rating/me` | Власна оцінка |
| P | `GET /api/search/global`, `GET /api/genres`, `GET /api/tags/popular` | Global Search categories, genres і популярні list tags |

## Profile

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| U | `GET`, `PATCH /api/profile/me`; `PUT /api/profile/me/password`; `DELETE /api/profile/me`; `GET`, `PUT /api/profile/me/social-links` | Власний профіль, social-links CRUD, зміна пароля та захищене видалення акаунта з відкликанням сесій |
| U | `GET /api/profile/me/watched`, `/api/profile/me/watchlist`, `/api/profile/me/favorites` | Сторінки власних системних списків |
| P | `GET /api/users/{id}` | Публічна коротка identity; email не повертається |
| P | `GET /api/users/{id}/profile`, `/api/users/{id}/collections/{collection}`, `/api/users/{id}/lists`, `/api/users/{id}/liked-reviews` | Повний public profile, watched/watchlist/favorites, публічні списки та вподобані огляди |
| U | `GET /api/users/me` | Поточний користувач; без сесії — 401 |
| U | `GET /api/profile/me/ratings`, `/api/profile/me/reviews` | Сторінкові повні історії оцінок та оглядів |

Own `recentReviews` і paged `/api/profile/me/reviews` у поточному source містять nullable `moviePhotoUrl` із самого review.movie; poster не залежить від останніх 10 ratings. Main API image ще не оновлено; frontend лише для відсутнього поля (`undefined`) підтримує legacy fallback, explicit `null` зберігає missing-image state.

## Lists

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| U | `GET /api/lists/my`, `GET /api/lists/my/page`, `POST /api/lists` | Власні списки (масив / сторінка), створення CUSTOM списку |
| P | `GET /api/lists/public` | Сторінковий каталог публічних списків |
| P | `GET /api/lists/public/{listId}` | Деталі публічного CUSTOM списку з фільмами |
| P | `GET /api/lists/public/popular`, `/api/lists/public/recently-liked`, `/api/lists/public/team` | Популярні, нещодавно вподобані та HQ/team public-list feeds |
| U | `GET /api/lists/public/{listId}/like-status`; `POST`, `DELETE /api/lists/{listId}/likes` | Статус і зміна вподобання public list |
| U | `PATCH`, `DELETE /api/lists/{listId}` | Зміна/видалення свого CUSTOM списку |
| U | `GET`, `POST /api/lists/{listId}/items`; `DELETE /api/lists/{listId}/items/{movieId}` | Елементи власного списку |
| U | `PUT /api/lists/{listId}/items/reorder` | Порядок елементів CUSTOM списку |
| U | `POST /api/lists/{listId}/movies`; `DELETE /api/lists/{listId}/movies/{movieId}` | Аліаси для frontend клієнта |

## Reviews

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| P/U | `GET`, `POST /api/movies/{movieId}/reviews` | Гостьовий список видимих відгуків і захищене створення |
| U | `PATCH`, `DELETE /api/reviews/{reviewId}` | Зміна/видалення власного відгуку |
| P | `GET /api/reviews/recent`, `/api/reviews/popular`, `GET /api/reviews/{reviewId}`, `GET /api/reviews/{reviewId}/comments`, `/api/reviews/{reviewId}/likes` | Публічні огляди, коментарі та кількість вподобань; приховані записи фільтруються |
| U | `GET /api/movies/{movieId}/reviews/me`; `POST /api/reviews/{reviewId}/comments`; `PATCH`, `DELETE /api/comments/{commentId}` | Власний огляд, створення/редагування/видалення коментарів |
| U | `GET /api/reviews/{reviewId}/like-status`; `POST`, `DELETE /api/reviews/{reviewId}/likes` | Статус і зміна власного вподобання |

## Social

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| U | `GET`, `POST /api/conversations`; `GET`, `POST /api/conversations/{id}/messages`; `POST /api/conversations/{id}/read` | Приватні діалоги й повідомлення; blocked pairs не можуть почати/читати/надсилати |
| U | `GET /api/users/{id}/block-status`, `POST/DELETE /api/users/{id}/block` | Перевірка, встановлення й зняття блокування; блок також прибирає взаємні follow |
| U | `GET`, `PUT /api/notifications/preferences` | Налаштування сповіщень |
| P | `GET /api/users/hq`, `/api/users/directory`, `/api/users/popular-reviewers`; `GET /api/users/{id}/followers`, `/api/users/{id}/following`, `/api/users/{id}/activity`; `GET /api/activity/recent-watched` | Community, network, public activity і recent-watched feed |
| U | `GET /api/users/{id}/follow-status`; `POST`, `DELETE /api/users/{id}/follow`; `GET /api/activity/following` | Власні follow relations і activity feed |
| U | `GET /api/notifications`, `/api/notifications/unread-count`, `/api/notifications/stream`; `POST /api/notifications/{id}/read`, `/api/notifications/read-all` | Сторінкові notifications, unread, SSE та read actions |
| U | `GET /api/conversations/unread-count` | Кількість непрочитаних діалогів |

## Journal

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| P | `GET /api/journal/articles?category=...&year=...&month=...`, `GET /api/journal/articles/archive`, `GET /api/journal/articles/{slug}` | Публічний журнал із мовним fallback, фільтром розділу, архівом і навігацією за місяцями |
| U | `GET`, `PUT /api/newsletter/subscription` | Власна newsletter підписка |

## Admin

| Доступ | Метод і шлях | Призначення |
| --- | --- | --- |
| A | `GET`, `POST /api/admin/movies`; `PUT`, `DELETE /api/admin/movies/{id}` | Сторінковий список, створення, редагування, видалення фільму; dashboard має CRUD-форму |
| A | `GET /api/admin/users`, `GET /api/admin/users/{id}`, `GET /api/admin/users/{id}/overview`, `PATCH /api/admin/users/{id}` | Пошук, detail, агрегований overview (статистика, reviews/activity/audit) і guard-оване редагування ролі/активності |
| A | `POST /api/admin/users/{id}/activate`, `/api/admin/users/{id}/deactivate` | Активація/деактивація |
| A | `GET /api/admin/reviews`; `POST /api/admin/reviews/{id}/hide`, `/api/admin/reviews/{id}/unhide`; `DELETE /api/admin/reviews/{id}` | Модерація відгуків; UI підключено до dashboard |
| A | `GET /api/admin/moderation/queue` | Об'єднана сторінкова черга немодерованих оглядів і коментарів |
| A | `GET`, `POST /api/admin/journal/articles`; `PUT /api/admin/journal/articles/{id}` | Список, створення й редагування/публікація статей з аудитом |
| A | `POST`, `GET /api/admin/journal/articles/{id}/newsletter` | Постановка newsletter у чергу та статус доставки |
| A | `GET /api/admin/dashboard`, `GET /api/admin/audit-logs` | Лічильники та журнал адміністративних дій |
| A | `GET /api/admin/comments`; `POST /api/admin/comments/{id}/hide`, `/api/admin/comments/{id}/unhide`; `DELETE /api/admin/comments/{id}` | Модерація коментарів; UI підключено до dashboard |
| A | `GET /api/admin/lists`; `PUT /api/admin/lists/{id}/visibility?visible=...` | Сторінковий список списків з кількістю фільмів; приховування/публікація з аудитом; UI підключено до dashboard |
| A | `GET /api/admin/conversations`, `GET /api/admin/notifications`; `DELETE /api/admin/conversations/{id}`, `DELETE /api/admin/notifications/{id}` | Сторінковий огляд і audit-видалення діалогів/сповіщень |
| A | `GET /api/admin/settings`, `PUT /api/admin/settings/{key}` | Whitelist налаштувань сайту з аудитом; UI підключено до dashboard |
| A | `PUT /api/admin/users/{id}/hq`; `DELETE /api/admin/lists/{id}` | HQ-прапорець і видалення списків з аудитом |
| A | `POST /api/admin/moderation/{type}/{id}/hide`, `/api/admin/moderation/bulk-hide` | Одинична та групова модерація |
| A | `POST /api/admin/notifications`; `PATCH /api/admin/notifications/{id}/read`, `/api/admin/notifications/{id}/unread`, `PATCH /api/admin/notifications/read-all`; `DELETE /api/admin/notifications` | Створення, read/unread і групові дії над notifications |
| A | `POST /api/admin/movies/{movieId}/tmdb-sync`, `/api/admin/movies/tmdb-sync/batch`, `/api/admin/movies/tmdb-import`, `/api/admin/movies/tmdb-import/discover`; `GET /api/admin/movies/tmdb-quality` | TMDB sync/import і діагностика повноти каталогу |

## Параметри та середовище

Пошук приймає `q`, `genreId`, `tag`, `year`, `minRating`, `sort`, `page`, `size`. Сортування: `newest`, `oldest`, `rating_desc`, `rating_asc`, `title_asc`; search обмежує розмір сторінки до 1–50. Базовий каталог сортує за ID спадно. DTO запитів і відповідей лежать поряд із відповідними модулями; ключові форми: реєстрація `{username,email,password}`, оцінка `{rating}`, відгук `{content,rating}`, створення списку `{name,description,isPublic}`, перестановка `{orderedItemIds}`.

Операційні endpoint-и: `GET /actuator/health` і `/actuator/health/{liveness|readiness}` відкриті для перевірки сервісу; `/actuator/metrics` потребує авторизації. У Compose Redis вмикається через `SPRING_CACHE_TYPE=redis`, а локальні тести використовують `spring.cache.type=none`.

Параметр `tag` у movie search зараз фільтрує назву жанру (`hasGenreName`); list tags використовуються окремим list API. `orderedItemIds` містить IDs елементів списку, а не IDs фільмів. Journal endpoints приймають `language=uk|en`.

## Перевірка контрактів

Із кореня репозиторію на локальній тестовій БД/Compose:

```powershell
.\scripts\verify-api.ps1 -BaseUrl http://127.0.0.1:8081
```

Сценарій перевіряє видалення list item/watchlist/rating/review (`204`), duplicate review (`409`), збереження окремої оцінки після видалення review, відкликання refresh family після replay (`401`), validation/not-found contract та відсутність email у public profile. Використовуються disposable акаунти `example.invalid`; це не production-команда.

`CoreFilmFlowIntegrationTests` покриває основний film flow на MySQL. Команди Maven, конфігурація БД і CSRF/bootstrap описані в [RUN_LOCAL.md](../operations/RUN_LOCAL.md). Дати, результати й межі виконаних перевірок — лише в [release evidence](../operations/RELEASE_EVIDENCE.md).

Пов'язані матеріали: [Backend](README.md), [ER](README.md#схема-даних), [карта функцій](../../README.md#де-шукати-функцію).
