# Rewind: перевірка основного API сценарію

> **Оновлення 17.10.2026.** Нижче збережений початковий аудит. Транзакційні помилки виправлено; на чистій MySQL 8.4 пройшов `scripts/verify-api.ps1`: усі чотири видалення повернули 204, повторний огляд — 409, видалення огляду зберегло рейтинг, а публічний профіль не розкрив email. `CoreFilmFlowIntegrationTests` також пройшов із MySQL. Деталі виконання — у `RUN_LOCAL.md`.

16.10.2026 перевірено живий Spring Boot API (`localhost:8080`) з MySQL 8.4. Використано випадковий тимчасовий акаунт у домені `example.invalid`, фільм `id=50` і його власний тестовий список. Після перевірок акаунт видалено за точним `id` та email; середню оцінку фільму перераховано. Контрольний SQL запит показав `users=0`, `reviews=0`, `ratings=0`, `list_items=0`, `movies[50].rating=NULL`.

## Результати HTTP сценарію

| Крок | Фактичний статус | Висновок |
| --- | --- | --- |
| `POST /api/auth/register` | 200 | Створення акаунта працює |
| `POST /api/auth/login` | 200 | JWT видається |
| `GET /api/profile/me` | 200 | JWT приймається, профіль читається |
| `GET /api/lists/my` | 200 | Після реєстрації є три системні списки |
| `POST /api/lists` | 200 | CUSTOM список створюється |
| `POST /api/lists/{id}/items` | 200 | Фільм додається до списку |
| `GET /api/lists/{id}/items` | 200 | Повертається один доданий елемент |
| `PUT /api/movies/50/rating` | 200 | Оцінка зберігається |
| `GET /api/movies/50/rating/me` | 200 | Повернулася оцінка 4 |
| `POST /api/movies/50/reviews` | 200 | Відгук створюється |
| `GET /api/movies/50/reviews` з JWT | 200 | Відгук з'явився в списку |
| `DELETE /api/lists/{id}/items/50` | **500** | Видалення з CUSTOM списку зламане |
| `DELETE /api/movies/50/watchlist` | **500** | Видалення із системного списку зламане |
| `DELETE /api/movies/50/rating` | **500** | Видалення власної оцінки зламане |
| `DELETE /api/reviews/{id}` | **500** | Видалення відгуку зламане; після нього `GET rating/me` усе ще повертав 200 |

Ці чотири статуси 500 відтворено в окремому короткому повторному сценарії. HTTP error body не містив причини винятку, тому наведений нижче діагноз є висновком із коду та поведінки, а не прочитаним stack trace.

## Ймовірна спільна причина

`ListItemRepository.deleteByListIdAndMovieId` та `RatingRepository.deleteByUserIdAndMovieId` — оголошені derived delete methods. Їх викликають `MovieListService.removeItem`, `SystemListItemService.remove` і `RatingService.deleteMyRating` без сервісної `@Transactional`. `ReviewService.deleteMy` викликає `RatingService.deleteMyRating` після видалення review. [Документація Spring Data JPA](https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html) пояснює, що оголошені query methods не отримують транзакцію автоматично; [derived delete](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html) спочатку знаходить сутності, а потім видаляє їх по одній. Це узгоджується з усіма чотирма помилками 500.

Наступний ремонт має задати транзакційні межі на сервісних методах видалення, а `ReviewService.deleteMy` зробити однією транзакцією разом із видаленням rating і перерахунком середнього. Після цього потрібен повторний HTTP сценарій із перевіркою рядків БД, бо попередня відповідь 500 могла залишити частково змінений стан. У цьому аудиті код видалення **не змінено**.
