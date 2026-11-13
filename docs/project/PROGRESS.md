# REWIND — поточний прогрес


> **Оновлення 13.11.2026:** GitHub Pages production лишається на останньому успішному deploy `c1202364`, а актуальний repo release record підтверджує Edge API v43. Коментарі/списки reports та Admin review editor зібрані в ізольованій гілці від свіжого `master`; цільові E2E **7/7** і build пройшли. Це ще не Pages deployment; див. [release-candidate evidence](../operations/RELEASE_EVIDENCE.md#admin-report-controls-release-candidate--local-validation--13112026).> **Supabase Edge source read-back: 12.11.2026, 17:16 UTC; database read-only snapshot: 17:27 UTC; GitHub Actions: 17:14 UTC.** Публічний сайт: [GitHub Pages](https://anton5267.github.io/rewind-letterboxd/); API — Supabase Edge `rewind-api` **v36 ACTIVE**; база — приватна схема `rewind` у Supabase Free. Точний порядок робіт — у [PLAN.md](../../PLAN.md), перевірки й історичні докази — у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md), вимоги та gaps — у [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md).

## Підтверджено

- Pages та публічний каталог доступні; прямі UK/EN Home/Admin маршрути повертають HTTP 200. `/api/genres` — 200; анонімні Admin API — 401. Приватні дані не відкриті через Data API.
- Hosted Auth: Site URL, чотири UK/EN login/reset redirects, confirmation/recovery шаблони й Gmail SMTP збережені. Signup confirmation, recovery/reset та повторний sign-in тестової identity завершені. Live read-back: 2 підтверджені Auth identities, 2 зв’язані REWIND профілі, 2 активні ADMIN. Локальний recovery template узгоджений із Dashboard щодо RedirectTo-aware мови.
- TMDB read-only snapshot (12.11 17:27 UTC): 50 фільмів, 49 зв’язані; original language є у **29/49**, ще **20** значень відсутні; один фільм без TMDB ID. Cron щоденний о 03:00 UTC; останній запуск 12.11 успішний, остання успішна спроба серед пропущених мов — 12.11 03:00 UTC, але значення не з’явилося. Перша повторна планова перевірка після cooldown — не раніше 16.11 03:00 UTC. ID кандидата для непов’язаного фільму офіційно не підтверджений і в БД не записаний.
- Admin Movies, report queue та Featured/Crew реалізовані у live Edge v36 і frontend. Featured CUSTOM lists отримали Move up/Move down; Edge v36 та Pages source опубліковані й перевірені, але live reorder mutation не проводилась: у production 0 CUSTOM. Live ADMIN movie update/audit і publication toggle перевірені раніше з read-back. `review_reports` порожня, тож report dismiss також не тестувався. Поточні ролі та lifecycle identities не змінювали.
- Edge suite: **107/107**; `deno check`, frontend `verify:build` (309 модулів), Admin Lists Playwright **1/1** (UK/EN × 7 ширин, ordering і межі позицій), GitHub CI [43266760220](https://github.com/anton5267/rewind-letterboxd/actions/runs/43266760220) та Pages deploy [43266760644](https://github.com/anton5267/rewind-letterboxd/actions/runs/43266760644) пройшли. Live Admin reorder acceptance не виконувався: немає CUSTOM списків; Playwright використовує ізольовані fixtures. Деталі — у [evidence](../operations/RELEASE_EVIDENCE.md#admin-featured-list-ordering-release--12112026).
- PostgreSQL baseline, MySQL-сумісність і локальний data-import rehearsal перевірені окремо від звичайного MySQL Compose. Full backend suite: 145/145 на PostgreSQL 17 та MySQL 8.4; import API flow: 21/21. Локальну MySQL базу й Compose не переносили.

- **Безпека (Supabase advisors, 12.11 о 10:00 UTC):** 3 INFO про приватні таблиці з RLS без policy; read-only перевірка підтвердила, що `anon`, `authenticated`, `rewind_edge_reader` та `rewind_edge_app` не мають табличних прав на них. `pg_net` встановлений у `public`, але активний cron використовує `net.http_post`, тому не переносити extension без заміни й репетиції залежності. Захист від витоклих паролів вимкнений; Supabase надає його лише на Pro+, тож на поточному Free увімкнути не можна. Performance advisor показує 15 невикористаних індексів; Health findings немає. [Details](../operations/RELEASE_EVIDENCE.md#supabase-advisor-and-private-table-grants--12112026).

## Відкрито

1. Пройти окремі UK/EN live Auth token callbacks і deletion/outbox cleanup лише для disposable identity; source fixture matrix 4/4 пройшла, але live token acceptance цим не підтверджений. Звичайний профіль не видаляти.
2. Прийняти інші Admin routes і list curation mutations. Featured reorder Edge v36 та Pages UI опубліковані; live reorder не перевірений, бо CUSTOM списків немає. Для report-dismiss потрібна справжня скарга; черга порожня, production fixture не створювати.
3. Після cooldown перевірити TMDB refresh: перші до 10 пропущених мов — не раніше 16.11 03:00 UTC, залишок — наступними плановими партіями. Для єдиного фільму без TMDB ID кандидат `1147411` досі потребує підтвердження офіційним TMDB API та штатного Admin sync; у БД ID не записаний.
4. Уточнити TMDB application details: сайт публічний, але в source scan немає платіжного чи рекламного provider. Офіційний FAQ визначає commercial use за основною метою отримати дохід і дозволяє безплатне non-commercial використання з атрибуцією; сама публічність не доводить commercial use. Не додавати монетизацію й не вважати API key комерційною ліцензією. [TMDB FAQ](https://developer.themoviedb.org/docs/faq).
5. Продовжити перевірені продуктні/UI gaps із матриці вимог; не трактувати локальні fixtures як live acceptance.

## Home activity feed — опубліковано 12.11

- Авторизовані користувачі мають UK/EN стрічку активності людей, на яких підписані. Гості не викликають персональний endpoint. Pages deploy і CI успішні; live UK Home показав новий текст, стрічку та empty state. Локальні fixture E2E — 2/2. [Evidence](../operations/RELEASE_EVIDENCE.md#authenticated-home-following-activity-pages-readback--12112026-1232-utc).

## Межі цього оновлення

Попередній release block синхронізував джерело Edge v34 і звузив Pages path filter, щоб E2E-only зміни не публікували сайт; історичні CI/Pages результати збережені в `RELEASE_EVIDENCE.md`. Новий live release з guard для CUSTOM visibility і його CI/Pages/API перевірки зафіксовані вище та в окремому evidence entry.
