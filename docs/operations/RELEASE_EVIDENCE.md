# Rewind — докази перевірок

Оновлено 21.10.2026, Europe/Berlin. Нижче наведено актуальний локальний release checkpoint. Production VPS не розгорнуто.

## Фінальна локальна регресія

| Gate | Результат | Доказ / межа |
| --- | --- | --- |
| Frontend build | PASS | `npm run verify:build`: TypeScript без помилок, Vite 213 modules |
| Full browser suite | **127 passed** | 0 failed/skipped/flaky/retries; production Nginx image, Google Chrome. Standard run: 115 passed + 12 gated admin skips, 4.4 min; disposable admin run: 12/12, 42 s |
| Backend suite | **87 tests** | failures/errors/skips 0, 1:52 min; окремий disposable MySQL 8.4 на `127.0.0.1:3308`, контейнер видалено |
| API smoke | PASS | OpenAPI 159 operations; auth, profiles, films, lists, reviews, comments, social, messages, notifications, newsletter і cleanup |
| Contract smoke | PASS | Public/protected routes, privacy fields, role guards, CRUD і nullable responses |
| Security smoke | PASS | CSRF, guest/admin guards, hostile query payloads, metrics protection |
| Password reset | PASS | Generic response, Mailpit delivery, one-time token, session revocation, new login |
| Cache / concurrency / load | PASS | Redis miss/hit/TTL; concurrent lists/ratings/reviews/comments/preferences/follows/likes; 20 requests across 8 endpoints, all 200 |
| ER schema | PASS | 38 tables, 55 foreign-key relationships |
| Backup/restore | PASS | Dump restored to a unique temporary schema; counts `203|438|31`; schema and temporary dump cleaned |
| Production template | PASS | Synthetic temporary env: HTTPS origin, strong placeholders, private DB/Redis/API, read-only API/web, loopback web port |
| Caddy / Compose | PASS | Caddy valid; development Compose config valid; clean API/web image builds |
| Local Docker runtime | PASS | `/actuator/health` 200, `/uk/home` 200; API/web rebuilt, DB volume and `.env` preserved |
| CI workflow maintenance | PASS locally | Official current major tags configured: `checkout@v7`, `setup-java@v6`, `setup-node@v7`; GitHub push validation pending |

Перший повний browser run завершився 123/125. Він виявив реальні regressions у Lists: hero втратив очікувані UK/EN «Колекції фільмів / Film collections», а landing CSS приховав feed navigation через `display:none`. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Поточний Search етап: targeted Global Search 4/4; нові UK/EN сценарії перевіряють shortcuts, URL, 361 px list cards, п’ять 79 px posters, багаторядкові tags і no-overflow. Повний набір зріс до 127. Admin wrapper спочатку зупинився до створення fixture через Docker template quoting у Windows PowerShell 5.1; після переходу на `docker inspect` JSON пройшов 12/12 і прибрав disposable fixture.

Початкові backend спроби проти основної dev DB не зараховані: вони отримали access denied через host credentials. Фінальний результат отриманий на чистій ізольованій MySQL з CI credentials; основну БД не змінювали.

## Figma та UI

- Design copy: `BDO9GO1oscOeUTcu4VXVKA`.
- У цьому проході concrete context/screenshots додатково використані для Search shortcuts `1480:8432`, lists `1480:8804` і tags `1480:8767`; попередній checkpoint охопив Journal article, Auth desktop/mobile, Help, About, Admin dashboard і Public Profile phone.
- Auth raster assets збережені локально; runtime не містить тимчасових Figma asset URLs.
- Повний browser suite перевірив UK/EN, 320/393/600/720/768/1440 responsive cases, keyboard/focus, loading/error/empty/retry, admin fixture і poster compatibility.

Точні mappings і межі pixel parity — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md). Загальна pixel-perfect відповідність усім top-level frames не заявляється без окремого screenshot comparison кожного frame.

## GitHub CI

- UI/assets/harness commit: `33f8082`.
- Release documentation commit: `f48713a`.
- [`CI / verify (push)` run 39557098972](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s. Backend tests, frontend build/typecheck і Caddy validation зелені.
- Історичний checkpoint перед поточним UI-проходом: [GitHub CI для `f0df409`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39485802412).

## Збереження даних

- Основні Docker volumes не видалялися; `down -v` не виконувався.
- Browser/API verification створювали лише disposable accounts/data й виконували cleanup.
- Diploma video artifacts, локальний `AGENTS.md`, `.env`, backups, caches і raw Figma references не включаються в release commits.

## Межа релізу

Локальні перевірки не підтверджують production infrastructure. VPS, domain/TLS, real SMTP/TMDB credentials, monitoring і restore drill на цільовому сервері виконуються окремо за [DEPLOYMENT](DEPLOYMENT.md). Відсутність погодженого Journal content не блокує код: Journal залишається API-backed.
