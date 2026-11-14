# REWIND — поточний прогрес

Оновлено 14.11.2026. Робочий порядок — у [PLAN](../../PLAN.md), вимоги — у [PROJECT_REQUIREMENTS](PROJECT_REQUIREMENTS.md), перевірки — у [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Опубліковано

- **Сайт і API.** GitHub Pages обслуговує повний UK/EN React frontend. Останній звірений hosted runtime — Edge v60 ACTIVE. [CI](https://github.com/anton5267/rewind-letterboxd/actions/workflows/ci.yml), [Pages](https://github.com/anton5267/rewind-letterboxd/actions/workflows/deploy-pages.yml).
- **Акаунти.** Hosted signup confirmation, recovery/reset і sign-in пройшли на disposable identities. Профілі пов’язані з Auth UUID. Опубліковані email-change UI/callback, owner-only names, location/pronoun, загальні й індивідуальні reply preferences. Початкове оновлення токена очікує профілю перед перевіркою Admin. Home та Header очищають стан при зміні ID користувача. Окремі cross-tab/late-response fixtures пройшли 6/6 для Home і 6/6 для unread counters Header.
- **Функції.** Каталог, ratings/reviews, private/public lists, list comments, follow/block, activity, messages/notifications, Journal і supported Admin controls доступні в hosted-стеку. Додані profile avatar/banner, pin і ranked/unranked lists, Journal media та Community public details.
- **Останні UI зміни.** Шапка статті Journal та її стилі відокремлені. Відновлені тло, breadcrumb, округлення колажу й reader columns; legacy/media/audio/language/error перевірки пройшли. Shared Header/Footer використовують оригінальні Figma SVG; desktop search border, nav slots/opacity й UK/EN keyboard/geometry перевірені у 10 комбінаціях. Messages/notifications оновлюються у видимій вкладці з guards від запізнілих відповідей. Person має десятиліття, окремі ACTOR/DIRECTOR/PRODUCER фільмографії та UK/EN біографії з позначеним English fallback і More/Less.
- **Settings layout.** Desktop identity form розкладена у дві колонки за Figma, стилі відокремлені. Цільові UK/EN save/reload, responsive drafts і mobile-dialog focus пройшли в обох копіях. Виправлено пріоритет стилів біографії над локальним legacy fallback, додано gold keyboard focus. Повна frame parity лишається відкритою.
- **Структура.** README англійською з трьома схемами. Edge розділений на contracts, HTTP, repositories і runtime. Власний/публічний React-профілі розділені на hooks, views і тематичні стилі. Докладна історія документації винесена в [архів](../archive/README.md).
- **Локальна сумісність.** PostgreSQL baseline та MySQL→PostgreSQL rehearsal раніше пройшли на ізольованих копіях зі збереженням IDs/FK/NULL/sequences. Локальні й hosted записи мають відмінності, подальше перенесення очікує звірки.

- **Звірка джерел.** Admin movie editor використовує захищені деталі для прихованих фільмів. Live save/reload та UK/EN відкриття прийняті, QA очищено, початкові 50 фільмів звірені за повним hash. SQL reader винесений у тематичний модуль. Hosted міграції покривають 55/55 live версій. Favorites і Admin queries мають actor/request guards. Поле жанрів має окрему UK/EN назву й точну помилку завантаження; цільові recovery сценарії пройшли. Стилі review editor винесені в окремий модуль; UK desktop/EN phone редагування, Cancel/Save focus і delayed-error guard пройшли цільову перевірку. Admin movie edit зберігає пропущену originalLanguage, nullable castOrder та порядок доданих акторів. Цільові cast-order fixtures пройшли 6/6 окремо в release й original checkout, обидва typecheck успішні. Supabase config явно задає public schemas, grants rewind для anon/authenticated лишаються забороненими.

- **Live списки.** Owner create/order/rank/reply, очищення опису, pin/save/reload та comment create/edit/reload/delete підтверджені через production UI і SQL. Приватизація автоматично зняла pin, анонімний GET повернув 404. Тестовий список/коментар очищені, початкові system lists і редаговані поля профілю звірені. Виправлені private-card links, UK/EN navigation 2/2 та попередній Retry/focus 1/1 пройшли.

- **Live профіль.** UK save/reload та EN clear/reload підтвердили display name, owner names, bio, location, pronoun і три reply preferences. Публічна відповідь приховує names/email. Website link пройшов save/reload/public-read/clear, початковий стан відновлений. Media upload зупинений до передачі файла через відсутній дозвіл file URLs у Chrome extension.

- **Live Journal.** Create/edit, rich/plain text, media clear, publish/unpublish і UK/EN reader прийняті. Тестова стаття очищена, аудит збережений. Фокус структурних дій редактора перевірений двома UK/EN fixtures і після публікації у Chrome.

## Залишилося

| Блок | Конкретна умова завершення |
| --- | --- |
| Recovery | Відсутні backup password/passphrase, перший encrypted export і disposable restore ще відкриті. Auth, Storage, settings і secrets потребують окремого recovery handling. |
| Локальний source/data | Відновити Docker, звірити бази, завершити змістовний upstream review. Зберігати підтверджену локальну V32/V33/V36 історію під час майбутньої інтеграції Spring. |
| Live приватні дії | Медіа upload/replace/clear очікує Chrome file-URL permission. Двоакаунтні reply/reports/moderation, двоадресний email change та двоакаунтна доставка очікують контрольованого приймання. Fixtures і read-only UI перевірки вже мають датовані докази. |
| TMDB | Snapshot 20/49 без original language, один фільм без підтвердженого ID. Наступний eligible refresh за останнім записом — 16.11.2026 03:00 UTC. |
| Дизайн і продукт | Залишаються токени/типографіка, решта header/footer parity, повна parity окремих layout/states, детальні job/written credits та відкриті пункти матриці вимог. |
| Free plan | Вбудована leaked-password protection недоступна. Межі capacity та recovery мають увійти до release review. |

Поточні результати підтверджують конкретні перевірені шляхи. Повне приймання всього проєкту залишається відкритим.
