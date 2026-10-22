# Rewind — поточний стан

Оновлено 22.10.2026. Повний Figma audit ще не завершений; наступна робота визначена в [PLAN](../../PLAN.md). Історичні результати та CI links — у [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md), конкретні nodes і межі відповідності — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md), функціональні вимоги — у [PROJECT_REQUIREMENTS](PROJECT_REQUIREMENTS.md).

## Зараз у роботі

**UserLists desktop create/edit:** живий frame `1480:5333` відкрито у Chrome; реалізація hero, metadata editor і populated rows триває з наявними CRUD/reorder API.

Global Search follow-up завершено: відновлено видимий category select/focus, виправлено intermediate-width overflow і clipping довгих текстів. Journal Search звірено з живим `1480:7549`, responsive/geometry/Search/Journal suites пройшли **23/23**, build і Docker web build PASS. Далі — Profile variants/settings і решта frame coverage за порядком PLAN.

## Що вже реалізовано

- Backend/Java і frontend/React розділені; Compose, CI та scripts використовують поточну структуру. README є входом у документацію.
- Home guest/member, navigation, Films/Search, Popular Reviews/Reviewers і Community отримали перевірені зміни за конкретними desktop/mobile raw frames; live API, UK/EN та стани завантаження/помилки збережені.
- Profile/PublicProfile мають desktop identity shell, five-tab rail, contextual mobile controls, 120 px avatar та safe wrapping довгих імен. Окремі collection/settings variants ще потребують повного аудиту.
- Lists landing, Featured/Popular feeds, Public List detail та mobile owner flows вирівняні за наявними references; працюють detail/like/tag APIs, information dialog і CRUD/reorder. Desktop owner editor лишається наступним великим блоком.
- Journal feed/article, Auth і Service/About мають локалізовані responsive layouts; декоративний `⋯` у JournalArticle прибрано. Journal зберігає API articles/audio/archive/category/pagination; newsletter subscription доступна через Profile, окрему Journal newsletter композицію ще треба звірити.
- Наявні Admin dashboard/users/reviews/comments/lists/moderation/audit/settings отримали зміни за raw geometry зі збереженням реальних actions; Messages/Notifications мають робочі routes та regression coverage, але покадровий аудит усіх variants не завершений.
- Poster contract для старих profile reviews nullable і сумісний зі старою відповіддю API; оригінальні доступні runtime assets збережені локально.

Це статус реалізованих блоків, а не заява pixel-perfect відповідності всім 250 visible top-level frames. Точні mappings, asset/font limitations і targeted checks зберігаються у профільних документах.

## Стан перевірок

| Перевірка | Останній записаний доказ і межі |
| --- | --- |
| Повна frontend regression | 22.10.2026: **128 passed, 2 failed, 12 skipped із 142**. Два failures — відомі Community retry scenarios у робочому дереві з незакоміченим `FollowActionsContext.tsx`; skips потребують admin fixture. Це checkpoint до наступних UI-змін. |
| Admin browser fixture | Попередній disposable fixture run: **12/12**, cleanup виконано; треба повторити з фінальним кодом. |
| Повна backend regression | **87 passed, 0 failures/errors/skips** проти Compose MySQL на port3307; результати й умови записані в RELEASE_EVIDENCE. |
| Build/targeted suites | Поточний Global Search follow-up: **23/23 PASS**, TypeScript/Vite (218 modules) і Docker web build PASS. Включено UK/EN, 9 ширин, long content, keyboard focus та empty state; UserLists ще не перевірено. |
| Infra/API checks | Security/contracts/password reset/cache/concurrency/load/ER/backup-restore/production config/Caddy/Compose мають попередні PASS; фінальний release pass ще потрібний. |
| GitHub/Docker | Завершені блоки доставлялися логічними commits із CI evidence, локальні API/web перебудовувалися. Остаточні Docker smoke та green CI для кінцевого commit ще попереду. |

Повний зелений фінальний regression поки не досягнуто; skips не зараховуються як passed. Старі baseline, зокрема 123/137, є історичними результатами, а не поточним підсумком.

## Відкриті залежності та межі

- **API gaps:** Admin reports/complaints/edit history/block-resolution; додаткові Profile fields/avatar-banner upload/OAuth; persisted ranked-list state; окремі feeds/counts без endpoints. Наявні moderation, URL-avatar/social links і ordered items не підміняють ці контракти. Деталі — у PLAN та FIGMA_HANDOFF.
- **Design source:** живий Figma canvas доступний у Chrome, Journal Search і Create List відкриті за node IDs. MCP design-context/screenshot повертають `Unknown tool`; локальні `.fig`/raw/screens доступні read-only для вимірів. Повний variables/assets export і fonts не підтверджені.
- **Збереження:** diploma video artifacts, локальний `AGENTS.md`, сторонні користувацькі зміни, БД, `.env`, backups, raw Figma references і кеші не входять у поточні зміни; Docker volumes зберігаються.
- **Окремий production етап:** VPS/domain/TLS, secrets, monitoring та реальний server restore drill. Погоджений Journal production content очікується й не блокує кодові перевірки.
