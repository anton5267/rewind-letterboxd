# Rewind — Figma references

Оновлено 21.10.2026. Тут зберігаються джерела дизайну й відповідність frames коду. Порядок роботи — лише у [PLAN.md](../../PLAN.md), результати перевірок — у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md).

## Локально отримані джерела

Основне live-джерело: Figma Design copy `BDO9GO1oscOeUTcu4VXVKA`, доступна через Figma plugin. 20.10.2026 підтверджено: повна metadata сторінки `0:1`, design context, screenshots, variables і тимчасові asset URLs для конкретних nodes. Контрольні nodes `560:1003` (Movie phone, 393×1908) і `825:1378` (Public Profile phone, 393×2355) повернули повний context та окремі screenshots. Node IDs збігаються з інвентарем нижче, тому це доступна копія того самого дипломного макета, а не нова несумісна дизайн-система.

20.10.2026 через дозволене browser `File > Save local copy` отримано оригінальний `.fig`: workspace `.codex-backups/figma-local-copy-20261020/original.fig`. SHA256 `3C45A2CC190296FDB44B17A49353634CEABC634B2816BE3E0DD4E72470CA5576`; archive CRC перевірений для всіх файлів. `extracted/` містить `canvas.fig`, metadata та оригінальні images. `decoded/` містить локально декодовані Kiwi schema/nodeChanges; `focused/index.json` посилається на subtree Movie, Review, auth mobile Profile і Home з geometry, typography, paints та image mappings.

Це справжній локальний design reference, отриманий без PAT і без редагування Figma. Він не є REST-exporter snapshot у `../figma/` і не підтверджує повний variables/component-overrides export чи точний renderer. Raw `originFileKey` містить opaque local-export identifier; provenance спирається на browser file URL, назву експорту й перевірені node IDs. Proprietary копія, images та tools залишаються поза Git.

Повні frames додатково експортовано з браузера: `screens/560-1003-movie-phone.jpg`, 4× JPEG, frame 393×1908; `screens/1480-9249-review-phone.png`, PNG 393×932; `screens/896-1838-profile-auth-phone.png`, PNG 393×2319. Provenance JSON містить SHA256. Це references, не assets для реалізації UI. Старий запис `560:1097` вказував на текст «Dune» всередині frame; правильний frame — `560:1003`.

Для Home/Search і наступного Lists блоку додано окремі 1× PNG у тому самому `screens/`: `1480-8594-search-films-phone.png`, `1480-8934-search-all-phone.png`, `1480-8856-search-empty-phone.png`, `1480-7256-search-films-desktop.png` та `1480-8280-public-lists-phone.png`. Розміри й SHA256 — у відповідних provenance JSON. Focused raw subtrees для Search/Lists перелічені в `focused/search-lists-supplement-index.json`; `page-frame-inventory.json` містить 250 effectively visible top-level frames основного canvas. Це inventory, не доказ експорту всіх frames. Великий PDF export перевантажив browser renderer і був скасований закриттям власної службової вкладки; PDF не отримано.

Для завершеного локального Lists блоку додано `1480-4983-public-lists-desktop.png` (1440×3816), `1480-9446-public-list-information-overlay-phone.png`, `1480-9542-user-lists-metadata-phone.png` і `1480-9606-user-lists-populated-phone.png` (кожен 393×852). Усі мають adjacent provenance JSON із SHA256. Desktop raw subtree — `focused/public-lists-desktop-1480-4983.json`, індекс — `focused/lists-desktop-supplement-index.json`; phone raw вже перелічені в Search/Lists supplement. Важливе уточнення: 9446 — information overlay, 9542 — metadata sheet, 9606 — add-films sheet, а не три повні routed pages. Наявні редактор, CRUD/reorder і catalogue-to-film flow збережені; Ranked/drag та окремий Crew feed не вигадувалися.

Оригінальні raster assets скопійовані без зміни байтів лише за підтвердженими node mappings: Home auth phone `1328:3443` → image `41d30a2f513e14d6725c29aa88e7da48934b4e72` → `frontend/public/images/home-hero-revenant.jpg`; Search phone `1480:8595` → `6e61361ef21ce52bdb91f3c55e1e9b371cf3e607` → `search-hero-phone.jpg`; Search desktop `1480:7259` → `f37f463c722c4aafc04a3a470943913ec5244ad8` → `search-hero-desktop.png` у тій самій app images папці. Guest/desktop Home artwork цим auth phone asset не підміняється.

Lists phone `1480:8281` і desktop `1480:4984` посилаються відповідно на ті самі original images `6e61361…` та `f37f463…`: повторно використано вже наявні Search hero assets, нових copies немає. Desktop intro wrapping/CTA налаштовано під поточний шрифт зі збереженням повних UK/EN текстів; це обґрунтований visual alignment, не доказ font parity.

## Доступ і межі точності

Figma plugin має read-доступ до Design copy: metadata, concrete-node design context, screenshots, variable definitions і assets працюють. Page node `0:1` використовується для metadata inventory; для context/screenshot потрібен конкретний frame або layer ID. Edit-доступ цим проходом не перевірявся і для реалізації не потрібний. Canonical batch REST exporter `../figma-codex-complete-export/` і snapshot `../figma/` відсутні, але вони більше не блокують роботу з окремими nodes через plugin. Локальна `.fig`, focused raw/image mappings і browser exports залишаються резервним відтворюваним доказом поза Git.

Auth mobile Home `1327:3210` додатково експортовано як PNG 393×2463 у workspace `.codex-backups/figma-browser-reference-2026-10-20-1327-3210/`, provenance перевірений SHA256. Це reference, а не UI asset.

Результат попередніх проходів — visual alignment. Plugin тепер дозволяє перевіряти точний frame context і screenshot перед наступними змінами, але один успішний node не доводить повний variables/component-overrides export або pixel-perfect parity всього файлу. Для кожної наступної поверхні запитувати конкретний node, його screenshot і assets, а потім перевіряти реалізацію окремо. Дозволи, оплата й Figma source не змінювалися.

## Додатково перевірені frames 21.10.2026

- Journal article `844:1547`: звірено desktop composition; mobile decorative `⋯` прибрано, бо дії та API для нього немає.
- Auth: desktop Login `605:2175` і mobile Login `944:1582` перевірені окремими screenshots/context; спільний layout застосований також до Register/Forgot/Reset nodes `605:2173–2176`, `911:1596`, `915:1598`, `922:1788`, `944:1828`, `944:1887`. Artwork завантажено як `frontend/src/assets/figma/auth-desktop.png` і `auth-mobile.png`.
- Service/About: Help `1062:1993` і About `1011:1915` використані для hero, navigation і structured content; ті самі правила застосовані до Contact, Rules, Privacy, Film Data та Account Deletion.
- Admin dashboard `1178:2466`: hero/avatar/workspace/metrics перенесені поверх наявних API-backed admin sections. Поведінкові users/movies/reviews/comments/lists/moderation/activity/audit/settings сценарії пройшли в повному browser suite.
- Public Profile phone `825:1378`: повторна перевірка на 320/393/768/1440 підтвердила 120 px avatar, перенос довгого імені, focus і відсутність horizontal overflow.
- Global Search phone: `1480:8432`, `1480:8804` і `1480:8767` отримані через plugin із screenshots/context. Реалізація має шість справжніх shortcut routes, 361 px list cards із п’ятьма overlapping posters та багаторядкові tag pills; перевірено при 393 px у UK/EN без overflow.

Після цих змін production build пройшов повну регресію 127/127. Це підтверджує маршрути, стани, локалізацію й доступність; pixel-perfect твердження обмежене конкретними переліченими screenshots/context, а не всією сторінкою `0:1`.

## Джерела

- [Figma Design copy — основне live-джерело для plugin](https://www.figma.com/design/BDO9GO1oscOeUTcu4VXVKA/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025--Copy-?node-id=0-1&p=f).
- [FigJam — аналіз, архітектура, персони, кольори та продуктова структура](https://www.figma.com/board/gPITmVEnT5L61gN7JiwIiX/Untitled?node-id=0-1&t=J1ORYD0WSrKidGxO-1).
- [Інформаційна архітектура, FigJam](https://www.figma.com/board/qrrA6VTNZFiJstg1CsaOTo/).

FigJam — джерело аналізу, архітектури, персон і колірного контексту; його палітра не замінює точні exported design tokens або CSS values. Для переходу до конкретного Design node додати `?node-id=1480-8280`, замінивши ID.

## Єдиний інвентар frames → React

Шляхи наведені без мовного prefix; застосунок використовує `/uk` і `/en`.
Розміри записані лише за попереднім вибором frame у Chrome; «alignment» означає реалізовану композицію на реальних API, а не pixel parity.

| Frame / варіант | Node ID → розмір | Route / компонент | Статус і залишений gap |
| --- | --- | --- | --- |
| Home registered / guest desktop | `1413:6263` → 1440×5020; `1413:6471` → 1440×4934 | `/home` → Home | Guest `1413:6471`: screenshot/context, local original hero artwork, 764 px hero and CTA geometry verified. Registered variant and the remaining desktop feed still require separate frame checks |
| Home registered / guest mobile | `1327:3210` → 393×2463; `1411:3473` → 393×2265 | `/home` → Home | Auth hero з mapped original artwork, 79×116 poster rails, compact typography, Journal covers і review previews; native scroll/focus та реальний preview count збережені. Guest artwork і точні fonts/tokens ще відкриті |
| Popular Reviews mobile | `1480:9087` → 393×1265 | `/reviews` → PopularReviews; Home/GlobalSearch review cards | Реальні reviews/reviewers, sort/pagination/states; 393/320 px browser evidence |
| All Films desktop / phone | `1413:12611` → 1440×2956; `1480:9187` → 393×1215 | `/films` → Search | Dark hero/filters/poster grid реалізовані |
| Films phone | `1480:7843` → 393×1235 | `/films` → Search | Alignment; звірка варіантів |
| Search shortcuts phone | `1480:8432` → 393×852 | `/search` → GlobalSearch | Screenshot/context: шість localized real-route rows у dark 52 px cards; 393 px UK/EN browser verification, keyboard focus і no-overflow підтверджені |
| Filter / show-results fragments | `1480:7611` → 295×1416; `1480:7595` → 197×319 | Search controls | Reference fragments; не окремі routes |
| Global Search all / no matches | `1480:8934` → 393×2801; `1480:8856` → 393×852 | `/search` → GlobalSearch | PNG/raw alignment: All poster rail і content order, compact Empty/white Home CTA. Query/category controls залишені доступними також у Empty; UK/EN copy та реальні counts збережено |
| Global Search lists / tags / films phone | `1480:8804`, `1480:8767`, `1480:8594` → 393×852 | `/search?tab=...` | Plugin screenshots/context: Lists має 361 px cards і п’ять 79×116 overlapping posters; Tags переносить pills у кілька рядків; Films зберігає 4-column grid. Native category select замінює desktop roving tabs; geometry/no-overflow перевірені browser test |
| Global Search lists desktop | `1480:7490` → 1440×1518 | `/search?tab=lists` | Alignment |
| Global Search tags desktop | `1480:7445` → 1440×1024 | `/search?tab=tags` | Alignment |
| Global Search cast / members desktop | `1480:7390` → 1440×1392 | `/search` → GlobalSearch | Alignment |
| Global Search reviews desktop | `1480:7311` → 1440×2176 | `/search?tab=reviews` | Alignment |
| Global Search films desktop | `1480:7256` → 1440×1062 | `/search?tab=films` | PNG/raw alignment: mapped background, search 400×44, 6 rounded posters близько 174×260; functional roving tabs з реальними counts збережені. Shared Header composition і точні fonts не заявлені як parity |
| Journal search desktop / phone | `1480:7549` → 1440×1149; `1480:8889` → 393×1150 | `/search?tab=journal` | Alignment |
| Tag search desktop / phone | `1480:6898` → 1440×2388; `1480:8527` → 393×1055 | `/lists/discover?tag=...`; GlobalSearch tags | Реальні tag/list transitions; exact parity відкрита |
| Додатковий mobile search reference | `1480:6217` → 393×581 | Search reference | Інвентаризовано; окрему parity не підтверджено |
| Lists catalog desktop / mobile | `1480:4983` → 1440×3816; `1480:8280` → 393×1809 | `/lists/discover` → PublicLists | PNG/raw: compact hero, upright strips, Recently liked rows/cards; тільки фактичні previews, справжні empty feeds |
| Featured desktop / mobile | `1480:5839` → 1440×3565; `1480:8012` → 393×2019 | `/lists/discover?feed=...` | Реальні feeds; частина feeds може бути порожньою |
| Popular desktop / mobile | `1480:5390` → 1440×2821; `1480:7927` → 393×1301 | `/lists/discover?feed=popular` | Compact feed layout; exact parity відкрита |
| Public / ranked list desktop | `1480:6071`, `1480:6134` → 1440×2033 | `/lists/public/:id` → PublicList | Dark hero, rank/posters/actions; без вигаданого ListType |
| Public list information overlay mobile | `1480:9446` → 393×852 | PublicList → `⋯` | PNG/raw підтверджують information sheet: справжні owner/likes/tags, Done, focus trap/return; цей frame не доводить геометрію poster wall |
| Create list empty / populated | `1480:5333` → 1440×2160; `1480:5182` → 1440×3856 | `/lists` → UserLists | Реальні create/edit/delete/reorder |
| List metadata / add-films sheets mobile | `1480:9542`, `1480:9606` → 393×852 | UserLists | PNG/raw: metadata/actions і 79×116 poster rows; перенесено visual composition у наявний routed editor, збережено реальні Remove/Up/Down і Browse films |
| Movie Details phone / actions | `560:1003` → 393×1908; actions `736:1107` → 393×852 | `/films/:id` → MovieDetails / MovieActionSheet | Movie frame підтверджений raw hierarchy й browser export; `560:1097` — лише TEXT «Dune». Новий alignment починається з повного frame |
| Movie Details desktop | Node не підтверджений | MovieDetails | Responsive alignment; exact reference/token audit відкритий |
| Review page / rating state | `1480:9249` → 393×932; `1480:9407` → 393×852 | `/reviews/:id` → ReviewDetails / RatingSheet | Movie/author/likes/ratings; оцінка належить фільму, не огляду |
| Public Profile overview desktop / phone | `238:596` → 1440×4459; `825:1378` → 393×2355 | `/users/:id` → PublicProfile | Plugin повертає повний context і screenshot mobile frame. Focus/44px/preview containment виправлені; mobile avatar 120 px, name 26 px і прихований повторний eyebrow застосовані та перевірені окремим Chrome smoke. Наступний точний comparison тепер не заблокований відсутнім reference |
| Власний Profile mobile overview | `896:1838` → 393×2319 | `/profile` → Profile | Raw subtree підтверджує Favorite Films, Recent Activity, Recent Reviews і Lists; пізніші коротші однойменні frames є іншими content states |
| Crew lists / more tags phone | `1480:9718` → 393×1546; `1480:9814` → 393×1674 | `/users/:id` → PublicProfile | Real poster-stack lists/tags; 393 px browser evidence |
| Community members desktop / phone | `605:1112` → 1440×4201; `1517:4931` → 393×1796 | `/community` → Community | Screenshot/context повторно перевірені. Hero, featured/popular rails і member-list order перенесено на справжні HQ/reviewer/directory APIs; directory search/pagination і follow states залишено доступними. Figma poster strips не використані як вигадані дані учасників. |
| Popular reviewers desktop / phone | `1480:5486` → 1440×2850; `1480:7698` → 393×852 | `/community/reviewers` → PopularReviewers | Plugin context/screenshot повторно підтверджені. Desktop має hero 628 px, 1200 px table, 80 px avatars і реальні watched/lists/likes; phone має простий 40 px row. API отримав additive nullable-compatible metrics. Цільовий browser test підтвердив UK/EN, keyboard follow/unfollow, 320/393/1440 px і відсутність overflow. Pagination/member rail не показуються, бо endpoint не повертає кількість усіх сторінок або окремий feed цих учасників. |
| Journal List 1 / 2 / 3 | `1494:4802` → 1440×3560; `1494:4932` → 1440×3562; `1494:5045` → 1440×3561 | `/journal` → Journal | Editorial rows реалізовані; потрібен реальний контент |
| Journal List 4 / 5 / 6 | `1494:5387` → 1440×3561; `1494:5182` → 1440×3560; `1494:5287` → 1440×3565 | `/journal` → Journal | List 4 screenshot/context: compact hero, 612 px primary cover, 3-column rows and 30 px cover radius applied. Lists 5/6 still require individual frame comparison; real API archive/category/pagination are retained. |
| Admin user profile | `1494:6089` → 1440×3059 | `/admin` → AdminUsers detail | API-backed identity/overview/history; сусідня movie database не є частиною цього frame |
| Mobile navigation | Reference `1480:9249` | Header | Home/Search/Add/Journal/Profile, menu/focus/active route |
| Journal article | `844:1547` | `/journal/:slug` → JournalArticle | Desktop context/screenshot звірено; API content/audio/error/retry збережені, mobile decorative `⋯` прибрано |
| Auth desktop/mobile | `605:2173–2176`, `911:1596`, `915:1598`, `922:1788`, `944:1582`, `944:1828`, `944:1887` | Login/Register/Forgot/Reset | Shared responsive composition, локальні artwork assets, UK/EN і password/focus contracts |
| Service/About | `1011:1915`, `1062:1993–1176:2515` | About, Help, Contact, Rules, Privacy, Film Data, Account Deletion | About/Help concrete context перевірено; спільний responsive contract застосовано до всіх service routes |
| Admin dashboard і sections | `1178:2466–1404:4076` | `/admin` → AdminDashboard + admin components | Dashboard context перевірено; усі API-backed admin flows пройшли browser regression |
| Messages / Notifications та інші variants | Інвентаризовані в page metadata | Відповідні наявні routes | Поведінка/responsive/accessibility пройшли regression; окрему pixel parity для кожного top-level frame не заявлено |

Спостережені references здебільшого мають dark canvas `#1f1f1f`, desktop 1440 px і mobile 393 px. Білий outer frame в inspector не означає білий app body. Повну палітру, typography, spacing і assets не виводити лише з цих спостережень.

## Локальний export workflow

Для поточної node-based роботи основний шлях — Figma plugin: `get_design_context` для конкретного frame, окремий screenshot, variables та потрібні assets. Тимчасові plugin asset URLs не залишати у runtime-коді; потрібні статичні assets завантажувати в проєкт і посилатися локально.

Зовнішній exporter лишається опційним лише для повного відтворюваного batch snapshot. Очікуване розташування — `../figma-codex-complete-export/` від кореня репозиторію. Ця папка зараз відсутня, тому наведені нижче legacy-команди потребують її відновлення; це не блокує роботу з конкретними nodes через plugin.

Із `frontend/` (scripts очікують зовнішній exporter за `../../figma-codex-complete-export/`; він зараз відсутній):

```powershell
npm run figma:sync
npm run figma:verify
```

Або з workspace root:

```powershell
.\figma-codex-complete-export\run-sync.ps1
.\figma-codex-complete-export\run-verify.ps1
```

PAT вводиться локально в прихований prompt; його не надсилати в чат і не зберігати в Git, env-файлах або логах.

Після успішного export використовувати `../figma/INDEX.md` і `manifest.json`, потім focused `screens/data/` JSON та відповідний PNG. `tokens.json` — похідні спостереження, не гарантований повний variables export. Оригінальні images/SVG брати лише за manifest mappings. Snapshot — read-only reference, не application code; не комітити його.

Verifier розрізняє COMPLETE/PARTIAL/FAILED і фіксує недоступні ресурси. Не створювати порожні папки як доказ успішного export.

Private bounded Profile/Community raw provenance: workspace `.codex-backups/profile-community-reference-review-20261020/reference-summary.json`. Нового decoder/export або Figma edits у цьому проході не було.
