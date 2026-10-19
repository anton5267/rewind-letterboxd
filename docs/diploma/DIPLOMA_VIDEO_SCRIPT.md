# Rewind — сценарій відеодемонстрації

Це сценарій для короткого запису екрана на 7–9 хвилин. Він спирається лише на локальний Compose runtime і не видає локальну перевірку за production launch.

## Перед записом

1. Запустити docker compose up -d у корені проєкту.
2. Перевірити http://127.0.0.1:3000/uk/home і http://127.0.0.1:8081/actuator/health.
3. Відкрити Google Chrome у headed режимі та підготувати окремий disposable user через verify-api.ps1 або browser smoke.
4. Не показувати паролі, .env, refresh cookies, email-адреси реальних людей або секрети TMDB.
5. Перед записом очистити тестові записи готовими verifier cleanup hooks.

## Таймкод і кадр

| Час | Екран | Що сказати |
| --- | --- | --- |
| 00:00–00:35 | /uk/home, потім /en/home | Rewind — двомовний щоденник фільмів із каталогом, списками, оцінками, оглядами та соціальними функціями. Перемикач мови змінює маршрут і UI. |
| 00:35–01:35 | /uk/films і /uk/films/:id | Показати пошук, жанр, рік, рейтинг, пагінацію, постер, опис, акторів, режисера, трейлер, схожі фільми та публічні огляди. |
| 01:35–02:35 | Login або disposable registration | Показати cookie auth і CSRF-захист. Не вводити секрети в кадрі. За потреби згадати password reset через Mailpit як окремий перевірений flow. |
| 02:35–03:35 | Movie actions і /uk/lists | Додати фільм у watched/watchlist/favorites, поставити оцінку, створити review, додати фільм у власний список. Показати loading, empty або retry state, якщо він виникає природно. |
| 03:35–04:25 | /uk/profile і public profile | Показати власні колекції, ratings, reviews, custom lists; відкрити public profile у guest context і показати, що email не є публічним полем. |
| 04:25–05:15 | Social screens | Показати follow, notification, review like або comment. Пояснити, що SSE reconnect і mobile pagination мають окремі browser checks. |
| 05:15–06:35 | /uk/admin | Увійти disposable admin fixture. Показати users, films, notifications, journal, moderation queue, pagination, hide/unhide і audit log. Не показувати зайві тестові адреси. |
| 06:35–07:25 | Security/quality slide або terminal | Коротко показати API=UP, 69/0/0/0 Maven, 28 passed + 12 skipped frontend, 12/12 admin, 200/200 load, concurrency 200/409, backup/restore counts. |
| 07:25–08:10 | Architecture slide | Пояснити React/TypeScript → Nginx → Spring Boot → MySQL/Flyway, Redis cache і Mailpit у local profile; cookie auth, CSRF, authorization і rate limits. |
| 08:10–08:45 | Limitations | Чесно назвати відкриті частини: Figma Editor parity, реальний VPS/domain/HTTPS/SMTP launch, TMDB key rotation і відмінність локального WebM demo від production launch. |

## Команди для evidence-кадру

~~~powershell
Invoke-RestMethod http://127.0.0.1:8081/actuator/health
.\scripts\verify-api.ps1
.\scripts\verify-password-reset.ps1
.\scripts\verify-http-concurrency.ps1
.\scripts\verify-backup-restore.ps1
~~~

Для повного browser evidence використовувати видимий Chrome:

~~~powershell
Set-Location letterboxd\letterboxd-login-figma-final2
npx playwright test --headed
Set-Location ..\..
.\scripts\verify-admin-browser.ps1 -Headed
~~~

## Після запису

1. Дочекатися завершення browser/API cleanup hooks.
2. Перевірити git diff --check, API health і відсутність *-current.log.
3. Вирізати з відео будь-які credentials, email-адреси та випадкові тестові ID.
4. Додати до опису відео дату перевірки й відмінність між local evidence та production readiness.
