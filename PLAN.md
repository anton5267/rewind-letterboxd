# Rewind — план завершення

Оновлено 21.10.2026. Після Search/CI checkpoint розпочато повний node-by-node Figma audit: кожен наступний UI-блок реалізується тільки після перевірки конкретного frame context і screenshot, а не за припущеннями. Завершені блоки цього проходу: Popular Reviewers desktop/phone `1480:5486`/`1480:7698`, Community desktop/phone `605:1112`/`1517:4931`, Journal List 4 desktop `1494:5387` і Home: desktop guest/member `1413:6471`/`1413:6263`, mobile guest/member `1411:3473`/`1327:3210`. Для Journal підтверджено editorial hero і three-column article rows; для Home — локальні original artworks, hero/CTA geometry та live API-backed poster rows. Наступний блок обирається лише після concrete-node review.

## Виконано

- Figma Design copy `BDO9GO1oscOeUTcu4VXVKA` доступна через plugin; для реалізації використані metadata, context, screenshots і assets конкретних nodes.
- Доведені Journal article, desktop/mobile Auth, Service/About, Admin dashboard і mobile PublicProfile. Декоративний `⋯` у JournalArticle прибрано.
- Auth artwork збережено локально в `frontend/src/assets/figma/`; тимчасових Figma URL у runtime-коді немає.
- Home/Search, Lists, Movie, Review, Profile, Community, Messages і Notifications зберігають реальні API, UK/EN, loading/error/empty/retry, клавіатуру й focus management.
- Lists landing знову має доступну feed navigation і локалізований hero після повної регресії.
- Global Search на телефонах має шість локалізованих швидких переходів із frame `1480:8432`; list cards і tag wrapping звірені з `1480:8804` та `1480:8767`.
- GitHub Actions переведені на актуальні Node 24 based majors: `checkout@v7`, `setup-java@v6`, `setup-node@v7`; runner зафіксовано на `ubuntu-24.04`, щоб прибрати migration annotation для `ubuntu-latest`.
- `verify-admin-browser.ps1` читає Compose project label із `docker inspect` JSON і працює у Windows PowerShell 5.1.
- Локальні `api` і `web` images перебудовані; основний DB volume та `.env` збережені.

## Актуальні перевірки

- `npm run verify:build`: PASS, TypeScript + Vite, 213 modules.
- Playwright: **127/127 passed**, failures/skips/flaky/retries 0; 115 public/real API scenarios та 12 scenarios з disposable admin fixture.
- Backend: **87/87 passed**, failures/errors/skips 0, ізольована MySQL 8.4.
- PASS: API, contracts, security, password reset, Redis cache, HTTP concurrency, load, ER schema, backup/restore, production template config, Caddy та Compose config.

Точні результати й межі доказу — у [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md), Figma mappings — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md).

## Доставка

- UI/assets/harness: commit `33f8082`.
- Локальні release results: commit `f48713a`.
- [GitHub CI / verify для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s.
- Search/CI maintenance: commit `ea037f0`, [CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s; runner pin/docs commit `0b22904`, [CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s.
- Diploma artifacts і локальний `AGENTS.md` залишилися поза commits.

## Поза цією ціллю

- Production VPS, домен, TLS, SMTP/TMDB secrets, monitoring і реальний restore drill на сервері.
- Публікація погодженого Journal-контенту. Код лишається API-backed; Figma-тексти не підміняють production data.
- Загальна pixel-perfect заява для всіх 250+ top-level Figma frames. У документації фіксуються лише перевірені конкретні frames; автоматична та browser-регресія підтверджує поведінку всіх реалізованих маршрутів.

## Межі безпеки роботи

Не змінювати diploma video artifacts, локальний `AGENTS.md`, бази, backups, `.env`, Figma raw references і кеші. Backend змінювати лише за підтвердженим функціональним дефектом; migrations не переписувати. Public routes й API залишаються сумісними; `ProfileReview.moviePhotoUrl` nullable.
