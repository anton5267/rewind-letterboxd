# Локальний запуск Rewind

Усі команди починаються з кореня Git-репозиторію. Потрібні Docker Desktop; для dev frontend — Node.js 20 (від 20.19) або 22.12+. Локальний Java запуск потребує JDK 17. Секрети створюються у Git-ignored `.env`.

## Docker Compose

```powershell
.\scripts\init-dev-env.ps1
docker compose up -d --build
docker compose ps
```

| Сервіс | Адреса |
| --- | --- |
| Зібраний сайт | `http://localhost:3000/uk/home` |
| API / health | `http://127.0.0.1:8081` / `/actuator/health` |
| Mailpit / SMTP | `http://localhost:8025` / `localhost:1025` |
| MySQL | `127.0.0.1:3307`, база `rewind`, користувач `rewind`, пароль із `.env` |
| Redis | Внутрішній Compose service; host port не опублікований |

Flyway застосовує migrations під час старту API. Dev seed додає 50 фільмів тільки в порожній каталог. `docker compose down` зберігає volumes; `down -v` видаляє дані й не використовується для звичайного перезапуску.

## Frontend із поточного source

Залиште Compose API запущеним; в іншому PowerShell:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1
```

Відкрийте `http://127.0.0.1:5173/uk/home`. Vite проксить `/api` на `http://127.0.0.1:8081`; іншу адресу задає process variable `VITE_API_PROXY_TARGET`. Порт 3000 оновлюється після rebuild Docker web; порт 5173 відображає зміни source. Тимчасовий regression порт 3002 не є постійною адресою сайту.

## Backend із локального JDK

Цей варіант замінює Compose API. Зупиніть лише `api`, якщо він займає 8081; залиште `db` і `mailpit` запущеними. У PowerShell задайте credentials із локального `.env` як process variables, не зберігаючи їх у source:

```powershell
docker compose stop api
docker compose up -d db mailpit
$env:DB_URL = 'jdbc:mysql://127.0.0.1:3307/rewind?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC'
$env:DB_USERNAME = 'rewind'
$env:DB_PASSWORD = '<MYSQL_PASSWORD із локального .env>'
$env:JWT_SECRET = '<JWT_SECRET із локального .env>'
$env:SERVER_PORT = '8081'
$env:COOKIE_SECURE = 'false'
$env:MAIL_HOST = 'localhost'
$env:MAIL_PORT = '1025'
$env:FRONTEND_RESET_URL = 'http://127.0.0.1:5173/uk/reset-password'
cd backend
.\mvnw.cmd spring-boot:run
```

Базова конфігурація локального Java не потребує Redis (`SPRING_CACHE_TYPE=none`). Для cache-перевірок використовуйте Compose API з його внутрішнім Redis. Maven виконується з `backend/`, бо `.mvn/maven.config` має відносний settings path.

## Перевірки

Frontend, із `frontend/`:

```powershell
npm run verify:build
```

Backend: із `backend/` виконати `.\mvnw.cmd test` з окремою MySQL schema у `DB_URL`, її `DB_USERNAME`/`DB_PASSWORD` та process `JWT_SECRET`. Flyway застосовується до цієї schema; тести створюють і змінюють дані.

Browser suite, із `frontend/`, із запущеним окремим тестовим стеком та Google Chrome:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:<test-web-port>'
npm run test:e2e
```

Повний admin suite запускає `scripts/verify-admin-browser.ps1 -Headed`; `-Grep` звужує сценарій. Для виділеного стека обов'язкові його `-BaseUrl`, `-ProjectName` і фактичні `-ComposeFile`. Wrapper перевіряє labels/ports, використовує disposable ADMIN fixture і відновлює process env. Не спрямовуйте mutation suites на робочі дані.

| Скрипт із `scripts/` | Призначення |
| --- | --- |
| `verify-api.ps1` | Cookie/CSRF/refresh/logout через HTTP, створює тимчасовий account |
| `verify-password-reset.ps1` | Одноразовий reset і доставка в Mailpit; потребує тестової БД |
| `verify-cache.ps1` | Redis hit/miss/TTL; очищає один detail cache key, MySQL не змінює |
| `verify-er-schema.ps1` | Звірка схеми з migrations/ER |
| `backup-dev.ps1` | Дамп через `mysqldump --single-transaction`; ціль задається явно, див. нижче |
| `restore-dev.ps1` | Відновлення з `-BackupPath` і підтвердженням `-Confirm`; ціль задається явно |
| `verify-backup-restore.ps1` | Restore у власну тимчасову БД, counts і exact cleanup |

`backup-dev.ps1` і `restore-dev.ps1` мають legacy defaults для окремого контейнера `rewind-mysql`. Для Compose обов'язково передайте `-Container` (точний ID із `docker compose ps -q db`), `-Database rewind`, `-Username rewind` та `-Password` із локального `.env`. Для ізольованого restore drill використовуйте Compose-aware `verify-backup-restore.ps1 -ComposeFile compose.yaml -EnvFile .env`.

`npm run verify:build` потрібний після завершеного frontend-блоку; targeted suites — за ризиком. Повний regression виконується після основної UI-роботи. Результати записуються лише у [RELEASE_EVIDENCE](RELEASE_EVIDENCE.md).

## Налаштування й проблеми

- Порт зайнятий: перевірте `docker compose ps` і локальні процеси; використовуйте узгоджені mappings/API proxy, без видалення volumes.
- `ERR_CONNECTION_REFUSED` на 3002: відкрийте постійний 3000 або dev 5173; regression стек тимчасовий.
- Старий UI на 3000: це зібраний image; dev-зміни доступні на 5173.
- Reset email: лист і посилання дивіться в Mailpit; для Vite перевірте `FRONTEND_RESET_URL`.
- API 401/403: перевірте актуальний API target, cookie/CSRF і роль; auth guards не вимикайте.
- TMDB вимкнений за замовчуванням. Для admin sync потрібні `TMDB_ENABLED=true` і новий локальний `TMDB_API_KEY`; контракти — [API / Admin](../backend/API.md#admin).

Production SMTP, secure cookies, HTTPS і deployment — у [DEPLOYMENT](DEPLOYMENT.md).
