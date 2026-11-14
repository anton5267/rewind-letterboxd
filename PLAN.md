# REWIND — план робіт

## Ціль і межі

Завершити UK/EN REWIND на GitHub Pages + Supabase Free. Зберігати маршрути, API-контракти, числові ID, ролі, приватність і доступність. Архітектура та запуск описані в [README](README.md).

Spring Boot/MySQL/Redis/Mailpit мають окремий локальний життєвий цикл. Наявні локальні зміни й дані зберігати. Перед перенесенням різних версій файлів проводити змістовне порівняння.

## Підтверджений стан — 14.11.2026

- [x] Повний React frontend опублікований на GitHub Pages. Функціональні релізи та їхні CI/Pages докази наведені в release evidence.
- [x] Hosted API `rewind-api` v59 ACTIVE звірено з повним джерелом. Таблиці застосунку розміщені в приватній `rewind` schema з RLS, профілі пов’язані з Auth за UUID.
- [x] Англійський README має три архітектурні схеми. Edge API та React-профілі рознесені за відповідальністю.
- [x] Опубліковані settings, reply preferences, коментарі списків, медіа й закріплення профілю, Journal media, Community details, оновлення повідомлень/сповіщень і Person filters/roles/biographies. Межі приймання — у [PROGRESS](docs/project/PROGRESS.md).
- [x] Історія hosted міграцій у джерелах звірена з 55/55 live версіями й назвами; чотири відсутні SQL-файли відновлені з перевіреної локальної копії. Favorites мають захист зміни акаунта й післявидальний focus, цільові UK/EN fixtures 6/6.
- [x] Admin credits search ізольовано за роллю й запитом, поле лишається доступним під час пошуку; зміна запиту очищає попередню помилку. Жанри Admin локалізовані через спільну функцію. Цільові browser сценарії 6/6.
- [x] Статусні документи скорочені, детальні checkpoints і варіанти попередніх текстів збережені в [архіві](docs/archive/README.md).
- [x] Live owner list flow пройшов створення, порядок фільмів, rank/reply settings, очищення опису, pin/save/reload, comment create/edit/reload/delete та public→private з автоматичним unpin і анонімним 404. Тестові записи очищені. Картки приватних списків спрямовані на відповідний owner detail route, UK/EN navigation fixtures 2/2.

## Наступна робота

Поки користувач відсутній, працювати над доступними пунктами 2 і 5. Пункти з відсутніми секретами, Docker або взаємодією власника відкласти до появи відповідних умов.

1. [ ] **Backup/restore та звірка даних.** Додати відсутні backup password і незалежну encryption passphrase у GitHub Secrets. Виконати зашифрований export та disposable restore, звірити рядки, IDs, FK, NULL і sequences обох джерел, визначити merge mapping і rollback. Локальна БД очікує відновлення Docker. До приймання не виконувати production import/overwrite. [Runbook](docs/operations/DEPLOYMENT_POSTGRESQL.md#supabase-free-backup-and-recovery--not-yet-accepted).
2. [ ] **Змістовна звірка локальних змін з upstream.** Продовжити з відмінностей Admin UI, test fixtures і конфігурації. Backend review та локальний V32/V36 шлях уже мають датовані докази. Зберігати застосовані локальні V32 identity/V33 outbox, original language додається через V36. Під час майбутнього об’єднання Spring-гілок зберегти обидві міграційні історії. Локальний Spring publication fix скомпільовано, виконання DB integration очікує доступної БД.
3. [ ] **Контрольоване live приймання приватних дій.** Завершити save/reload/clear профілю й reply settings, upload/replace/remove медіа, двоакаунтні list reply/report/Admin dismissal, email change з двома адресами, двоакаунтну доставку messages/notifications та editorial save. Перевірити розмежування доступу й cleanup тестових записів. Чинну `+rewindtest` ADMIN identity зберігати.
4. [ ] **TMDB metadata.** Після cooldown перевірити штатний daily refresh. За останнім записом наступна eligible партія — не раніше 16.11.2026 03:00 UTC. Snapshot має 20/49 зв’язаних фільмів без `original_language` та один фільм без підтвердженого TMDB ID. Зберігати API-підтверджену відповідність. [Операції](docs/operations/SUPABASE_OPERATIONS.md).
5. [ ] **Решта підтверджених UI/API/Figma прогалин.** Звіряти чинні frames із відповідними станами застосунку. Відкриті дизайн-токени й типографіка, shared header/footer, повний settings/article layout, детальні job/written credits та інші непідтверджені стани. Конкретний дефект виправляти окремим читабельним блоком. [Figma](docs/frontend/FIGMA_HANDOFF.md), [вимоги](docs/project/PROJECT_REQUIREMENTS.md#implementation-status).
6. [ ] **Підсумкове release review.** Зіставити реалізацію з усіма вимогами, зафіксувати прийняті обмеження Free plan та відтворюваний recovery-процес, передати актуальні інструкції.

## Правила виконання

- Перевірки обирати за зміненим шляхом і конкретним ризиком регресії. Повторювати їх після релевантної зміни або нових доказів помилки.
- Для змін лише Markdown перевіряти зміст, шляхи, anchors і diff. Результати CI, fixtures, production reads і реальних дій записувати з точними межами.
- Після завершеного блоку оновлювати короткий статус. Датовані технічні докази зберігати в архіві.
- Серверні секрети зберігати в secret storage. Приватну `rewind` schema, Supabase `auth` та межі власності даних зберігати за чинною архітектурою.
