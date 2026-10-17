# Rewind — контрольний чекліст

Цей файл — короткий навігатор по великому плану. Детальні докази, дати, команди й відкриті ризики залишаються у [PROGRESS.md](PROGRESS.md). Позначка `[x]` ставиться тільки після коду, тесту й наскрізної перевірки; `[~]` означає частково виконаний етап.

## Етапи

- [~] **1. Основа й дизайн** — Git, CI, секрети й карта проєкту готові. Відкриті: ротація старого TMDB-ключа, Editor-доступ Figma і точна parity-перевірка.
- [~] **2. Стабільний локальний продукт** — Compose, Flyway 27, API error contract, DELETE-виправлення, core browser flow і MySQL integration tests готові. Додано конкурентне створення огляду: один запис перемагає, другий отримує HTTP 409; rating upsert використовує атомарний MySQL `ON DUPLICATE KEY UPDATE`. Відкриті: повний контрактний аудит усіх endpoint'ів.
- [~] **3. Інтерфейс і акаунт** — UK/EN маршрути, cookie auth, reset, профіль і списки готові. Відкриті: повна локалізація даних, UX профілю й повний responsive-аудит.
- [~] **4. Фільми й пошук** — home, каталог, фільтри, деталка, персоналії, рекомендації та admin TMDB import/sync/quality report готові. Відкриті: реальний контрольований batch після надання ключа, scheduler і Figma parity.
- [~] **5. Особисті дії та списки** — watched/watchlist/favorites, ratings, reviews, comments і public lists підключені. Відкриті: повний browser UX-аудит профілю та списків.
- [~] **6. Спільнота** — follows, likes, activity, tags, notifications/SSE, messages і HQ готові. Відкриті: ширші admin browser regression flows.
- [~] **7. Журнал і службові сторінки** — journal, archive, podcast audio, newsletter, legal/help pages і admin editor готові. Відкриті: повна редакційна локалізація та production SMTP monitoring.
- [~] **8. Адмінка** — dashboard, users/HQ, movies, lists, communications, notifications, moderation, settings і audit готові. Review/comment moderation вже проходить у браузері; відкриті ширші права й bulk regression.
- [~] **9. Якість і реліз** — Redis cache, rate limits, health/metrics, backups, restore drill, security headers, axe/keyboard, non-root image і production overlay готові. Відкриті: глибші SQLi/XSS matrix, dev dependency audit, production load, VPS/HTTPS.
- [ ] **10. Захист і презентація** — ER-діаграма готова, але Figma parity, демонстраційні дані та відеопрезентація ще не закриті.

## Останній перевірений зріз

- `CoreFilmFlowIntegrationTests`: конкурентне створення одного review дає **1 успіх + 1 HTTP 409**, у БД залишається один запис.
- `CoreFilmFlowIntegrationTests`: два одночасні rating upsert проходять без duplicate-key error і залишають один запис з останнім значенням.
- Browser security: review/comment `<img onerror>` payload не створює DOM image або dialog; catalog/admin SQL-подібний пошук не дає 500.
- Admin moderation: review і comment окремо приховуються з moderation queue.
- Compose HTTP flow: `scripts/verify-api.ps1` за замовчуванням ходить на `127.0.0.1:8081` і проходить auth/catalog/lists/rating/review/comment/social/refresh сценарії.

## Наступна черга

1. Додати contract smoke для решти public/protected endpoint'ів і конкурентного запису списків/соціальних дій.
2. Закрити повну локалізацію й error/empty/loading стани незалежних від Figma екранів.
3. Розширити production-like load/security matrix і перевірку bulk moderation прав.
4. Після Editor-доступу зафіксувати точні Figma desktop/mobile фрейми, tokens, assets і screenshots.

## Команди перевірки

```powershell
./mvnw.cmd -q -DskipTests compile
./scripts/verify-security.ps1
./scripts/verify-load.ps1
./scripts/verify-admin-browser.ps1
cd letterboxd/letterboxd-login-figma-final2
npm run build
npx playwright test
```

## Figma blocker

Плагін підключений, але три надані файли зараз доступні лише для перегляду/comment. `get_design_context` і screenshots повертають `don't have edit access`, тому точні токени й assets не вигадуються до Editor-доступу.
