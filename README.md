# Rewind

Rewind is a bilingual movie discovery and social review platform inspired by Letterboxd. It combines a React/TypeScript web client with a Spring Boot API, MySQL persistence, optional Redis caching, and an administration dashboard.

## Current scope

- Ukrainian and English routes under `/uk/...` and `/en/...`
- Cookie-based access and refresh sessions with CSRF protection
- Movie catalog, search, filters, pagination, people pages, ratings, reviews, comments, lists, profiles, follows, likes, activity, notifications, SSE, and private messages
- Journal articles with language fallback, category filtering, monthly archive navigation, and admin publishing
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

The Compose file uses public ECR mirrors for container images. Maven uses the configured public mirror in `.mvn/settings.xml` so a local Docker build does not depend on a single registry endpoint.

### Run services without Compose

Start MySQL and set `DB_PASSWORD`, `JWT_SECRET`, and the other values described in [RUN_LOCAL.md](RUN_LOCAL.md), then run:

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

The current verified slice is tracked in [PROGRESS.md](PROGRESS.md), while the API and database map is in [PROJECT_MAP.md](PROJECT_MAP.md).

## Project references

- Product plan: [PLAN.md](PLAN.md)
- Requirements trace: [REQUIREMENTS_TRACE.md](REQUIREMENTS_TRACE.md)
- Local setup: [RUN_LOCAL.md](RUN_LOCAL.md)
- Figma design file: <https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/>
- Project FigJam: <https://www.figma.com/board/gPITmVEnT5L61gN7JiwIiX/>
- Information architecture FigJam: <https://www.figma.com/board/qrrA6VTNZFiJstg1CsaOTo/>

## Security notes

Local secrets belong in `.env`, which is ignored by Git. Do not commit API keys, database passwords, refresh tokens, or production credentials. External ratings are displayed only when they are stored from an allowed source; the project does not scrape IMDb.
