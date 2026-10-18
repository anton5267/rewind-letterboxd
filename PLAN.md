# Rewind — актуальний робочий план

Оновлено **18.10.2026**. Ціль: довести Rewind до вимог [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md), доступних Figma-макетів, перевірених наскрізних сценаріїв і готового public-release. Працюємо кодом; тести використовуємо після змін як доказ, а не як заміну реалізації.

## Поточний verified state

- Backend: **68 тестів, 0 failures, 0 errors, 0 skipped** у 36 test classes.
- Database: Flyway **V1–V30**, schema **36 tables / 53 foreign keys**.
- API: **155 operations / 126 paths**, Compose health `UP`.
- Frontend: `tsc --noEmit`, Vite build (**150 modules**), Web container rebuild.
- Runtime smoke: public/protected contract smoke green, public guards **5/5**, admin headed smoke **12/12**.
- Backup/restore: **167 movies / 379 users / 30 migrations** у тимчасовій БД.
- Останні кодові зрізи: list likes/feeds, активна privacy-фільтрація, популярні списки за лайками, public-list detail UX, journal per-slug locale fallback.
- GitHub: **не пушити**, доки користувач окремо не скаже.

## Порядок наступної роботи

### 1. Завершити локальний UX і браузерні сценарії — наступний кодовий етап

- [ ] Профіль і списки: пройти всі loading/error/retry/empty стани, mutation locks, останню сторінку після delete та мобільні ширини 320/768 px.
- [ ] Social: довести один headed flow для follow → notification → unread badge, block → message guard → unblock, public activity/network.
- [ ] Public lists: перевірити discover → tag/feed → detail → author profile → movie detail, включно з UK/EN і keyboard navigation.
- [ ] Admin: додати ширший browser flow для moderation, notifications, conversations, lists і останньої сторінки після дій.
- [ ] Після коду оновити [`docs/PROGRESS.md`](docs/PROGRESS.md) та [`docs/IMPLEMENTATION_CHECKLIST.md`](docs/IMPLEMENTATION_CHECKLIST.md) фактичними результатами.

### 2. Довести двомовність і редакційний контент

- [x] UI має UK/EN маршрути, статичні labels і fallback для відомих enum/category значень.
- [x] Public journal list/detail/archive мають server-side per-slug fallback перекладу.
- [ ] Перевірити всі майбутні dynamic metadata/редакційні поля: не залишати порожній текст без явного fallback.
- [ ] При додаванні нового UI спочатку додавати обидва словникові ключі, потім компонент.

### 3. Figma parity — після отримання доступу

- [ ] Отримати Editor-доступ або конкретні frame links для Design і FigJam.
- [ ] Зафіксувати desktop/mobile frames, tokens, typography, spacing, assets і стани.
- [ ] Зіставити frames із React-сторінками та зробити visual audit у розмірах макетів.
- [ ] Не вигадувати Figma-параметри, поки інтеграція повертає `don't have edit access`.

Документ передачі: [`docs/FIGMA_HANDOFF.md`](docs/FIGMA_HANDOFF.md).

### 4. Production readiness — після надання зовнішніх даних

- [ ] Ротувати раніше розкритий TMDB key і перевірити всі secrets.
- [ ] Отримати production TMDB/SMTP credentials, домен, VPS і HTTPS certificate.
- [ ] Заповнити `.env.production` поза Git, пройти `verify-production-config.ps1` на реальному secure env.
- [ ] Запустити production Compose overlay, scheduler з bounded batch, monitoring і backup schedule.
- [ ] Перевірити реєстрацію, reset email, catalog, lists, social, moderation, обидві мови та restore drill на production-like середовищі.

Runbook: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### 5. Фінальний реліз і захист

- [ ] Зібрати один clean release evidence bundle: build, API contracts, browser smoke, schema, backup/restore, accessibility/security.
- [ ] Переглянути дипломні матеріали й локальний WebM recording.
- [ ] Перевірити `git diff --check`, статус, секрети та список файлів.
- [ ] Показати користувачу підсумок змін.
- [ ] Зробити **один** commit/push лише після його команди.

## Правила роботи

1. Не переписувати Flyway V1–V4; зміни БД — тільки новою міграцією.
2. Не скидати й не перезаписувати чужі незакомічені зміни.
3. Спочатку реалізувати код, потім запускати targeted verification і лише після завершення зрізу — повний regression.
4. Публічні responses не повинні розкривати email, службові поля або дані деактивованих авторів.
5. Пагінація має бути server-side, зі стабільним tie-breaker; фільтри починаються з першої сторінки.
6. Кожен новий текст UI має UK/EN label; кожна mutation має loading/error/lock стан.
7. Не пушити GitHub без прямої команди користувача.

## Definition of done

Ціль можна закрити тільки коли:

- локальні функціональні вимоги з [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md) мають код і наскрізний доказ;
- основні user flows пройдені browser → API → MySQL;
- Figma parity або чесно підтверджена неможливість через відсутній доступ;
- production runbook виконаний на реальному secure env або явно заблокований відсутніми credentials;
- documentation summary відповідає фактичному стану;
- користувач погодив фінальний push.

Детальні докази та історія змін: [`docs/PROGRESS.md`](docs/PROGRESS.md). Короткий checklist: [`docs/IMPLEMENTATION_CHECKLIST.md`](docs/IMPLEMENTATION_CHECKLIST.md). Вимоги: [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md).
