# Rewind — робочий план

**Прибирання репозиторію відновлено за новою командою користувача.** Робота над UI та deployment поки лишається в черзі нижче; агентів не запущено. Попередній стан — [PROGRESS](docs/project/PROGRESS.md), перевірки — [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md).

## Поточна задача: аудит і прибирання

1. **Інвентаризація.** Звірити Git-стан після перенесення в `backend/` і `frontend/`, карту файлів у README, локальні посилання, конфігурацію та типи артефактів. Відділити вихідний код і потрібні звіти від кешу. Інвентаризація не є ручним code review кожного файла.
2. **Кеш залишити.** Користувач дозволив продовжувати роботу без очищення кешу. `frontend/dist`, Vite cache, Python `__pycache__` і відновлювані Maven outputs залишаються на диску; не видаляти їх у цій задачі. `node_modules`, `frontend/test-results`, `artifacts`, звіти всередині `backend/target`, `.env`, БД, резервні копії та Figma references також зберегти.
3. **Зручність навігації — виконано для поточного cleanup.** Підтверджені шляхи й назви виправлені. Перенесення та пов'язані config/docs/source додані до Git-індексу: Git бачить 435 renames; commit/push не виконано. Історичні diploma artifacts, `.env`, БД, backup і Figma raw не додавалися.
4. **Перевірка cleanup — виконано в доступному обсязі.** Markdown-посилання, `git diff --cached --check`, frontend build, Maven package/validate, Compose config і script syntax перевірені. Повний frontend/backend regression виконати після завершення основної UI-роботи, як вказано нижче.

Перший аудит: 10 документів у `docs/`, зламаних локальних Markdown-посилань 0, `git diff --check` без помилок форматування. У `backend/src/main/java` — 269 файлів, `backend/src/test/java` — 40, `frontend/src` — 124, `frontend/tests` — 37, `scripts` — 21. Однакових за SHA-256 файлів серед source/scripts/docs не знайдено; посилань на стару `letterboxd/...` структуру й вилучені сторінки документації в перевірених source/config/docs немає. Із видалених Git шляхів 473 мають файл за очікуваним новим шляхом; ще 67 untracked файлів — доданий код, тести, assets і нові docs, які слід розглядати окремо. Решта 14 видалень — попередньо скорочені docs і один video screenshot. `backend/target` і `frontend/test-results` містять історичні докази; не очищати їх цілком. Глобальне `git clean` або скидання worktree заборонені.

Поточна перевірка структури: `npm run verify:build` у `frontend/` — PASS (TypeScript і Vite, 213 modules); `./mvnw.cmd -DskipTests package` у `backend/` — PASS (тести пропущено, Maven використав уже скомпільовані класи). Повний regression цим не замінено. У source/scripts/docs немає нульових файлів, файлів понад 500 KB чи конфліктів шляхів лише за регістром.

Додатково: 13 Markdown-файлів разом із кореневими — 0 зламаних відносних посилань; 16 PowerShell scripts — 0 синтаксичних помилок; 3 MJS scripts пройшли `node --check`; `docker compose config --quiet` — PASS. Два production `.sh` не вдалося перевірити через відсутній робочий Bash у цьому Windows-середовищі (WSL не має `/bin/bash`), це не висновок про помилку в скриптах.

Frontend import graph від `main.tsx` охоплює 122 із 124 source-файлів. Два винятки потрібні: `AuthShared.module.css` підключається через CSS Modules `composes`, `vite-env.d.ts` додає Vite types. Підтверджених зайвих frontend source-файлів цим аудитом не знайдено.

Playwright discovery: 125 тестів у 36 файлах (`--list`, без запуску сценаріїв). Чотири абсолютні `/images/...` шляхи у frontend source існують у `frontend/public`. Нові backend DTO/validator і чотири Figma assets мають реальні використання; не видаляти їх як «зайві» лише через статус untracked.

Назву `frontend/public/logo.png.png` нормалізовано до `logo.png`; Header/Footer використовують новий шлях. `npm run verify:build` — PASS, зібраний asset має той самий SHA-256, старих посилань немає. Точкове `Remove-Item` для одного `.pyc` також відхилено автоматичною перевіркою (`blocked by policy`); кеш залишено за новою вказівкою користувача.

Навігація: у головному README додано коротке призначення груп `scripts/`, а локальний `.vscode/settings.json` приховує `__pycache__` в Explorer. Markdown-посилання на конкретні розділи звірені з відповідними headings/HTML anchors; конфліктів не виявлено. VS Code settings JSON і `git diff --check` — PASS.

Backend-структура: усі 309 Java-файлів мають package, що відповідає каталогу; 31 Flyway migration утворюють версії V1–V31 без пропусків або повторів. Це структурна перевірка, не новий backend regression і не підстава змінювати історичні migrations.

На диску лишається приблизно 85.6 MB відновлюваних файлів (переважно Maven JAR 77.49 MB, Vite cache 4.30 MB і `frontend/dist` 1.69 MB). Звіти тестів і `artifacts` у цю оцінку не включено. Попередні команди видалення відхилила автоматична перевірка; за новою вказівкою користувача очищення більше не є умовою продовження.

Окремий cleanup: генератор `tmdb_seed_50.py` перенесено з Java runtime resources до `scripts/`; вихідний SQL лишився за старим classpath шляхом. Генератор тепер записує його за абсолютним шляхом від власного розташування. `backend/.dockerignore` та `backend/pom.xml` виключають Python cache з нових Docker/Maven збірок. Python AST parse, Maven `validate`, відносні Markdown-посилання й `git diff --check` пройшли. Старий локальний `backend/target` містить копії попереднього ресурсу; склад нового JAR перевіряти після майбутньої чистої збірки, не видавати старий JAR за новий.

## Точка продовження після відновлення

1. **Виконано:** mobile PublicProfile avatar 88 → 120 px, name 34 → 26 px, повторний eyebrow приховано. `npm run verify:build` — PASS; Chrome 320/393/768/1440 з read-only HTTP fixture: overflow 0, page errors 0, mobile CSS і довге ім'я перевірені. Auth mobile Profile не змінювався. Matching PublicProfile PNG/focused subtree відсутні, тому точну Figma parity не заявляти.
2. **Наступне:** Journal/Auth/Service → Admin, потім решта Home/Search/Lists variants і точні fonts/tokens. JournalArticle `⋯` досі декоративний — надати обґрунтовану дію або прибрати affordance.
3. Після основної UI-роботи — один актуальний frontend/backend full regression. Попередні 108/85 не є перевіркою останніх змін.
4. Новий ProfileReview.moviePhotoUrl перевірений source/targeted tests, main API ще старого image. Після потрібних gates виконати контрольований local backend/web refresh зі збереженням env/БД/rollback; frontend сумісний зі старим API.
5. Production — лише після отримання ресурсів і проходження [DEPLOYMENT](docs/operations/DEPLOYMENT.md).

## Зовнішні залежності

- Погоджені UK/EN Journal тексти, обкладинки, дати й audio URLs. Не вигадувати статті для порожнього API.
- Ротація старого TMDB key; production TMDB/SMTP credentials, VPS/domain/HTTPS/secure env; mail delivery, scheduler, monitoring та target backup/restore.
- Локальні Figma raw/image mappings і вибрані PNG є; canonical exporter/snapshot і повні fonts/variables/overrides відсутні. Джерела й frames — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md); без підтвердження не заявляти pixel parity.

## Правила відновлення

Координатор веде коротку чергу й перевіряє diffs; один owner на файл. Зберігати реальні API, UK/EN, responsive/loading/error/empty/retry, accessibility та поточні незакомічені зміни. Backend змінювати лише за підтвердженим дефектом; Flyway migrations не переписувати.

Після логічного frontend-блоку — `npm run verify:build` і короткий Chrome smoke 320/393/768/1440. Targeted tests — за ризиком, full — після основної UI-роботи. Inventory/pattern scans не означають ручної перевірки кожного файла.

Source Vite 5173, попередній Docker web 3000; запуск — [RUN_LOCAL](docs/operations/RUN_LOCAL.md). Не очищати історичні дані за шаблонами, не скидати worktree. Секрети не записувати в Git/чат/логи. Нове відео не потрібне. Commit/push — лише за окремою прямою командою.
