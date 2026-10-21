# Rewind — поточний стан

Оновлено 21.10.2026. Основний release checkpoint і Search/CI maintenance етап доставлені в GitHub; після них розпочато повний Figma audit по конкретних nodes. Завершений Popular Reviewers `1480:5486`/`1480:7698` має реальні reviewer metrics, desktop/mobile geometry, повні 127 browser-сценарії та 87 backend-тестів. Community `605:1112`/`1517:4931` переведений на Figma hero, featured/popular rails і member-list composition; справжні API profiles та follow interactions збережені. Guest Home desktop `1413:6471` отримав перевірений local original artwork та Figma hero/CTA geometry; member Home і наступні feed variants ще потребують окремої звірки. Робочий порядок — [PLAN](../../PLAN.md), детальні результати — [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Структура та документація

- Backend розташований у `backend/`, frontend — у `frontend/`; Compose, CI, Caddy та scripts використовують актуальні шляхи.
- Документація зведена до навігаційних guides без дублювання вимог. Raw Figma references, backups, secrets і generated evidence залишаються поза Git.
- Кореневий `.gitignore` тепер ігнорує лише `/figma/`, тому потрібні runtime assets у `frontend/src/assets/figma/` можуть бути доставлені.

## Реалізація

- Movie, Review, Home/Search, Lists, Profile/PublicProfile, Community, Messages і Notifications мають responsive стани, UK/EN, клавіатурну навігацію та реальні API.
- Старі profile reviews отримують nullable `moviePhotoUrl`; frontend сумісний і з попередньою відповіддю API.
- Journal зберігає API-backed feed/archive/article/audio/newsletter. У mobile article прибрано декоративний control без дії. List 4 desktop `1494:5387` повторно звірено через Figma screenshot/context: compact hero та editorial 3-column rows застосовано до реальних статей без заміни їх Figma fixtures.
- Login/Register/Forgot/Reset використовують спільну desktop/mobile Figma-композицію з локальними assets.
- Help, Contact, Rules, Privacy, Film Data, Account Deletion та About отримали структуровані responsive layouts.
- Admin dashboard отримав Figma hero/workspace/metrics, зберіг усі users/movies/reviews/comments/lists/moderation/activity/audit/settings actions.
- Lists landing повернув видиму feed navigation і точний UK/EN зміст після regression failure; links залишаються клавіатурно доступними.
- Global Search отримав mobile shortcuts із шістьма реальними routes, а list/tag results — Figma-aligned poster stack і перенесення тегів без horizontal overflow.
- CI використовує `ubuntu-24.04`, `actions/checkout@v7`, `actions/setup-java@v6` і `actions/setup-node@v7`, прибираючи Node 20/deprecated action та runner migration warnings.
- Admin browser wrapper більше не залежить від ламкого Docker Go-template quoting у Windows PowerShell 5.1.

## Перевірка 21.10.2026

| Gate | Результат |
| --- | --- |
| Frontend typecheck/build | PASS; 213 modules |
| Playwright | **127 passed**, 0 failed/skipped/flaky/retries; 115 standard + 12 disposable admin fixture |
| Backend Maven | **87 tests**, 0 failures/errors/skips |
| Local Docker | API health 200, web 200; images перебудовані зі збереженням DB/`.env` |
| API/contracts/security/reset | PASS |
| Redis/concurrency/load/schema | PASS; 38 tables, 55 foreign keys |
| Backup/restore | PASS в окремій тимчасовій schema, cleanup виконано |
| Production template/Caddy/Compose | PASS |
| GitHub CI | [PASS для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972), 1m53s |

Search/CI maintenance commit `ea037f0`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s. Runner pin/docs commit `0b22904`: [GitHub CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s. Runs підтвердили 87 backend-тестів, frontend typecheck/build, Caddy, нові action majors і `ubuntu-24.04`.

Перший full browser run виявив два дефекти Lists: втрачений локалізований hero text і приховану feed navigation. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Наступний Search run додав 2 двомовні сценарії. Targeted Global Search дав 4/4; повний standard run — 115 passed із 12 очікуваними admin skips, окремий wrapper — 12/12, разом усі 127 унікальних сценаріїв без skips. Перший запуск wrapper виявив quoting-дефект до створення fixture; після JSON fix сценарії пройшли, fixture видалено.

## Figma

Plugin читає структуру, screenshots, assets, variables і context конкретних вузлів design copy `BDO9GO1oscOeUTcu4VXVKA`. Додатково перевірені Search phone `1480:8432`, lists `1480:8804` і tags `1480:8767`; раніше використані Journal article `844:1547`, Auth, Help `1062:1993`, About `1011:1915` і Admin dashboard `1178:2466`. Повний mapping і чесні межі точності — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).

## Зовнішні залежності

Production VPS/domain/TLS, SMTP/TMDB credentials, monitoring, server restore drill і погоджений Journal content залишаються окремою інфраструктурною фазою. Вони не блокують завершення коду та локальної регресії.
