# Rewind — повний редизайн за актуальним Figma

Оновлено 29.10.2026. Цей план замінює попередній поетапний порядок. Основу визначають START HERE і167 READY frames/states; збережений інвентар268 кандидатів повторно не генерувати без виявленої розбіжності.

- [Поточний прогрес](docs/project/PROGRESS.md)
- [Інвентар Figma → routes/states](docs/frontend/FIGMA_HANDOFF.md)
- [Докази перевірок та історичні checkpoints](docs/operations/RELEASE_EVIDENCE.md)

Поточний checkpoint29.10: Search READY `1480:6991`/`1480:8464` і empty STATE `1480:5809`/`1480:8856` повторно звірено; погоджена дія Back to home реалізована, цільові Search-тести8/8. Новий web image зібрано без кешу й запущено зі збереженим DB volume; Docker Search/Journal/Popular/Films21/21. Повний Docker Playwright suite158/158 без skips, `verify:build` успішний. Далі — scoped commit, push і новий CI; візуальні/API gaps залишаються явно позначеними в матриці.

## Ціль

Перенести актуальні доступні макети Figma в Rewind для всіх наявних маршрутів: desktop, phone, мови UK/EN, ролі користувача та релевантні стани. Перебудувати спільні стилі й компоненти там, де вони не відповідають макетам. Зберегти справжні API-дані, робочі дії, клавіатуру, доступність і адаптивність.

Екран закривається лише після зв’язки **конкретний Figma frame/state → маршрут та умови → runtime-огляд → результат**. Збірка або наявність node ID окремо не є доказом відповідності.

## Нова основа Figma

Пам’ятка [START HERE `5321:8872`](https://www.figma.com/design/BDO9GO1oscOeUTcu4VXVKA/REWIND?node-id=5321-8872) і свіжі MCP context/screenshots визначають джерело. Індекс містить253 top-level frames разом із пам’яткою; **167 READY включають20 STATE**, не167 маршрутів. `ALTERNATE`, `REFERENCE`, `PROTOTYPE` та колекції `1480:11279`/`1237:4689` не є основою реалізації. Зберігати історичні268 кандидатів, поточну класифікацію й окремий runtime-результат у [матриці](docs/frontend/FIGMA_SCREEN_CANDIDATES.md); повторний повний інвентар не потрібен.

Єдиний цільовий шрифт — локальний Inter із кирилицею; SF Pro у старих frames — спадковий орієнтир. Font-only вплив показано на Home перед глобальним підключенням. Mobile<768: gutter16; tablet/desktop: gutter24, fluid content до1200 за доречності. Перевіряти360/393/768/1024/1440 і200% text; попередні320/600/720 лишаються додатковими.

Останні змінені джерела: Dashboard `1178:2466`, Film phone `560:1003`, Create List phone `1480:9542`. Перед блоком і звітом повторно отримувати контекст/зображення, бо дизайнер продовжує редагування. READY не означає перевірену реалізацію.

У першому проході також прочитані brand frames `1423:4557` і `1423:4621`: є різні логотип-варіанти й окрема палітра `#5A8A90`, `#938D7D`, `#D69251`, `#1A1E1F`, `#FFFFFF`. Визначити по route frames, де саме застосовується кожна версія; поки не замінювати tokens за одним moodboard/brand slide.

**Поточна звірка 28.10.2026:** system frame `153:2` є reference без variables; типографіку визначає нова Inter-пам’ятка. Admin Movies READY editor — `1260:4840`; `1494:6790` виключений і лишається історичним посиланням. PublicProfile phone Search погоджено замість невизначеного More. Journal article `844:1547` показує collage/byline/inline stills, яких немає в поточному DTO — це data gaps. Детальні докази — у [PROGRESS.md](docs/project/PROGRESS.md) та [RELEASE_EVIDENCE.md](docs/operations/RELEASE_EVIDENCE.md).

## Етапи

### 0. Підтримувати наявний інвентар

1. Наявні268 кандидатів уже класифіковано за свіжими іменами/статусами. Оновлювати конкретні змінені IDs; повний перелік повторно знімати лише за виявленої розбіжності.
2. Для кожного екраноподібного frame записати: node ID, назву, розмір, visible/hidden, desktop/phone, відповідний маршрут, guest/member/admin, мову, дані та UI state.
3. Класифікувати вузли як canonical screen, окремий state/variant, прототип, reusable component, hidden duplicate або невизначений. Hidden варіанти не викидати, доки не перевірено їхню відмінність.
4. Звірити нові інвентарні дані з попередніми доказами. Старі збіги, які суперечать новому Figma, позначити як superseded і перевірити заново.
5. Єдина матриця `frame → route/state → source → runtime result → evidence/gap` — `docs/frontend/FIGMA_SCREEN_CANDIDATES.md`; handoff містить пояснення й історичні checkpoints. READY не підміняє runtime-статус; розрізняти реалізацію без runtime, перевірені результати, погоджені винятки, API/data gaps і prototype/component.

### 1. Відновити дизайн-систему й shell

1. Витягти підтверджені токени кольору, типографіки, розмірів, spacing, grid, радіусів, тіней, градієнтів, навігації й footer із Figma system frames та повторно вживаних component frames.
2. Використовувати локальний Inter із кирилицею за актуальною пам’яткою. Font-only Home порівняння desktop/mobile та глобальне підключення вже виконано; зберігати природне перенесення контенту.
3. Узгодити токени у `global.css` і спільних компонентах без глобальної заміни стилів навмання.
4. Переробити спільні Header, Footer, navigation, search, button, form, card, poster, tabs, dialogs та loading/error/empty стани за повторно використовуваними Figma-патернами.
5. Перевірити assets: джерело, локальна копія, ліцензійність, правильний компонент і ефективний розмір у runtime. Тимчасові Figma URLs не залишати в застосунку.

### 2. Перенести екрани сімействами

Після shell пройти кожен frame і variant, зафіксований на етапі 0:

1. **Auth та Service:** Login/Register/Forgot/Reset; About, Help/FAQ, Contact, Rules, Privacy/Terms, Film Data, Account Deletion, інші актуальні service frames.
2. **Home та discovery:** Home guest/member/phone, Films Discovery/All Films, Popular Reviews/Reviewers, Global Search categories/results/empty/error/phone.
3. **Film та review:** Movie Details і phone, Person/Actor/Director, Review Details, Comments та їхні пов’язані стани.
4. **Lists:** catalog/feeds, Featured/Crew, public/ranked/unranked, create/edit, tags, filters, dialogs, phone.
5. **Profiles та social:** own/public profile, identity/avatar/banner/settings, films/lists/reviews/followers/following, More sheet, Community, Messages, Notifications.
6. **Journal:** feed, archive, categories, article, newsletter та phone/empty/error states.
7. **Admin:** Dashboard, Users/User Profile/Films, Movies/editor, Reviews/Comments/Lists, reported variants, moderation, Moderator Logs, Activity, Settings та доступні dialogs.

Порядок можна міняти за залежностями компонентів, але жодне сімейство не зникає з матриці. Після кожного сімейства оновити матрицю, прогрес і докази.

### 3. Відповідність, API й доступність

- Зіставляти кадри за призначенням і компонентами, а не лише за схожим заголовком. Для кожного canonical frame зробити runtime capture відповідної мови, ролі й стану.
- Phone frames перевіряти за їхньою реальною шириною; desktop — за frame width. Додатково перевірити переходи 320/393/600/720/768/1024/1440 px і відсутність горизонтального overflow.
- Перевірити реальні дані, loading/error/empty/retry, довгі тексти, клавіатуру, видимий focus, Escape, dialog focus trap/return, scroll та цільові області.
- Figma sample data не підміняє дані production. Не додавати імітаційні кнопки, лічильники чи результати.
- Зберігати чинні публічні маршрути/API. Якщо новий frame потребує поля або операції, яких немає в API, відмітити конкретний gap. Новий контракт чи міграцію робити лише після підтвердження потреби й backward-compatible дизайну рішення.
- Зберегти раніше погоджені відмінності, доки новий файл або користувач явно їх не змінить: прямий Login/Register замість необов’язкових стартових прототипів; наявні Featured/Crew feeds, якщо окремих API немає; PublicList/Ranked List виняток від повторного matched-width огляду залишається лише якщо його не скасують нові актуальні frames.

### 4. Перевірки та доставка

Поки триває visual stage, після кожного блока виконувати `npm run verify:build` і ручний огляд Chrome. Автотести не запускати до завершення візуального етапу, як було погоджено раніше.

Після закриття frame/state матриці:

1. `npm run verify:build`, повний Playwright suite з фактичними skips, backend suite та погоджені security/API/backup/production-config перевірки.
2. Повторити Compose/Caddy/config validation; перебудувати Docker images та smoke-перевірити основні UI/API flows, не змінюючи `.env` і DB volume.
3. Переглянути diff і вибрати лише власні зміни роботи; захистити дипломні артефакти, локальний `AGENTS.md`, references, backups, кеші, `.env` і БД.
4. Логічні commits, push у GitHub, перевірити `CI / verify (push)`.

VPS, production secrets, домен, TLS, monitoring і реальний production restore лишаються поза цим етапом.

## Поточна позиція

- Основу167 READY/20 STATE актуалізовано; усі268 історичних кандидатів збережено в єдиній матриці. Кожен має конкретне runtime evidence, API/data gap, source-render limitation або component/prototype classification; загальних pending-позначок немає. Це не blanket pixel-perfect погодження.
- Inter normal/italic з кирилицею локально; font-only Home preview показано перед глобальним переходом. Phone/tablet boundary767/768, природне зростання довгого контенту.
- Спільна компактна Admin-оболонка1178:2466 для12 розділів. Personal/platform metrics розділено; unsupported history/session недоступні. Loading/result states і active/focus rail перевірено; Audit Logs зберігає page size50.
- Create List — самостійна phone сторінка, local draft до Save. Повний успіх → readonly owner detail за ID + success + явне Edit/Add film; failure/partial Retry зберігають форму. Ранжування без API не вигадувати.
- Actor використовує погоджений baked asset5340:4508 із окремими чорними overlays. Phone F1 artwork лишається data gap. Person Back працює під час loading/error.
- Auth/Service, Home/Person, Search/Films/Reviews, Lists/Journal і Profile/social мають парні screenshots та поточні поведінкові перевірки; receipts і конкретні обмеження у Release evidence. Terms/Conditions/Safety/HQ — погоджені інформаційні routes на спільному ServicePage,56 cases +112 rechecks існуючого rail. List information sheet1480:9494 —14 current cases, Done/Escape/Tab/focus return.
- Settings API gaps перелічені по source field IDs: email/bio/pronoun/location/reply preference, banner/file upload, OAuth/import і watched-date не створювати заради макета. Реальні displayName/password/avatar URL/social links збережені й перевірені. Journal live populated дані відсутні; populated screenshots лише isolated browser responses.
- Backend delta походить від документованого stale rating/cache після account deletion; додано commit-aware Redis eviction і реальні deletion/cache regression cases. Ізольована MySQL3318/rewind_test:90 tests,0 failures/errors/skips, BUILD SUCCESS. Frontend verify:build251 modules пройшов; це технічна перевірка.
- Docker config --quiet, Caddy і production-config із тимчасовими синтетичними значеннями пройшли. Старі API/web image IDs і rollback tags, .env hash та DB mount checkpoint збережено поза Git. Чистий Docker build завершено; лише API/web оновлено, .env hash і DB mount не змінилися. Disposable rating/cache/null-poster перевірка та точний cleanup пройшли.
- Наступне: виправити фактичні збої full Playwright158 (перший запуск64 passed/94 failed) та Admin run (4 passed/8 failed), повторити без mandatory skips → API/security/contracts/reset/schema/cache/concurrency/backup-restore scripts і Docker smoke → прибрати тимчасові файли, scoped commits/push та green CI. Admin і browser tests оновлюються під маршрути, діалоги та Inter; підтверджені функціональні збої виправляти в коді, не приховувати.
- Зберегти погоджені matched-width/PublicList/Ranked винятки; hidden1×1 sources не вважати підтвердженою геометрією. Native OS Share success, екранна клавіатура та нативний200% zoom не заявляються перевіреними.
- Дипломні артефакти, локальний AGENTS.md, secrets, references, backups і сторонні зміни — поза commits. VPS/production deployment окремо.

[Top-level source index](docs/frontend/FIGMA_FRAME_INVENTORY.md) · [Єдина матриця268 кандидатів](docs/frontend/FIGMA_SCREEN_CANDIDATES.md).
