# Rewind — поточний стан

Оновлено 21.10.2026. Код і локальна release-регресія завершені; доставка в GitHub ще виконується. Робочий порядок — [PLAN](../../PLAN.md), детальні результати — [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Структура та документація

- Backend розташований у `backend/`, frontend — у `frontend/`; Compose, CI, Caddy та scripts використовують актуальні шляхи.
- Документація зведена до навігаційних guides без дублювання вимог. Raw Figma references, backups, secrets і generated evidence залишаються поза Git.
- Кореневий `.gitignore` тепер ігнорує лише `/figma/`, тому потрібні runtime assets у `frontend/src/assets/figma/` можуть бути доставлені.

## Реалізація

- Movie, Review, Home/Search, Lists, Profile/PublicProfile, Community, Messages і Notifications мають responsive стани, UK/EN, клавіатурну навігацію та реальні API.
- Старі profile reviews отримують nullable `moviePhotoUrl`; frontend сумісний і з попередньою відповіддю API.
- Journal зберігає API-backed feed/archive/article/audio/newsletter. У mobile article прибрано декоративний control без дії.
- Login/Register/Forgot/Reset використовують спільну desktop/mobile Figma-композицію з локальними assets.
- Help, Contact, Rules, Privacy, Film Data, Account Deletion та About отримали структуровані responsive layouts.
- Admin dashboard отримав Figma hero/workspace/metrics, зберіг усі users/movies/reviews/comments/lists/moderation/activity/audit/settings actions.
- Lists landing повернув видиму feed navigation і точний UK/EN зміст після regression failure; links залишаються клавіатурно доступними.

## Перевірка 21.10.2026

| Gate | Результат |
| --- | --- |
| Frontend typecheck/build | PASS; 213 modules |
| Playwright | **125 passed**, 0 failed/skipped/flaky/retries |
| Backend Maven | **87 tests**, 0 failures/errors/skips |
| Local Docker | API health 200, web 200; images перебудовані зі збереженням DB/`.env` |
| API/contracts/security/reset | PASS |
| Redis/concurrency/load/schema | PASS; 38 tables, 55 foreign keys |
| Backup/restore | PASS в окремій тимчасовій schema, cleanup виконано |
| Production template/Caddy/Compose | PASS |

Перший full browser run виявив два дефекти Lists: втрачений локалізований hero text і приховану feed navigation. Після виправлення targeted run дав 7/7, повторний full run — 125/125.

## Figma

Plugin читає структуру, screenshots, assets, variables і context конкретних вузлів design copy `BDO9GO1oscOeUTcu4VXVKA`. У цьому проході використані Journal article `844:1547`, Auth `605:2173–2176`, mobile Auth `911:1596`, `915:1598`, `922:1788`, `944:1582`, `944:1828`, `944:1887`, Help `1062:1993`, About `1011:1915` і Admin dashboard `1178:2466`. Повний mapping і чесні межі точності — у [FIGMA_HANDOFF](../frontend/FIGMA_HANDOFF.md).

## Зовнішні залежності

Production VPS/domain/TLS, SMTP/TMDB credentials, monitoring, server restore drill і погоджений Journal content залишаються окремою інфраструктурною фазою. Вони не блокують завершення коду та локальної регресії.
