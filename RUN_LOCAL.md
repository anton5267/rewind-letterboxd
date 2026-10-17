# Локальний запуск Rewind

Потрібні Docker Desktop і доступ до registry для образів (Compose використовує public ECR, Mailpit — GHCR). З кореня репозиторію у PowerShell:

```powershell
.\scripts\init-dev-env.ps1
docker compose up --build
```

Відкрийте `http://localhost:3000/uk/films`. Compose запускає MySQL 8.4, Redis, API і React через Nginx. MySQL доступний лише локально на порту `3307`, API — на `8081`. Міграції Flyway виконуються під час старту API; у профілі `dev` 50 демонстраційних фільмів імпортуються тільки в порожній каталог. Облікові дані випадково генеруються у `.env`, який ігнорується Git. Дані БД живуть у volume `rewind-db`; `docker compose down` його зберігає.

Контрольований TMDB sync вимкнений за замовчуванням. Для локального admin-тесту додайте в `.env` `TMDB_ENABLED=true` і `TMDB_API_KEY=<ключ>`, перезапустіть API та викликайте `POST /api/admin/movies/{movieId}/tmdb-sync` з JSON `{"tmdbId":550,"syncSimilar":true}`. Endpoint оновлює тільки обраний фільм, його credits/трейлер/рейтинг і зв’язує схожі стрічки, які вже мають локальний `tmdb_id`. Для контрольного оновлення кількох записів використовуйте `POST /api/admin/movies/tmdb-sync/batch` з JSON `{"syncSimilar":true,"movies":[{"movieId":1,"tmdbId":550},{"movieId":2,"tmdbId":603}]}`. Batch обмежений 20 елементами й повертає `SYNCED` або `FAILED` окремо для кожного фільму, тому одна помилка не зупиняє решту. Для імпорту нових фільмів використовуйте `POST /api/admin/movies/tmdb-import` з JSON `{"tmdbIds":[550,603],"syncSimilar":true}`. Він також обмежений 20 ID, є ідемпотентним за `tmdb_id` і не залишає порожній запис при помилці окремого імпорту.

Для перевірки відновлення пароля відкрийте `http://localhost:8025`: локальний Mailpit перехоплює листи, а посилання з листа веде на форму нового пароля. Compose також запускає Redis для кешу гостьової деталки фільму. Health API доступний на `/actuator/health`, метрики — на захищеному `/actuator/metrics`. Для production налаштуйте справжній SMTP через `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SMTP_AUTH` і `MAIL_SMTP_STARTTLS`.

Авторизація використовує короткий access token та відкличний refresh token у HttpOnly cookie. Запити, що змінюють дані, потребують CSRF cookie і заголовка `X-XSRF-TOKEN`; фронтенд додає його автоматично. У Compose `COOKIE_SECURE=false` лише для локального HTTP. Для HTTPS залишайте `COOKIE_SECURE=true`.

На машині з уже зайнятим портом 3000 або 8081 спочатку звільніть порт чи змініть локальний mapping у `compose.yaml`. Не запускайте `docker compose down -v`, якщо хочете зберегти дані.

## Запуск із локальними Java і Node

Потрібні **JDK 17**, Node.js 20+ і MySQL 8.4. На цьому ПК існує окремий старий контейнер `rewind-mysql` із локальною базою на порту `3306`. Його пароль розробки — `rewinddev`. У PowerShell:

```powershell
docker start rewind-mysql
docker compose up -d mailpit
$env:JAVA_HOME = 'C:\Users\Legion\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_USERNAME = 'rewind'
$env:DB_PASSWORD = 'rewinddev'
$env:JWT_SECRET = '<власний випадковий секрет щонайменше 32 байти>'
$env:COOKIE_SECURE = 'false'
$env:MAIL_HOST = 'localhost'
$env:MAIL_PORT = '1025'
$env:FRONTEND_RESET_URL = 'http://127.0.0.1:5173/uk/reset-password'
.\mvnw.cmd spring-boot:run
```

В іншому PowerShell:

```powershell
cd .\letterboxd\letterboxd-login-figma-final2
npm ci
npm run dev -- --host 127.0.0.1
```

Відкрийте `http://127.0.0.1:5173/uk/films`. Vite проксуює `/api` до `localhost:8080`. Якщо використовуєте іншу БД, встановіть `DB_URL`, `DB_USERNAME` і `DB_PASSWORD`. Не використовуйте тестовий JWT-секрет для публічного середовища.

Якщо окремі нові маршрути (наприклад `/api/journal/articles`) повертають 403, а старі сторінки працюють, на `8080` залишився старий Spring-процес. Зупиніть саме старий процес, повторно запустіть `spring-boot:run` з цього checkout і перезавантажте Vite; не перемикайте клієнт на іншу версію API.

## Перевірка

```powershell
$env:DB_USERNAME = 'rewind'
$env:DB_PASSWORD = 'rewinddev'
.\mvnw.cmd test
cd .\letterboxd\letterboxd-login-figma-final2
npx tsc --noEmit
npm run build
```

Інтеграційні тести запускають Spring і Flyway на реальній MySQL та перевіряють видалення зі списків, оцінки, огляди, одноразовий токен відновлення й ротацію refresh token. Тестові зміни даних відкочуються. `scripts/verify-api.ps1 -BaseUrl http://localhost:8080` перевіряє реальний HTTP-сценарій, cookie, CSRF, повторне використання refresh token і logout. Скрипт створює тимчасовий обліковий запис: запускайте його на тестовій БД. Compose runtime перевірений локально: MySQL/Redis healthy, API health `200`, Web `200`; `docker compose config --quiet` також проходить.

Перевірка Redis cache hit/miss для гостьової деталки:

```powershell
./scripts/verify-cache.ps1 -BaseUrl http://127.0.0.1:8081
```

Скрипт очищає один ключ деталки, виконує два HTTP-запити та перевіряє Redis `keyspace_misses`, `keyspace_hits`, наявність ключа й позитивний TTL. Він не змінює дані MySQL.

Для автоматизованого браузерного сценарію потрібен запущений Compose і встановлений Google Chrome:

```powershell
cd .\letterboxd\letterboxd-login-figma-final2
npm ci
$env:E2E_BASE_URL = 'http://127.0.0.1:3000'
npm run test:e2e
```

Тест створює тимчасовий акаунт і проходить реєстрацію, вхід, каталог, watchlist, оцінку, створення/редагування/видалення огляду, видалення оцінки та прибирання з watchlist.

Окремий `scripts/verify-password-reset.ps1 -BaseUrl http://localhost:8080` пройшов із реальною SMTP-доставкою до Mailpit: однакова відповідь для відомого й невідомого email, одноразове посилання та вхід із новим паролем. Скрипти використовують тимчасові адреси `example.invalid`; запускайте їх на тестовій БД. Для локального перехоплення пошти використано [офіційний Docker-образ Mailpit](https://mailpit.axllent.org/docs/install/docker/).

Для локального backup/restore використовуйте `scripts/backup-dev.ps1` і `scripts/restore-dev.ps1 -BackupPath .\backups\rewind-....sql -Confirm`. Backup робиться через `mysqldump --single-transaction`; перед production відновленням спочатку перевірте файл у тимчасовій базі.
