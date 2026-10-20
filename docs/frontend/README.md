# Rewind — frontend

React, TypeScript і Vite; код у `frontend/`. Маршрути визначає [`App.tsx`](../../frontend/src/App.tsx): усі URL нижче мають префікс `/uk` або `/en`, старі URL перенаправляються на `/uk/...`.

## Маршрути й код

Шляхи компонентів відраховуються від [`src/`](../../frontend/src/), клієнтів — від [`src/api/`](../../frontend/src/api/). HTTP-контракти описані в [API.md](../backend/API.md).

| Напрям / URL без мовного префікса | Компоненти | Основні API clients / контракт |
| --- | --- | --- |
| <a id="catalog"></a>Каталог: `/home`, `/films`, `/search`, `/films/:id`, `/people/:type/:id` | `pages/{Home,Search,GlobalSearch,MovieDetails,Person}.tsx` | `search.api.ts`, `movies.api.ts`, `people.api.ts`, `ratings.api.ts`, `tags.api.ts`; [Catalog](../backend/API.md#catalog) |
| <a id="profile"></a>Профіль: `/profile`, `/users/:id` | `pages/{Profile,PublicProfile}.tsx` | `profile.api.ts`, `social.api.ts`, `newsletter.api.ts`; [Profile](../backend/API.md#profile) |
| <a id="lists"></a>Списки: `/lists`, `/lists/discover`, `/lists/public/:id` | `pages/{UserLists,PublicLists,PublicList}.tsx` | `lists.api.ts`, `tags.api.ts`; [Lists](../backend/API.md#lists) |
| <a id="reviews"></a>Огляди: `/reviews`, `/reviews/:id` | `pages/{PopularReviews,ReviewDetails,Comments}.tsx` | `reviews.api.ts`, `comments.api.ts`, `social.api.ts`; [Reviews](../backend/API.md#reviews) |
| <a id="social"></a>Спільнота: `/community`, `/community/reviewers`, `/messages`, `/notifications` | `pages/{Community,PopularReviewers,Messages,Notifications}.tsx` | `social.api.ts`, `messages.api.ts`, `notifications.api.ts`; [Social](../backend/API.md#social) |
| <a id="journal"></a>Журнал: `/journal`, `/journal/:slug` | `pages/{Journal,JournalArticle}.tsx`, `components/AdminArticles.tsx` | `journal.api.ts`, `newsletter.api.ts`; [Journal](../backend/API.md#journal) |
| <a id="auth"></a>Акаунт: `/login`, `/register`, `/forgot-password`, `/reset-password` | `auth/{Login,Register,ForgotPassword,ResetPassword}.tsx`; `context/AuthContext.tsx` | `auth.api.ts`, `axios.ts`; [Auth](../backend/API.md#auth) |
| Службові: `/help`, `/contact`, `/rules`, `/privacy`, `/film-data`, `/delete-account`, `/about` | `pages/{ServicePage,About}.tsx` | Без API |
| <a id="admin"></a>Адміністрування: `/admin` | `pages/AdminDashboard.tsx`, `components/Admin*.tsx` | `admin.api.ts` і domain clients; [Admin](../backend/API.md#admin) |

## Спільні правила

- `main.tsx` монтує `BrowserRouter` і `AuthProvider`; `layout/Layout` підключає Header/Footer. Локалізація — `i18n.ts`, токени й базові стилі — `global.css`.
- Зберігати UK/EN, URL query/history, серверну пагінацію та окремі loading/error/empty/retry стани. Контент і counts беруться з API; порожня відповідь не замінюється демонстраційними даними.
- Перевикористовувати `Pagination`, `RetryButton`/`RetryNotice`, `ResilientImage`, `ListPosterStack`, action/rating sheets. `useDialogFocusTrap`, `useRovingTabs`, `useActiveSection` і `utils/userIdentity.ts` задають спільну поведінку фокуса, навігації та identity fallbacks. Перевіряти повні доступні назви, keyboard focus і mobile touch targets.
- `UserFollowRow` і page-scoped `FollowActionsContext` синхронізують дублікати користувача. Зберігати guest/self/block guards і pending states; після невдалої social mutation retry спочатку перечитує статус.
- Axios працює через same-origin `/api`; Vite proxy налаштовується в `vite.config.ts`. Auth використовує HttpOnly cookies і `/users/me`. `api/axios.ts` читає поточний CSRF cookie, за його відсутності ділить один `/auth/csrf` GET між паралельними мутаціями; 401 запускає shared refresh, 403 автоматично не повторюється. UI role guard не замінює авторизацію backend.

## Команди

З кореня репозиторію:

```powershell
cd frontend
npm ci
npm run dev
```

У другому терміналі з `frontend/`: `npm run verify:build` запускає TypeScript перевірку і Vite build; окремий `vite build` не перевіряє типи. E2E specs — у [`tests/e2e/`](../../frontend/tests/e2e/); запускати цільові сценарії за ризиком зміни, повний regression — за планом.

[Запуск середовища](../operations/RUN_LOCAL.md) · [Результати перевірок](../operations/RELEASE_EVIDENCE.md) · [Figma references](FIGMA_HANDOFF.md) · [Навігація проєктом](../../README.md)
