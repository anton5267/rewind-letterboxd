# Rewind — план завершення

Оновлено 22.10.2026. Це єдиний порядок наступної роботи; поточний статус — у [PROGRESS](docs/project/PROGRESS.md), історія перевірок — у [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md), frame mappings — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md).

## Мета та правила реалізації

Довести всі реалізовані маршрути й доступні variants до перевіреної відповідності Figma, зберегти робочі API, доступність і UK/EN, пройти повну регресію, оновити локальний Docker і доставити результат із зеленим `CI / verify (push)` у GitHub. Загальна ціль ще не завершена.

- Перед змінами читати конкретний frame/raw subtree, screenshot і mappings; використовувати наявні компоненти, реальні дані та локальні assets. Палітру, шрифти, відступи, радіуси й responsive поведінку звіряти з джерелом; для відсутніх ліцензованих шрифтів використовувати найближчий доступний fallback.
- Перевіряти loading/error/empty/retry, клавіатуру, focus management і ширини 320/393/600/720/768/1440 px; додатково перевіряти межі media queries, зокрема 1024 px.
- Публічні routes/API залишати сумісними; backend змінювати лише через підтверджений функціональний дефект. `ProfileReview.moviePhotoUrl` лишається nullable та сумісним зі старим API. Migrations не переписувати.
- Journal отримує статті через API; статичний Figma-контент дозволений лише у fixtures/visual checks. Відсутній production-контент не блокує завершення коду.
- Після логічного UI-блоку: TypeScript/Vite (`npm run verify:build`), targeted Playwright, Chrome smoke та оновлення статусу, mappings і перевірок у відповідному документі.

## Порядок роботи

1. **Global Search follow-up — завершено цей блок.** Journal Search `1480:7549` повторно відкрито в живій Figma. Виправлено прихований category control, overflow на 600/1024/1100 px та clipping довгого live content. Combined Search/Journal suites: **23/23 PASS**, typecheck/Vite і Docker web build PASS. Exact empty-copy typography та shared header/footer parity ще потребують окремої звірки; це не повне закриття всіх search variants.
2. **UserLists desktop create/edit — у роботі.** Порожній editor `1480:5333` відкрито у живій Figma; populated `1480:5182` і edit variants `341:4372`/`361:592` перевіряються по raw. Привести hero, поля, controls і rows до доступних bounds. Зберегти реальні create/update/delete/add/remove/reorder та mobile metadata/add-film flows `1480:9542`/`1480:9606`; відокремити ranked-state API gap.
3. **Profile/PublicProfile variants і settings.** Перевірити Films/Lists/Reviews/Following/Followers/Watchlist/Likes та settings/authentication за конкретними raw frames. Реалізувати доступні display-name/avatar-URL/password/social-link flows; відсутні profile fields, upload/banner та OAuth залишити явними контрактними gaps. Повторити identity/long-name/focus перевірки на 320/393/768/1440 px.
4. **Закрити решту frame coverage.** Звірити незакриті Home guest/member feed rows, Search Films/tags/members/journal, Lists feeds/filters/tags/dialogs, Movie/Review/Person, Community, Journal archive/category/newsletter, Auth і Service/Admin variants. Для Messages/Notifications спочатку встановити конкретні reference nodes. Вести статус кожного variant у FIGMA_HANDOFF; alternate static content не підміняє API.
5. **Повна регресія та усунення дефектів.** Виконати всі gates нижче на фінальному коді. Окремо перевірити відомі Community retry failures з урахуванням незакоміченого користувацького `FollowActionsContext.tsx`; зберегти цю зміну й не приписувати їй нові результати без перевірки. Admin scenarios запускати з disposable fixture та cleanup, без skips у фінальному доказі.
6. **Локальний Docker і доставка.** Перевірити Compose config, чисто скласти API/web images, контрольовано оновити containers зі збереженням БД і `.env`; перевірити Home/Auth/Journal/Admin і poster contract через Docker. Зробити логічні commits лише власних змін, push у GitHub, дочекатися зеленого `CI / verify (push)` для фінального commit та записати evidence.

## Контрактні gaps

| Напрям | Наявний контракт і відсутня частина |
| --- | --- |
| Admin reported/edit | Є hide/unhide, visibility/delete і audit APIs. Немає report/complaint entities, відповідних report endpoints, edit history та block/resolution mutations. Точні frames наведені в FIGMA_HANDOFF; потрібен погоджений API контракт. |
| Profile settings | Є displayName/avatarUrl, password і social-link URL APIs. Немає контрактів для bio/location/pronouns та решти Figma profile fields, avatar/banner upload або OAuth connection/import. |
| Ranked lists | Є збережений порядок items та reorder; окремого persisted ranked/unranked стану немає. Нумерація у frame не доводить наявності такого API. |
| Додаткові feeds | Person має один filmography feed; окремі Films Produced/Crew streams та деякі Figma counts/pagination не забезпечені поточними endpoints. Справжні API feeds зберігаються. |

Ці gaps не закриваються декоративними кнопками чи вигаданими даними. Для кожного фіксується доступна реалізація та залежність; загальна відповідність усім frames до їхнього вирішення не оголошується.

## Фінальні gates

- `npm run verify:build`; усі актуальні Playwright-сценарії, включно з admin fixture, без failures/skips. Початковий план мав 125 сценаріїв; останній записаний повний run містить 142, тож орієнтир — актуальний набір, а не старе число.
- Усі backend-тести без failures/errors/skips; останній повний checkpoint — 87/87.
- Security, API/contracts, password reset, Redis/cache, concurrency/load, ER schema, backup/restore в ізольованому середовищі, production template config, Caddy/HTTPS proxy і Compose checks.
- Фінальний browser/API smoke після Docker update; актуальні результати та точний commit у RELEASE_EVIDENCE. Targeted checks і попередній CI не замінюють повну регресію нового коду.

## Межі та збереження даних

- Production VPS, домен, TLS, SMTP/TMDB secrets, monitoring і реальний restore drill на сервері виконуються окремо після надання інфраструктурного доступу.
- Не змінювати diploma video artifacts, локальний `AGENTS.md`, користувацькі сторонні зміни, бази, backups, `.env`, Figma raw references або кеші; не видаляти Docker data volumes.
- Figma canvas доступний у Chrome: `1480:7549` та `1480:5333` відкриті й візуально звірені. `get_design_context`/`get_screenshot` через plugin повертають `Unknown tool`; точні виміри беруться з наявного read-only `.fig` archive. Повний plugin/variables/asset export не підтверджено.
- Inventory 250 visible top-level frames визначає обсяг аудиту; завершення одного екрана або green build не доводить відповідність усього дизайну. Заявляти лише фактично перевірені frames і явно фіксувати asset/font/API gaps.
