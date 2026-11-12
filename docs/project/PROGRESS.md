# REWIND — поточний прогрес

> **Live read-back: 12.11.2026, 09:57 UTC.** Публічний сайт: [GitHub Pages](https://anton5267.github.io/rewind-letterboxd/); API — Supabase Edge `rewind-api` **v33 ACTIVE**; база — приватна схема `rewind` у Supabase Free. Точний порядок робіт — у [PLAN.md](../../PLAN.md), перевірки й історичні докази — у [RELEASE_EVIDENCE.md](../operations/RELEASE_EVIDENCE.md), вимоги та gaps — у [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md).

## Підтверджено

- Pages та публічний каталог доступні; прямі UK/EN Home/Admin маршрути повертають HTTP 200. `/api/genres` — 200; анонімні Admin API — 401. Приватні дані не відкриті через Data API.
- Hosted Auth: Site URL, чотири UK/EN login/reset redirects, confirmation/recovery шаблони й Gmail SMTP збережені. Signup confirmation, recovery/reset та повторний sign-in тестової identity завершені. Live read-back: 2 підтверджені Auth identities, 2 зв’язані REWIND профілі, 1 активний ADMIN. Локальний recovery template узгоджений із Dashboard щодо RedirectTo-aware мови.
- TMDB refresh: 50 фільмів, 49 зв’язані; **49/49** спроб успішні, помилок немає. Original language є у **29/49**, ще 20 значень відсутні; один фільм без TMDB ID. Cron активний щодня о 03:00 UTC. Останній контрольований batch: **9/9** успішно.
- Admin Movies, report queue та Featured/Crew реалізовані в Edge v33 і frontend. Report queue порожня; живе dismiss не тестувався. Поточна браузерна сесія автентифікована, але не проходить ADMIN role guard; роль не змінювалася.
- PostgreSQL baseline, MySQL-сумісність і локальний data-import rehearsal перевірені окремо від звичайного MySQL Compose. Full backend suite: 145/145 на PostgreSQL 17 та MySQL 8.4; import API flow: 21/21. Локальну MySQL базу й Compose не переносили.

## Відкрито

1. Пройти окремі UK/EN Auth token callbacks і deletion/outbox cleanup лише для disposable identity; звичайний профіль не видаляти.
2. Прийняти Admin UI з браузерною сесією справжнього ADMIN; не видавати роль лише заради тесту. Для report dismiss потрібна реальна скарга, не fixture у production.
3. Після чотириденного cooldown перевірити повторне TMDB-заповнення 20 пропусків. Для єдиного фільму без TMDB ID знайдений кандидат `1147411`, але його ще потрібно підтвердити через офіційний TMDB/API та штатний Admin sync; у базу ID не записаний.
4. Продовжити перевірені продуктні/UI gaps із матриці вимог; не трактувати локальні fixtures як live acceptance.

## Межі цього оновлення

Цього разу виконано live read-only звірку Auth, профілів, каталогу, refresh state, report queue і cron. Один штатний Vault-authenticated TMDB batch оновив лише публічні метадані фільмів. Код, ролі, приватні користувацькі дані, Auth settings, GitHub deployment і локальний MySQL/Compose не змінювалися. Documentation cleanup перевірено `git diff --check`; повні тести не запускалися, бо runtime-код не змінювався.