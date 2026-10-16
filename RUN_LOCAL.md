# Локальний запуск Rewind

Потрібні Docker Desktop і доступ до реєстру Docker Hub. З кореня репозиторію у PowerShell:

```powershell
.\scripts\init-dev-env.ps1
docker compose up --build
```

Відкрийте `http://localhost:3000/uk/films`. Compose запускає MySQL 8.4, API і React через Nginx. MySQL доступний лише локально на порту `3307`, API — на `8081`. Міграції Flyway виконуються під час старту API; у профілі `dev` 50 демонстраційних фільмів імпортуються тільки в порожній каталог. Облікові дані випадково генеруються у `.env`, який ігнорується Git. Дані БД живуть у volume `rewind-db`; `docker compose down` його зберігає.

Для перевірки відновлення пароля відкрийте `http://localhost:8025`: локальний Mailpit перехоплює листи, а посилання з листа веде на форму нового пароля. Для production налаштуйте справжній SMTP через `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SMTP_AUTH` і `MAIL_SMTP_STARTTLS`.

На машині з уже зайнятим портом 3000 або 8081 спочатку звільніть порт чи змініть локальний mapping у `compose.yaml`. Не запускайте `docker compose down -v`, якщо хочете зберегти дані.

## Запуск із локальними Java і Node

Потрібні **JDK 17**, Node.js 20+ і MySQL 8.4. На цьому ПК існує окремий старий контейнер `rewind-mysql` із локальною базою на порту `3306`. Його пароль розробки — `rewinddev`. У PowerShell:

```powershell
docker start rewind-mysql
$env:JAVA_HOME = 'C:\Users\Legion\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:DB_USERNAME = 'rewind'
$env:DB_PASSWORD = 'rewinddev'
$env:JWT_SECRET = '<власний випадковий секрет щонайменше 32 байти>'
.\mvnw.cmd spring-boot:run
```

В іншому PowerShell:

```powershell
cd .\letterboxd\letterboxd-login-figma-final2
npm ci
npm run dev -- --host 127.0.0.1
```

Відкрийте `http://127.0.0.1:5173/uk/films`. Vite проксуює `/api` до `localhost:8080`. Якщо використовуєте іншу БД, встановіть `DB_URL`, `DB_USERNAME` і `DB_PASSWORD`. Не використовуйте тестовий JWT-секрет для публічного середовища.

## Перевірка

```powershell
$env:DB_USERNAME = 'rewind'
$env:DB_PASSWORD = 'rewinddev'
.\mvnw.cmd test
cd .\letterboxd\letterboxd-login-figma-final2
npx tsc --noEmit
npm run build
```

Інтеграційні тести запускають Spring і Flyway на реальній MySQL та перевіряють видалення зі списків, оцінки, огляди й одноразовий токен відновлення. Тестові зміни даних відкочуються. Чистий MySQL-контейнер і API пройшли `scripts/verify-api.ps1 -BaseUrl http://localhost:8082`; тимчасовий контейнер після тесту видалено. Повний Compose на поточному ПК ще не перевірений: Docker Hub повертав мережеву помилку під час завантаження базових образів. Конфігурацію перевірено командою `docker compose config --quiet`.

Окремий `scripts/verify-password-reset.ps1 -BaseUrl http://localhost:8082` пройшов із реальною SMTP-доставкою до Mailpit: однакова відповідь для відомого й невідомого email, одноразове посилання та вхід із новим паролем. Скрипти використовують тимчасові адреси `example.invalid`; запускайте їх на тестовій БД. Для локального перехоплення пошти використано [офіційний Docker-образ Mailpit](https://mailpit.axllent.org/docs/install/docker/).
