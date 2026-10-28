# Rewind — поточний прогрес

Оновлено 28.10.2026. Ціль активна: завершити Figma-аудит наявних маршрутів, регресію, локальний Docker і доставку в GitHub із зеленим CI. Повне завершення ще не підтверджене.

## Поточний стан

- Додаткова перевірка після першого full run: Profile 10/10, navigation/Admin/community 19/19, list mobile header/dialog 12/12, Movie/Person 6/6; у повторному наборі Movie/Search/localization Search і localization пройшли. Full suite ще не повторено успішно: залишаються геометричні та маршрутні перевірки.

- Погоджені чотири інформаційні Service-сторінки додано на спільному компоненті: Terms, Conditions, Safety Notice, HQ Accounts. UK/EN,56 перевірок ширини без overflow, клавіатура й активна навігація; парні393/1440 screenshots. Тексти не обіцяють непідтриманих платних/HQ функцій. Нових API немає. Останній build251 — технічна перевірка.
- Додатково перевірено читабельні captions288cases, колекції профілів90cases, Settings focus720/767/768 і справжні password/displayName Save, Search/Journal categories52cases та NotFound10cases. Точні докази в Release evidence; це не повна регресія.


- Figma MCP доступний. Основу визначає START HERE `5321:8872`: **167 READY**, включно зі станами; це не167 маршрутів. Історичні268 кандидатів збережено, альтернативні колекції виключено. Джерело дизайну й runtime-докази розділено у [матриці](../frontend/FIGMA_SCREEN_CANDIDATES.md).
- Inter normal/italic з кирилицею збережено локально. Перед глобальним підключенням показано font-only Home desktop/mobile; браузер підтвердив кириличні гліфи Inter без підміни. Спільний mobile/tablet перехід —767/768.
- За відповідями дизайнера компактна спільна Admin-оболонка застосована до всіх12 розділів. Підписана навігація, горизонтальний mobile rail, активний/сфокусований пункт видимі. Dashboard показує особисті API-лічильники, одну картку створених списків і поточну середню оцінку; платформа окремо. Непідтримані часові метрики позначено недоступними.96 звичайних geometry cases та15 simulated200% text cases без document overflow; це не повне приймання вмісту всіх Admin frames.
- Create List — самостійна mobile сторінка й локальна чернетка до Save. Після підтвердженого Save відкривається owner read-only `/lists?list=<id>&mode=view`, короткий успіх та явні Edit/Add film. Private/public, частковий збій додавання й Retry, невалідний ID перевірено. При помилці форма й дані зберігаються.
- Auth/Service, Search/Films/Reviews, Lists/Journal та Profile/social пройшли окремі поточні runtime-блоки UK/EN з реальними API й парними screenshots. Actor desktop отримав погоджений baked фон5340:4508 без повторного crop; phone Person має власну навігацію й Back під час loading/error. Специфічний F1 phone artwork лишається data gap. Не всі READY frame/state мають закриту композицію; точні API/data gaps лишаються відкритими в матриці.
- Спільний modal hook блокує фон через inert, утримує фокус і повертає його. Реальні Followers sheet та MovieActionSheet перевірено; native OS Share, реальна екранна клавіатура й нативний200% zoom не заявляються як перевірені.
- Admin loading24cases/text20030cases та owner-review detail Save/Delete/Retry/ownership перевірено; placeholders профілів identity6cases без overflow. Остання інтеграційна `verify:build` пройшла TypeScript/Vite,251 modules. Це технічна перевірка. Backend на ізольованій MySQL:90 tests,0 failures/errors/skips. Docker API/web чисто перебудовано й оновлено; .env і DB volume збережені. Full browser run64 passed/94 failed; виправлення й повторна регресія тривають. Окремий Admin12/12 без skips, API/security/contracts/cache/concurrency/reset/ER/backup-restore/Caddy/config scripts пройшли. Backend `c7cb26a` та UI `aba9e03` уже в origin/master; CI / verify для `aba9e03` успішний. Тести й документація ще потребують фінального commit/push та повторного CI.

Докази й обмеження: [Release evidence](../operations/RELEASE_EVIDENCE.md), [Figma handoff](../frontend/FIGMA_HANDOFF.md). Парні знімки та JSON — в ігнорованому `artifacts/visual-audit-20261028/`.

## Далі

1. Усунути збої браузерного набору й повторити full suite; окремо всі обов’язкові Admin-сценарії без skips.
2. Full Playwright158 tests із disposable ADMIN fixture, окремі Admin-сценарії й scripts API/security/contracts/reset/schema/cache/concurrency/backup/config/Caddy; виправити фактичні збої.
3. Docker UI/API smoke, scoped review/commits/push і зелений CI. Матриця268 тепер містить конкретні докази або API/data/render/component gaps; це не blanket pixel-perfect погодження.

## Погоджені межі

Усі12 Admin links; mobile PublicProfile Search; прямий Login/Register; Contact `anonimua910@gmail.com`; nullable `ProfileReview.moviePhotoUrl`. Цільовий шрифт Inter замінює попередню домовленість про системний fallback. Реальні API мають пріоритет; нових endpoints/DTO/migrations заради макетів не додавати. OAuth/Remember me/phone recovery, ranked state, окремі Featured/Crew feeds, відсутні profile/person/Admin поля й Journal rich content лишаються документованими gaps. Недоступні matched-width перевірки й попередній PublicList/Ranked виняток не перетворюються на parity claim. Незв’язані дипломні артефакти, локальний AGENTS.md, secrets, backups і references — поза commits; VPS/production deployment окремо.
