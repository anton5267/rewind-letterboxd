# REWIND — поточний прогрес

Оновлено 14.11.2026. Робочий порядок — у [PLAN](../../PLAN.md), вимоги — у [PROJECT_REQUIREMENTS](PROJECT_REQUIREMENTS.md), перевірки — у [RELEASE_EVIDENCE](../operations/RELEASE_EVIDENCE.md).

## Опубліковано

- **Сайт і API.** GitHub Pages обслуговує повний UK/EN React frontend. Останній звірений hosted runtime — Edge v59 ACTIVE. [CI](https://github.com/anton5267/rewind-letterboxd/actions/workflows/ci.yml), [Pages](https://github.com/anton5267/rewind-letterboxd/actions/workflows/deploy-pages.yml).
- **Акаунти.** Hosted signup confirmation, recovery/reset і sign-in пройшли на disposable identities. Профілі пов’язані з Auth UUID. Опубліковані email-change UI/callback, owner-only names, location/pronoun, загальні й індивідуальні reply preferences.
- **Функції.** Каталог, ratings/reviews, private/public lists, list comments, follow/block, activity, messages/notifications, Journal і supported Admin controls доступні в hosted-стеку. Додані profile avatar/banner, pin і ranked/unranked lists, Journal media та Community public details.
- **Останні UI зміни.** Messages/notifications оновлюються у видимій вкладці з guards від запізнілих відповідей. Person має десятиліття, окремі ACTOR/DIRECTOR/PRODUCER фільмографії та UK/EN біографії з позначеним English fallback і More/Less.
- **Структура.** README англійською з трьома схемами. Edge розділений на contracts, HTTP, repositories і runtime. Власний/публічний React-профілі розділені на hooks, views і тематичні стилі. Докладна історія документації винесена в [архів](../archive/README.md).
- **Локальна сумісність.** PostgreSQL baseline та MySQL→PostgreSQL rehearsal раніше пройшли на ізольованих копіях зі збереженням IDs/FK/NULL/sequences. Локальні й hosted записи мають відмінності, подальше перенесення очікує звірки.

- **Звірка джерел.** Відновлені чотири раніше застосовані SQL-міграції, версії/назви збігаються з live history 55/55. Запізніле видалення favorites із попереднього акаунта ізольоване, після видалення останнього елемента відновлюється фокус. UK/EN fixtures 6/6 і typecheck пройшли. Admin credits search отримав query/role guards та очищення помилки після редагування; жанри використовують чинну UK/EN локалізацію. Чотири нові й два попередні browser flows пройшли. Сумісність Admin movie edit з відсутнім originalLanguage відновлена, omission/value/clear/null fixtures 6/6 і попередній credits save пройшли.

- **Live списки.** Owner create/order/rank/reply, очищення опису, pin/save/reload та comment create/edit/reload/delete підтверджені через production UI і SQL. Приватизація автоматично зняла pin, анонімний GET повернув 404. Тестовий список/коментар очищені, початкові system lists і редаговані поля профілю звірені. Виправлені private-card links, UK/EN navigation 2/2 та попередній Retry/focus 1/1 пройшли.

- **Live профіль.** UK save/reload та EN clear/reload підтвердили display name, owner names, bio, location, pronoun і три reply preferences. Публічна відповідь приховує names/email. Website link пройшов save/reload/public-read/clear, початковий стан відновлений. Media upload зупинений до передачі файла через відсутній дозвіл file URLs у Chrome extension.

## Залишилося

| Блок | Конкретна умова завершення |
| --- | --- |
| Recovery | Відсутні backup password/passphrase, перший encrypted export і disposable restore ще відкриті. Auth, Storage, settings і secrets потребують окремого recovery handling. |
| Локальний source/data | Відновити Docker, звірити бази, завершити змістовний upstream review. Зберігати підтверджену локальну V32/V33/V36 історію під час майбутньої інтеграції Spring. |
| Live приватні дії | Медіа upload/replace/clear очікує Chrome file-URL permission. Двоакаунтні reply/reports/moderation, двоадресний email change, двоакаунтна доставка й editorial save очікують контрольованого приймання. Fixtures і read-only UI перевірки вже мають датовані докази. |
| TMDB | Snapshot 20/49 без original language, один фільм без підтвердженого ID. Наступний eligible refresh за останнім записом — 16.11.2026 03:00 UTC. |
| Дизайн і продукт | Залишаються токени/типографіка, header/footer, повна parity окремих layout/states, детальні job/written credits та відкриті пункти матриці вимог. |
| Free plan | Вбудована leaked-password protection недоступна. Межі capacity та recovery мають увійти до release review. |

Поточні результати підтверджують конкретні перевірені шляхи. Повне приймання всього проєкту залишається відкритим.
