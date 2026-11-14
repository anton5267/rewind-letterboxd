# REWIND — план робіт

## Ціль і межі

Завершити UK/EN REWIND на GitHub Pages + Supabase Free. Зберігати маршрути, API-контракти, числові ID, ролі, приватність і доступність. Архітектура та запуск описані в [README](README.md).

Spring Boot/MySQL/Redis/Mailpit мають окремий локальний життєвий цикл. Наявні локальні зміни й дані зберігати. Перед перенесенням різних версій файлів проводити змістовне порівняння.

## Підтверджений стан — 14.11.2026

- [x] Повний React frontend опублікований на GitHub Pages. Функціональні релізи та їхні CI/Pages докази наведені в release evidence. Стани Home та Header ізольовані за ID глядача. Cross-tab account switch і запізнілі відповіді перевірені цільовими UK/EN fixtures для feed та unread counters.
- [x] Hosted API `rewind-api` v60 ACTIVE звірено з повним джерелом. Таблиці застосунку розміщені в приватній `rewind` schema з RLS, профілі пов’язані з Auth за UUID.
- [x] Hosted session bootstrap очікує REWIND-профіль перед Admin guard. Прострочений токен, ADMIN/USER routing та Header account switch мають цільове покриття.
- [x] Англійський README має три архітектурні схеми. Edge API та React-профілі рознесені за відповідальністю.
- [x] Shared Header/Footer отримали оригінальні Figma SVG, desktop search border і nav slots/opacity. Цільова UK/EN звірка геометрії та клавіатури пройшла у 10 viewport/locale комбінаціях. Типографіка й повна frame parity відкриті.
- [x] Journal article має окремі Header/Skeleton і стилі, джерельне тло/breadcrumb, геометрію обкладинки та reader columns. Перевірені legacy/media/audio/language/error шляхи й 320px layout. Live editorial save, публікація й повернення в чернетку та UK/EN reader прийняті. QA запис очищений. Повна article parity відкрита.
- [x] Опубліковані settings, reply preferences, коментарі списків, медіа й закріплення профілю, Journal media, Community details, оновлення повідомлень/сповіщень і Person filters/roles/biographies. Межі приймання — у [PROGRESS](docs/project/PROGRESS.md).
- [x] Історія hosted міграцій у джерелах звірена з 55/55 live версіями й назвами; чотири відсутні SQL-файли відновлені з перевіреної локальної копії. Favorites мають захист зміни акаунта й післявидальний focus, цільові UK/EN fixtures 6/6.
- [x] Admin search має request/role guards, локалізовані жанри й окремі назву/помилку поля жанрів. Movie edit зберігає відсутню originalLanguage й nullable castOrder. Новий актор отримує наступну позицію з урахуванням integer bounds. Версійний Supabase config явно виключає rewind із Data API. Перевірки — у release evidence. Admin review editor має окремий CSS-модуль, адаптивне поле й keyboard focus. Захищений Admin GET деталей і hidden-film save/reload прийняті live. QA очищено, початкові 50 фільмів звірені. Спільний SQL reader відокремлений.
- [x] Статусні документи скорочені, детальні checkpoints і варіанти попередніх текстів збережені в [архіві](docs/archive/README.md).
- [x] Live owner list flow пройшов створення, порядок фільмів, rank/reply settings, очищення опису, pin/save/reload, comment create/edit/reload/delete та public→private з автоматичним unpin і анонімним 404. Тестові записи очищені. Картки приватних списків спрямовані на відповідний owner detail route, UK/EN navigation fixtures 2/2.

- [x] Live profile settings пройшли UK save/reload, EN clear/reload та SELF/FOLLOWED/ANYONE. Перевірено owner-only names і website save/reload/public-read/clear. Початкові поля й порожні social/name записи відновлені.

## Наступна робота

Поки користувач відсутній, працювати над доступними пунктами 2 і 5. Пункти з відсутніми секретами, Docker або взаємодією власника відкласти до появи відповідних умов.

1. [ ] **Backup/restore та звірка даних.** Додати відсутні backup password і незалежну encryption passphrase у GitHub Secrets. Виконати зашифрований export та disposable restore, звірити рядки, IDs, FK, NULL і sequences обох джерел, визначити merge mapping і rollback. Локальна БД очікує відновлення Docker. До приймання не виконувати production import/overwrite. [Runbook](docs/operations/DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted).
2. [ ] **Змістовна звірка локальних змін з upstream.** Продовжити з відмінностей Admin UI, test fixtures і конфігурації. Backend review та локальний V32/V36 шлях уже мають датовані докази. Зберігати застосовані локальні V32 identity/V33 outbox, original language додається через V36. Під час майбутнього об’єднання Spring-гілок зберегти обидві міграційні історії. Локальний Spring publication fix скомпільовано, виконання DB integration очікує доступної БД.
3. [ ] **Контрольоване live приймання приватних дій.** Завершити upload/replace/remove медіа, двоакаунтні list reply/report/Admin dismissal, email change з двома адресами, двоакаунтну доставку messages/notifications. Перевірити розмежування доступу й cleanup тестових записів. Чинну `+rewindtest` ADMIN identity зберігати. Live upload очікує Chrome extension Allow access to file URLs, звичайні settings вже прийняті.
4. [ ] **TMDB metadata.** Після cooldown перевірити штатний daily refresh. За останнім записом наступна eligible партія — не раніше 16.11.2026 03:00 UTC. Snapshot має 20/49 зв’язаних фільмів без `original_language` та один фільм без підтвердженого TMDB ID. Зберігати API-підтверджену відповідність. [Операції](docs/operations/SUPABASE_OPERATIONS.md).
5. [ ] **Решта підтверджених UI/API/Figma прогалин.** Звіряти чинні frames із відповідними станами застосунку. Відкриті дизайн-токени й типографіка, решта shared header/footer parity, повний settings layout і решта article parity, детальні job/written credits та інші непідтверджені стани. Конкретний дефект виправляти окремим читабельним блоком. [Figma](docs/frontend/FIGMA_HANDOFF.md), [вимоги](docs/project/PROJECT_REQUIREMENTS.md#implementation-status).
6. [ ] **Підсумкове release review.** Зіставити реалізацію з усіма вимогами, зафіксувати прийняті обмеження Free plan та відтворюваний recovery-процес, передати актуальні інструкції.

## Правила виконання

- Перевірки обирати за зміненим шляхом і конкретним ризиком регресії. Повторювати їх після релевантної зміни або нових доказів помилки.
- Для змін лише Markdown перевіряти зміст, шляхи, anchors і diff. Результати CI, fixtures, production reads і реальних дій записувати з точними межами.
- Після завершеного блоку оновлювати короткий статус. Датовані технічні докази зберігати в архіві.
- Серверні секрети зберігати в secret storage. Приватну `rewind` schema, Supabase `auth` та межі власності даних зберігати за чинною архітектурою.
