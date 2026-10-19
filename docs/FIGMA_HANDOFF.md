# Rewind: підготовка до роботи з Figma

Стан на 19.10.2026. Цей файл доповнює [PROJECT_MAP.md](PROJECT_MAP.md). Отримане ТЗ та завдання дизайнерів збережено в [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md); поточний прогрес — у [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md). Три Figma-посилання отримано й відкрито в браузері. Плагін підключений, але останні спроби `get_design_context`/`get_screenshot` повернули `don't have edit access` (debug UUID `cbcb4c4f-674a-4c05-b11d-44167b8e09a1` / `a4ddce08-c20e-44af-ae21-5c14305365d4`). Це зафіксований результат попередніх запитів, а не гарантія поточного стану доступу. Повна відповідність реалізованих екранів макетам ще не перевірена.

Оновлення 17.10.2026: усі три посилання відкриті в Google Chrome. Основний Design-файл доступний для перегляду, а обидві FigJam-дошки показують режим `You can only view and comment on this file`; точний структурний handoff через Figma MCP все ще потребує Editor-доступу.

Повторна перевірка 18.10.2026 через Figma MCP підтвердила те саме: авторизований акаунт має Full seat у власній команді, але `get_metadata` для Design-файлу повертає `don't have edit access` (`INVALID_ARGUMENT`, debug UUID `ab2e10e1-e07f-4287-b9c3-8a08ab6abd1c`). Точні node-level tokens, screenshots і assets не вигадуються до надання Editor-доступу або конкретних frame links.

Повторна спроба 19.10.2026 для конкретного Search Results frame `1480:8934` (`get_design_context`) повернула той самий `don't have edit access` (`05df3197-30ce-416c-9aae-2402bda474db`). `GlobalSearch` тому залишається API-backed visual alignment за доступним Chrome inventory; pixel-perfect parity та assets не заявляються.

Додаткова перевірка 19.10.2026 за обов'язковим `figma-design-to-code` workflow для того самого node знову заблокована (`get_design_context`, debug UUID `6c3419ef-4fd7-48b4-9862-59616f8ea4e4`; `get_screenshot`, debug UUID `1bdde5ee-b9b4-4d46-b9db-5875c85c8d82`). У Chrome frame `1480:8934` реально вибирається як `Search Results "all" (svergunova phone)`, його properties показують `393×2,801 px` і `rgba(31,31,31,1)`; це підтверджує visual reference, але не node-level MCP context.

Контрольна перевірка 19.10.2026 через `get_screenshot` для підтвердженого search-by-tags node знову повернула `don't have edit access` (debug UUID `d9fa0653-075d-4f5a-97e2-0e0574fcb894`). Browser-перегляд конкретних frame-ів у Chrome залишається доступним і використовується як visual-alignment evidence.

Повторна спроба 19.10.2026 через `figma-design-to-code` для mobile public-list node `1480:9446` також повернула `don't have edit access` (`INVALID_ARGUMENT`, debug UUID `3e819a2d-8805-42bb-9de4-cbebcac15f5d`). Новий код не будується на неперевіреному MCP output; доступні frame references і project tokens залишаються джерелом visual alignment.

Code/design update 19.10.2026: Home і Community розділені на незалежні API-backed surfaces — кожна секція має власні loading/error/empty/retry стани та `aria-busy`, тому visual alignment не маскує частково недоступні реальні дані. Це не змінює Figma matrix і не є заявою про pixel-perfect parity; browser/E2E verification для цього зрізу свідомо відкладено до завершення основної UI-роботи.

Того ж дня mobile Lists CSS cascade нормалізовано: `PublicLists` має один фінальний breakpoint для 320–380 px замість дубльованих правил після Figma mobile pass. Це підтримує visual alignment frame `1480:8280`, але не додає нових Figma tokens чи assets.

Той самий cleanup застосовано до `UserLists` (create/edit frame `1480:9542`) і `PublicList` (detail frame `1480:9446`): старі pre-Figma 380px правила прибрані, а compact sheet/poster-wall правила залишені в одному фінальному cascade.

`Community.module.css` також нормалізовано: старий light fallback block більше не перекриває Figma dark Community reference `1413:13364` / `1480:7698`; залишено один hero/card/directory cascade із доступними retry, focus і mobile rules.

Після цього code/design pass production frontend build пройшов через Vite (**180 modules**, exit 0), а backend compile через `mvnw.cmd -DskipTests compile` завершився `BUILD SUCCESS`. Це підтверджує збірку, але не замінює відкладену browser/E2E visual verification.

Фінальна повторна перевірка 18.10.2026 через `get_design_context` для `orb73jiLJnIsZNCRtJsWgS`, node `0:1`, дала той самий результат — `don't have edit access`, `INVALID_ARGUMENT`, debug UUID `db76f461-be64-4827-b9c3-0ab74cd0d7cd`. Точний design-to-code контекст і screenshot залишаються заблокованими правами Figma.

Контрольна перевірка 18.10.2026 через обов'язковий `figma-design-to-code` workflow для того самого file/node знову повернула `don't have edit access`, debug UUID `ace43c6c-85d2-4227-9b0c-b3f6c8208f75`. Нових screenshots, tokens або assets не отримано; код не змінювався на підставі неперевіреного дизайну.

## Надані Figma-файли

| Джерело | Посилання й перевірений вміст |
| --- | --- |
| Основний дизайн-файл | [Диплом_ItStep_2025](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=0-1&p=f&t=MrwgnpGt8D0uvYdX-0) — відкривається в Chrome; одна сторінка з великою кількістю фреймів, серед видимих у списку шарів є мобільні Films, Lists, Search, Reviews, створення списків, добірки, а на загальному полотні також видимі інші групи екранів та мудборд. Посилання веде на всю сторінку (`node-id=0-1`), не на окремий екран. |
| Дошка проєкту | [Project - Rewind](https://www.figma.com/board/gPITmVEnT5L61gN7JiwIiX/Project---Rewind?node-id=0-1&p=f&t=kC1g3lLavOAd4VTL-0) — FigJam із дослідженнями/референсами та схемами. Відкривається в режимі перегляду й коментування. |
| Інформаційна архітектура | [Інформаційна архітектура диплом](https://www.figma.com/board/qrrA6VTNZFiJstg1CsaOTo/%D0%86%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D1%96%D0%B9%D0%BD%D0%B0-%D0%B0%D1%80%D1%85%D1%96%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%B0-%D0%B4%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC?node-id=1-2&t=Z5SB99JXWyALUifl-0) — FigJam зі схемою сторінок і переходів; посилання відкривається, елемент діаграми вибраний. Також лише перегляд і коментування. |

## Canonical Figma → React matrix

Це єдина актуальна таблиця для порядку visual-аудиту. Розміри й node ID наведені лише там, де frame був реально вибраний у Chrome. Позначка `Chrome reference only` означає доступний browser frame без node-level MCP context; це visual alignment, а не pixel-perfect parity.

| Figma frame / area | Node ID і розмір | React route / component | Статус | Evidence | Залишений gap |
| --- | --- | --- | --- | --- | --- |
| Home registered / guest | `1413:6263`, `1413:6471`; 1440 px | `/home` → `Home` | visual slice done | Chrome desktop screenshots; API-backed feed | exact parity усіх variants |
| Home mobile | `1327:3210`, `1411:3473`; 393 px | `/home` → `Home` | visual slice done | Chrome mobile screenshots; no mock data | exact parity |
| All Films / Films phone | `1413:12611`; 1440 px; `1480:9187`; 393 px | `/films` → `Search` | visual slice done | `public-guards + accessibility` 11/11; Vite/Docker build | full desktop/mobile visual audit |
| Films / Search phone variants | `1480:7843`; 393×1235; `1480:8432`; 393×852 | `/films` → `Search` | visual slice done | Chrome reference inventory; responsive runtime smoke | exact frame-by-frame parity |
| Movie filter / show-results fragments | `1480:7611`; 295×1416; `1480:7595`; 197×319 | `/films` → `Search` controls | reference fragments inventoried | Chrome properties panel dimensions | fragments are not standalone routes; exact component parity |
| Global Search states | `1480:8934`, `8856`, `8804`, `8767`, `8594`, `8527`; 393 px; desktop lists `1480:7490` (1440×1518), tags `1480:7445` (1440×1024), cast/members `1480:7390` (1440×1392), reviews `1480:7311` (1440×2176), films `1480:7256` (1440×1062); search-by-tags desktop `1480:6898` (1440×2388); journal desktop `1480:7549` (1440×1149); journal phone `1480:8889` (393×1150) | `/uk|en/search` → `GlobalSearch` | API-backed slice done | real global search categories and tab states; desktop lists/tags/cast/reviews/films, search-by-tags and journal-articles variants selected in Chrome | exact token/assets parity and long-content audit |
| Lists catalog | `1480:4983`; 1440×3816; `1480:8280`; 393×1809 | `/lists/discover` → `PublicLists` | mobile/desktop alignment done | 9/9 responsive checks; 0 px overflow | Featured/Popular exact parity |
| Featured / Popular feeds | Featured `1480:5839` (1440×3565), Popular `1480:5390`; phone `1480:8012` (393×2019), `1480:7927` (393×1301) | `/lists/discover` → `PublicLists` | partial | Featured desktop frame re-opened in Chrome; `team` feed uses the real `/lists/public/team` contract and the existing 3-column poster-card composition; Popular/phone references remain inventory-only | exact frame-by-frame audit; Recently liked/HQ-Team reference not confirmed |
| Popular Reviews | `1480:9087`; 393×1265 | `/home`, `/search` → review cards | API-backed visual slice | poster/avatar review cards and fallback data | exact parity of the long reference |
| Public / Ranked list detail | `1480:6071`, `1480:6134`; 1440 px; `1480:9446`; 393×852 | `/lists/public/:id` → `PublicList` | mobile/desktop alignment done | public guards 11/11; detail screenshot | exact parity, long-title states |
| Create list empty / populated | `1480:5333`, `1480:5182`; 1440 px; `1480:9542`; 393×852 | `/lists` → `UserLists` | API-backed slice done | owner flow 2/2; mobile no-overflow smoke | exact parity and auth reference |
| Movie Details | Chrome-visible `Films` / movie-detail reference; exact node not available to MCP | `/films/:id` → `MovieDetails` | responsive visual alignment done, parity partial | API-backed route; screenshots at 320/393/768/1440 in `artifacts/movie-details-*.png`; full Playwright regression green | exact frame link, pixel-level parity and authenticated visual reference |
| Review page variants | `1480:9249` 393×932; `1480:9407` 393×852 | `/reviews/:id` → `ReviewDetails` | visual slice done | runtime desktop/mobile and API endpoint | exact parity without Editor access |
| Profile / Following / Public Profile | `1413:9302`, `1413:11582`, `1494:6089`; 1440 px | `/profile`, `/users/:id` | visual slice done | profile/social targeted 8/8 | exact parity, mobile frame inventory |
| Crew lists / more tags | `1480:9718`, `1480:9814`; 393 px | `/users/:id` → `PublicProfile` | visual/data slice done | batch previews, tags, responsive surface | exact parity |
| Community | `1413:13364`; desktop; `1480:7698`; phone | `/community` → `Community` | visual slice done | public guards + accessibility 11/11 | exact parity |
| Journal list variants | `1494:4802`, `4932`, `5045`, `5387`, `5182`, `5287`; 1440 px | `/journal` → `Journal` | visual slice done | journal/editorial browser flows | article/mobile exact parity |
| Journal article / archive | no dedicated node confirmed | `/journal/:slug` → `JournalArticle` | design-system aligned | real editorial API and locale fallback | Figma reference and real UK/EN content |
| Notifications / Messages / Admin / Auth / Service | no dedicated node confirmed | corresponding routes and components | design-system aligned | existing targeted functional flows | do not claim parity without reference |

### Matrix rules

- `done` means the code path, real API data and the listed evidence exist; it does not mean pixel-perfect parity.
- A missing node ID is a Figma/reference gap, not permission to invent a frame or mock data.
- The `MovieDetails` implementation slice is complete at the API-backed visual-alignment level; remaining work is the exact node/pixel audit where a concrete Figma reference exists, followed by external release gates.

## Інвентар, підтверджений у Chrome

У Design-файлі на `Page 1` у дереві шарів видно такі групи сценаріїв: `All Films`, `Films`, `movie filter for phone`, `show results phone`, `Search`, `Lists`, `Featured lists`, `Popular lists`, `Popular reviewers`, `review page`, `Ranked list`, `Create your list`, `Create your list 2`, `Crew lists`, `Crew lists ''more tags''`, а також стани пошуку `Search Results "all"`, `journal articles`, `no matches`, `lists`, `tags`, `cast/ members`, `reviews`, `films` і `search lists by tags`. Це достатньо, щоб зіставити наступні browser/UI зрізи з конкретними сценаріями.

19.10.2026 у Chrome додатково підтверджено розміри й node ID для `Search`, `Films`, `Featured lists`, `Popular lists`, `Popular reviewers`, `Popular Reviews`, `Lists`, `movie filter for phone`, `show results phone`, desktop `Search Results "lists" (svergunova)` (`1480:7490`, 1440×1518), `tags` (`1480:7445`, 1440×1024), `cast/ members` (`1480:7390`, 1440×1392), `reviews` (`1480:7311`, 1440×2176), `films` (`1480:7256`, 1440×1062) та desktop `search lists by tags (svergunova)` (`1480:6898`, 1440×2388). Три `Transparent MacBook Pro` mockup-и й `лого сітка` залишені поза route matrix як presentation/mockup layers, а не окремі application screens. Таким чином matrix охоплює всі названі app-flow frames, які доступні для перегляду; точні tokens/assets усе ще залежать від Editor-level access.

Обмеження, які залишаються зафіксованими: загальний canvas відкривається на дуже малому масштабі, тому без конкретного `Copy link to selection` не можна достовірно зняти desktop/mobile розміри, кольори, типографіку, spacing або assets. Не переносимо ці параметри припущеннями.

Великий дизайн-файл на загальному масштабі 2% і FigJam-дошки не дають надійно зчитати точні розміри, кольори та дрібний текст із загального огляду. Для реалізації потрібно визначити конкретні desktop/mobile фрейми та стани; `Copy link to selection` допомагає зафіксувати вибраний вузол. Можливість отримати структуру, screenshots і assets через підключений плагін необхідно перевірити повторним запитом. Перегляд у браузері сам по собі не підтверджує права інтеграції.

## Початковий візуальний аудит (історичний зріз)

Наведені нижче таблиці описують стан до реалізації reset API, деталки, профілю й інших модулів. Вони не є переліком поточних дефектів; актуальні реалізація та перевірки наведені в `PROGRESS.md`. Точне перенесення макетів залишається відкритим.

Переглянуто живі сторінки `/films`, `/login`, `/register`, `/forgot-password` у Chrome при ширині вікна 1536 px; `/films` і `/login` додатково перевірено при 390 px, `/login` — при 768 px.

| Видима частина | Код | Стан |
| --- | --- | --- |
| Заголовок із логотипом, Films, login/register/logout і пошуком | `src/components/Header.tsx`, `Header.module.css` | Спільний для всіх активних сторінок через `Layout.tsx`; висота 80 px, фіксований зверху |
| Каталог | `src/pages/Search.tsx` | Власні inline стилі; показує перші 20 із 50 фільмів сіткою, назву, рік, poster; пошук за назвою |
| Вхід | `src/auth/Login.tsx`, `Login.module.css` | Робоча форма, локальна авторизація через `AuthContext` |
| Реєстрація | `src/auth/Register.tsx`, `Register.module.css` | Робоча форма з переходом до входу після створення акаунта |
| Відновлення пароля | `src/auth/ForgotPassword.tsx`, `ForgotPassword.module.css` | Форма видима, серверного endpoint-а ще немає |
| Підвал | `src/components/Footer.tsx`, `Footer.module.css` | Спільний; посилання декоративні |

Auth екрани використовують схожу палітру: фон градієнтом `#0b0b0b` → `#2f4f55` → `#b98a3a`, темна картка `#2a2a2a` або `#2b2b2b`, округлення 56 px, округлі поля/кнопки висотою близько 64 px. Стилі повторені окремо у трьох CSS Modules; єдиного файлу токенів або набору спільних UI компонентів немає. Логотип: `public/logo.png.png`. Іконки частково беруться з Font Awesome CDN, замок на recovery екрані — emoji. Глобального CSS reset немає; частина тексту рендериться стандартним serif шрифтом, тоді як каталог задає Arial inline.

### Зафіксовані проблеми верстки

- При viewport 1536 px `document.documentElement.scrollWidth` дорівнює 1673 px. Найдалі виступає `footer`: `width: 100%` разом із `padding: 40px 80px 25px` без `box-sizing: border-box`. На всіх переглянутих сторінках видно горизонтальний скролбар.
- Для auth карток/полів також переважно не задано `box-sizing`, а фіксовані ширини карток 720–760 px з відступами 90 px не мають адаптивних правил. У CSS Modules немає `@media` блоків. При 390 px логотип перекриває навігацію, вміст форми стискається; сторінка має `scrollWidth` 527 px. При 768 px auth картка займає майже всю ширину, а сторінка має `scrollWidth` 905 px. Сітка каталогу при 390 px стає одним стовпцем, але заголовок лишається перекритим.
- Браузер застосовує стандартний `body { margin: 8px }` і Times New Roman до заголовка/навігації; `footer` має `box-sizing: content-box`. Це підтверджено обчисленими стилями в браузері.
- Каталог і auth екрани мають різні підходи до стилів. Перед перенесенням нового дизайну слід отримати Figma змінні кольорів, типографіки й відступів, щоб визначити спільні токени.

## Куди переносити майбутні фрейми

| Figma фрейм / сценарій | Поточна точка в коді | Що перевірити при інтеграції |
| --- | --- | --- |
| Каталог / пошук | `App.tsx` → `/films` → `Search.tsx`; `api/search.api.ts` | Стани loading/empty/error, Spring `Page.content`, пагінація, відкриття картки фільму |
| Вхід | `/login` → `Login.tsx`; `AuthContext.tsx`; `api/auth.api.ts` | Помилки валідації, індикатор запиту, адаптивність, переходи |
| Реєстрація | `/register` → `Register.tsx`; `api/auth.api.ts` | Поля `{username,email,password}`, успішний стан, помилки |
| Відновлення | `/forgot-password` → `ForgotPassword.tsx` | У бекенді нема `/auth/forgot-password`; сам макет не зробить форму функціональною |
| Глобальна навігація | `Layout.tsx`, `Header.tsx`, `Footer.tsx` | Адаптивні стани й справжні посилання; усунути переповнення сторінки |
| Деталі фільму, оцінка, відгуки | `pages/MovieDetails.tsx`, `MovieDetails.module.css`, `Comments.tsx`; route `/films/:id` | Poster-backed hero, metadata/credits, watched/watchlist/favorites, rating, review/comment actions, similar films і loading/error states |
| Профіль / списки | `pages/Profile.tsx`, `PublicProfile.tsx`, `UserLists.tsx`, `PublicLists.tsx`, `PublicList.tsx`; routes підключені в `App.tsx` | Перевіряти visual variants і API-backed states, не вигадуючи нові backend contracts |

## Як працювати з конкретними фреймами

1. Для кожної сторінки потрібне посилання на **конкретний Figma frame або variant**, а також цільові desktop/mobile розміри й важливі стани (empty, loading, error, hover, active).
2. Через Figma інтеграцію спочатку отримати `get_design_context` точного node; якщо даних надто багато — `get_metadata` і повторно контекст потрібного піддерева. Потім обов'язково `get_screenshot` того ж variant і, за потреби, variables/assets.
3. Зіставити frame з таблицею вище. Переносити структуру у React/TypeScript та існуючі CSS Modules, узгоджуючи повторні елементи у спільні компоненти й токени. Не переносити згенерований Tailwind код дослівно й не вигадувати assets, які вже є у Figma.
4. Перевірити результат у браузері при розмірах макета, порівняти з Figma screenshot і перевірити поведінку через реальний API. Для змін кількох TSX компонентів виконати React quality checklist, `npx tsc --noEmit` і `npm run build`.

Загальні Figma-посилання вже є, але до вибору конкретного фрейму і доступу до його властивостей точні кольори, відступи, шрифти та assets лишаються неперевіреними.

## Точні frames, знайдені через Chrome

18.10.2026 потрібні фрейми були вибрані безпосередньо в перегляді Figma у Chrome. Для них збережені node ID, розмір і базовий фон; це надійні координати для наступного design-to-code проходу, навіть поки MCP не має Editor-доступу.

| Сценарій | Node ID | Розмір | Базовий фон | Посилання |
| --- | --- | --- | --- | --- |
| Lists catalog | `1480:4983` | 1440×3816 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-4983) |
| Featured lists | `1480:5839` | 1440×3565 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-5839) |
| Popular lists | `1480:5390` | 1440×2821 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-5390) |
| Create your list — empty | `1480:5333` | 1440×2160 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-5333) |
| Create your list — populated | `1480:5182` | 1440×3856 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-5182) |
| Public list detail | `1480:6071` | 1440×2033 | `#ffffff` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-6071) |
| Lists catalog — mobile | `1480:8280` | 393×1809 | видимий dark surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8280) |
| Create your list — mobile | `1480:9542` | 393×852 | видимий dark surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-9542) |
| Public list detail — mobile | `1480:9446` | 393×852 | видимий dark surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-9446) |
| Ranked list detail | `1480:6134` | 1440×2033 | `#ffffff` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-6134) |
| Crew lists — profile lists tab | `1480:9718` | 393×1546 | видимий dark surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-9718) |
| Search Results “all” | `1480:8934` | 393×2801 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8934) |
| Search Results “no matches” | `1480:8856` | 393×852 | `#ffffff` inspector / dark visible surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8856) |
| Search Results “lists” | `1480:8804` | 393×852 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8804) |
| Search Results “tags” | `1480:8767` | 393×852 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8767) |
| Search Results “films” | `1480:8594` | 393×852 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8594) |
| Search Results “journal articles” — desktop | `1480:7549` | 1440×1149 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7549) |
| Search Results “journal articles” — mobile | `1480:8889` | 393×1150 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8889) |
| Search Results “lists” — desktop | `1480:7490` | 1440×1518 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7490) |
| Search Results “tags” — desktop | `1480:7445` | 1440×1024 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7445) |
| Search Results “cast/ members” — desktop | `1480:7390` | 1440×1392 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7390) |
| Search Results “reviews” — desktop | `1480:7311` | 1440×2176 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7311) |
| Search Results “films” — desktop | `1480:7256` | 1440×1062 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-7256) |
| Search lists by tags — desktop | `1480:6898` | 1440×2388 | `rgba(31,31,31,1)` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-6898) |
| Search lists by tags | `1480:8527` | 393×1055 | `#ffffff` outer inspector / dark visible surface | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-8527) |
| Mobile search result reference | `1480:6217` | 393×581 | `#8a38f5` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1480-6217) |

### Journal frames, знайдені через Chrome

У тому самому Design-файлі окремо знайдено шість desktop-станів Journal. Вони підтверджують наявність серії довгих editorial screens, але без Editor-доступу Figma MCP не повертає node-level screenshot/context для pixel-accurate перенесення.

| Сценарій | Node ID | Розмір | Посилання |
| --- | --- | --- | --- |
| Journal List 1 — Sulyma Bohdan | `1494:4802` | 1440×3560 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-4802) |
| Journal List 2 | `1494:4932` | 1440×3562 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-4932) |
| Journal List 3 | `1494:5045` | 1440×3561 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-5045) |
| Journal List 4 | `1494:5387` | 1440×3561 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-5387) |
| Journal List 5 | `1494:5182` | 1440×3560 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-5182) |
| Journal List 6 | `1494:5287` | 1440×3565 | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-5287) |

### Profile і social frames, знайдені через Chrome

Пошук по всіх сторінках Design-файлу дав окремі профільні та social references. Вони підтверджують темний profile shell із hero/identity, статистикою, розподілом оцінок, колекціями й review/activity sections; Following-варіація додатково має центральну колонку компактних user rows. MCP все ще не має права повернути точний node context, тому ці frames використовуються як візуальні reference, а не як підтвердження pixel parity.

| Сценарій | Node ID | Розмір | Базовий фон | Посилання |
| --- | --- | --- | --- | --- |
| Profile Page “Profile” — Simchuk | `1413:9302` | 1440×4459 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1413-9302) |
| My Profile Page “Following” — Simchuk | `1413:11582` | 1440×3863 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1413-11582) |
| User Profile — Sulyma Bohdan | `1494:6089` | 1440×3059 | `#1f1f1f` | [відкрити frame](https://www.figma.com/design/orb73jiLJnIsZNCRtJsWgS/%D0%94%D0%B8%D0%BF%D0%BB%D0%BE%D0%BC_ItStep_2025?node-id=1494-6089) |

Окремо перевірено mobile `Crew lists (svergunova phone)` — node `1480:9718`, 393×1546, і `Crew lists ''more tags''` — node `1480:9814`, 393×1674. У reference після identity/stats видно tabs Profile/Watchlist/Likes/Lists, активну вкладку Lists і широкі темні list cards з poster collage, назвою, кількістю фільмів та розширеним набором тегів. У `PublicProfile` це перенесено як API-backed public-list cards із до трьома preview posters, `itemCount`, UK/EN pluralization, описом і повними tag links; точна pixel parity не заявляється.

`Search Results ''all'' (svergunova phone)` — node `1480:8934`, 393×2801, показує єдиний global-search result surface з категоріями films, users, tags, lists, cast/members, reviews та journal articles. Реалізований public `/api/search/global` і `/uk|en/search` покриває всі ці категорії API-backed даними; `/films` лишається окремим film-catalog flow. Люди беруться з actor/director/producer каталогу, reviews — лише visible reviews активних users, tags/lists — лише public lists. Окремо в Chrome підтверджено desktop `Search Results "lists" (svergunova)` — node `1480:7490`, 1440×1518, dark surface `rgba(31,31,31,1)`, а також desktop `search lists by tags (svergunova)` — node `1480:6898`, 1440×2388, і phone variant — node `1480:8527`, 393×1055; phone frame має білий outer inspector, тому це не доказ білого app body. Також підтверджено `Search Results "journal articles"`: desktop node `1480:7549`, 1440×1149, і phone node `1480:8889`, 393×1150; обидва мають dark surface `rgba(31,31,31,1)`.

Окремі phone states `1480:8856` (no matches), `1480:8804` (lists), `1480:8767` (tags) і `1480:8594` (films) реалізовані через `tab` query в `/uk|en/search?q=...&tab=...`: категорії перемикаються без mock-даних, а no-match має окремий centered empty surface із поверненням до всіх категорій.

### Підтверджений Journal design slice

Chrome-вигляд `Journal List 1`–`6` показує темний editorial feed: горизонтальні article rows, cover artwork ліворуч, category/date і title/excerpt у центрі, додатковий thumbnail праворуч, outlined `Read` action, byline та чорний footer. Цей підтверджений зріз перенесено в `src/pages/Journal.tsx` і `Journal.module.css`; cover URL, локалізована дата, retry, archive і pagination збережені. Перевірка: `journal-design-flow.spec.ts`, `editorial-layout.spec.ts`, `tsc --noEmit`, Vite build. Це не означає повну pixel parity всіх шести довгих frames.

### Підтверджений Profile visual slice

За знайденими `Profile Page`, `My Profile Page` і `User Profile` frames у коді узгоджено темний profile shell: gradient identity hero, avatar/actions, компактні stats cards, rating distribution, poster-led collections, activity/network/list surfaces та review cards. Реалізація охоплює `Profile.tsx`/`Profile.module.css` і `PublicProfile.tsx`/`PublicProfile.module.css`; функціональні follow/block/message та collection contracts не змінювалися. Перевірка: profile/public/social E2E **8/8 targeted**, `npx tsc --noEmit`, Vite build **165 modules**, Docker Web rebuild і живий Chrome screenshot. Це підтверджений visual slice, а не заява про pixel parity без Editor-доступу.

### Home frames, знайдені через Chrome

Home має окремі guest/registered desktop і mobile variants. У всіх reference frames підтверджений dark `#1f1f1f` canvas; desktop має ширину 1440px, mobile — 393px. Зареєстрований і гостьовий стани відрізняються контентом welcome/activity, але спільно використовують centered hero, poster rows і великі review/list surfaces.

| Сценарій | Node ID | Розмір | Базовий фон |
| --- | --- | --- | --- |
| Home registered desktop | `1413:6263` | 1440×5020 | `#1f1f1f` |
| Home guest desktop | `1413:6471` | 1440×4934 | `#1f1f1f` |
| Home registered mobile | `1327:3210` | 393×2463 | `#1f1f1f` |
| Home guest mobile | `1411:3473` | 393×2265 | `#1f1f1f` |

Реалізація `Home.module.css` узгоджує dark canvas, centered hero, responsive poster row і raised review/list panels. Це visual slice за доступним Chrome reference; точна pixel parity всіх variants не заявляється.

Окремо у Chrome перевірено `Popular Reviews (svergunova phone)` — node `1480:9087`, 393×1265. Reference використовує poster фільму, avatar автора, rating/meta і текст огляду в піднятих dark cards. `RecentReviewResponse` тепер повертає `moviePhotoUrl`/`userAvatarUrl`, а `Home` і Global Search відтворюють цю композицію API-backed даними та fallback-ініціалами. Pixel parity не заявляється без Editor-доступу.

### Review Details frames, знайдені через Chrome

У Chrome перевірено два однойменні `review page (svergunova phone)` variants: node `1480:9249` (393×932) з backdrop/poster hero, title/meta, author, довгим текстом, `Watch Trailer`, liker avatars і mobile navigation; node `1480:9407` (393×852) з компактною like/rating card, heart/count, divider, five-star control і `Done`. Точні `get_design_context` та `get_screenshot` для цих nodes повторно повернули `don't have edit access`, тому реалізація спирається лише на видимий Chrome reference й не заявляє pixel parity.

Доданий `/reviews/:id` використовує реальні API-дані: public visible review, author avatar/name, movie poster/backdrop/meta/trailer, active like count і liker avatars. Сторінка має локалізовані loading/error/fallback стани, display rating, real like/unlike для авторизованого користувача та переходи до movie/author. Review cards у Home, Global Search, Movie Details і PublicProfile ведуть на деталку. Desktop і 393×852 runtime screenshots перевірено; Vite зібрав **170 modules**, API health `UP`, console errors відсутні. Другий Figma variant не перетворено на фальшиве оцінювання огляду: в доменній моделі оцінка належить фільму, а соціальна дія огляду — like.

Нижня mobile navigation цього frame читається без MCP: `Home / Search / Add / Journal / Profile` з п'ятьма рівними icon slots на темній fixed surface. `Header` відтворює цей pattern на ≤720 px; довгі desktop/account links не видаляються, а переходять у верхнє меню з unread badges, locale, admin і logout. На 393 та 320 px усі labels видимі, `scrollWidth - clientWidth = 0`; desktop header лишається без змін. Повторні node-запити 19.10.2026 знову повернули view-only помилку (`get_design_context` debug UUID `465e570d-2760-4e04-b882-a5dcafd1c95d`, `get_screenshot` `ff328e6a-9508-483c-b699-8878031d53da`), тому pixel parity не заявляється.

### Films/Search frames, знайдені через Chrome

Для каталогу знайдено desktop frame `All Films (svergunova)` (`1413:12611`, 1440×2956), phone frames `All Films (svergunova phone)` (`1480:9187`, 393×1215) і `Films (svergunova phone)` (`1480:7843`, 393×1235), а також окремий `Search (svergunova phone)` (`1480:8432`, 393×852). Додатково зафіксовано filter fragment `1480:7611` (295×1416) і show-results fragment `1480:7595` (197×319). Reference показує dark shell, teal/amber hero treatment, компактну filter surface та poster grid. `Search.module.css` узгоджено з цим treatment; controls, loading/error/empty states і server pagination залишилися без зміни контракту.

### Lists catalog frame, знайдений через Chrome

Для основного каталогу списків вибрано `Lists (svergunova)` — node `1480:4983`, 1440×3816, базовий фон `#1f1f1f`, і `Lists (svergunova phone)` — node `1480:8280`, 393×1809. У references видно dark teal/black hero з gold CTA, feed/tag rails, poster-stack cards, compact featured/popular rows і темний footer. `PublicLists.tsx`/`PublicLists.module.css` зберігають feeds, tag filtering, server pagination та loading/error/empty states; mobile отримав компактний hero, горизонтальні rails і двоколонкові картки. Read-only smoke для 320/393/768 px дав **0 px** overflow; pixel parity без Editor-доступу не заявляється.

Public list detail `list (svergunova)` — node `1480:6071`, 1440×2033, і mobile `list (svergunova phone)` — node `1480:9446`, 393×852 — мають dark hero, author/title/actions, poster-grid body і mobile bottom navigation. Inspector frame показує outer base `rgba(255,255,255,1)`, тому це не використовується як доказ суцільного білого body. `PublicList.module.css` відтворює dark composition, а mobile отримав компактний hero та 4-column poster wall; like/tag/author/movie links і loading/error states залишилися функціональними. `public-guards.spec.ts` — **6/6** у попередньому функціональному зрізі, новий smoke — **0 px** overflow на 320/393/768 px.

### Community / Popular reviewers frames, знайдені через Chrome

Для Community вибрано desktop `Popular reviewers (svergunova)` — node `1413:13364`, 1440×2850, базовий фон `#1f1f1f`, і phone `Popular reviewers (svergunova phone)` — node `1480:7698`, 393×852. Reference показує teal/amber hero, yellow section label, avatar-led user rows, directory/search, pagination і dark mobile navigation. Реалізація `Community.tsx`/`Community.module.css` додає avatar/fallback rows, accessible search label, pagination і responsive 320/768 layout; перевірка `public-guards + accessibility` — **11/11**, Vite **165 modules**, Docker Web rebuild green. Selected phone frame має світлий outer inspector у Figma, тому точний базовий колір phone не стверджується; pixel parity не заявляється.

### Що саме видно в Lists flow

- Catalog має темний фон, велику верхню область, секції зі списками та прев'ю постерів.
- Featured/Popular варіанти використовують картки або компактні рядки з колажами постерів, назвою, описом, тегами та метаданими.
- Create empty містить поля Name, Description, Tags, visibility, дію Add a film і стани Cancel/View list/Save; populated-варіант показує додані фільми рядками.
- Public list і Ranked list — visible dark composition деталки з темною обкладинкою/hero, автором і метаданими, діями, сіткою постерів та темним footer; inspector outer frame може показувати білий base, тому це не є доказом білого body.
- API для каталогу списків уже віддає до 3 `previewMovies` на картку через пакетний query без N+1; це використовується `ListPosterStack` у catalog/feed cards. Mobile catalog і detail visual alignment завершені, окремий pixel-perfect audit Featured/Popular без Editor-доступу не заявляється.

### Create your list visual slice

Для empty-стану вибрано desktop frame `Create your list (svergunova)` — node `1480:5333`, 1440×2160, базовий фон `#1f1f1f`. У Chrome reference видно teal/amber hero, двоколонкову форму Name/Description/Tags/visibility, action row і порожній preview card. `UserLists.tsx`/`UserLists.module.css` тепер відтворюють цю композицію через реальні API-поля, локалізований public/private hint, textarea для довгого опису, live preview і mobile collapse.

Для populated-стану перевірено `Create your list 2 (svergunova)` — node `1480:5182`, 1440×3856. При виборі списку hero стає його назвою/описом, create-form замінюється edit-form, а фільми показуються poster rows із fallback, meta, remove і reorder actions. Loading/error/empty стани мають окремі accessible cards. Owner flow **2/2**, public/accessibility suite **11/11**, exact pixel parity без Editor-доступу не заявляється.

Для mobile create/edit reference у Chrome вибрано `Create your list (svergunova phone)` — node `1480:9542`, 393×852. `UserLists.module.css` тепер використовує sheet-style dark surfaces, одноколонкові поля, full-width actions, двоколонковий список власних списків і компактні poster rows; реальні create/edit/delete/reorder та loading/error/empty стани не змінювалися. Responsive smoke для public routes і authenticated shell build green; повний owner E2E після presentation-only CSS змін не запускався.

### Що дали FigJam-дошки

`Project - Rewind` підтверджує продуктову карту, дослідження, референси й основні feature-flow; це джерело контексту, а не точних CSS-токенів. `Інформаційна архітектура диплом` показує головну сторінку, фільми, списки, сортування, сторінку фільму, написання відгуку та створення списку як пов'язані переходи. Обидві дошки відкриті в режимі view/comment і не містять додаткових конкретних UI-фреймів, потрібних для pixel-perfect перенесення.

### Готовий порядок наступної реалізації

1. Винести підтверджені базові кольори й layout primitives у спільні токени, не вигадуючи неперевірені Figma variables.
2. Перенести `Lists` через `Featured/Popular` картки та poster preview data.
3. `Create your list` для empty/populated/error/loading станів перенесений і перевірений.
4. Public/Ranked detail використовують спільний template; cover backdrop і position badges вже перенесені, залишаються точні mobile variants і product-level ranked ordering, якщо такий контракт буде доданий у backend.
5. Desktop 1440 px і основні mobile Lists frames уже зіставлені; далі залишаються інші невикористані Figma variants і загальний visual audit без заяви про pixel-perfect parity.
