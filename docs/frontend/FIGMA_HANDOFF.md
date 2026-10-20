# Rewind — Figma references

Оновлено 20.10.2026. Тут зберігаються джерела дизайну й відповідність frames коду. Порядок роботи — лише у [PLAN.md](../../PLAN.md), результати перевірок — у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md).

## Локально отримані джерела

20.10.2026 через дозволене browser `File > Save local copy` отримано оригінальний `.fig`: workspace `.codex-backups/figma-local-copy-20261020/original.fig`. SHA256 `3C45A2CC190296FDB44B17A49353634CEABC634B2816BE3E0DD4E72470CA5576`; archive CRC перевірений для всіх файлів. `extracted/` містить `canvas.fig`, metadata та оригінальні images. `decoded/` містить локально декодовані Kiwi schema/nodeChanges; `focused/index.json` посилається на subtree Movie, Review, auth mobile Profile і Home з geometry, typography, paints та image mappings.

Це справжній локальний design reference, отриманий без PAT і без редагування Figma. Він не є REST-exporter snapshot у `../figma/` і не підтверджує повний variables/component-overrides export чи точний renderer. Raw `originFileKey` містить opaque local-export identifier; provenance спирається на browser file URL, назву експорту й перевірені node IDs. Proprietary копія, images та tools залишаються поза Git.

Повні frames додатково експортовано з браузера: `screens/560-1003-movie-phone.jpg`, 4× JPEG, frame 393×1908; `screens/1480-9249-review-phone.png`, PNG 393×932; `screens/896-1838-profile-auth-phone.png`, PNG 393×2319. Provenance JSON містить SHA256. Це references, не assets для реалізації UI. Старий запис `560:1097` вказував на текст «Dune» всередині frame; правильний frame — `560:1003`.

Для Home/Search і наступного Lists блоку додано окремі 1× PNG у тому самому `screens/`: `1480-8594-search-films-phone.png`, `1480-8934-search-all-phone.png`, `1480-8856-search-empty-phone.png`, `1480-7256-search-films-desktop.png` та `1480-8280-public-lists-phone.png`. Розміри й SHA256 — у відповідних provenance JSON. Focused raw subtrees для Search/Lists перелічені в `focused/search-lists-supplement-index.json`; `page-frame-inventory.json` містить 250 effectively visible top-level frames основного canvas. Це inventory, не доказ експорту всіх frames. Великий PDF export перевантажив browser renderer і був скасований закриттям власної службової вкладки; PDF не отримано.

Для завершеного локального Lists блоку додано `1480-4983-public-lists-desktop.png` (1440×3816), `1480-9446-public-list-information-overlay-phone.png`, `1480-9542-user-lists-metadata-phone.png` і `1480-9606-user-lists-populated-phone.png` (кожен 393×852). Усі мають adjacent provenance JSON із SHA256. Desktop raw subtree — `focused/public-lists-desktop-1480-4983.json`, індекс — `focused/lists-desktop-supplement-index.json`; phone raw вже перелічені в Search/Lists supplement. Важливе уточнення: 9446 — information overlay, 9542 — metadata sheet, 9606 — add-films sheet, а не три повні routed pages. Наявні редактор, CRUD/reorder і catalogue-to-film flow збережені; Ranked/drag та окремий Crew feed не вигадувалися.

Оригінальні raster assets скопійовані без зміни байтів лише за підтвердженими node mappings: Home auth phone `1328:3443` → image `41d30a2f513e14d6725c29aa88e7da48934b4e72` → `frontend/public/images/home-hero-revenant.jpg`; Search phone `1480:8595` → `6e61361ef21ce52bdb91f3c55e1e9b371cf3e607` → `search-hero-phone.jpg`; Search desktop `1480:7259` → `f37f463c722c4aafc04a3a470943913ec5244ad8` → `search-hero-desktop.png` у тій самій app images папці. Guest/desktop Home artwork цим auth phone asset не підміняється.

Lists phone `1480:8281` і desktop `1480:4984` посилаються відповідно на ті самі original images `6e61361…` та `f37f463…`: повторно використано вже наявні Search hero assets, нових copies немає. Desktop intro wrapping/CTA налаштовано під поточний шрифт зі збереженням повних UK/EN текстів; це обґрунтований visual alignment, не доказ font parity.

## Доступ і межі точності

Design/FigJam доступні у Chrome view-only. MCP context/screenshot повертає `don't have edit access`; desktop MCP не запущений. Canonical REST exporter `../figma-codex-complete-export/` і snapshot `../figma/` відсутні. Доступні оригінальна локальна `.fig` copy, focused raw/image mappings та вибрані frame exports, описані вище.

Auth mobile Home `1327:3210` додатково експортовано як PNG 393×2463 у workspace `.codex-backups/figma-browser-reference-2026-10-20-1327-3210/`, provenance перевірений SHA256. Це reference, а не UI asset.

Результат — visual alignment. Повні fonts/variables/component overrides та pixel-perfect parity не підтверджені. Для неповних frames використовуються наявна дизайн-система й обґрунтовані рішення щодо читабельності, композиції та доступності. Дозволи, оплата й Figma source не змінювалися.

## Джерела

- [Figma Design — прототипи й дизайн сторінок](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/).
- [FigJam — аналіз, архітектура, персони, кольори та продуктова структура](https://www.figma.com/board/gPITmVEnT5L61gN7JiwIiX/Untitled?node-id=0-1&t=J1ORYD0WSrKidGxO-1).
- [Інформаційна архітектура, FigJam](https://www.figma.com/board/qrrA6VTNZFiJstg1CsaOTo/).

FigJam — джерело аналізу, архітектури, персон і колірного контексту; його палітра не замінює точні exported design tokens або CSS values. Для переходу до конкретного Design node додати `?node-id=1480-8280`, замінивши ID.

## Єдиний інвентар frames → React

Шляхи наведені без мовного prefix; застосунок використовує `/uk` і `/en`.
Розміри записані лише за попереднім вибором frame у Chrome; «alignment» означає реалізовану композицію на реальних API, а не pixel parity.

| Frame / варіант | Node ID → розмір | Route / компонент | Статус і залишений gap |
| --- | --- | --- | --- |
| Home registered / guest desktop | `1413:6263` → 1440×5020; `1413:6471` → 1440×4934 | `/home` → Home | Alignment; звірити точні tokens/variants |
| Home registered / guest mobile | `1327:3210` → 393×2463; `1411:3473` → 393×2265 | `/home` → Home | Auth hero з mapped original artwork, 79×116 poster rails, compact typography, Journal covers і review previews; native scroll/focus та реальний preview count збережені. Guest artwork і точні fonts/tokens ще відкриті |
| Popular Reviews mobile | `1480:9087` → 393×1265 | `/reviews` → PopularReviews; Home/GlobalSearch review cards | Реальні reviews/reviewers, sort/pagination/states; 393/320 px browser evidence |
| All Films desktop / phone | `1413:12611` → 1440×2956; `1480:9187` → 393×1215 | `/films` → Search | Dark hero/filters/poster grid реалізовані |
| Films phone | `1480:7843` → 393×1235 | `/films` → Search | Alignment; звірка варіантів |
| Search shortcuts phone | `1480:8432` → 393×852 | `/search` reference | Raw має shortcut sections; не frame каталогу Films. Matching PNG/parity ще не підтверджено |
| Filter / show-results fragments | `1480:7611` → 295×1416; `1480:7595` → 197×319 | Search controls | Reference fragments; не окремі routes |
| Global Search all / no matches | `1480:8934` → 393×2801; `1480:8856` → 393×852 | `/search` → GlobalSearch | PNG/raw alignment: All poster rail і content order, compact Empty/white Home CTA. Query/category controls залишені доступними також у Empty; UK/EN copy та реальні counts збережено |
| Global Search lists / tags / films phone | `1480:8804`, `1480:8767`, `1480:8594` → 393×852 | `/search?tab=...` | Films підтверджено PNG/raw: search 361×32, 4-column 79×116 grid при 393 px; native category select замінює desktop roving tabs. Lists/tags exact variants ще відкриті |
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
| Public Profile overview desktop / phone | `238:596` → 1440×4459; `825:1378` → 393×2355 | `/users/:id` → PublicProfile | Bounded existing raw підтвердив visible frames; matching PNG/focused subtree відсутні. Focus/44px/preview containment виправлені; mobile avatar/name composition лишилася незастосованим наступним кроком |
| Власний Profile mobile overview | `896:1838` → 393×2319 | `/profile` → Profile | Raw subtree підтверджує Favorite Films, Recent Activity, Recent Reviews і Lists; пізніші коротші однойменні frames є іншими content states |
| Crew lists / more tags phone | `1480:9718` → 393×1546; `1480:9814` → 393×1674 | `/users/:id` → PublicProfile | Real poster-stack lists/tags; 393 px browser evidence |
| Community members desktop / phone | `605:1112` → 1440×4201; `1517:4931` → 393×1796 | `/community` → Community | Existing raw members frames; original gr1 image `6e83fad…` mapped nodes 605:1140/1517:5008 → community-hero.jpg, STRETCH. Compact mobile та desktop columns — visual judgment на реальному API, без invented favorite/follower data |
| Popular reviewers desktop / phone | `1480:5486` → 1440×2850; `1480:7698` → 393×852 | `/community/reviewers` → PopularReviewers | Corrected raw mapping; shared follow guards/retry збережено, Back/Search 44 px зі 36/40 px graphics. Matching PNG/parity не підтверджено |
| Journal List 1 / 2 / 3 | `1494:4802` → 1440×3560; `1494:4932` → 1440×3562; `1494:5045` → 1440×3561 | `/journal` → Journal | Editorial rows реалізовані; потрібен реальний контент |
| Journal List 4 / 5 / 6 | `1494:5387` → 1440×3561; `1494:5182` → 1440×3560; `1494:5287` → 1440×3565 | `/journal` → Journal | Alignment; exact variant parity відкрита |
| Admin user profile | `1494:6089` → 1440×3059 | `/admin` → AdminUsers detail | API-backed identity/overview/history; сусідня movie database не є частиною цього frame |
| Mobile navigation | Reference `1480:9249` | Header | Home/Search/Add/Journal/Profile, menu/focus/active route |
| Journal article/archive, auth, service, messages, notifications, інші admin pages | Окремі nodes не підтверджені | Відповідні наявні routes | Спільна дизайн-система; не заявляти Figma parity |

Спостережені references здебільшого мають dark canvas `#1f1f1f`, desktop 1440 px і mobile 393 px. Білий outer frame в inspector не означає білий app body. Повну палітру, typography, spacing і assets не виводити лише з цих спостережень.

## Локальний export workflow

Очікуване розташування exporter — `../figma-codex-complete-export/` від кореня репозиторію. Ця зовнішня папка зараз відсутня, тому наведені команди потребують її відновлення користувачем; PAT сам по собі не усуває цю залежність.

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
