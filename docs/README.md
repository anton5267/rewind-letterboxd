# Документація Rewind

У корені залишені файли запуску, конфігурації та головний [`PLAN.md`](../PLAN.md).

## Як читати документацію

`PLAN.md` — єдине джерело поточного порядку роботи. `PROGRESS.md` — детальний
історичний журнал фактичних змін і перевірок, а `IMPLEMENTATION_CHECKLIST.md` —
короткий release-oriented список завершених зрізів. `FIGMA_HANDOFF.md` — єдина
актуальна таблиця відповідності Figma frame → node/size → React route → evidence
→ gap. `RELEASE_EVIDENCE.md` містить останній локальний evidence bundle; він не
замінює production sign-off.

Для зміненого admin flow спочатку використовуйте targeted запуск
`scripts/verify-admin-browser.ps1 -Headed -Grep "..."`; повний admin набір
залишайте для завершення великого UI-зрізу або release regression.

Генеровані або тимчасові артефакти (`target/`, frontend `dist/`,
`node_modules/`, `test-results/`) не є вихідним кодом. Знімки та WebM у
`artifacts/` залишаються лише як локальні докази й не повинні змішуватися з
React, Java або документаційною структурою.

## Робочі документи

- [`PROJECT_REQUIREMENTS.md`](PROJECT_REQUIREMENTS.md) — вимоги замовника.
- [`REQUIREMENTS_TRACE.md`](REQUIREMENTS_TRACE.md) — відповідність вимог коду.
- [`PROJECT_MAP.md`](PROJECT_MAP.md) — карта API, модулів і бази даних.
- [`PROGRESS.md`](PROGRESS.md) — детальний журнал реалізації та перевірок.
- [`IMPLEMENTATION_CHECKLIST.md`](IMPLEMENTATION_CHECKLIST.md) — короткий checklist.
- [`RUN_LOCAL.md`](RUN_LOCAL.md) — локальний запуск і перевірки.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — production runbook.
- [`ER_DIAGRAM.md`](ER_DIAGRAM.md) — актуальна ER-діаграма.
- [`API_AUDIT.md`](API_AUDIT.md) — історичний API-аудит і його виправлення.
- [`FIGMA_HANDOFF.md`](FIGMA_HANDOFF.md) — передача Figma та відкриті обмеження доступу.

## Дипломні матеріали

Матеріали для демонстрації та відеозапису зібрані у [`diploma/`](diploma/).
