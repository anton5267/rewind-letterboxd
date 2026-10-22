# Rewind — поточний стан

Оновлено 22.10.2026. Основний release checkpoint і Search/CI maintenance етап доставлені в GitHub; після них розпочато повний Figma audit по конкретних nodes. Завершений Popular Reviewers `1480:5486`/`1480:7698` має реальні reviewer metrics, desktop/mobile geometry, повні 127 browser-сценарії та 87 backend-тестів. Community `605:1112`/`1517:4931` переведений на Figma hero, featured/popular rails і member-list composition; справжні API profiles та follow interactions збережені. Home desktops `1413:6471` (guest) і `1413:6263` (member) отримали перевірені local original artworks, hero geometry, typography й member poster rows. Mobile guest `1411:3473` та member `1327:3210` мають власні Figma heroes, чотири справжні poster previews і порядок API-backed секцій. Popular Lists `1480:5390`/`1480:7927` тепер має окремі desktop/mobile hero, контекстні controls, Figma-sized poster cards і pagination з реальними API lists. Auth mobile family `944:1582`/`944:1828`/`944:1887` перевірена на 393×852, включно з Back, standalone canvas, sign-in footer і tab-order. 404 frame `361:778` тепер доступний як локалізований route state з no-overflow перевіркою на 320/393/768/1440 px. Робочий порядок — [PLAN](../../PLAN.md), детальні результати — [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Структура та документація

- Backend розташований у `backend/`, frontend — у `frontend/`; Compose, CI, Caddy та scripts використовують актуальні шляхи.
- Документація зведена до навігаційних guides без дублювання вимог. Raw Figma references, backups, secrets і generated evidence залишаються поза Git.
- Кореневий `.gitignore` тепер ігнорує лише `/figma/`, тому потрібні runtime assets у `frontend/src/assets/figma/` можуть бути доставлені.

## Реалізація

- Movie, Review, Home/Search, Lists, Profile/PublicProfile, Community, Messages і Notifications мають responsive стани, UK/EN, клавіатурну навігацію та реальні API. PublicProfile `238:596`/`825:1378` повторно звірений: desktop отримав центрований identity hero і state rail, phone має 120 px avatar, 26 px name, 44 px controls і safe wrapping довгих імен. Оригінальний desktop photographic asset ще очікує доступу Figma quota.
- Старі profile reviews отримують nullable `moviePhotoUrl`; frontend сумісний і з попередньою відповіддю API.
- Journal зберігає API-backed feed/archive/article/audio/newsletter. У mobile article прибрано декоративний control без дії. List 4 desktop `1494:5387` повторно звірено через Figma screenshot/context: compact hero та editorial 3-column rows застосовано до реальних статей без заміни їх Figma fixtures.
- Login/Register/Forgot/Reset використовують спільну desktop/mobile Figma-композицію з локальними assets.
- Help, Contact, Rules, Privacy, Film Data, Account Deletion та About отримали структуровані responsive layouts.
- Service desktop `1062:1993` повторно звірений через Figma screenshot/raw geometry: hero збільшено до 818 px, title/lead центровано, detail cards переведено у широкі alternating editorial rows; `service-pages-responsive.spec.ts` пройшов 1/1 для всіх шести service routes.
- Admin dashboard отримав Figma hero/workspace/metrics, зберіг усі users/movies/reviews/comments/lists/moderation/activity/audit/settings actions.
- Lists landing повернув видиму feed navigation і точний UK/EN зміст після regression failure; links залишаються клавіатурно доступними.
- Global Search отримав mobile shortcuts із шістьма реальними routes, а list/tag results — Figma-aligned poster stack і перенесення тегів без horizontal overflow. Додатковий mobile reference `1480:6217` звірений по raw hierarchy: show-results native select має 160 px trigger geometry без втрати keyboard/URL semantics.
- Public Lists follow-up прибрав mobile tagged-card hit-area overlap: compact poster stack тепер обрізається в 138 px Figma rail, а desktop feed зберігає доступний back/filter toolbar. `list-discovery-controls.spec.ts` 3/3, `public-guards.spec.ts` 6/6, release matrix 1/1 і WCAG axe 1/1 пройшли після Docker web rebuild.
- Tag search mobile `1480:8527` повторно звірений у Figma: заголовок і кількість тепер стоять над poster rail, картка має 16 px radius і 138 px poster area; targeted list discovery tests 3/3 passed.
- Movie Details desktop `39:2`/`61:244` знайдені в локальному Figma inventory й повторно відкриті в canvas: застосовано dark full-bleed hero, 811 px backdrop, 275 px poster, desktop Rating/Cast rails і dark six-column content rail; targeted Movie Details tests 5/5 passed.
- Person desktop `545:676` перевірений у canvas та inventory: hero став full-bleed із 265 px centered avatar, а filmography отримала 1200 px six-column rail; API-backed single feed збережено без вигаданого Films Produced.
- Person phone `721:1085` звірений із локальним inventory та browser preview: додано 120 px centered avatar, compact back/filter toolbar, 465 px identity hero і four-column poster grid; sort/genre controls відкриваються через mobile Filters. `producer-flow.spec.ts` пройшов 2/2.
- Admin Dashboard `1178:2466`/settings `1404:4076` повторно звірені по raw geometry: desktop identity/workspace hero збільшено до 1020 px із 272 px avatar; existing admin tables and settings remain API-backed. `service-pages-responsive.spec.ts` admin geometry check пройшов.
- Auth mobile `944:1582`/`944:1828` повторно звірений у Chrome: Login/Register/Forgot/Reset family отримала standalone canvas, 24 px back control, hidden global mobile header/nav/footer, Figma sign-in footer and 393 px no-overflow contract. `auth-responsive.spec.ts` пройшов 1/1; desktop route structure не змінено.
- Для mobile Auth footer залишено лише порожній landmark без прихованих focusable links; `release-responsive-matrix.spec.ts` після цього пройшов 1/1 на 320/393/768/1440 px.
- CI використовує `ubuntu-24.04`, `actions/checkout@v7`, `actions/setup-java@v6` і `actions/setup-node@v7`, прибираючи Node 20/deprecated action та runner migration warnings.
- Admin browser wrapper більше не залежить від ламкого Docker Go-template quoting у Windows PowerShell 5.1.

## Перевірка 21.10.2026

| Gate | Результат |
| --- | --- |
| Frontend typecheck/build | PASS; 218 modules |
| Playwright | Latest local full run **118 passed, 2 failures, 12 skips** across 132 scenarios. Both failures are caused by the user's uncommitted `FollowActionsContext.tsx` change; the list-header suite passed 12/12 and the earlier EN-only failure passed 6/6 on repeat. Movie Details WCAG axe rerun 1/1 after contrast fix. |
| Backend Maven | Historical release checkpoint **87 tests**; latest 22.10.2026 local Compose-MySQL run **89 passed**, 0 failures/errors/skips |
| Local Docker | API health 200, web 200; images перебудовані зі збереженням DB/`.env` |
| API/contracts/security/reset | PASS |
| Redis/concurrency/load/schema | PASS; 38 tables, 55 foreign keys |
| Backup/restore | PASS в окремій тимчасовій schema, cleanup виконано |
| Production template/Caddy/Compose | PASS |
| GitHub CI | [PASS для `f48713a`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972), 1m53s |

Search/CI maintenance commit `ea037f0`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726), 1m44s. Runner pin/docs commit `0b22904`: [GitHub CI PASS без annotations](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893), 1m36s. Runs підтвердили 87 backend-тестів, frontend typecheck/build, Caddy, нові action majors і `ubuntu-24.04`.

Auth mobile footer cleanup commit `42b8e3b`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39700140275), 1m52s. Backend tests, frontend build/typecheck і Caddy validation зелені.

Latest regression evidence commit `5e449af`: [GitHub CI PASS](https://github.com/anton5267/rewind-letterboxd/actions/runs/39706799280). The push contains documentation only; no unrelated local files were staged.

Перший full browser run виявив два дефекти Lists: втрачений локалізований hero text і приховану feed navigation. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Наступний Search run додав 2 двомовні сценарії. Targeted Global Search дав 4/4; повний standard run — 115 passed із 12 очікуваними admin skips, окремий wrapper — 12/12, разом усі 127 унікальних сценаріїв без skips. Перший запуск wrapper виявив quoting-дефект до створення fixture; після JSON fix сценарії пройшли, fixture видалено.

## Figma

Plugin читає структуру, screenshots, assets, variables і context конкретних вузлів design copy `BDO9GO1oscOeUTcu4VXVKA`. Додатково перевірені Search phone `1480:8432`, lists `1480:8804` і tags `1480:8767`; раніше використані Journal article `844:1547`, Auth, Help `1062:1993`, About `1011:1915` і Admin dashboard `1178:2466`. Повний mapping і чесні межі точності — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).

## Зовнішні залежності

Production VPS/domain/TLS, SMTP/TMDB credentials, monitoring, server restore drill і погоджений Journal content залишаються окремою інфраструктурною фазою. Вони не блокують завершення коду та локальної регресії.
