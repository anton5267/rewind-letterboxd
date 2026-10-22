# Rewind — докази перевірок

Оновлено 21.10.2026, Europe/Berlin. Нижче наведено актуальний локальний release checkpoint. Production VPS не розгорнуто.

## Фінальна локальна регресія

| Gate | Результат | Доказ / межа |
| --- | --- | --- |
| Frontend build | PASS | `npm run verify:build`: TypeScript без помилок, Vite 216 modules |
| Full browser suite | **127 passed** | 0 failed/flaky/retries; production Nginx image, Google Chrome. Standard run: 115 passed + 12 gated admin skips, 5.2 min; disposable admin run: 12/12, 43.6 s |
| Backend suite | **87 tests** | failures/errors/skips 0, 2:24 min; окремий disposable MySQL 8.4 на `127.0.0.1:3308`, контейнер видалено |
| API smoke | PASS | OpenAPI 159 operations; auth, profiles, films, lists, reviews, comments, social, messages, notifications, newsletter і cleanup |
| Contract smoke | PASS | Public/protected routes, privacy fields, role guards, CRUD і nullable responses |
| Security smoke | PASS | CSRF, guest/admin guards, hostile query payloads, metrics protection |
| Password reset | PASS | Generic response, Mailpit delivery, one-time token, session revocation, new login |
| Cache / concurrency / load | PASS | Redis miss/hit/TTL; concurrent lists/ratings/reviews/comments/preferences/follows/likes; 20 requests across 8 endpoints, all 200 |
| ER schema | PASS | 38 tables, 55 foreign-key relationships |
| Backup/restore | PASS | Dump restored to a unique temporary schema; counts `203|438|31`; schema and temporary dump cleaned |
| Production template | PASS | Synthetic temporary env: HTTPS origin, strong placeholders, private DB/Redis/API, read-only API/web, loopback web port |
| Caddy / Compose | PASS | Caddy valid; development Compose config valid; clean API/web image builds |
| Local Docker runtime | PASS | `/actuator/health` 200, `/uk/community/reviewers` 200; API/web rebuilt, DB volume and `.env` preserved. Живий contract повернув `reviewCount`, `watchedCount`, `listCount` |
| CI workflow maintenance | PASS | `ubuntu-24.04`, `checkout@v7`, `setup-java@v6`, `setup-node@v7`; action majors підтверджені GitHub run 39560672726 |

Перший повний browser run завершився 123/125. Він виявив реальні regressions у Lists: hero втратив очікувані UK/EN «Колекції фільмів / Film collections», а landing CSS приховав feed navigation через `display:none`. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

Поточний Figma-audit блок Popular Reviewers: перший full run виявив, що release matrix неправильно очікував mobile Back-link на desktop, хоча у frame є desktop header. Перевірку обмежено шириною phone (`<=720 px`); цільова matrix пройшла, а повторний повний frontend run завершився 115 passed. Backend contract для трьох reviewer metrics перевірено окремо і в повному наборі; реалізація використовує групові запити, а не запит на кожного рецензента.

Community members frames `605:1112` (1440 px) and `1517:4931` (393 px) were re-read through Figma context and screenshots. The route now has the same hero, featured/popular rails, and full member-list order while retaining live API identities, directory search/pagination, and accessible follow actions. Static Figma poster strips are not used as fabricated member data. `npm run verify:build` passed (216 modules); `community-follow.spec.ts` passed 10/10 when rerun after one transient browser-start failure. GitHub CI run 39614762671 for the preceding Popular Reviewers commit passed.

Journal List 4 `1494:5387` was verified with Figma context and screenshot before its CSS change. The API-backed feed now follows the compact Journal hero, a 612 px feature cover, and editorial three-column rows at desktop. Archive/category controls and pagination remain available with real data. `npm run verify:build` passed (216 modules); journal design flow and retry passed, including a 393 px no-horizontal-overflow assertion.

Journal List 5/6 `1494:5182`/`1494:5287` were read separately. They confirm the same route with alternate static article and image fixtures, including an 818 px artwork hero. The released API-backed List 4 composition remains the applicable implementation; no fixture content or temporary Figma asset URL was introduced.

Guest Home desktop `1413:6471` was checked with its Figma context and screenshot. The implementation uses the verified original artwork stored at `frontend/public/images/home-hero-guest.jpg`, a 764 px visual hero, and the target CTA geometry. `npm run verify:build` passed (216 modules); the Home keyboard/list-card suite and responsive matrix passed 3/3 against the rebuilt Docker web image. The authenticated Home variant and the remaining guest feed still need their own frame-by-frame review.

Member Home desktop `1413:6263` was reviewed separately and uses `frontend/public/images/home-hero-member.jpg`, a 948 px header-underlaid hero, target 58 px title/24 px subtitle and six 174×260 px API-backed poster slots. `npm run verify:build` passed (216 modules); the rebuilt Docker web image passed the Home suite 3/3, including an authenticated mocked-session assertion. Other feed sections still require individual frame review.

Guest Home mobile `1411:3473` was checked with its Figma screenshot/context. It now uses the Figma headline and registration CTA, 142 px artwork hero, four live 79×116 poster tiles, explainer and mobile content order. The production Docker web image passed `home-list-cards` plus the release viewport matrix 4/4; `npm run verify:build` passed (216 modules). The member mobile variant and remaining feed screens require separate frame review.

Member Home mobile `1327:3210` was checked separately. Its 320 px artwork hero, centered 24 px heading/12 px copy, New on Rewind heading and four live 79×116 poster tiles follow the frame while preserving the API-backed news, review and list sections. `npm run verify:build` passed (216 modules); the rebuilt Docker web image passed `home-list-cards` 3/3 with an authenticated mocked session.

Popular Lists desktop/mobile `1480:5390`/`1480:7927` were checked with their Figma screenshot/context. The feed now has the desktop 628 px image hero, 58 px heading and 1200×339 rows with 174×260 five-poster stacks, plus the 183 px mobile hero, contextual top controls, single 361 px card column and pagination. It retains API-backed lists and accessible targets. `npm run verify:build` passed (216 modules); `list-discovery-controls.spec.ts` passed 3/3 and `list-mobile-header.spec.ts` passed 12/12 at 320, 393, 600, 720 and 768 px in UK and EN.

Public Profile desktop `238:596` was reviewed directly in the Figma canvas. Its centered identity header and profile-state rail are now reflected in the live route without altering API content or mobile layout. `npm run verify:build` passed (216 modules); `route-transition.spec.ts` ran after the change. The original photographic hero asset remains pending Figma quota rather than being replaced by an unrelated image.

Поточний Search етап: targeted Global Search 4/4; нові UK/EN сценарії перевіряють shortcuts, URL, 361 px list cards, п’ять 79 px posters, багаторядкові tags і no-overflow. Повний набір зріс до 127. Admin wrapper спочатку зупинився до створення fixture через Docker template quoting у Windows PowerShell 5.1; після переходу на `docker inspect` JSON пройшов 12/12 і прибрав disposable fixture.

Після повторної перевірки Figma `1480:8527` mobile tag search cards now render the title/count before the poster rail, with 16 px radius and a 138 px poster area. `list-discovery-controls.spec.ts` пройшов 3/3; desktop original imagery remains pending Figma Starter quota.

Movie Details desktop `39:2`/`61:244` додатково перевірені через local Figma inventory і canvas. Реалізація тепер має full-bleed dark hero, 811 px backdrop, 275 px poster, desktop Rating/Cast rails і dark similar/review sections; `movie-mobile-alignment.spec.ts` та responsive suite пройшли 5/5.

Person/Actor desktop `545:676` і phone `721:1085` перевірені через local inventory та browser preview. Реалізація має full-bleed identity hero, 265 px desktop avatar, 120 px mobile avatar, compact mobile back/filter toolbar і 1200 px desktop або чотириколонкову mobile filmography grid; producer-flow suite пройшов 2/2 разом із API-backed navigation та mobile filter toggle.

Початкові backend спроби проти основної dev DB не зараховані: вони отримали access denied через host credentials. Фінальний результат отриманий на чистій ізольованій MySQL з CI credentials; основну БД не змінювали.

## Figma та UI

- Design copy: `BDO9GO1oscOeUTcu4VXVKA`.
- У цьому проході concrete context/screenshots додатково використані для Popular Reviewers desktop/phone `1480:5486`/`1480:7698`; попередній checkpoint охопив Search shortcuts, Lists, Journal article, Auth desktop/mobile, Help, About, Admin dashboard і Public Profile phone.
- Service desktop `1062:1993` повторно перевірений у Figma canvas: Help-style full-bleed 818 px hero, centered title/lead і alternating detail rows тепер спільні для шести service routes. `service-pages-responsive.spec.ts` пройшов 1/1.
- Auth raster assets збережені локально; runtime не містить тимчасових Figma asset URLs.
- Повний browser suite перевірив UK/EN, 320/393/600/720/768/1440 responsive cases, keyboard/focus, loading/error/empty/retry, admin fixture і poster compatibility.

Точні mappings і межі pixel parity — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md). Загальна pixel-perfect відповідність усім top-level frames не заявляється без окремого screenshot comparison кожного frame.

## GitHub CI

- UI/assets/harness commit: `33f8082`.
- Release documentation commit: `f48713a`.
- [`CI / verify (push)` run 39557098972](https://github.com/anton5267/rewind-letterboxd/actions/runs/39557098972): PASS, 1m53s. Backend tests, frontend build/typecheck і Caddy validation зелені.
- Search/CI maintenance commit: `ea037f0`; [`CI / verify (push)` run 39560672726](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560672726): PASS, 1m44s. Runner pin/docs commit `0b22904`; [run 39560950893](https://github.com/anton5267/rewind-letterboxd/actions/runs/39560950893): PASS, 1m36s, без annotations. Нові action majors та `ubuntu-24.04` виконані успішно.
- Історичний checkpoint перед поточним UI-проходом: [GitHub CI для `f0df409`](https://github.com/anton5267/rewind-letterboxd/actions/runs/39485802412).

## Збереження даних

- Основні Docker volumes не видалялися; `down -v` не виконувався.
- Browser/API verification створювали лише disposable accounts/data й виконували cleanup.
- Diploma video artifacts, локальний `AGENTS.md`, `.env`, backups, caches і raw Figma references не включаються в release commits.

## Межа релізу

Локальні перевірки не підтверджують production infrastructure. VPS, domain/TLS, real SMTP/TMDB credentials, monitoring і restore drill на цільовому сервері виконуються окремо за [DEPLOYMENT](DEPLOYMENT.md). Відсутність погодженого Journal content не блокує код: Journal залишається API-backed.
