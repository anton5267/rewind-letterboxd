# Rewind — сценарій дипломного захисту

Rewind — двомовний щоденник фільмів із каталогом, оцінками, оглядами, списками та соціальною взаємодією. Цей сценарій розрахований на 7–9 хвилин усного показу. Готове відео користувач уже має; новий запис не потрібний.

## Послідовність показу

| Час | Що показати | Матеріал для слайда або пояснення |
| --- | --- | --- |
| 1 хв | Проблема, користувачі, можливості гостя, USER та ADMIN | [Вимоги й trace appendix](../project/PROJECT_REQUIREMENTS.md) |
| 1 хв | React/TypeScript → Spring Boot API → MySQL; Flyway, Redis cache, cookie auth і CSRF | [Архітектура backend](../backend/README.md), [ER-схема](../backend/README.md#схема-даних), [frontend map](../frontend/README.md) |
| 2 хв | `/uk/home` → `/en/home`; каталог, фільтри, деталі фільму; вхід і rating/review | [Каталог та auth](../frontend/README.md#catalog), [HTTP API](../backend/API.md) |
| 2 хв | Власний і публічний профіль; створення списку, додавання фільмів і reorder; follow, like або comment | [Профіль](../frontend/README.md#profile), [Lists](../frontend/README.md#lists), [Social](../frontend/README.md#social) |
| 1 хв | Admin: знайти демонстраційний запис, показати модерацію й audit; Journal editor за потреби | [Адмінка](../frontend/README.md#admin) |
| 1–2 хв | Пояснити локальні перевірки, backup/restore, поточні обмеження та наступні кроки | [Release evidence](../operations/RELEASE_EVIDENCE.md), [Deployment](../operations/DEPLOYMENT.md), [Поточний статус](../project/PROGRESS.md) |

## Підготовка демонстрації

- Запустити локальне середовище за [RUN_LOCAL.md](../operations/RUN_LOCAL.md), заздалегідь перевірити вхід у demo USER/ADMIN та наявність потрібних фільмів.
- Мутації виконувати лише на підготовлених демонстраційних акаунтах і записах. Зберегти точні ID створених fixtures; cleanup прибирає лише їх, а не особисті або історичні дані.
- Показувати реальні API-відповіді, зокрема порожній стан і доступний retry. Journal без опублікованих матеріалів демонструвати як порожній feed або редактор, без вигаданих статей.
- Дату, обсяг і результат кожної перевірки брати з release evidence: targeted сценарій не підтверджує весь regression, локальний запуск — production.

## Межі результату

Наявні оригінальна `.fig`, raw subtrees, image mappings і browser PNG дають основу visual alignment; точні fonts/variables та загальна parity ще не підтверджені — див. [Figma handoff](../frontend/FIGMA_HANDOFF.md). Production VPS/domain/HTTPS/SMTP, погоджений опублікований UK/EN Journal content і зовнішні credentials залишаються окремими завданнями в [PLAN.md](../../PLAN.md).

[Навігація проєктом](../../README.md) · [Поточний статус](../project/PROGRESS.md)
