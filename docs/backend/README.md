# Rewind — backend

Java 17, Spring Boot 4.0.1, Spring MVC/Security/JPA, MySQL, Flyway і Redis.

## Архітектура

`backend/src/main/java/com/rewind/rewind/` організовано за функціями (`movie`, `list`, `review`, `profile`, `social`, `journal`, `admin` тощо): controller → service → repository/entity, з DTO на HTTP-межі. `security/` — JWT/CSRF/доступ, `config/` — спільні налаштування й помилки, `tmdb/` — імпорт каталогу та credits.

Auth використовує HttpOnly cookies, хешовані refresh-токени з ротацією та CSRF без servlet session. JWT filter перевіряє актуальну роль/активність; сервіс — власника ресурсу й блокування.

[HTTP API](API.md) · [Локальний запуск](../operations/RUN_LOCAL.md) · [Карта проєкту](../../README.md)

## Схема даних

Нижче — усі 37 прикладних таблиць і 55 FK-зв'язків після V1–V31, без службової таблиці Flyway. Показано ключові поля; повний DDL — у [`db/migration`](../../backend/src/main/resources/db/migration/). Hibernate використовує `ddl-auto=validate`; схему змінюють лише нові Flyway migrations.

```mermaid
erDiagram
USERS {
    BIGINT id PK
    VARCHAR username UK
    VARCHAR email UK
    ENUM role
    BOOLEAN is_active
    BOOLEAN is_hq
}
MOVIES {
    BIGINT id PK
    BIGINT tmdb_id UK
    VARCHAR imdb_id UK
    VARCHAR title
    DATE release_date
    DECIMAL rating
    VARCHAR trailer_url
}
ACTORS { BIGINT id PK VARCHAR name BIGINT tmdb_id UK }
DIRECTORS { BIGINT id PK VARCHAR name BIGINT tmdb_id UK }
PRODUCERS { BIGINT id PK VARCHAR name BIGINT tmdb_id UK VARCHAR photo_url }
GENRES { BIGINT id PK VARCHAR name UK BIGINT tmdb_id UK }
MOVIE_ACTORS { BIGINT movie_id PK BIGINT actor_id PK VARCHAR character_name INT cast_order }
MOVIE_DIRECTORS { BIGINT movie_id PK BIGINT director_id PK }
MOVIE_PRODUCERS { BIGINT movie_id PK BIGINT producer_id PK }
MOVIE_GENRES { BIGINT movie_id PK BIGINT genre_id PK }
LISTS { BIGINT id PK BIGINT user_id FK ENUM list_type BOOLEAN is_public }
LIST_ITEMS { BIGINT id PK BIGINT list_id FK BIGINT movie_id FK INT position }
REVIEWS { BIGINT id PK BIGINT user_id FK BIGINT movie_id FK TINYINT rating BOOLEAN is_hidden BIGINT moderated_by FK }
REVIEW_ARCHIVE { BIGINT id PK BIGINT user_id BIGINT movie_id }
RATINGS { BIGINT id PK BIGINT user_id FK BIGINT movie_id FK TINYINT rating }
EXTERNAL_RATINGS { BIGINT id PK BIGINT movie_id FK ENUM source DECIMAL rating INT votes_count }
SIMILAR_MOVIES { BIGINT movie_id PK BIGINT similar_movie_id PK }
COMMENTS { BIGINT id PK BIGINT review_id FK BIGINT user_id FK BOOLEAN is_hidden BIGINT moderated_by FK }
FOLLOWS { BIGINT id PK BIGINT follower_id FK BIGINT following_id FK }
REVIEW_LIKES { BIGINT id PK BIGINT review_id FK BIGINT user_id FK }
USER_ACTIVITIES { BIGINT id PK BIGINT user_id FK BIGINT movie_id FK BIGINT review_id FK BIGINT list_id FK BIGINT related_user_id FK }
TAGS { BIGINT id PK VARCHAR name VARCHAR slug UK }
LIST_TAGS { BIGINT list_id PK BIGINT tag_id PK }
NOTIFICATIONS { BIGINT id PK BIGINT recipient_id FK BIGINT actor_id FK BIGINT related_user_id FK BIGINT review_id FK VARCHAR notification_type TIMESTAMP read_at }
NOTIFICATION_PREFERENCES { BIGINT user_id PK BOOLEAN follows_enabled BOOLEAN review_likes_enabled }
PASSWORD_RESET_TOKENS { BIGINT id PK BIGINT user_id FK VARCHAR token_hash UK TIMESTAMP expires_at TIMESTAMP used_at }
REFRESH_SESSIONS { BIGINT id PK BIGINT user_id FK VARCHAR token_hash UK TIMESTAMP expires_at TIMESTAMP revoked_at }
CONVERSATIONS { BIGINT id PK BIGINT user_one_id FK BIGINT user_two_id FK }
MESSAGES { BIGINT id PK BIGINT conversation_id FK BIGINT sender_id FK TIMESTAMP read_at }
ADMIN_AUDIT_LOGS { BIGINT id PK BIGINT admin_id FK VARCHAR action VARCHAR target_type BIGINT target_id }
JOURNAL_ARTICLES { BIGINT id PK VARCHAR slug VARCHAR language VARCHAR category BIGINT author_id FK VARCHAR audio_url BOOLEAN is_published }
NEWSLETTER_SUBSCRIPTIONS { BIGINT id PK BIGINT user_id FK UK BOOLEAN is_subscribed TIMESTAMP subscribed_at TIMESTAMP updated_at }
NEWSLETTER_DELIVERIES { BIGINT id PK BIGINT article_id FK BIGINT user_id FK ENUM status INT attempts TIMESTAMP available_at TIMESTAMP sent_at VARCHAR last_error }
SITE_SETTINGS { VARCHAR setting_key PK VARCHAR setting_value BIGINT updated_by FK }
USER_SOCIAL_LINKS { BIGINT id PK BIGINT user_id FK VARCHAR platform VARCHAR url }
USER_BLOCKS { BIGINT id PK BIGINT blocker_id FK BIGINT blocked_id FK TIMESTAMP created_at }
LIST_LIKES { BIGINT id PK BIGINT list_id FK BIGINT user_id FK TIMESTAMP created_at }

USERS ||--o{ LISTS : owns
LISTS ||--o{ LIST_ITEMS : contains
MOVIES ||--o{ LIST_ITEMS : appears_in
USERS ||--o{ REVIEWS : writes
USERS |o--o{ REVIEWS : moderates
MOVIES ||--o{ REVIEWS : receives
USERS ||--o{ RATINGS : gives
MOVIES ||--o{ RATINGS : receives
MOVIES ||--o{ EXTERNAL_RATINGS : has
MOVIES ||--o{ SIMILAR_MOVIES : source
MOVIES ||--o{ SIMILAR_MOVIES : similar
MOVIES ||--o{ MOVIE_ACTORS : cast
ACTORS ||--o{ MOVIE_ACTORS : appears_in
MOVIES ||--o{ MOVIE_DIRECTORS : crew
DIRECTORS ||--o{ MOVIE_DIRECTORS : directs
MOVIES ||--o{ MOVIE_PRODUCERS : crew
PRODUCERS ||--o{ MOVIE_PRODUCERS : produces
MOVIES ||--o{ MOVIE_GENRES : categorized
GENRES ||--o{ MOVIE_GENRES : classifies
REVIEWS ||--o{ COMMENTS : has
USERS ||--o{ COMMENTS : writes
USERS |o--o{ COMMENTS : moderates
USERS ||--o{ FOLLOWS : follows
USERS ||--o{ FOLLOWS : followed_by
REVIEWS ||--o{ REVIEW_LIKES : receives
USERS ||--o{ REVIEW_LIKES : gives
USERS ||--o{ USER_ACTIVITIES : creates
USERS ||--o{ USER_BLOCKS : blocks
USERS ||--o{ USER_BLOCKS : blocked_by
LISTS ||--o{ LIST_LIKES : receives
USERS ||--o{ LIST_LIKES : gives
MOVIES |o--o{ USER_ACTIVITIES : references
REVIEWS |o--o{ USER_ACTIVITIES : references
LISTS |o--o{ USER_ACTIVITIES : references
USERS |o--o{ USER_ACTIVITIES : relates_to
LISTS ||--o{ LIST_TAGS : tagged
TAGS ||--o{ LIST_TAGS : used_by
USERS ||--o{ NOTIFICATIONS : receives
USERS |o--o{ NOTIFICATIONS : triggers
USERS |o--o{ NOTIFICATIONS : related_user
REVIEWS |o--o{ NOTIFICATIONS : references
USERS ||--o| NOTIFICATION_PREFERENCES : configures
USERS ||--o| PASSWORD_RESET_TOKENS : resets
USERS ||--o{ REFRESH_SESSIONS : sessions
USERS ||--o{ CONVERSATIONS : user_one
USERS ||--o{ CONVERSATIONS : user_two
CONVERSATIONS ||--o{ MESSAGES : contains
USERS ||--o{ MESSAGES : sends
USERS ||--o{ ADMIN_AUDIT_LOGS : performs
USERS |o--o{ JOURNAL_ARTICLES : authors
USERS ||--o| NEWSLETTER_SUBSCRIPTIONS : opts_in
JOURNAL_ARTICLES ||--o{ NEWSLETTER_DELIVERIES : delivers
USERS ||--o{ NEWSLETTER_DELIVERIES : receives
USERS |o--o{ SITE_SETTINGS : updates
USERS ||--o{ USER_SOCIAL_LINKS : publishes
```

- Унікальні пари: user/movie у `ratings` і `reviews`, list/movie у `list_items`, follow/like/block, user/platform у `user_social_links`, slug/language у Journal, article/user у newsletter delivery. Блокування себе заборонено.
- `movies.rating` — середнє користувацьких оцінок; зовнішні рейтинги зберігаються окремо. WATCHLIST, WATCHED і FAVORITES створює `SystemListService`; CUSTOM списки підтримують власний порядок і теги.
- `review_archive` зберігає дублікати, перенесені V5, і не використовується runtime API. `similar_movies` зв'язує фільми між собою. Nullable moderator/author/settings посилання використовують `ON DELETE SET NULL`; точні CASCADE/RESTRICT правила визначає DDL.

`backend/src/main/resources/seed_50_real.sql` — окреме демонаповнення 50 фільмів із TMDB оцінками, без similar/producer credits. Генератор [`scripts/tmdb_seed_50.py`](../../scripts/tmdb_seed_50.py) потребує `TMDB_API_KEY` з environment і записує SQL за цим шляхом незалежно від поточного каталогу; для його запуску потрібен Python package `requests`. Producer credits додає TMDB sync.

Наявність таблиць і мінімум FK у локальній Compose БД перевіряє `scripts/verify-er-schema.ps1`. Це перевірка схеми, не доказ повного DDL parity чи production restore.
