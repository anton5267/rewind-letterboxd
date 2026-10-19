# Rewind — матеріали для дипломного захисту

Цей файл є робочою основою для презентації, демонстрації та пояснення технічних рішень. Він містить лише перевірені факти з локального Compose runtime; публічний VPS, домен, реальний SMTP і точна Figma parity ще не заявляються як готові.

## Короткий опис проєкту

Rewind — двомовна платформа щоденника фільмів і соціальних оглядів. Користувач може знаходити фільми, ставити оцінки, писати огляди й коментарі, вести списки, підписуватися на інших користувачів, отримувати сповіщення та спілкуватися в приватних діалогах. Адміністратор керує каталогом, користувачами, журналом, сповіщеннями, аудитом і модерацією.

## Архітектура для слайда

```text
Google Chrome
    │  UK/EN React + TypeScript, cookie auth, CSRF, SSE
    ▼
Nginx web container :3000 ── /api ──► Spring Boot API :8081
                                      │
                                      ├── MySQL 8.4 :3307 + Flyway 31
                                      ├── Redis 7.4 cache
                                      └── Mailpit :8025 (local email)
```

- Frontend: React 18, TypeScript, Vite 7.3.7, React Router, Axios.
- Backend: Java 17, Spring Boot 4, Spring Security, Spring Data JPA, Flyway.
- Дані: MySQL; Redis використовується опційно для cache read paths.
- Безпека: HttpOnly cookie sessions, CSRF, rate limits, server-side authorization, CSP/security headers, non-root API image.

## Демонстраційний сценарій (7–9 хвилин)

1. Відкрити `/uk/home`, переключити мову на `/en/home`, показати локалізовану навігацію.
2. Перейти до `/uk/films`: пошук, фільтри, сторінка деталей фільму.
3. Увійти або зареєструвати disposable-користувача; додати фільм у watched/watchlist, поставити rating і створити review.
4. Відкрити власний профіль, списки та публічний профіль без авторизації; показати статистику й empty/loading/error states.
5. Показати social flow: follow, notification, review like або comment.
6. Увійти як admin: відкрити users/movies/notifications/journal, знайти запис у moderation queue і приховати review/comment.
7. Показати `/uk/help` або `/uk/privacy` і коротко пояснити backup/restore та production runbook.

Для демонстрації використовувати disposable fixture, а не особистий акаунт. Після показу виконати cleanup через готові browser/API scripts.

## Перевірені докази

| Область | Фактичний доказ |
| --- | --- |
| Backend | MySQL Compose suite: **69 tests, 0 failures, 0 errors, 0 skipped** у 37 test classes |
| Browser regression | Playwright: **28 passed, 12 skipped, 0 failed**; skipped — 12 admin fixture tests без окремих E2E credentials |
| Admin | `verify-admin-browser.ps1 -Headed`: **12 passed (36.9s)** |
| Accessibility | public accessibility/WCAG suite: **5 passed**; axe audit без violations у попередньому повному наборі |
| Security | security browser matrix: review/comment escaping + 4 SQLi/XSS query payloads, **1 passed**; backend authorization smoke перевіряє guest `401` і non-admin `403` |
| Concurrency | list/reorder/rating/review/comment/follow/like/notification writes; concurrent review дає очікувані `200 + 409`, дублікати не створюються |
| Load | **200/200 HTTP 200 за 0.62s** на 8 public/health endpoint-групах у локальному Compose runtime |
| Backup | актуальний dump/restore у тимчасову БД: **188 movies / 448 users / 31 migrations**, основна БД не змінювалася |
| Auth recovery / contracts | Mailpit one-time password reset із revocation старої сесії; core API contract regression успішний |
| Schema / cache | актуальна ER/schema перевірка: **38 tables / 55 foreign keys**; Redis movie-details TTL **599s**, miss **1**, hits **3** |
| Dependencies | offline npm audit після Vite 7.3.7 upgrade: **0 vulnerabilities**; online npm quick endpoint registry повертає 400 |

Команди й дати кожного зрізу збережені у [PROGRESS.md](../PROGRESS.md) та [IMPLEMENTATION_CHECKLIST.md](../IMPLEMENTATION_CHECKLIST.md).

Готовий окремий сценарій відеозапису з таймкодами, кадрами, командами evidence і post-recording cleanup: [DIPLOMA_VIDEO_SCRIPT.md](DIPLOMA_VIDEO_SCRIPT.md).

Підготовлено реальні headed-кадри, autoplay-slideshow у `artifacts/diploma-video/index.html` і перевірений WebM recording `artifacts/diploma-video/rewind-diploma-demo.webm` (76,223 bytes, WebM/EBML header). Повторний запис відтворюється `node scripts/capture-diploma-video.mjs`. Це локальний demo artifact, не доказ Figma parity або production launch.

## Орієнтовна структура презентації

1. Проблема й ціль платформи.
2. Аналіз користувачів, інформаційна архітектура та двомовність.
3. Архітектура React → Spring Boot → MySQL/Redis.
4. Основні користувацькі сценарії: пошук, review, lists, profile, social.
5. Адмінка, moderation queue та audit log.
6. Безпека, accessibility, pagination, concurrency і backup/restore.
7. Демонстрація продукту.
8. Результати, обмеження й подальший розвиток.

## Чесні обмеження перед захистом

- Figma MCP не отримує node-level context: для Design-файлу потрібен Editor-доступ; тому точна parity-звірка фреймів і assets ще не підтверджена.
- Production runbook і Compose production overlay готові, але реальний VPS/domain/HTTPS/SMTP запуск ще не виконаний.
- `Caddyfile.example` готує HTTPS reverse proxy до loopback web port `127.0.0.1:8088`; certificate issuance і фактичний VPS smoke ще не виконувалися.
- TMDB batch/import працює контрольовано, але повний scheduler/crawl і ротація старого ключа залишаються відкритими.
- Редакційний контент із довільними новими category values має raw fallback; відомі категорії вже локалізовані UK/EN.

## Перед фінальним захистом

- Отримати Editor-доступ до Figma або конкретні frame links; зняти screenshots/tokens/assets і додати фактичну parity-таблицю.
- Запустити production validator на реальному `.env.production`, виконати VPS/HTTPS smoke та restore drill.
- За потреби перезаписати відео з підготовленими демоданими; поточний локальний recording уже є перевіреним артефактом, а Figma parity і production launch не заявляються.
- Перед великим sync перевірити `git diff --check`, backend suite, headed browser suite, backup/restore та security smoke.
