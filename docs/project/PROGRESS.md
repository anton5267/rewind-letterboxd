# Rewind — підсумок роботи й стан передачі

**Роботу зупинено 20.10.2026 за прямою командою користувача.** Реалізація та агенти зупинені; нижче — фактичний підсумок і точка продовження. Нові зміни починати лише після команди відновити роботу. Порядок — [PLAN](../../PLAN.md), точні перевірки — [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## 1. Структура проєкту й прибирання

- Workspace: `C:\Users\Legion\Downloads\rewind-master`; Git-репозиторій — вкладений `rewind-master`.
- Java/Maven перенесено в `backend/`, React/TypeScript/Vite — у `frontend/`. Compose, scripts, CI, Caddy, env та artifacts залишені в корені; відповідні paths оновлено.
- Документацію скорочено з 17 до 10 файлів, обсяг тексту — на 45.8%. Головний README тепер містить архітектуру, карту функцій і навігацію.
- ER-схему об'єднано з backend guide, відповідність реалізації — з ТЗ. Дубльовані карти/чекліст/покажчик і зайвий сценарій відео прибрано. Оригінальний текст вимог збережено.
- `target`, `.class`, `dist`, dependencies і test reports відділені від source. Важливий dirty worktree, особисті файли, БД та попередні докази збережено; commit/push не виконувалися.

Backup усіх 20 початкових Markdown — workspace `.codex-backups/docs-cleanup-before-20261020_2035/`; [доказ cleanup](../../artifacts/docs-cleanup-verification-20261020.json). Поточні документи: frontend guide/Figma, backend guide/API, запуск/deployment/evidence, вимоги/статус, матеріали захисту.

## 2. Реалізований продукт

| Напрям | Що є в коді |
| --- | --- |
| Акаунт | Реєстрація, вхід/вихід, HttpOnly access/refresh cookies, CSRF, reset через email; UK/EN |
| Каталог | Home, каталог/фільтри/пошук/пагінація, глобальний пошук, Movie Details, актори/режисери/продюсери й filmography |
| Особисті дії | Оцінки, watched/watchlist/favorites, створення/редагування/видалення оглядів, коментарі та likes |
| Списки | Власні CRUD/reorder, публічні feeds/detail, tags, likes, інформаційна панель і responsive editor |
| Профілі/social | Власний і публічний профілі, статистика/історія/collections, social links, follow/block, Community, activity |
| Спілкування | Messages, conversations, pagination, unread, notifications/SSE/preferences і retry |
| Journal | Feed/article/archive/category/audio/newsletter, admin editor/publishing; опублікованого погодженого UK/EN контенту поки немає |
| Admin | Users/HQ/overview, movies/TMDB, reviews/comments/lists moderation, communications, settings/audit |
| Середовище | Flyway, MySQL/Redis, Mailpit, Docker Compose, локальні verification і backup/restore інструменти |

Це перелік наявних функцій, а не доказ production-готовності кожної поверхні. Шляхи компонентів і Java packages — у [головному README](../../README.md#де-шукати-функцію).

## 3. Виправлені дефекти й UI-доведення

- **Auth/інфраструктура:** виправлено CSRF cookie/header race між паралельними запитами; збережено auth rotation/guards. Закрито pathname scroll/focus дефект і недовірені HTTPS proxy headers. Перевірено password UTF-8 limit, reset/admin success/cancel focus та TMDB ID validation.
- **Movie/Review/auth mobile Profile:** допрацьовано постери, заголовки, metadata, порядок content sections, preview rails і contextual mobile navigation зі збереженням реальних actions.
- **Home/Search:** застосовано mapped original hero assets, компактні poster/content rails, Journal covers, реальні counts, phone All/Films/Empty і desktop Films composition; виправлено невидимі/обрізані focus rings та їх clearance.
- **Lists:** компактний landing, upright preview strips, Recently liked cards, metadata/editor rows; збережено фактичні preview counts і CRUD/reorder. Виправлено перекритий mobile Back; `⋯` тепер відкриває справжній dialog з owner/likes/tags, focus trap, Escape/Done/backdrop і retry.
- **Profile/Reviewers:** виправлено обрізання first/last focus rings у rails, збережено native scrollbars; Back/Search мають 44 px hitboxes. Public list preview більше не перекриває довгий title, його outline видно всередині картки.
- **Community:** прибрано повторення однакових заголовків, скорочено mobile hero, використано справжній mapped background, desktop reviewer/HQ columns і широкий directory; search/pagination/view-all мають придатні touch targets. Реальні API та empty states збережено.
- **Постери старих оглядів:** backend DTO/mapper додає nullable `moviePhotoUrl`; frontend бере poster із самого огляду. `null` означає справді відсутнє зображення; лише `undefined` від старого API використовує попередній recentRatings fallback. Це усуває залежність нової відповіді від останніх 10 оцінок без додаткових per-movie requests.
- **Runbooks:** виправлено legacy backup/restore target ambiguity та узгоджено production install/Compose paths. Це документація, а не виконаний production запуск.

Останній запланований косметичний крок — збільшити mobile PublicProfile avatar 88 → 120 px, name до 26 px і прибрати повторний eyebrow — **не застосовано**, бо користувач зупинив роботу. На 393 px у довгого реального імені ще може залишатися самотній останній символ на новому рядку.

## 4. Figma й агент-координатор

Отримано справжню локальну `.fig` copy, 1544 original images, локально прочитані raw nodes/image mappings і вибрані frame exports. Proprietary references та tools залишені поза Git у `.codex-backups/figma-local-copy-20261020/`. REST exporter/snapshot відсутні, MCP має обмеження доступу; повні fonts/variables/overrides не підтверджені. Результат називаємо **visual alignment**, а не pixel-perfect parity. Frames і corrected mappings — лише у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).

Створено координатора: він вів PLAN, розподіляв непересічні ownership zones, перевіряв diffs і фактичні focus paints, передавав дефекти виконавцям. Виконано bounded source/config/docs audit; inventory не оголошувався повною ручною перевіркою кожного файла. На момент зупинки coordinator/backend agents завершені, останнього UI-агента перервано.

## 5. Що перевірено

| Перевірка | Результат і межа |
| --- | --- |
| Останній frontend build | PASS 20:54:20–20:54:41; 213 modules, entry 323.74 kB / gzip 105.23 kB. Усі 135 frontend source/public/config hashes збігаються з поточним станом після зупинки |
| Останній Profile/Community блок | Backend 2 DB-free service→controller contract cases; frontend 3 poster cases; Community keyboard 1 case — PASS. CSS 24 views / 80 focus states / 120 hit points; root real Chrome 20 loaded views на 320/393/768/1440, overflow/console 0 |
| Lists | Окремо Header 10 і dialog 2 cases, catalog 10 scenarios, editor 32 state views; build і real Chrome 16 views |
| Home/Search | Окремі Search 4/Home 2 cases, build та реальний responsive/keyboard smoke |
| Останні повні suites | Frontend 108 passed / 0 skipped; backend 85 tests / 0 skipped — **раніші checkpoints**. Вони не покривають автоматично останні Home/Search/Lists/Profile/Community зміни й новий backend field |
| Документація | Cleanup links/anchors і source pins перевірені; нових UI/full suites через документи не запускали |

Перші невдалі/перервані запуски збережено окремо. Старі 12 skips були без admin credentials; у новому full 108 їх 0. У цьому блоці Community test harness мав race між local pending і HTTP dispatch; виправлено точне очікування, product guards не змінювалися. Не всі історичні тести були writes0: exact interrupted disposable account/list cleanup описано в release evidence.

Останні докази — [Profile/Community JSON](../../artifacts/profile-community-verification-20261020.json), [Lists](../../artifacts/lists-verification-20261020.json), [Home/Search](../../artifacts/home-search-verification-20261020.json). Повні reports, source hashes і межі — у [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## 6. Локальний сайт і незавершене розгортання

- `http://127.0.0.1:5173/uk/home` — поточний Vite frontend source; під час останнього Chrome smoke працював із наявним API.
- `http://127.0.0.1:3000/uk/home` — попередній перевірений Docker web image, а не останні UI-зміни.
- API 8081 теж не оновлювався в останньому блоці. Новий `moviePhotoUrl` перевірений у source/тестах, але потребує подальшого контрольованого backend package/image refresh; frontend підтримує попередній API.
- Власний Chrome viewport override прибрано, службову вкладку закрито. Основні контейнери, dev server, env і БД не зупинялися/не змінювалися через команду зупинити реалізацію.

## 7. Що залишилося й звідки продовжувати

1. Завершити зазначене mobile PublicProfile composition виправлення, перевірити affected paint/keyboard і build.
2. Journal/Auth/Service → Admin та інші variants/fonts/tokens; JournalArticle декоративний `⋯` досі потребує реальної дії або видалення affordance.
3. Після основної UI-роботи виконати один актуальний повний frontend/backend regression, потім контрольовано оновити локальні images за потреби.
4. Отримати погоджені UK/EN Journal тексти, covers/audio/dates; порожній API не підмінявся статтями або mocks.
5. Ротувати старий TMDB key, надати production TMDB/SMTP credentials, VPS/domain/HTTPS; перевірити mail/scheduler/monitoring/backup-restore на цільовому середовищі.

Робочі оцінки лишаються приблизними: **95% основного функціоналу, 80% готовності до релізу**. Це не виміряний відсоток тестів. Користувач уже має відео; нового запису немає. Git залишається dirty, staged/conflicts на момент зупинки 0; commit/push потребують окремої прямої команди.
