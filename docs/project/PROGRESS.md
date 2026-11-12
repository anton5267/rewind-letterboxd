# REWIND — поточний прогрес

> **Live read-back: 12.11.2026, 15:34 UTC.** Публічний сайт: [GitHub Pages](https://anton5267.github.io/rewind-letterboxd/); API — Supabase Edge `rewind-api` **v34 ACTIVE**; база — приватна схема `rewind` у Supabase Free. Точний порядок робіт — у [PLAN.md](../../PLAN.md), перевірки й історичні докази — у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md), вимоги та gaps — у [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md).

## Підтверджено

- Pages та публічний каталог доступні; прямі UK/EN Home/Admin маршрути повертають HTTP 200. `/api/genres` — 200; анонімні Admin API — 401. Приватні дані не відкриті через Data API.
- Hosted Auth: Site URL, чотири UK/EN login/reset redirects, confirmation/recovery шаблони й Gmail SMTP збережені. Signup confirmation, recovery/reset та повторний sign-in тестової identity завершені. Live read-back: 2 підтверджені Auth identities, 2 зв’язані REWIND профілі, 2 активні ADMIN. Локальний recovery template узгоджений із Dashboard щодо RedirectTo-aware мови.
- TMDB refresh: 50 фільмів, 49 зв’язані; **49/49** спроб успішні, помилок немає. Original language є у **29/49**, ще 20 значень відсутні; один фільм без TMDB ID. Cron активний щодня о 03:00 UTC. Останній контрольований batch: **9/9** успішно.
- Admin Movies, report queue та Featured/Crew реалізовані в Edge v34 і frontend. Live ADMIN movie write audit і публікаційний toggle перевірені з read-back; запис містить лише назви змінених полів. Report queue порожня; живе dismiss не тестувався. Поточна сесія має ADMIN доступ. Disposable `+rewindtest` identity зараз має пов’язаний профіль ADMIN і активну сесію; роль/lifecycle окремо не змінювали.
- PostgreSQL baseline, MySQL-сумісність і локальний data-import rehearsal перевірені окремо від звичайного MySQL Compose. Full backend suite: 145/145 на PostgreSQL 17 та MySQL 8.4; import API flow: 21/21. Локальну MySQL базу й Compose не переносили.

- **Безпека (Supabase advisors, 12.11 о 10:00 UTC):** 3 INFO про приватні таблиці з RLS без policy; read-only перевірка підтвердила, що `anon`, `authenticated`, `rewind_edge_reader` та `rewind_edge_app` не мають табличних прав на них. `pg_net` встановлений у `public`, але активний cron використовує `net.http_post`, тому не переносити extension без заміни й репетиції залежності. Захист від витоклих паролів вимкнений; Supabase надає його лише на Pro+, тож на поточному Free увімкнути не можна. Performance advisor показує 15 невикористаних індексів; Health findings немає. [Details](../operations/RELEASE_EVIDENCE.md#supabase-advisor-and-private-table-grants--12112026).

## Відкрито

1. Пройти окремі UK/EN Auth token callbacks і deletion/outbox cleanup лише для disposable identity; звичайний профіль не видаляти.
2. Прийняти Admin UI з браузерною сесією справжнього ADMIN; не видавати роль лише заради тесту. Для report dismiss потрібна реальна скарга, не fixture у production.
3. Після чотириденного cooldown перевірити повторне TMDB-заповнення 20 пропусків. Для єдиного фільму без TMDB ID знайдений кандидат `1147411`, але його ще потрібно підтвердити через офіційний TMDB/API та штатний Admin sync; у базу ID не записаний.
4. Продовжити перевірені продуктні/UI gaps із матриці вимог; не трактувати локальні fixtures як live acceptance.

## Home activity feed — опубліковано 12.11

- Авторизовані користувачі мають UK/EN стрічку активності людей, на яких підписані. Гості не викликають персональний endpoint. Pages deploy і CI успішні; live UK Home показав новий текст, стрічку та empty state. Локальні fixture E2E — 2/2. [Evidence](../operations/RELEASE_EVIDENCE.md#authenticated-home-following-activity-pages-readback--12112026-1232-utc).

## Межі цього оновлення

Цього разу виконано live read-only звірку Auth, профілів, каталогу, refresh state, report queue і cron. Один штатний Vault-authenticated TMDB batch оновив лише публічні метадані фільмів. Код, ролі, приватні користувацькі дані, Auth settings, GitHub deployment і локальний MySQL/Compose не змінювалися. Documentation cleanup перевірено `git diff --check`; повні тести не запускалися, бо runtime-код не змінювався.
