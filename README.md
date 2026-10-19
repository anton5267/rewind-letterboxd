# Rewind

Rewind is a bilingual movie discovery and social review platform inspired by Letterboxd. It combines a React/TypeScript web client with a Spring Boot API, MySQL persistence, optional Redis caching, and an administration dashboard.

## Current scope

- Ukrainian and English routes under `/uk/...` and `/en/...`
- Cookie-based access and refresh sessions with CSRF protection
- Movie catalog, search, filters, pagination, people pages, ratings, reviews, comments, lists, profiles, follows, likes, activity, notifications, SSE, and private messages
- Controlled admin-only TMDB synchronization for movie metadata, credits, trailer, external rating, and links to similar movies already in the local catalog
- Journal articles with language fallback, category filtering, monthly archive navigation, and admin publishing
- Newsletter opt-in/opt-out for users, an idempotent Flyway-backed delivery outbox with retry statuses, and audited admin queueing of published Newsletter/Бюлетень articles to active subscribers
- Admin dashboard for users/HQ, movies, lists, reviews, comments, moderation queue, settings, communications, and audit logs
- Flyway migrations and MySQL integration tests for the implemented API contracts

## Stack

- Backend: Java 17, Spring Boot, Spring Data JPA, Spring Security, Flyway
- Database: MySQL 8.4
- Optional runtime cache: Redis 7.4
- Frontend: React 18, TypeScript, Vite
- Local mail: Mailpit

## Local development

### Docker Compose

1. Create local credentials:

   ```powershell
   .\scripts\init-dev-env.ps1
   ```

2. Build and start the complete stack:

   ```powershell
   docker compose up -d --build
   ```

3. Open the web app at `http://localhost:3000`. API health is available at `http://localhost:8081/actuator/health` and Mailpit at `http://localhost:8025`.

TMDB synchronization is disabled by default. To enable it locally, set `TMDB_ENABLED=true` and `TMDB_API_KEY` in `.env`, restart the API, then an administrator can call:

```http
POST /api/admin/movies/{movieId}/tmdb-sync
Content-Type: application/json

{"tmdbId":550,"syncSimilar":true}
```

Для контрольного оновлення кількох уже створених локальних фільмів доступний admin-only batch endpoint. Він приймає максимум 20 пар за запит, ізолює помилку окремого фільму та повертає результат для кожного елемента:

```http
POST /api/admin/movies/tmdb-sync/batch
Content-Type: application/json

{"syncSimilar":true,"movies":[{"movieId":1,"tmdbId":550},{"movieId":2,"tmdbId":603}]}
```

The endpoint requires the normal admin cookie/CSRF contract. It never creates unverified similar movies; only already imported local movies with matching `tmdb_id` are linked.

Для імпорту нових стрічок за TMDB ID використовуйте admin-only endpoint. Він створює відсутні локальні записи, повторно використовує вже імпортований фільм з таким самим `tmdb_id`, приймає максимум 20 ID і повертає окремий статус для кожного:

```http
POST /api/admin/movies/tmdb-import
Content-Type: application/json

{"tmdbIds":[550,603],"syncSimilar":true}
```

Якщо один ID не знайдено або TMDB тимчасово недоступний, інші елементи batch все одно обробляються. Зміни виконуються в окремих транзакціях, тому невдалий імпорт не залишає порожній локальний фільм.

Для контрольованого імпорту з TMDB discovery використовуйте фільтри й сторінку результатів. Endpoint повертає загальну кількість сторінок/результатів і статус кожного імпорту; за один запит обробляється не більше 20 кандидатів:

```http
POST /api/admin/movies/tmdb-import/discover
Content-Type: application/json

{"page":1,"year":2024,"genreId":18,"minRating":7.0,"limit":20,"syncSimilar":true}
```

Це дозволяє адмінському імпорту рухатися сторінка за сторінкою та повторювати невдалі елементи без неконтрольованого масового заповнення каталогу.

Для перевірки якості вже імпортованого каталогу використовуйте admin-only read endpoint:

```http
GET /api/admin/movies/tmdb-quality
```

Відповідь містить кількість фільмів у каталозі, TMDB-зв'язаних і повністю заповнених записів, відсутні постери/backdrop/описи/тривалості/трейлери/TMDB-рейтинги та відсотки покриття й повноти. Запит виконує один агрегований SQL без N+1 читань.

The Compose file uses public ECR mirrors for container images. Maven uses the configured public mirror in `.mvn/settings.xml` so a local Docker build does not depend on a single registry endpoint.

### Run services without Compose

Start MySQL and set `DB_PASSWORD`, `JWT_SECRET`, and the other values described in [docs/RUN_LOCAL.md](docs/RUN_LOCAL.md), then run:

```powershell
$env:DB_PASSWORD = "rewinddev"
$env:JWT_SECRET = "a-local-secret-at-least-32-bytes-long"
.\mvnw.cmd spring-boot:run
```

In another terminal:

```powershell
cd letterboxd/letterboxd-login-figma-final2
npm ci
npm run dev
```

## Verification

Backend integration tests use MySQL and apply Flyway migrations automatically:

```powershell
$env:DB_PASSWORD = "rewinddev"
$env:JWT_SECRET = "a-local-secret-at-least-32-bytes-long"
.\mvnw.cmd test
```

Frontend checks:

```powershell
cd letterboxd/letterboxd-login-figma-final2
npx tsc --noEmit
npm run build
```

With the Compose stack running and Google Chrome installed, the main browser flow can be checked end to end:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:3000'
npm run test:e2e
```

Для admin UI використовується окремий disposable fixture. Повний headed набір:

```powershell
.\scripts\verify-admin-browser.ps1 -Headed
```

Після зміни конкретного admin flow можна звузити запуск, наприклад:

```powershell
.\scripts\verify-admin-browser.ps1 -Headed -Grep "admin notification table"
```

The current verified slice is tracked in [docs/PROGRESS.md](docs/PROGRESS.md), while the API and database map is in [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md). The current migration-backed ER diagram is in [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md); run `scripts/verify-er-schema.ps1` against Compose to check it.

## Project references

- Product plan: [PLAN.md](PLAN.md)
- Requirements trace: [docs/REQUIREMENTS_TRACE.md](docs/REQUIREMENTS_TRACE.md)
- Local setup: [docs/RUN_LOCAL.md](docs/RUN_LOCAL.md)
- Database ER diagram: [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md)
- Production deployment: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Diploma and demo materials: [docs/diploma/DIPLOMA_MATERIALS.md](docs/diploma/DIPLOMA_MATERIALS.md)
- Figma design file: <https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/>
- Project FigJam: <https://www.figma.com/board/gPITmVEnT5L61gN7JiwIiX/>
- Information architecture FigJam: <https://www.figma.com/board/qrrA6VTNZFiJstg1CsaOTo/>

## Security notes

Local secrets belong in `.env`, which is ignored by Git. Do not commit API keys, database passwords, refresh tokens, or production credentials. External ratings are displayed only when they are stored from an allowed source; the project does not scrape IMDb.
