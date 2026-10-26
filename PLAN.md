# Rewind — план завершення

Оновлено 26.10.2026. Це єдине джерело порядку наступної роботи. Поточні результати — у [PROGRESS](docs/project/PROGRESS.md), frame/route/state статуси — у [FIGMA_HANDOFF](docs/frontend/FIGMA_HANDOFF.md#current-package-matrix--26102026), докази й історичні checkpoints — у [RELEASE_EVIDENCE](docs/operations/RELEASE_EVIDENCE.md).

## Ціль і критерій завершення

Завершити дизайн усіх наявних маршрутів Rewind за доступними Figma-макетами зі збереженням API, UK/EN та доступності; закрити інвентар явними статусами «перевірено», «виправлено й перевірено», «погоджений API/data gap» або «відкрите питання». Після visual stage пройти регресію, оновити локальний Docker, доставити власні commits у GitHub і отримати зелений CI. Збірка або сам node ID не доводять відповідність дизайну.

## Наступний порядок

1. Продовжити Profile/PublicProfile та Admin visual gaps: Movies/editor має перевірений scoped desktop/phone layout на семи ширинах і виправлену доступну висоту контролів; лишаються висота editor workspace, populated read-only credits та контрактні gaps. Далі Reviews/Comments/Moderation/Logs composition і named phone variants. Dashboard identity/navigation/Retry та Users table/email перевірено.
2. Закрити залишені Profile/PublicProfile й Admin пакети, потім Journal та решту маршрутів за таблицею нижче. Не повторювати вже підтверджені anchors без зміни коду; generic actor/page/locale mutation permutations виконати у фінальній регресії, не оголошуючи їх уже перевіреними.
3. Паралельно завершити canonical інвентар: підтверджені aliases/duplicates, component/board/prototype exclusions і всі невизначені candidates. Main route table має72 рядки/203 distinct numeric ID labels з кількох Figma file keys; це не unique node count чи coverage denominator. Старий archive snapshot `orb73jiLJnIsZNCRtJsWgS` має250 visible frames; numeric-token comparison показує58 archive labels поза таблицею, але same-number IDs across files можуть означати різні вузли. `orb73…/1390:4021` — відкритий Admin Activity candidate; старі phone candidates `1033:6171`/`1034:6494`, `1023:2343`/`1023:2837`, `1480:5390` і `1480:9494` явно зазначені з невирішеною поточною identity/transition. `BDO…/1480:9494` окремо є current-Copy information sheet. `845:1679` — hidden Profile Films phone collection; owner/prototype branch і populated runtime parity відкриті. IDs/пакети не є denominator або відсотком готовності.
4. Після кожного UI-блоку: `npm run verify:build`, ручний Chrome огляд застосовних320/393/600/720/768/1024/1440px, UK/EN, populated/loading/error/empty/retry, довгі тексти, keyboard/focus/Escape/trap/return/scroll/overflow. Оновити canonical docs стисло. Automated suites до завершення visual stage не писати й не запускати.
5. Після закриття visual stage виконати фінальні gates нижче; ціль завершувати лише за їхніми фактичними доказами.

## Черга UI —19 робочих пакетів

Це групування роботи, не19 окремих frames. Точні verified/fixed/gap/open межі й попередні докази визначає current matrix FIGMA_HANDOFF.

| Блок | Залишена перевірка |
| --- | --- |
| 1. Profile overview | Own/public overview section placement, невкриті locale/populated/keyboard states; перевірені long-name/avatar anchors не повторювати |
| 2. Profile collections/lists |24-poster grid і named own/public Next/Previous/Retry focus перевірено; лишились інші collection kinds/lists, full geometry та delayed actor/locale/page-clamp permutations |
| 3. Profile network/More | Populated UK393 own/public rows, More structured paint/geometry/long-name/trap/Escape, own subtitle typography, UK sheet Follow/Unfollow та EN1440 direct action перевірено; own remount/last-row focus виправлено. Clipped reference group адаптовано за правилом доступності. Лишається desktop full composition |
| 4. Profile reviews/editor | Named EN1440/UK320 edit/Escape/save/delete/error/empty/focus та overview sync перевірено; лишились full-frame geometry і delayed actor/view/page/locale permutations |
| 5. Profile settings | Avatar/social named save/error/validation/phone toolbar states перевірено; лишились identity/password, delayed scope/focus та unified phone UK full geometry; unsupported fields/OAuth лишаються gaps |
| 6. Admin geometry | Dashboard1178:2466 identity/navigation/Retry verified with explicit analytics gap; Users1222:3530 supported table/email/UKEN responsive перевірено; Movies1260:3772 catalog/editor1260:4840 supported API fields, nested layout and matched1440 anchors checked; workspace height mismatch/populated credit view remain open; Reviews1310:3108/Comments1342:3589; Moderation1399:3300 supported composition; Logs1404:3804/1494:7933 now has a two-column supported-field layout and focus recovery, with actor name/email/profile destination gap and runtime review open. Settings/UserProfile landmarks already checked |
| 7. Admin read/locale states | Movie editor current UK/EN widths320/393/600/720/768/1024/1440 no overflow; all form controls >=44px, matched1440 workspace x120/y1218, poster x150/y1246; Cancel focus returned to Edit. Metadata round-trip and error/retry are prior checked flows; populated credits are confirmed from GET payloads, while their authenticated Admin rendering and keyboard layout need visual evidence. Reviews/Comments UK populated layout remains; Logs two-column supported-field source has passed build but needs populated UK/EN responsive/focus runtime review. [Movies evidence](docs/operations/RELEASE_EVIDENCE.md#admin-movies-supported-editor-fields-and-catalog-layout--26102026) |
| 8. Admin mutations/inventory | Named Users/Lists/Reviews/Comments/Settings/bulk mutations і delayed outcomes перевірено; Review/Comment DELETE UI wired to existing API with localized confirmation/error, actor-scope and focus/page recovery; build PASS. Manual confirm/success/focus verification remains open after browser dialog blocked. Generic page/failure/locale та nullable clearing semantics — фінальні regression gates. Report/edit/activity audit classified API gaps; current-Copy report-ID conflict, Block semantics and Activity destination need confirmation, без нових endpoints; cleanup після disposable fixtures |
| 9. Auth geometry | Named form geometry UK/EN320/393/1440 перевірено. За прямим рішенням користувача intro605:2173/915:1598/911:1596/922:1788 — невикористані прототипи; прямий Login/Register збережено |
| 10. Auth results | Named Register UK/EN success/error responsive results, isolated Reset success, locale/delayed focus та real API Auth checks перевірено; Profile→Login→return query/hash/anchor focus EN1440/UK393 виправлено й перевірено. Programmatic in-flight token replacement та реальний Reset/session flow — явні фінальні regression gates |
| 11. Service | Named static layout/link checks закриті: Film Data/Privacy1440, UK phone rights focus, Deletion desktop slot/document1748 і supplementary UK/EN widths. About/Rules/Help/Contact/FAQ попередні докази збережені. Content/font/sidebar/absent-route gaps явні; реальне видалення — Profile/final regression |
| 12. Journal feeds | Сім feed frames класифіковано: wide+author strip і portrait без strip; КК — visible List1 copy. Wide514×296/portrait513×612 switching і fallback перевірено; КК text anchors і255/500-char wide flow перевірено; наступне — решта full composition/runtime/locale/state scope та newsletter/phone mapping; author/related-art DTO gaps зберегти |
| 13. Journal article | Невкриті content-specific body layouts/locale/state permutations; populated1440/responsive anchors, Back і successful recovery вже перевірено. Illustration/collage gaps зберегти |
| 14. Home/shared chrome | Guest/member1440/phone, authenticated member feeds/states, header/footer |
| 15. Search | Відкриті desktop categories/compact/no-results та phone Lists; states/довгі дані |
| 16. Films | All Films/Discovery desktop і решта states; phone anchors/keyboard уже перевірені |
| 17. Lists | Catalog/popular/team states; authenticated create/edit/dialogs; погоджені gaps і matched-width waiver збережені |
| 18. Movie/Review/Person | Populated downstream sections/actions, role variants, Person genre/mobile retry |
| 19. Community/Messages/Notifications | Community desktop/phone shell anchors now cross-checked against saved measurements/CSS; post-reserve empty-state runtime remeasure is still open, as are populated rows, directory downstream geometry/states, Popular Reviewers UK states, supported messaging/notification interactions. Немає public message/notification Figma mapping |

## Інваріанти й погоджені винятки

- Чинні маршрути/API та UK/EN зберігаються; нових публічних endpoints/міграцій не планується. Backend змінювати лише для підтвердженого функціонального дефекту зі збереженням сумісності. `ProfileReview.moviePhotoUrl` лишається nullable з підтримкою legacy API.
- Journal у production читає API; тимчасові browser fixtures допустимі для візуальної перевірки, Figma-контент не підміняє production-дані. Відсутній production-контент не блокує готовність коду.
- Assets зберігати у стабільних frontend-шляхах без тимчасових URL; використовувати доступні ліцензовані шрифти або найближчий fallback зі збереженням розмірів і перенесення.
- Погоджені gaps: OAuth/Remember me/phone recovery, ranked/Featured/Crew feeds, непідтримані profile/person поля, Journal illustrations, частина Admin reports/edit/history, відсутні Service routes та production/legal content. Не вигадувати даних/контролів без контракту. PublicList/Ranked List — без нового matched-width огляду за прямим винятком користувача; це не доказ parity.
- Figma MCP використовувати коли доступний; за Starter quota продовжувати через browser canvas і збережені references. Не оголошувати pixel-perfect без покадрової перевірки.
- Берегти сторонні зміни, diploma artifacts, локальний `AGENTS.md`, Figma raw references, кеші, backups, `.env` і DB volumes. Disposable fixtures прибирати exact ID/identity predicates із перевіркою counts.
- VPS, домен, production secrets, TLS, monitoring та реальний production restore drill — окремий інфраструктурний етап.

## Фінальна перевірка й доставка

1. `npm run verify:build`; повний Playwright suite та Admin disposable fixture з cleanup. Перевірити programmatic in-flight Reset token replacement (ізоляція draft/result/focus); real valid-token reset і session revocation. Обов'язкові сценарії без skips; зафіксувати фактичні counts і причину кожного пропуску. Старі125/87 — лише історичний орієнтир.
2. Backend suite через Maven wrapper із `backend/`; наявні API/security/contracts/password-reset/schema/cache/concurrency та backup/restore checks. Restore — лише в тимчасовій БД.
3. Compose/Caddy/production config validation на локальних fixtures; не заявляти production-готовність без інфраструктурних доступів.
4. Чисто перебудувати API/web images; контрольовано оновити локальні containers без втрати `.env`/DB. Docker smoke Home/Auth/Journal/Admin, основні user flows та nullable poster contract.
5. Звести актуальні докази в RELEASE_EVIDENCE, відокремити історичні результати. Перевірити diff, зробити логічні commits лише власних змін, push у чинний репозиторій, дочекатися зеленого `CI / verify (push)` і виправити failures.
6. Закрити ціль лише після інвентарю з явними погодженими винятками, повної успішної регресії, Docker smoke та зеленого CI. Якщо доказу немає, пункт лишається відкритим.
