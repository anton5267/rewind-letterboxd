import { useLocation } from "react-router-dom";
export type Language = "uk" | "en";

const genreTranslations: Record<Language, Record<string, string>> = {
  uk: {
    action: "Бойовик", adventure: "Пригоди", animation: "Анімація", comedy: "Комедія", crime: "Кримінал",
    documentary: "Документальний", drama: "Драма", family: "Сімейний", fantasy: "Фентезі", history: "Історичний",
    horror: "Жахи", music: "Музика", mystery: "Містика", romance: "Романтика", "science fiction": "Наукова фантастика",
    "tv movie": "Телефільм", thriller: "Трилер", war: "Військовий", western: "Вестерн",
  },
  en: {
    action: "Action", adventure: "Adventure", animation: "Animation", comedy: "Comedy", crime: "Crime",
    documentary: "Documentary", drama: "Drama", family: "Family", fantasy: "Fantasy", history: "History",
    horror: "Horror", music: "Music", mystery: "Mystery", romance: "Romance", "science fiction": "Science Fiction",
    "tv movie": "TV Movie", thriller: "Thriller", war: "War", western: "Western",
  },
};

const journalCategoryKeys: Record<string, TranslationKey> = {
  news: "journalNews", новини: "journalNews",
  awards: "journalAwards", винагороди: "journalAwards",
  community: "journalCommunity", спільнота: "journalCommunity",
  interviews: "journalInterviews", "інтерв'ю": "journalInterviews",
  platform: "journalPlatform", платформа: "journalPlatform",
  podcasts: "journalPodcasts", подкасти: "journalPodcasts",
  newsletter: "journalNewsletter", бюлетень: "journalNewsletter",
};

const auditTranslations: Record<Language, { actions: Record<string, string>; targets: Record<string, string> }> = {
  uk: {
    actions: {
      SITE_SETTING_UPDATED: "Налаштування сайту оновлено", COMMENT_HIDDEN: "Коментар приховано", COMMENT_UNHIDDEN: "Коментар повернуто", COMMENT_DELETED: "Коментар видалено",
      NOTIFICATIONS_MARKED_READ: "Сповіщення позначено прочитаними", NOTIFICATIONS_BULK_DELETED: "Сповіщення видалено масово", NOTIFICATION_CREATED: "Сповіщення створено", NOTIFICATION_DELETED: "Сповіщення видалено", NOTIFICATION_MARKED_READ: "Сповіщення позначено прочитаним", NOTIFICATION_MARKED_UNREAD: "Сповіщення позначено непрочитаним", CONVERSATION_DELETED: "Діалог видалено",
      LIST_PUBLISHED: "Список опубліковано", LIST_HIDDEN: "Список приховано", LIST_DELETED: "Список видалено", REVIEW_HIDDEN: "Огляд приховано", REVIEW_UNHIDDEN: "Огляд повернуто", REVIEW_DELETED: "Огляд видалено",
      JOURNAL_ARTICLE_CREATED: "Статтю журналу створено", JOURNAL_ARTICLE_UPDATED: "Статтю журналу оновлено", JOURNAL_NEWSLETTER_QUEUED: "Бюлетень поставлено в чергу", USER_UPDATED: "Користувача оновлено", USER_DEACTIVATED: "Користувача деактивовано", USER_ACTIVATED: "Користувача активовано", HQ_GRANTED: "HQ надано", HQ_REVOKED: "HQ відкликано",
    },
    targets: { USER: "Користувач", REVIEW: "Огляд", COMMENT: "Коментар", LIST: "Список", NOTIFICATION: "Сповіщення", CONVERSATION: "Діалог", JOURNAL_ARTICLE: "Стаття журналу", SITE_SETTING: "Налаштування сайту" },
  },
  en: {
    actions: {
      SITE_SETTING_UPDATED: "Site settings updated", COMMENT_HIDDEN: "Comment hidden", COMMENT_UNHIDDEN: "Comment restored", COMMENT_DELETED: "Comment deleted",
      NOTIFICATIONS_MARKED_READ: "Notifications marked as read", NOTIFICATIONS_BULK_DELETED: "Notifications deleted in bulk", NOTIFICATION_CREATED: "Notification created", NOTIFICATION_DELETED: "Notification deleted", NOTIFICATION_MARKED_READ: "Notification marked as read", NOTIFICATION_MARKED_UNREAD: "Notification marked as unread", CONVERSATION_DELETED: "Conversation deleted",
      LIST_PUBLISHED: "List published", LIST_HIDDEN: "List hidden", LIST_DELETED: "List deleted", REVIEW_HIDDEN: "Review hidden", REVIEW_UNHIDDEN: "Review restored", REVIEW_DELETED: "Review deleted",
      JOURNAL_ARTICLE_CREATED: "Journal article created", JOURNAL_ARTICLE_UPDATED: "Journal article updated", JOURNAL_NEWSLETTER_QUEUED: "Newsletter queued", USER_UPDATED: "User updated", USER_DEACTIVATED: "User deactivated", USER_ACTIVATED: "User activated", HQ_GRANTED: "HQ granted", HQ_REVOKED: "HQ revoked",
    },
    targets: { USER: "User", REVIEW: "Review", COMMENT: "Comment", LIST: "List", NOTIFICATION: "Notification", CONVERSATION: "Conversation", JOURNAL_ARTICLE: "Journal article", SITE_SETTING: "Site setting" },
  },
};

const adminUserMessages = {
  uk: {
    adminUserList: "Список користувачів",
    adminUserNameColumn: "Ім’я", adminUserRoleColumn: "Роль", adminUserActionsColumn: "Дії",
    adminUserRoleOption: "Користувач", adminAdministratorRoleOption: "Адміністратор",
    adminUserProfile: "Профіль користувача", adminUserProfileSaved: "Профіль користувача збережено.", adminUserProfileSaveError: "Не вдалося зберегти ім’я або посилання на аватар.", adminUserProfileInvalidName: "Відображуване ім’я має містити щонайменше 2 символи або бути порожнім.", viewUserProfile: "Переглянути профіль", close: "Закрити", loadAdminUserError: "Не вдалося завантажити профіль користувача.", loadAdminUserOverviewError: "Не вдалося завантажити зведення користувача.", userId: "ID", userCreatedAt: "Дата реєстрації", userStatus: "Статус", userHqStatus: "Статус HQ", hqMember: "HQ-учасник", notHqMember: "Без HQ", viewPublicProfile: "Публічний профіль", openConversation: "Написати повідомлення", adminUserStats: "Активність користувача", adminWatchedMovies: "Переглянуто фільмів", adminUserReviewsCount: "Оглядів", adminUserLikesComments: "Вподобання / коментарі", adminUserFollowers: "Підписники", adminUserListsCount: "Створених списків", adminActionHistory: "Історія дій адміністратора", noAdminHistory: "Дій над користувачем поки немає.",
  },
  en: {
    adminUserList: "User List",
    adminUserNameColumn: "Name", adminUserRoleColumn: "Role", adminUserActionsColumn: "Actions",
    adminUserRoleOption: "User", adminAdministratorRoleOption: "Admin",
    adminUserProfile: "User profile", adminUserProfileSaved: "User profile saved.", adminUserProfileSaveError: "Could not save the display name or avatar URL.", adminUserProfileInvalidName: "Display name must contain at least 2 characters or be empty.", viewUserProfile: "View profile", close: "Close", loadAdminUserError: "Could not load this user profile.", loadAdminUserOverviewError: "Could not load this user's activity summary.", userId: "ID", userCreatedAt: "Registered", userStatus: "Status", userHqStatus: "HQ status", hqMember: "HQ member", notHqMember: "No HQ role", viewPublicProfile: "Public profile", openConversation: "Send message", adminUserStats: "User Activity", adminWatchedMovies: "Films watched", adminUserReviewsCount: "Reviews", adminUserLikesComments: "Likes / comments", adminUserFollowers: "Followers", adminUserListsCount: "User-created lists", adminActionHistory: "Administrator action history", noAdminHistory: "No administrator actions for this user yet.",
  },
} as const;

const messages = {
  uk: {
    ...adminUserMessages.uk,
    editListEntries: "Редагувати фільми…", editList: "Редагувати список",
    rankedList: "Ранжований список", rankedListHint: "Показувати позицію кожного фільму.",
    termsTitle: "Умови користування", termsBody: "Користування Rewind та відповідальність учасників.",
    conditionsTitle: "Умови роботи", conditionsBody: "Доступність функцій і матеріалів Rewind.",
    safetyNoticeTitle: "Безпека спільноти", safetyNoticeBody: "Захист акаунта й безпечна взаємодія.",
    hqAccountsTitle: "Акаунти HQ", hqAccountsBody: "Позначка HQ та наявні можливості профілю.",
    authEntryGreeting: "Привіт!",
    authEntryIntro: "Тут можна досліджувати каталог фільмів, знаходити нові улюблені стрічки та зберігати історію своїх переглядів.",
    authFieldRequired: "Заповніть це поле.",
    authEmailInvalid: "Введіть коректну електронну адресу.",
    authFieldMinLength: "Введіть щонайменше {min} символів.",
    authFieldInvalid: "Перевірте значення цього поля.",
    createListTitle: "Створення списку",
    listNoFilmsTitle: "Фільмів поки немає",
    listNoFilmsHint: "Додайте перший фільм до цього списку.",
    listKeepOneFilm: "У власному списку має залишатися щонайменше один фільм.",
    listEntries: "фільмів",
    listDraftAddError: "Список збережено, але деякі фільми не додано. Повторіть збереження, щоб завершити.",
    listCreated: "Список створено.",
    clearSearch: "Очистити пошук",
    adminWorkspace: "Робочий простір",
    adminPlatformMetrics: "Статистика платформи",
    adminPersonalMetrics: "Особисті показники",
    adminReviewDeletedSuccess: "Рецензію успішно видалено.",
    adminReviewHiddenSuccess: "Рецензію успішно приховано.",
    adminReviewReportDismissedSuccess: "Скаргу відхилено. Її запис збережено в журналі модерації.",
    adminReviewReportDismissError: "Не вдалося відхилити скаргу.",
    dismissReport: "Відхилити скаргу",
    adminReturnToReviews: "Повернутися до рецензій",
    adminCreatedLists: "Створені списки",
    adminAverageRating: "Середня оцінка фільмів",
    adminReviewsWritten: "Написані рецензії",
    adminLikesReceived: "Вподобання рецензій",
    adminEngagementGrowth: "Зростання активності",
    adminAverageSession: "Середній час сеансу",
    adminWatchlistMovies: "Фільми до перегляду",
    adminMetricUnavailable: "Недоступно",
    adminAllTimeMetrics: "Ваші поточні показники за весь час",
    adminNoRatings: "Ви ще не оцінювали фільми.",
    adminRatingSnapshot: "За вашими поточними оцінками, без часової історії.",
    adminHistoryUnavailable: "Джерело даних для цього показника відсутнє.",
    personShowAllFilms: "Усі фільми",
    personShowFewerFilms: "Менше фільмів",
    faqTitle: "Поширені запитання", serviceFaqLabel: "Часті запитання", serviceFilmDataLabel: "Дані фільмів", serviceImportantDataLabel: "Важливі дані", serviceNavigation: "Навігація сервісу",
    faqBody: "Відповіді на запитання про Rewind, його спільноту та можливості сервісу.",
    interactionBlocked: "Взаємодію заблоковано",
    passwordByteLimitHint: "Щонайменше 8 символів і до 72 байтів UTF-8. Українські літери та emoji можуть займати кілька байтів.",
    passwordByteLimitError: "Пароль перевищує 72 байти UTF-8. Скоротіть його.",
    podcastAudioLoadError: "Не вдалося завантажити аудіо подкасту.",
    articleLanguageUk: "Українська", articleLanguageEn: "Англійська", tmdbIdsHint: "Напр.: 550, 603",
    noAdminArticles: "Статей не знайдено.", adminArticlesPagination: "Сторінки статей", articleLanguage: "Мова статті",
    articleCoverUrl: "URL обкладинки", editArticle: "Редагувати статтю", articleDraft: "Чернетка", articlePublished: "Опубліковано", adminArticleSaveError: "Не вдалося зберегти статтю.",
    articleCurrentCategory: "Поточна категорія",
    noAdminNotifications: "Сповіщень не знайдено.", adminNotificationsPagination: "Сторінки сповіщень",
    noAdminConversations: "Діалогів не знайдено.", adminConversationsPagination: "Сторінки діалогів",
    newsletter: "Бюлетень", newsletterEnabled: "Отримувати нові випуски на email", newsletterSaved: "Налаштування бюлетеня збережено.", newsletterError: "Не вдалося зберегти налаштування бюлетеня.", loadNewsletterError: "Не вдалося завантажити налаштування бюлетеня.", sendNewsletter: "Поставити в чергу", newsletterQueueStatus: "Черга / надіслано / помилки",
    noAdminLists: "Списків не знайдено.", adminListsPagination: "Сторінки списків", noAdminComments: "Коментарів не знайдено.", noAdminReviews: "Оглядів не знайдено.", reportedOnly: "Лише зі скаргами", reportedReviewsOnly: "Лише зі скаргами", reportComment: "Поскаржитися на коментар", reportList: "Поскаржитися на список", contentReported: "Скаргу надіслано.", contentReportError: "Не вдалося перевірити або надіслати скаргу.", reportedOn: "Скаргу подано", reportedReason: "Причина скарги", reviewReportReason_SPAM: "Спам", reviewReportReason_INAPPROPRIATE_CONTENT: "Неприйнятний вміст", reviewReportReason_BULLYING: "Булінг", reportCommentsCount: "Коментарі", reportReview: "Поскаржитися на огляд", submitReport: "Надіслати скаргу", reviewReported: "Скаргу надіслано.", reportReviewError: "Не вдалося надіслати скаргу.", adminCommentsPagination: "Сторінки коментарів", adminReviewsPagination: "Сторінки оглядів", adminVisibilityFilter: "Видимість", allVisibilityStates: "Усі", visibleOnly: "Лише видимі", hiddenOnly: "Лише приховані",
    adminMovies: "Фільми", adminMovieDatabase: "База фільмів", adminMovieSearch: "Пошук фільму в каталозі", adminMovieEditor: "Редагування фільму", addMovie: "Додати фільм", noAdminMovies: "Фільмів не знайдено.", adminMovieResults: "Фільми каталогу", adminMovieMetadata: "Дані фільму", adminMovieVisibleReviews: "Видимі огляди", moviePublished: "Опубліковано", movieUnpublished: "Не опубліковано", changeMoviePublication: "Змінити статус", adminMoviePublicationError: "Не вдалося змінити статус публікації фільму.", adminMoviesPagination: "Сторінки фільмів в адмінці", movieTitle: "Назва фільму", movieDurationMinutes: "Тривалість (хв)", imdbId: "IMDb ID", ageRating: "Вікова категорія", backdropUrl: "URL фонового зображення", trailerUrl: "URL трейлера", releaseDate: "Дата виходу", rating: "Рейтинг", posterUrl: "URL постера", editMovie: "Редагувати", deleteMovie: "Видалити", deleteMovieConfirm: "Ви справді хочете видалити цей фільм?", tmdbId: "TMDB ID", tmdbIds: "TMDB ID", searchTmdb: "Знайти в TMDB", findTmdbCandidates: "Підібрати TMDB", tmdbCandidates: "Можливі збіги TMDB", tmdbCandidateSearchHint: "Спочатку шукаємо за IMDb ID; якщо збігу немає — за назвою й роком. Перед синхронізацією звірте назву та дату.", tmdbCandidatesEmpty: "Кандидатів не знайдено.", tmdbCandidatesError: "Не вдалося знайти кандидатів TMDB.", tmdbIntegrationUnavailable: "Інтеграцію TMDB не налаштовано. Додайте TMDB_API_KEY у секрети Edge Function.", selectTmdbCandidate: "Вибрати кандидата TMDB", tmdbCandidateSyncHint: "Вибір лише підставляє ID. Натисніть «Синхронізувати TMDB», щоб застосувати його.", syncTmdb: "Синхронізувати TMDB", tmdbIdRequired: "Вкажіть коректний TMDB ID.", tmdbSyncDone: "TMDB оновлено", tmdbSyncError: "Не вдалося синхронізувати TMDB.", tmdbImportTitle: "Імпорт фільмів із TMDB", tmdbQualityTitle: "Якість каталогу TMDB", tmdbQualitySummary: "Прив'язані фільми / весь каталог", tmdbCoverage: "Покриття", tmdbCompleteness: "Повнота", tmdbMissingPoster: "Без постера", tmdbMissingBackdrop: "Без фонового зображення", tmdbMissingPlot: "Без опису", tmdbMissingRuntime: "Без тривалості", tmdbMissingTrailer: "Без трейлера", tmdbMissingRating: "Без рейтингу TMDB", tmdbMissingOriginalLanguage: "Без оригінальної мови", tmdbImport: "Імпортувати ID", tmdbImportLimit: "Вкажіть від 1 до 20 коректних TMDB ID.", tmdbImportDone: "Імпорт завершено", tmdbDiscoveryImport: "Знайти й імпортувати", tmdbDiscoveryInvalid: "Сторінка має бути 1–500, кількість — 1–20.", tmdbDiscoveryDone: "Discovery-імпорт завершено", tmdbImportError: "Не вдалося імпортувати фільми з TMDB.", tmdbBatchSyncTitle: "Пакетна синхронізація каталогу", tmdbBatchSyncHint: "Вставте до 50 пар REWIND ID і TMDB ID, по одній на рядок (формат movie_id,tmdb_id). Пари надсилаються послідовно групами до 20. Оновляться дані TMDB та персоналії; список схожих фільмів не зміниться.", tmdbBatchSyncCsv: "Відкрити CSV із 49 перевіреними парами", tmdbBatchSyncLoadCsv: "Завантажити перевірені пари", tmdbBatchSyncPreview: "Перевірка пар TMDB", tmdbBatchSyncRewindMovie: "Фільм REWIND", tmdbBatchSyncMovieMissing: "Фільм не знайдено", tmdbBatchSyncCsvLoaded: "перевірених пар завантажено. Перегляньте список перед синхронізацією.", tmdbBatchSyncCsvLoadError: "Не вдалося підготувати перегляд пар. Список не змінено.", tmdbBatchSyncPairs: "Пари ID фільмів", tmdbBatchSyncPlaceholder: "movie_id,tmdb_id\n1,1084242", tmdbBatchSyncButton: "Синхронізувати пари", tmdbBatchSyncConfirm: "Підтвердіть синхронізацію каталожних записів", tmdbBatchSyncInvalid: "Вкажіть 1–50 пар з унікальними додатними REWIND і TMDB ID.", tmdbBatchSyncDone: "Пакетну синхронізацію завершено", tmdbBatchSyncPartial: "Один пакет не повернув відповідь. Перевірте дані фільмів перед повторною синхронізацією невизначених пар.", tmdbBatchSyncUnconfirmed: "Результат цих пар невідомий; спершу звірте їх у каталозі:", genres: "жанрів",
    adminLists: "Списки", adminAllLists: "Усі списки", featureList: "Додати до вибраних", unfeatureList: "Прибрати з вибраних", featuredPositionLabel: "Позиція у вибраних:", adminListFeaturedError: "Не вдалося змінити добірку списків.", adminListFeaturedBoundary: "Список уже на цьому краї добірки.", moveFeaturedUp: "Перемістити вище", moveFeaturedDown: "Перемістити нижче", adminListCreatedDate: "Створено", items: "фільмів", hiddenList: "прихований", hideList: "Приховати", publishList: "Опублікувати", deleteList: "Видалити список", deleteListConfirm: "Видалити цей кастомний список?", adminConversations: "Діалоги", adminNotifications: "Сповіщення", conversationUsers: "Користувачі", deleteConversation: "Видалити діалог", deleteNotification: "Видалити сповіщення", deleteConversationConfirm: "Видалити цей діалог і всі повідомлення?", deleteNotificationConfirm: "Видалити це сповіщення?", createNotification: "Створити сповіщення", notificationType: "Тип сповіщення", notificationFollowType: "Нова підписка", notificationReviewLikedType: "Вподобання огляду", unknownNotificationType: "Невідомий тип", notificationRecipientId: "ID отримувача", notificationActorId: "ID ініціатора", notificationReviewId: "ID огляду", notificationTypeFilter: "Фільтр типу", notificationReadFilter: "Фільтр стану", notificationRecipientFilter: "ID отримувача для фільтра", allNotificationTypes: "Усі типи", allNotificationStates: "Усі стани", filterNotifications: "Фільтрувати", markFilteredNotificationsRead: "Позначити відфільтровані прочитаними", deleteFilteredNotifications: "Видалити відфільтровані", deleteFilteredNotificationsConfirm: "Видалити всі сповіщення за поточним фільтром?", markNotificationRead: "Позначити прочитаним", markNotificationUnread: "Позначити непрочитаним", messagesCount: "повідомлень", notificationRecipient: "отримувач", notificationActor: "ініціатор", read: "прочитано", unread: "не прочитано", userSearch: "Пошук користувача", noAdminUsers: "Користувачів не знайдено.", adminUsersPagination: "Сторінки користувачів", activeUser: "активний", blockedUser: "заблокований", blockUser: "Заблокувати", activateUser: "Активувати",
    journal: "Журнал", journalRead: "Читати", journalCategory: "Розділ", allJournalCategories: "Усі розділи", journalNews: "Новини", journalAwards: "Винагороди", journalCommunity: "Спільнота", journalInterviews: "Інтерв'ю", journalPlatform: "Платформа", journalPodcasts: "Подкасти", journalNewsletter: "Бюлетень", journalArchive: "Архів", noJournalArchive: "Архів поки порожній.", clearArchive: "Показати всі місяці", journalLoadError: "Не вдалося завантажити журнал.", noJournalArticles: "Опублікованих статей поки немає.", journalEditor: "Редактор журналу", articleSlug: "Slug статті", articleTitle: "Заголовок", articleCategory: "Категорія", articleExcerpt: "Короткий опис", articleContent: "Текст статті", audioUrl: "URL аудіо подкасту", podcastAudio: "Аудіо подкасту", podcastAudioUnavailable: "Ваш браузер не підтримує аудіо.", publishArticle: "Опублікувати", adminReviews: "Огляди", adminReviewsTitle: "Усі огляди", hiddenReview: "прихований", visibleReview: "видимий", hideReview: "Приховати", unhideReview: "Повернути", adminReviewDeleteConfirm: "Видалити цей огляд назавжди?", adminReviewDeleteError: "Не вдалося видалити огляд.", adminReviewContent: "Текст огляду", adminEditReview: "Редагувати текст", adminReviewEditError: "Не вдалося зберегти зміни до огляду.", help: "Допомога", contact: "Контакти", rules: "Правила", privacy: "Приватність", filmData: "Дані фільмів", importantData: "Важливі дані", deleteAccount: "Видалення акаунта", helpTitle: "Допомога", helpBody: "Якщо виникла проблема, перевірте вхід, cookies і з'єднання з API. Для повідомлення про помилку підготуйте URL і час події.", contactTitle: "Контакти", contactBody: "Напишіть команді Rewind через контактний канал вашого навчального проєкту. Не надсилайте пароль або refresh token.", rulesTitle: "Правила користування", rulesBody: "Поважайте інших учасників, не публікуйте незаконний або шкідливий контент і не обходьте обмеження доступу. Порушення можуть бути приховані модераторами.", privacyTitle: "Політика приватності", privacyBody: "Публічні профілі не містять email і службових полів. Дані сесії зберігаються в HttpOnly cookies, а пароль — лише як хеш.", filmDataTitle: "Дані фільмів", filmDataBody: "Каталог і зображення фільмів надходять із дозволених зовнішніх джерел. Зовнішній рейтинг показується лише коли він фактично збережений.", importantDataTitle: "Важливі дані", importantDataBody: "Джерела й оновлення даних фільмів.", deleteAccountTitle: "Видалення акаунта", deleteAccountBody: "Увійдіть у профіль і скористайтеся формою видалення акаунта. Потрібен поточний пароль; усі списки, оцінки, огляди та сесії буде видалено.",
    home: "Головна", films: "Фільми", login: "Увійти", logout: "Вийти", logoutError: "Не вдалося вийти. Спробуйте ще раз.", register: "Реєстрація", menu: "Меню", closeMenu: "Закрити меню", moreNavigation: "Додаткова навігація", deleteAccountConfirm: "Видалити акаунт і всі пов'язані дані? Цю дію не можна скасувати.", deleteAccountWarning: "Видалення акаунта назавжди прибере ваші списки, оцінки, огляди та сесію.", deleteAccountError: "Не вдалося видалити акаунт. Перевірте пароль.",
    lists: "Мої списки", profile: "Профіль", users: "Користувачі", browseFilms: "Переглянути фільми", globalSearch: "Глобальний пошук", globalSearchIntro: "Знайдіть фільми, людей, списки, теги та матеріали журналу.", globalSearchPlaceholder: "Пошук у Rewind", globalSearchResults: "Категорії результатів", searchShortcuts: "Швидкі переходи пошуку", popularFilms: "Популярні фільми", openFilmDetails: "Відкрити сторінку фільму", searchMembers: "Учасники", searchLists: "Списки", searchTags: "Теги", searchPeople: "Актори й команда", searchReviews: "Огляди", searchJournal: "Журнал", loadingSearch: "Пошук у Rewind...", searchError: "Не вдалося виконати пошук.", noGlobalResults: "За вашим запитом нічого не знайдено", noGlobalResultsHint: "Перевірте написання або спробуйте інший запит", discoverListsIntro: "Колекції фільмів, до яких хочеться повертатися.",
    searchFilms: "Пошук фільмів", searchFilmPlaceholder: "Назва фільму", addFilm: "Додати фільм", search: "Пошук", searchIntro: "Знайдіть наступний фільм для свого списку.", loadingFilms: "Завантаження фільмів...",
    genre: "Жанр", allGenres: "Усі жанри", year: "Рік", minRating: "Рейтинг від", anyRating: "Будь-який", filters: "Фільтри",
    sortBy: "Сортувати", sortNewest: "Новіші", sortOldest: "Старіші", sortBestRated: "Найвища оцінка", sortLowestRated: "Найнижча оцінка", sortTitle: "За назвою", sortPopularReviews: "Популярністю",
    applyFilters: "Застосувати", loadGenresError: "Не вдалося завантажити жанри.", retry: "Спробувати ще", resultsCount: "Знайдено фільмів",
    pagination: "Сторінки фільмів", profileCollectionPagination: "Сторінки колекції профілю", publicProfileListsPagination: "Сторінки публічних списків профілю", publicListsPagination: "Сторінки публічних списків", journalPagination: "Сторінки журналу", previous: "Назад", next: "Далі", page: "Сторінка", of: "з", limit: "Кількість",
      homeEyebrow: "Rewind — ваш кіножурнал", homeTitle: "Позначайте переглянуті фільми. Зберігайте ті, що хочете подивитися. Діліться враженнями з друзями.", homeSubtitle: "Відкривайте стрічки, діліться оцінками та збирайте власні списки.", joinRewind: "Створити акаунт", getStarted: "Почати", homeGuestReleases: "Rewind допомагає вам…", homeGuestExplainerHeading: "Rewind допомагає вам…", homeGuestExplainerTitle: "Зберігайте історію кожного переглянутого фільму", homeGuestExplainerText: "або почніть вести її з дня, коли приєднаєтеся.", homeGuestFeatureTrack: "Зберігайте історію всіх переглянутих фільмів або почніть із дня реєстрації.", homeGuestFeatureLike: "Вподобайте улюблені фільми, списки й огляди.", homeGuestFeatureShare: "Пишіть огляди та стежте за друзями й іншими учасниками.", homeGuestFeatureRate: "Оцінюйте кожен фільм за п’ятизірковою шкалою, з половинками.", homeGuestFeatureDiary: "Ведіть щоденник переглядів і отримуйте персональну статистику.", homeGuestFeatureLists: "Створюйте списки фільмів на будь-яку тему та watchlist.", homeJustReviewed: "Щойно переглянули…", homeGuestPitchLead: "Пишіть і діліться оглядами. Створюйте власні списки. Розповідайте про кіно у своєму житті.", homeGuestPitchPrompt: "Нижче — популярні огляди й списки цього тижня. Зареєструйтеся, щоб створити власні.", homeRecentNews: "Останні новини", homeMore: "Більше",
      homeWelcomeTitle: "З поверненням. Ось що ми дивимося…", homeWelcomeSubtitle: "Новинки, популярні фільми та активність учасників, на яких ви підписані.", homeFollowingActivity: "Активність тих, на кого ви підписані", noFollowingActivity: "Поки немає активності від учасників, на яких ви підписані.", homeNewOnRewind: "Нове у Rewind", homeYourActivity: "Ваша активність", homePopularOnRewind: "Популярне у Rewind", homeLatestNews: "Останні новини", homePopularReviewsThisWeek: "Популярні огляди цього тижня", homePopularLists: "Популярні списки",
    loadingHome: "Завантаження головної сторінки...", loadHomeError: "Не вдалося завантажити головну сторінку.", popularThisWeek: "Популярне", newReleases: "Нові релізи", viewAll: "Переглянути всі", readMore: "Читати далі",
    filmsDiscoverTitle: "Відкривайте кіно", filmsDiscoverIntro: "Популярні фільми та свіжі огляди спільноти Rewind.",
    allSearchResults: "Усі", showingSearchMatches: "Результати для", showSearchResultsFor: "Показати результати", showMoreResults: "Показати більше результатів", backToHome: "На головну", notFoundTitle: "Ой! Сторінку не знайдено", notFoundMessage: "Схоже, цей фрагмент вирізали з фінального монтажу. Сторінка зникла, але ви завжди можете повернутися до Rewind.",
    listsLandingIntro: "Збирайте фільми, створюйте добірки й діліться ними.", startOwnLists: "Створіть власний список",
    listInformation: "Інформація про список",
    popularReviewers: "Популярні рецензенти", popularReviewersIntro: "Переглядайте профілі найпопулярніших і найшанованіших рецензентів.", sortByPopularity: "За популярністю", reviewerMetrics: "Статистика рецензента", name: "Ім’я", noPopularReviewers: "Рецензентів з вподобаннями поки немає.", socialLinks: "Соціальні посилання", noSocialLinks: "Соціальні посилання не додані.", socialLinksSaved: "Соціальні посилання збережено.", loadSocialLinksError: "Не вдалося завантажити соціальні посилання.", socialLinksSaveError: "Не вдалося зберегти соціальні посилання.", community: "Спільнота", communitySubtitle: "Знайомтеся з активними рецензентами, HQ-учасниками та користувачами Rewind.", loadCommunityError: "Не вдалося завантажити спільноту.", featuredMembers: "Рекомендовані учасники", noFeaturedMembers: "Рекомендованих учасників поки немає.", allUsers: "Усі користувачі", noUsers: "Користувачів поки немає.", communityUsersPagination: "Сторінки користувачів спільноти", searchUsers: "Пошук користувачів", recentWatched: "Щойно переглянуто", noRecentWatched: "Щойно переглянутих фільмів поки немає.", activityWatched: "переглянув(-ла)",
    socialWebsite: "Вебсайт", socialInstagram: "Instagram", socialTiktok: "TikTok", socialLetterboxd: "Letterboxd",
    latestJournal: "Останнє з журналу", noLatestJournal: "Новин журналу поки немає.", homePopularReviews: "Популярні огляди", popularLists: "Публічні списки", noRecentReviews: "Оглядів поки немає.", noPublicLists: "Публічних списків поки немає.", byUser: "від",
    loadFilmsError: "Не вдалося завантажити фільми. Перевірте API.", noFilms: "Фільмів не знайдено.",
    unknownYear: "Рік невідомий", about: "Про нас", credits: "Джерела",
    loading: "Завантаження...", appErrorTitle: "Сталася помилка", appErrorMessage: "Перезавантажте сторінку та спробуйте ще раз.", reload: "Перезавантажити", save: "Зберегти", create: "Створити", add: "Додати", remove: "Прибрати",
    loadMovieError: "Не вдалося завантажити фільм.", saved: "Збережено.", linkCopied: "Посилання скопійовано.", watched: "Переглянуто", wantsToSee: "До перегляду", likedCollection: "Улюблене",
    watchlist: "До перегляду", favorite: "Улюблене", myActions: "Мої дії", myRating: "Ваша оцінка",
    none: "немає", addToList: "Додати в список", addToLists: "Додати до списків", chooseList: "Оберіть список",
    actors: "Актори", directors: "Режисери", producers: "Продюсери", castAndCrew: "Актори та знімальна група", adminMoviePeopleSearch: "Знайти персоналію", adminMoviePeopleResults: "Результати пошуку", adminMovieSelectedPeople: "Додані до фільму", characterName: "Ім’я персонажа", castOrder: "Порядок у списку акторів", originalLanguage: "Оригінальна мова (код ISO, наприклад en)", selected: "Додано", peopleSearchError: "Не вдалося знайти персоналії.", similarFilms: "Схожі фільми", reviews: "Огляди", storyline: "Сюжет", favoriteFilms: "Улюблені фільми",
    noReviews: "Оглядів поки немає.", yourReview: "Ваш огляд", publishReview: "Опублікувати огляд",
    editReview: "Редагувати", deleteReview: "Видалити огляд", saveReview: "Зберегти огляд", cancel: "Скасувати",
    reviewUpdated: "Огляд оновлено.", reviewDeleted: "Огляд видалено.", deleteReviewConfirm: "Видалити ваш огляд? Оцінка залишиться.",
    loadMyReviewError: "Не вдалося завантажити ваш огляд.", updateReviewError: "Не вдалося оновити огляд.", deleteReviewError: "Не вдалося видалити огляд.",
    deleteRating: "Видалити оцінку", ratingDeleted: "Оцінку видалено.", deleteRatingError: "Не вдалося видалити оцінку.",
    signInToReview: "щоб оцінити чи написати огляд.", trailer: "Трейлер", watchTrailer: "Переглянути трейлер", trailerUnavailable: "Трейлер ще не додано.", noSimilarFilms: "Схожі фільми поки не знайдені.", movieCrewUnavailable: "Інформація про акторів і режисерів поки відсутня.", movieStorylineUnavailable: "Опис сюжету поки недоступний.",
    myProfile: "Мій профіль", displayName: "Відображуване ім'я", changePassword: "Змінити пароль",
    settings: "Налаштування", whoCanView: "Хто може переглянути", accountSettings: "Налаштування акаунта", accountSettingsIntro: "Керуйте даними профілю, вподобаннями та налаштуваннями акаунта в одному місці.", authentication: "Автентифікація", backToProfile: "До профілю", confirmNewPassword: "Підтвердіть новий пароль",
    account: "Акаунт", footerTerms: "Умови", footerContacts: "Контакти", footerInformation: "Інформація про сервіс",
    currentPassword: "Поточний пароль", newPassword: "Новий пароль", saving: "Збереження…", deleting: "Видалення…", recentRatings: "Останні оцінки",
    recentReviews: "Останні огляди", likedReviews: "Вподобані огляди", noLikedReviews: "Вподобаних оглядів поки немає.", loadLikedReviewsError: "Не вдалося завантажити вподобані огляди.", likedReviewsPagination: "Сторінки вподобаних оглядів", newList: "Новий список", emptyList: "Тут поки немає фільмів. Додайте їх зі сторінки фільму.",
    welcome: "З поверненням", email: "Електронна пошта", password: "Пароль", showPassword: "Показати пароль", hidePassword: "Приховати пароль", forgotPassword: "Забули пароль?",
    loggingIn: "Вхід...", noAccount: "Немає акаунта?", createOne: "Створити",
    createAccount: "Створити акаунт", username: "Нікнейм", accountCreated: "Акаунт створено", goToLogin: "Перейти до входу", confirmEmailBeforeLogin: "Перевірте пошту й підтвердьте email перед входом.", emailConfirmedSignIn: "Email підтверджено. Тепер увійдіть.",
    alreadyAccount: "Вже маєте акаунт?", return: "Назад", forgotTitle: "Забули пароль?",
    forgotDescription: "Введіть електронну пошту, і ми надішлемо посилання для відновлення пароля.", dividerOr: "Або",
    forgotRequestError: "Не вдалося надіслати запит на відновлення пароля. Спробуйте ще раз.",
    resetPassword: "Відновити пароль", resetTitle: "Встановити новий пароль", confirmPassword: "Повторіть пароль",
    changeEmail: "Змінити email",
    emailChangeHint: "Нова адреса збережеться після підтвердження. Перевірте отримані листи.",
    emailChangeSent: "Запит на зміну надіслано. Підтвердьте адресу за посиланнями в отриманих листах.",
    emailChangeRequestError: "Не вдалося запросити зміну email. Перевірте адресу та вхід в акаунт і спробуйте ще раз.",
    emailChangeRateLimit: "Забагато запитів. Зачекайте перед повторним надсиланням.",
    emailChangeCheck: "Перевірити підтвердження",
    emailChangeWaiting: "Зміна ще очікує підтвердження. Відкрийте найсвіжіші листи й підтвердьте адресу.",
    emailChangeConfirmed: "Email підтверджено й оновлено у профілі.",
    emailChangeCheckError: "Не вдалося синхронізувати профіль. Спробуйте перевірити підтвердження ще раз.",
    emailChangeConfirmTitle: "Підтвердьте зміну email",
    emailChangeConfirmBody: "Продовжуйте, якщо ви запросили зміну адреси свого акаунта REWIND.",
    emailChangePendingTitle: "Підтвердження прийнято",
    emailChangePendingBody: "Відкрийте інший лист підтвердження, якщо він надійшов, і завершіть зміну. Після цього увійдіть в акаунт.",
    emailChangeCompleteTitle: "Email оновлено",
    emailChangeCompleteBody: "Адресу підтверджено й синхронізовано з вашим профілем REWIND.",
    emailConfirmTitle: "Підтвердьте свою пошту", emailConfirmBody: "Адресу захищено. Натисніть кнопку, щоб завершити підтвердження та відкрити свій кінощоденник.", emailConfirmAction: "Підтвердити пошту",
    emailRecoveryTitle: "Підтвердіть зміну пароля", emailRecoveryBody: "Ми отримали запит на зміну пароля. Продовжуйте лише якщо це були ви.", emailRecoveryConfirm: "Продовжити до зміни пароля",
    emailActionExpiredTitle: "Посилання недійсне або застаріле", emailActionExpiredBody: "Це одноразове посилання вже використано, воно застаріло або пошкоджене. Запросіть нове й відкрийте найсвіжіший лист.", emailActionProfileTitle: "Пошту підтверджено", emailActionProfileError: "Профіль REWIND ще не завантажився. Увійдіть трохи пізніше або спробуйте ще раз.", emailActionRequestReset: "Запросити нове посилання", emailActionRegisterAgain: "Повернутися до реєстрації",
    resetSuccess: "Пароль змінено.", resetInvalid: "Посилання недійсне або його час минув.", resetMissing: "У посиланні немає токена відновлення.",
    resetRequestError: "Не вдалося змінити пароль. Перевірте з’єднання та спробуйте ще раз.",
    supabaseLinkTitle: "Підключити Supabase Auth", supabaseLinkDescription: "Ми використаємо ваш поточний пароль, щоб створити захищений обліковий запис, і надішлемо лист для підтвердження email. Профіль, роль і дані Rewind залишаться без змін.", supabaseLinkStart: "Надіслати лист підтвердження", supabaseLinkEmailSent: "Лист надіслано. Підтвердьте email за посиланням, а потім завершіть підключення.", supabaseLinkStartError: "Не вдалося почати підключення. Перевірте пароль і спробуйте пізніше.", supabaseLinkAlreadyConnected: "Ваш обліковий запис уже підключено.", supabaseLinkCompleteTitle: "Завершити підключення акаунта", supabaseLinkCompleteHint: "Введіть поточний пароль Rewind, щоб підтвердити власність на наявний профіль.", supabaseLinkComplete: "Підключити акаунт", supabaseLinkCompleteError: "Не вдалося підтвердити підключення. Перевірте пароль або відкрийте найновіше посилання з листа.", supabaseLinkMissingToken: "Посилання для підключення недійсне або прострочене. Поверніться в налаштування акаунта й надішліть нове.", supabaseLinkSuccess: "Акаунт підключено. Профіль і всі дані Rewind збережено.",
    resetSent: "Якщо акаунт існує, лист із посиланням надіслано.",
    loginError: "Невірна пошта або пароль.", weakPasswordSignIn: "Цей пароль не відповідає оновленим вимогам безпеки. Скористайтеся відновленням пароля й задайте пароль щонайменше з 8 символів.", emailNotConfirmed: "Спочатку підтвердьте email за посиланням у листі, а потім увійдіть.", confirmationCallbackError: "Не вдалося завершити підтвердження email. Відкрийте найновіший лист-підтвердження або запросіть новий.", confirmationLinkExpired: "Це одноразове посилання вже використано або його термін дії минув. Спробуйте увійти; якщо email ще не підтверджено, запросіть новий лист.", accountLoadError: "Пароль прийнято, але профіль REWIND не завантажився. Спробуйте ще раз трохи пізніше.", registrationError: "Не вдалося зареєструватися.",
    footerMade: "Створено студентами в Києві, Україна.", filmDataFrom: "Дані фільмів з TMDB.", tmdbDisclaimer: "Цей продукт використовує TMDB API, але не схвалений і не сертифікований TMDB.",
    aboutIntro: "Rewind — щоденник фільмів і спільнота, створена студентами в Києві, Україна.",
    filmDataAndImages: "Дані та зображення фільмів", confirmMismatch: "Паролі не збігаються.",
    invalidMovieId: "Некоректний номер фільму.", invalidProfileId: "Некоректне посилання на профіль.", invalidReviewId: "Некоректне посилання на огляд.",
    loadProfileError: "Не вдалося завантажити профіль.", nameSaved: "Профіль оновлено.",
    saveNameError: "Не вдалося зберегти ім'я.", saveAvatarError: "Не вдалося оновити аватар.", passwordChanged: "Пароль змінено.",
    changePasswordError: "Перевірте поточний і новий пароль.", passwordChangedSignIn: "Пароль змінено. Увійдіть знову.", passwordChangedLogoutError: "Пароль змінено, але не вдалося вийти. Спробуйте вийти вручну.", loadListsError: "Не вдалося завантажити списки.",
    loadItemsError: "Не вдалося завантажити фільми.", createListError: "Не вдалося створити список.",
    removeItemError: "Не вдалося видалити фільм зі списку.", favoriteRemoved: "Фільм видалено з улюблених.", changeListError: "Не вдалося змінити список.",
    saveRatingError: "Не вдалося зберегти оцінку.", rateFirst: "Спочатку поставте оцінку.",
    reviewPublished: "Огляд опубліковано.", createReviewError: "Не вдалося додати огляд. На один фільм дозволено один активний огляд.",
    filmAdded: "Фільм додано до списку.", addFilmError: "Не вдалося додати фільм до списку.",
    commentsSection: "Коментарі", showComments: "Показати коментарі", hideComments: "Сховати коментарі", commentsPagination: "Сторінки коментарів", noComments: "Коментарів поки немає.", yourComment: "Ваш коментар", sendComment: "Надіслати",
    editComment: "Редагувати коментар", deleteComment: "Видалити коментар", deleteCommentConfirm: "Видалити цей коментар?", loginToComment: "Увійдіть, щоб залишити коментар.",
    loadCommentsError: "Не вдалося завантажити коментарі.", createCommentError: "Не вдалося додати коментар.", updateCommentError: "Не вдалося оновити коментар.", deleteCommentError: "Не вдалося видалити коментар.",
    listBy: "Список від", emptyPublicList: "У цьому списку поки немає фільмів.", invalidListId: "Некоректне посилання на список.", loadPublicListError: "Не вдалося завантажити публічний список.",
    description: "Опис", listSettings: "Налаштування списку", viewList: "Переглянути список", cancelListChanges: "Скасувати зміни", createListIntro: "Збирайте фільми в добірку, до якої захочеться повертатися.", publicList: "Публічний список", privateList: "Приватний список", listName: "Назва списку", listNameRequired: "Введіть назву списку.", updateListError: "Не вдалося оновити список.", reorderListError: "Не вдалося змінити порядок фільмів.", deleteListError: "Не вдалося видалити список.", listDeleted: "Список видалено.", deletingList: "Видалення…", moveUp: "Перемістити вище", moveDown: "Перемістити нижче", reorderItem: "Змінити порядок:", listReorderHelp: "Переміщуйте елемент перетягуванням або клавішами зі стрілками вгору та вниз.",
    tags: "Теги", profileListTags: "Теги списків", moreTags: "Більше", lessTags: "Менше", tagsHint: "Через кому, до 10", popularTags: "Популярні теги", noTags: "Тегів поки немає.", loadTagsError: "Не вдалося завантажити популярні теги.", discoverLists: "Добірки", listsTaggedHeading: "Усі списки за тегом", noTaggedLists: "За цим тегом списків поки немає.", listFeeds: "Добірки списків", featuredLists: "Вибрані добірки", featuredListsIntro: "Стартовий набір від спільноти Rewind та авторів платформи.", popularListsTitle: "Популярні добірки", popularListsIntro: "Переглядайте найпопулярніші добірки від спільноти Rewind.", recentlyLikedListsTitle: "Нещодавно вподобані добірки", recentlyLikedListsIntro: "Добірки, які останнім часом сподобалися спільноті.", recentListsTitle: "Нові добірки", recentListsIntro: "Свіжі добірки фільмів від авторів Rewind.", listFeedTeamSection: "Списки команди", crewListsIntro: "Публічні списки активних авторів Rewind.", listFeedRecent: "Нові", listFeedPopular: "Популярні", listFeedRecentlyLiked: "Нещодавно вподобані", listFeedTeam: "Списки команди", likeList: "Вподобати список", unlikeList: "Прибрати вподобання", listLikeError: "Не вдалося змінити вподобання списку.",
    notificationActionError: "Не вдалося змінити стан сповіщення.", loadNotificationPreferencesError: "Не вдалося завантажити налаштування сповіщень.", notificationsPagination: "Сторінки сповіщень",
    notifications: "Сповіщення", noNotifications: "Нових сповіщень немає.", loadNotificationsError: "Не вдалося завантажити сповіщення.", markRead: "Прочитано", markAllNotificationsRead: "Позначити все прочитаним", notificationFollowedYou: "підписався(-лася) на вас", notificationLikedReview: "вподобав(-ла) ваш огляд", someone: "Хтось", notificationPreferences: "Налаштування сповіщень", notifyOnFollow: "Нові підписки", notifyOnReviewLike: "Вподобання моїх оглядів", notificationPreferencesSaved: "Налаштування збережено.", notificationPreferencesError: "Не вдалося зберегти налаштування.", messages: "Повідомлення", conversations: "Діалоги", noConversations: "Діалогів поки немає.", loadConversationsError: "Не вдалося завантажити діалоги.", startConversationError: "Не вдалося відкрити діалог.", conversationsPagination: "Сторінки діалогів", chooseConversation: "Оберіть діалог.", noMessages: "У цьому діалозі ще немає повідомлень.", emptyMessageBody: "Повідомлення без тексту", loadMessagesError: "Не вдалося завантажити або надіслати повідомлення.", messagesPagination: "Сторінки повідомлень", newerMessages: "Новіші", olderMessages: "Старіші", messageText: "Текст повідомлення", sendMessage: "Написати", messagesError: "Не вдалося завантажити або надіслати повідомлення.", hq: "HQ", adminDashboard: "Панель адміністратора", adminActorId: "ID адміністратора", adminLoadError: "Не вдалося завантажити адмін-панель.", adminSelfChangeError: "Не можна деактивувати або понизити власний акаунт адміністратора.", adminLastAdminError: "Має залишатися хоча б один активний адміністратор.", adminUsers: "Користувачі", adminComments: "Коментарі", adminCommentsTitle: "Усі коментарі", hiddenComment: "прихований", visibleComment: "видимий", hideComment: "Приховати", unhideComment: "Повернути", adminCommentDeleteConfirm: "Видалити цей коментар назавжди?", adminCommentDeleteError: "Не вдалося видалити коментар.", auditLogs: "Журнал дій", adminActivityHistory: "Історія дій модератора", adminAuditDateLabel: "Дата й час дії", adminAuditActionType: "Тип дії", noAuditLogs: "Дій поки немає.", adminAuditPagination: "Сторінки журналу дій", grantHq: "Призначити HQ", revokeHq: "Зняти HQ", activeUsers: "Активні", hqUsers: "HQ-користувачі", movies: "Фільми", hiddenReviews: "Приховані огляди", moderationQueue: "Черга модерації", moderationQueueTitle: "Список контенту для модерації", moderatorLogs: "Журнал модераторів", noModerationItems: "Черга модерації порожня.", moderationReview: "Огляд", moderationComment: "Коментар", moderationTypeFilter: "Фільтр типу модерації", allModerationTypes: "Усі типи", moderationSearch: "Пошук у черзі", filterModeration: "Фільтрувати", selectAllModeration: "Вибрати все", moderationReason: "Причина модерації", hideSelectedModeration: "Приховати вибране", hideSelectedModerationConfirm: "Приховати вибрані елементи?", moderationDefaultReason: "Порушення правил", adminGeneralSettings: "Загальні налаштування", adminSettings: "Налаштування сайту", adminSettingDefaultLocale: "Мова інтерфейсу", adminSettingJournalEnabled: "Журнал увімкнено", adminSettingMaintenanceMode: "Режим обслуговування", adminSettingSiteName: "Назва сайту", noAdminSettings: "Налаштувань поки немає.", saveSetting: "Зберегти",
    profileLocation: "Місце проживання", profilePronoun: "Займенник", profilePronounNone: "Не вказано",
    profileReplyPreference: "Хто може відповідати", profileRepliesAnyone: "Усі", profileRepliesFollowed: "Друзі (на кого ви підписані)", profileRepliesSelf: "Лише ви",
    repliesProfileDefault: "З налаштувань профілю",
    reviewRepliesHint: "Застосовується до нових коментарів під цим оглядом. Виберіть налаштування профілю, щоб успадковувати їхні зміни.",
    profileRepliesHint: "Застосовується до нових коментарів під вашими оглядами та списками. Для окремого огляду чи списку можна обрати інше правило.",
    listRepliesHint: "Застосовується до нових коментарів під цим публічним списком. Налаштування профілю успадковує їхні зміни.",
    listCommentRepliesRestricted: "Власник списку обмежив коментування або заблокував взаємодію.",
    commentRepliesRestricted: "Автор обмежив коментування цього огляду або заблокував взаємодію.",
    bio: "Про себе", bioHint: "До 500 символів. Цей текст буде видимий у вашому публічному профілі.", profileIdentity: "Дані профілю", editProfile: "Редагувати профіль", profileActions: "Дії профілю", profileStats: "Статистика", ratingDistribution: "Розподіл оцінок", noRatingDistribution: "Оцінок поки немає.", publicLists: "Публічні списки", ratings: "Оцінки", profileNotFound: "Цей профіль не існує або недоступний.", loadPublicProfileError: "Не вдалося завантажити профіль користувача.",
    markMessagesReadError: "Не вдалося позначити діалог прочитаним.", sendMessageError: "Не вдалося надіслати повідомлення.", adminSaveError: "Не вдалося зберегти налаштування.", adminMovieCreateError: "Не вдалося створити фільм.", adminMovieSaveError: "Не вдалося зберегти фільм.", adminMovieDetailsError: "Не вдалося завантажити повні дані фільму для редагування.", adminMovieDeleteError: "Не вдалося видалити фільм.", adminArticleCreateError: "Не вдалося створити статтю.", adminNewsletterError: "Не вдалося поставити бюлетень у чергу.", adminNewsletterStatusError: "Бюлетень поставлено в чергу, але не вдалося оновити стан.", adminCommentModerationError: "Не вдалося змінити видимість коментаря.", adminConversationDeleteError: "Не вдалося видалити діалог.", adminListVisibilityError: "Не вдалося змінити видимість списку.", adminListDeleteError: "Не вдалося видалити список.", adminUserActionError: "Не вдалося змінити користувача.", adminReviewModerationError: "Не вдалося змінити видимість огляду.", adminModerationActionError: "Не вдалося виконати модерацію.", adminNotificationActionError: "Не вдалося виконати дію зі сповіщенням.", tmdbQualityError: "Не вдалося завантажити якість каталогу TMDB.",
    profileCollections: "Мої фільми", noCollectionFilms: "У цій добірці поки немає фільмів.", loadCollectionError: "Не вдалося завантажити добірку.", noLists: "Списків поки немає.", listsPagination: "Сторінки списків", reviewsPagination: "Сторінки оглядів",
    allRatings: "Усі оцінки", allReviews: "Усі огляди", reviewsByUser: "Огляди від {name}", showFewerReviews: "Показати менше оглядів", noRatings: "Оцінок поки немає.", loadRatingsError: "Не вдалося завантажити оцінки.", loadReviewsError: "Не вдалося завантажити огляди.",
    follow: "Підписатися", unfollow: "Відписатися", blockProfileUser: "Заблокувати", unblockUser: "Розблокувати", blockError: "Не вдалося змінити блокування.", moreActions: "Інші дії", goToMember: "Перейти до учасника", followers: "Підписники", following: "Підписки", networkStats: "Підписників: {followers} · Підписок: {following}", networkStatsOne: "Підписників: {followers} · Підписок: {following}", noFollowers: "Підписників поки немає.", noFollowing: "Підписок поки немає.", loadNetworkError: "Не вдалося завантажити мережу користувача.", networkPagination: "Сторінки мережі", followError: "Не вдалося змінити підписку.", loadFollowStatusError: "Не вдалося перевірити стан підписки.", loadBlockStatusError: "Не вдалося перевірити стан блокування.",
    likes: "Вподобання", like: "Вподобати", unlike: "Прибрати вподобання", likeReviewError: "Не вдалося змінити вподобання.", review: "Огляд", reviewBy: "Огляд від", publishedAt: "Опубліковано", loadingReview: "Завантаження огляду...", reviewUnavailable: "Огляд недоступний", reviewNotFound: "Цей огляд не існує або недоступний.", loadReviewError: "Не вдалося завантажити цей огляд.", backToMovie: "Назад до фільму", moreOptions: "Додаткові дії", membersWhoLikedReview: "Кому сподобався цей огляд", noReviewLikes: "Цей огляд ще ніхто не вподобав.", loginToLikeReview: "Увійдіть, щоб вподобати",
    recentActivity: "Остання активність", noActivity: "Активності поки немає.", loadActivityError: "Не вдалося завантажити активність.", activityPagination: "Сторінки активності", activityFollowed: "підписався(-лася) на", activityRated: "оцінив(-ла)", activityReviewed: "написав(-ла) огляд до", activityCreatedList: "створив(-ла) список", unknownActivity: "Невідома активність", adminRole: "роль адміністратора", userRole: "роль користувача",
    avatarUrl: "Посилання на аватар", invalidAvatarUrl: "Вкажіть повне посилання на зображення (http або https).", invalidSocialLinkUrl: "Вкажіть коректне посилання на соціальний профіль (http або https).",
    filmography: "Фільмографія", filmsStarring: "Фільми за участі", filmsDirected: "Режисерські роботи", invalidPersonId: "Некоректне посилання на персоналію.", loadPersonError: "Не вдалося завантажити сторінку персоналії.",
    poster: "Постер", minutes: "хв", rate: "Оцінка", rateAs: "Оцінити на", rateFilm: "Оцінити фільм", done: "Готово", share: "Поділитися", unknownPerson: "Персоналія без імені", untitledFilm: "Фільм без назви",
    journalIntro: "Історії, розмови й новини спільноти Rewind.", notificationsIntro: "Будьте в курсі підписок і взаємодії з вашими оглядами.", messagesIntro: "Приватні розмови з учасниками спільноти Rewind.", unknownJournalCategory: "Без розділу", untitledArticle: "Стаття без заголовка", noArticleContent: "Текст цієї статті ще не додано.",
    mainNavigation: "Головна навігація", accountEyebrow: "REWIND / АКАУНТ", journalEyebrow: "Редакція Rewind", socialEyebrow: "Спільнота Rewind", discoverEyebrow: "REWIND / ВІДКРИТТЯ", emptyEyebrow: "REWIND / ПОРОЖНЬО", searchEyebrow: "REWIND / ПОШУК", collectionsEyebrow: "REWIND / ДОБІРКИ", listEyebrow: "REWIND / СПИСОК", listsEyebrow: "REWIND / СПИСКИ", previewLabel: "ПЕРЕГЛЯД", emptyListLabel: "ПОРОЖНІЙ СПИСОК", journalArchiveError: "Не вдалося завантажити архів.",
  },
  en: {
    ...adminUserMessages.en,
    editListEntries: "Edit entries…", editList: "Edit List",
    rankedList: "Ranked list", rankedListHint: "Show position for each film.",
    termsTitle: "Terms", termsBody: "Using Rewind and participating responsibly.",
    conditionsTitle: "Conditions", conditionsBody: "Availability of Rewind features and content.",
    safetyNoticeTitle: "Safety Notice", safetyNoticeBody: "Account protection and safe interaction.",
    hqAccountsTitle: "HQ Accounts", hqAccountsBody: "The HQ badge and existing profile features.",
    authEntryGreeting: "Hi there!",
    authEntryIntro: "Here you can explore our movie catalog, discover new favorites, and keep track of everything you’ve already watched.",
    authFieldRequired: "Complete this field.",
    authEmailInvalid: "Enter a valid email address.",
    authFieldMinLength: "Enter at least {min} characters.",
    authFieldInvalid: "Check this field’s value.",
    createListTitle: "Create list",
    listNoFilmsTitle: "No films yet",
    listNoFilmsHint: "Add your first film to start building this list.",
    listKeepOneFilm: "Keep at least one film in a custom list.",
    listEntries: "entries",
    listDraftAddError: "The list was saved, but some films could not be added. Retry Save to finish.",
    listCreated: "List created.",
    clearSearch: "Clear search",
    adminWorkspace: "Workspace",
    adminPlatformMetrics: "Platform statistics",
    adminPersonalMetrics: "Personal metrics",
    adminReviewDeletedSuccess: "The review has been successfully deleted.",
    adminReviewHiddenSuccess: "The review has been successfully hidden.",
    adminReviewReportDismissedSuccess: "The report was dismissed and its resolution was recorded.",
    adminReviewReportDismissError: "Could not dismiss this report.",
    dismissReport: "Dismiss report",
    adminReturnToReviews: "Back to reviews",
    adminCreatedLists: "Lists created",
    adminAverageRating: "Average movie rating",
    adminReviewsWritten: "Reviews written",
    adminLikesReceived: "Likes received on reviews",
    adminEngagementGrowth: "Engagement growth",
    adminAverageSession: "Average session time",
    adminWatchlistMovies: "Films in watchlist",
    adminMetricUnavailable: "Unavailable",
    adminAllTimeMetrics: "Your current totals for all time",
    adminNoRatings: "You have not rated any films yet.",
    adminRatingSnapshot: "Based on your current ratings, without a time history.",
    adminHistoryUnavailable: "There is no data source for this metric.",
    personShowAllFilms: "All films",
    personShowFewerFilms: "Fewer films",
    faqTitle: "Frequent Questions", serviceFaqLabel: "Frequent Question", serviceFilmDataLabel: "Film Data", serviceImportantDataLabel: "Important Data", serviceNavigation: "Service navigation",
    faqBody: "Answers to common questions about Rewind, its community, and the service.",
    interactionBlocked: "Interaction blocked",
    passwordByteLimitHint: "At least 8 characters and up to 72 UTF-8 bytes. Ukrainian letters and emoji may use multiple bytes.",
    passwordByteLimitError: "Password exceeds 72 UTF-8 bytes. Shorten it.",
    podcastAudioLoadError: "Could not load podcast audio.",
    articleLanguageUk: "Ukrainian", articleLanguageEn: "English", tmdbIdsHint: "e.g. 550, 603",
    noAdminArticles: "No articles found.", adminArticlesPagination: "Article pages", articleLanguage: "Article language",
    articleCoverUrl: "Cover URL", editArticle: "Edit article", articleDraft: "Draft", articlePublished: "Published", adminArticleSaveError: "Could not save the article.",
    articleCurrentCategory: "Current category",
    noAdminNotifications: "No notifications found.", adminNotificationsPagination: "Notification pages",
    noAdminConversations: "No conversations found.", adminConversationsPagination: "Conversation pages",
    newsletter: "Newsletter", newsletterEnabled: "Receive new issues by email", newsletterSaved: "Newsletter settings saved.", newsletterError: "Could not save newsletter settings.", loadNewsletterError: "Could not load newsletter settings.", sendNewsletter: "Queue newsletter", newsletterQueueStatus: "Queued / sent / failed",
    noAdminLists: "No lists found.", adminListsPagination: "List pages", noAdminComments: "No comments found.", noAdminReviews: "No reviews found.", reportedOnly: "Reported only", reportedReviewsOnly: "Reported only", reportComment: "Report comment", reportList: "Report list", contentReported: "Report submitted.", contentReportError: "Could not check or submit the report.", reportedOn: "Reported on", reportedReason: "Report reason", reviewReportReason_SPAM: "Spam", reviewReportReason_INAPPROPRIATE_CONTENT: "Inappropriate content", reviewReportReason_BULLYING: "Bullying", reportCommentsCount: "Comments", reportReview: "Report review", submitReport: "Submit report", reviewReported: "Review reported.", reportReviewError: "Could not submit the report.", adminCommentsPagination: "Comment pages", adminReviewsPagination: "Review pages", adminVisibilityFilter: "Visibility", allVisibilityStates: "All", visibleOnly: "Visible only", hiddenOnly: "Hidden only",
    adminMovies: "Films", adminMovieDatabase: "Film database", adminMovieSearch: "Search films in the catalog", adminMovieEditor: "Edit film", addMovie: "Add film", noAdminMovies: "No films found.", adminMovieResults: "Catalog films", adminMovieMetadata: "Film details", adminMovieVisibleReviews: "Visible reviews", moviePublished: "Published", movieUnpublished: "Unpublished", changeMoviePublication: "Change status", adminMoviePublicationError: "Could not change the film publication status.", adminMoviesPagination: "Admin film pages", movieTitle: "Film title", movieDurationMinutes: "Duration (minutes)", imdbId: "IMDb ID", ageRating: "Age rating", backdropUrl: "Backdrop URL", trailerUrl: "Trailer URL", releaseDate: "Release date", rating: "Rating", posterUrl: "Poster URL", editMovie: "Edit", deleteMovie: "Delete", deleteMovieConfirm: "Are you sure you want to delete this film?", tmdbId: "TMDB ID", tmdbIds: "TMDB IDs", searchTmdb: "Search TMDB", findTmdbCandidates: "Find TMDB matches", tmdbCandidates: "Possible TMDB matches", tmdbCandidateSearchHint: "We search by IMDb ID first; if unmatched, we fall back to title and year. Check the title and date before syncing.", tmdbCandidatesEmpty: "No candidates found.", tmdbCandidatesError: "Could not find TMDB candidates.", tmdbIntegrationUnavailable: "TMDB integration is not configured. Add TMDB_API_KEY to the Edge Function secrets.", selectTmdbCandidate: "Select TMDB candidate", tmdbCandidateSyncHint: "Selection only fills the ID. Press “Sync TMDB” to apply it.", syncTmdb: "Sync TMDB", tmdbIdRequired: "Enter a valid TMDB ID.", tmdbSyncDone: "TMDB updated", tmdbSyncError: "Could not sync TMDB.", tmdbImportTitle: "Import films from TMDB", tmdbQualityTitle: "TMDB catalog quality", tmdbQualitySummary: "Linked films / full catalog", tmdbCoverage: "Coverage", tmdbCompleteness: "Completeness", tmdbMissingPoster: "Missing poster", tmdbMissingBackdrop: "Missing backdrop", tmdbMissingPlot: "Missing plot", tmdbMissingRuntime: "Missing runtime", tmdbMissingTrailer: "Missing trailer", tmdbMissingRating: "Missing TMDB rating", tmdbMissingOriginalLanguage: "Missing original language", tmdbImport: "Import IDs", tmdbImportLimit: "Enter 1 to 20 valid TMDB IDs.", tmdbImportDone: "Import completed", tmdbDiscoveryImport: "Discover and import", tmdbDiscoveryDone: "Discovery import completed", tmdbDiscoveryInvalid: "Page must be 1–500, count must be 1–20.", tmdbImportError: "Could not import films from TMDB.", tmdbBatchSyncTitle: "Bulk catalog sync", tmdbBatchSyncHint: "Paste up to 50 REWIND and TMDB ID pairs, one per line (format movie_id,tmdb_id). Pairs are sent sequentially in batches of up to 20. TMDB metadata and credits will be updated; existing similar-film links will not change.", tmdbBatchSyncCsv: "Open CSV with 49 verified pairs", tmdbBatchSyncLoadCsv: "Load verified pairs", tmdbBatchSyncPreview: "TMDB pair review", tmdbBatchSyncRewindMovie: "REWIND film", tmdbBatchSyncMovieMissing: "Film not found", tmdbBatchSyncCsvLoaded: "verified pairs loaded. Review them before syncing.", tmdbBatchSyncCsvLoadError: "Could not prepare the verified pair review. The list was not changed.", tmdbBatchSyncPairs: "Film ID pairs", tmdbBatchSyncPlaceholder: "movie_id,tmdb_id\n1,1084242", tmdbBatchSyncButton: "Sync pairs", tmdbBatchSyncConfirm: "Confirm sync of these catalog records", tmdbBatchSyncInvalid: "Enter 1–50 pairs with unique positive REWIND and TMDB IDs.", tmdbBatchSyncDone: "Bulk sync finished", tmdbBatchSyncPartial: "A batch did not return a response. Check movie data before retrying unconfirmed pairs.", tmdbBatchSyncUnconfirmed: "The outcome for these pairs is unknown; check them in the catalog first:", genres: "genres",
    adminLists: "Lists", adminAllLists: "All Lists", featureList: "Feature list", unfeatureList: "Remove from featured", featuredPositionLabel: "Featured position:", adminListFeaturedError: "Could not update featured lists.", adminListFeaturedBoundary: "This list is already at that end of the featured order.", moveFeaturedUp: "Move up", moveFeaturedDown: "Move down", adminListCreatedDate: "Created", items: "films", hiddenList: "hidden", hideList: "Hide", publishList: "Publish", deleteList: "Delete list", deleteListConfirm: "Delete this custom list?", adminConversations: "Conversations", adminNotifications: "Notifications", conversationUsers: "Users", deleteConversation: "Delete conversation", deleteNotification: "Delete notification", deleteConversationConfirm: "Delete this conversation and all messages?", deleteNotificationConfirm: "Delete this notification?", createNotification: "Create notification", notificationType: "Notification type", notificationFollowType: "New follower", notificationReviewLikedType: "Review liked", unknownNotificationType: "Unknown type", notificationRecipientId: "Recipient ID", notificationActorId: "Actor ID", notificationReviewId: "Review ID", notificationTypeFilter: "Type filter", notificationReadFilter: "Read state filter", notificationRecipientFilter: "Recipient ID filter", allNotificationTypes: "All types", allNotificationStates: "All states", filterNotifications: "Filter", markFilteredNotificationsRead: "Mark filtered as read", deleteFilteredNotifications: "Delete filtered", deleteFilteredNotificationsConfirm: "Delete all notifications matching the current filter?", markNotificationRead: "Mark as read", markNotificationUnread: "Mark as unread", messagesCount: "messages", notificationRecipient: "recipient", notificationActor: "actor", read: "read", unread: "unread", userSearch: "Search users", noAdminUsers: "No users found.", adminUsersPagination: "User pages", activeUser: "active", blockedUser: "blocked", blockUser: "Block", activateUser: "Activate",
    journal: "Journal", journalRead: "Read", journalCategory: "Section", allJournalCategories: "All sections", journalNews: "News", journalAwards: "Awards", journalCommunity: "Community", journalInterviews: "Interviews", journalPlatform: "Platform", journalPodcasts: "Podcasts", journalNewsletter: "Newsletter", journalArchive: "Archive", noJournalArchive: "The archive is empty.", clearArchive: "Show all months", journalLoadError: "Could not load the journal.", noJournalArticles: "No published articles yet.", journalEditor: "Journal editor", articleSlug: "Article slug", articleTitle: "Title", articleCategory: "Category", articleExcerpt: "Excerpt", articleContent: "Article content", audioUrl: "Podcast audio URL", podcastAudio: "Podcast audio", podcastAudioUnavailable: "Your browser does not support audio.", publishArticle: "Publish", adminReviews: "Reviews", adminReviewsTitle: "All Reviews", hiddenReview: "hidden", visibleReview: "visible", hideReview: "Hide", unhideReview: "Restore", adminReviewDeleteConfirm: "Permanently delete this review?", adminReviewDeleteError: "Could not delete the review.", adminReviewContent: "Review text", adminEditReview: "Edit text", adminReviewEditError: "Could not save the review changes.", help: "Help", contact: "Contact", rules: "Rules", privacy: "Privacy", filmData: "Film data", importantData: "Important data", deleteAccount: "Delete account", helpTitle: "Help", helpBody: "If something is wrong, check your sign-in, cookies, and API connection. Include the URL and time when reporting an error.", contactTitle: "Contacts", contactBody: "Contact the Rewind team through the channel for your education project. Never send a password or refresh token.", rulesTitle: "Rules of Use", rulesBody: "Respect other members, do not publish illegal or harmful content, and do not bypass access controls. Moderators may hide violations.", privacyTitle: "Privacy Policy", privacyBody: "Public profiles do not expose email or service fields. Session data uses HttpOnly cookies, and passwords are stored only as hashes.", filmDataTitle: "Film Data", filmDataBody: "Film metadata and images come from permitted external sources. An external rating is shown only when it is actually stored.", importantDataTitle: "Important Data", importantDataBody: "Sources and updates for film information.", deleteAccountTitle: "Account Deletion", deleteAccountBody: "Sign in, open your profile, and use the delete account form. Your current password is required; lists, ratings, reviews, and sessions will be removed.",
    home: "Home", films: "Films", login: "Log in", logout: "Log out", logoutError: "Could not log out. Please try again.", register: "Register", menu: "Menu", closeMenu: "Close menu", moreNavigation: "More navigation", deleteAccountConfirm: "Delete the account and all related data? This cannot be undone.", deleteAccountWarning: "Deleting the account permanently removes your lists, ratings, reviews, and sessions.", deleteAccountError: "Could not delete the account. Check your password.",
    lists: "My lists", profile: "Profile", users: "Users", browseFilms: "Browse films", globalSearch: "Global search", globalSearchIntro: "Find films, people, lists, tags, and journal stories.", globalSearchPlaceholder: "Search Rewind", globalSearchResults: "Search result categories", searchShortcuts: "Search shortcuts", popularFilms: "Popular films", openFilmDetails: "Open film details", searchMembers: "Members", searchLists: "Lists", searchTags: "Tags", searchPeople: "Cast & crew", searchReviews: "Reviews", searchJournal: "Journal", loadingSearch: "Searching Rewind...", searchError: "Could not complete the search.", noGlobalResults: "There were no matches for your search term", noGlobalResultsHint: "Check your spelling or search for something else", discoverListsIntro: "Film collections worth coming back to.",
    searchFilms: "Search films", searchFilmPlaceholder: "Film title", addFilm: "Add a film", search: "Search", searchIntro: "Find the next film for your list.", loadingFilms: "Loading films...",
    genre: "Genre", allGenres: "All genres", year: "Year", minRating: "Minimum rating", anyRating: "Any", filters: "Filters",
    sortBy: "Sort by", sortNewest: "Newest", sortOldest: "Oldest", sortBestRated: "Highest rated", sortLowestRated: "Lowest rated", sortTitle: "Title", sortPopularReviews: "Popularity",
    applyFilters: "Apply", loadGenresError: "Could not load genres.", retry: "Retry", resultsCount: "Films found",
    pagination: "Film pages", profileCollectionPagination: "Profile collection pages", publicProfileListsPagination: "Public profile list pages", publicListsPagination: "Public list pages", journalPagination: "Journal pages", previous: "Previous", next: "Next", page: "Page", of: "of", limit: "Count",
      homeEyebrow: "Rewind — your film diary", homeTitle: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good.", homeSubtitle: "Discover films, share your ratings, and build your own lists.", joinRewind: "Create account", getStarted: "Get Started", homeGuestReleases: "Rewind lets you…", homeGuestExplainerHeading: "Rewind lets you…", homeGuestExplainerTitle: "Keep track of every film you’ve ever watched", homeGuestExplainerText: "or just start from the day you join.", homeGuestFeatureTrack: "Keep track of every film you’ve watched, or start from the day you join.", homeGuestFeatureLike: "Like your favorite films, lists and reviews.", homeGuestFeatureShare: "Write and share reviews, and follow friends and other members.", homeGuestFeatureRate: "Rate each film on a five-star scale, including half stars.", homeGuestFeatureDiary: "Keep a diary of your film watching and get personal stats.", homeGuestFeatureLists: "Compile lists of films on any topic and keep a watchlist.", homeJustReviewed: "Just reviewed…", homeGuestPitchLead: "Write and share reviews. Compile your own lists. Share your life in film.", homeGuestPitchPrompt: "Below are some popular reviews and lists from this week. Sign up to create your own.", homeRecentNews: "Recent News", homeMore: "More",
      homeWelcomeTitle: "Welcome back. Here’s what we’ve been watching…", homeWelcomeSubtitle: "Catch up on new releases, popular films, and activity from members you follow.", homeFollowingActivity: "Activity from people you follow", noFollowingActivity: "There’s no activity from people you follow yet.", homeNewOnRewind: "New on Rewind", homeYourActivity: "Your activity", homePopularOnRewind: "Popular on Rewind", homeLatestNews: "Latest news", homePopularReviewsThisWeek: "Popular reviews this week", homePopularLists: "Popular Lists",
    loadingHome: "Loading the home page...", loadHomeError: "Could not load the home page.", popularThisWeek: "Popular now", newReleases: "New releases", viewAll: "View all", readMore: "Read more",
    filmsDiscoverTitle: "Discover films", filmsDiscoverIntro: "Popular films and recent reviews from the Rewind community.",
    allSearchResults: "All", showingSearchMatches: "Showing matches for", showSearchResultsFor: "Show results for", showMoreResults: "Show more results", backToHome: "Back to home", notFoundTitle: "Ooops! Page not found", notFoundMessage: "Looks like you’ve reached a moment that was cut from the final edit. This page is missing, but you can always rewind.",
    listsLandingIntro: "Collect, curate, and share. Lists are the perfect way to group films.", startOwnLists: "Start your own lists",
    listInformation: "List information",
    popularReviewers: "Popular reviewers", popularReviewersIntro: "Explore the profiles of our most followed and respected reviewers.", sortByPopularity: "Sort by popularity", reviewerMetrics: "Reviewer statistics", name: "Name", noPopularReviewers: "No reviewers have likes yet.", socialLinks: "Social links", noSocialLinks: "No social links added.", socialLinksSaved: "Social links saved.", loadSocialLinksError: "Could not load social links.", socialLinksSaveError: "Could not save social links.", community: "Community", communitySubtitle: "Meet active reviewers, HQ members, and Rewind users.", loadCommunityError: "Could not load the community.", featuredMembers: "Featured members", noFeaturedMembers: "There are no featured members yet.", allUsers: "All users", noUsers: "There are no users yet.", communityUsersPagination: "Community user pages", searchUsers: "Search users", recentWatched: "Recently watched", noRecentWatched: "No recently watched films yet.", activityWatched: "watched",
    socialWebsite: "Website", socialInstagram: "Instagram", socialTiktok: "TikTok", socialLetterboxd: "Letterboxd",
    latestJournal: "Latest from the journal", noLatestJournal: "No journal updates yet.", homePopularReviews: "Popular reviews", popularLists: "Public lists", noRecentReviews: "No reviews yet.", noPublicLists: "No public lists yet.", byUser: "by",
    loadFilmsError: "Could not load films. Check that the API is running.", noFilms: "No films found.",
    unknownYear: "Year unknown", about: "About us", credits: "Credits",
    loading: "Loading...", appErrorTitle: "Something went wrong", appErrorMessage: "Reload the page and try again.", reload: "Reload", save: "Save", create: "Create", add: "Add", remove: "Remove",
    loadMovieError: "Could not load the film.", saved: "Saved.", linkCopied: "Link copied.", watched: "Watched", wantsToSee: "Wants to See", likedCollection: "Liked",
    watchlist: "Watchlist", favorite: "Favorite", myActions: "My actions", myRating: "Your rating",
    none: "none", addToList: "Add to list", addToLists: "Add to lists", chooseList: "Choose a list",
    actors: "Cast", directors: "Directors", producers: "Producers", castAndCrew: "Cast & Crew", adminMoviePeopleSearch: "Find a person", adminMoviePeopleResults: "Search results", adminMovieSelectedPeople: "Added to this film", characterName: "Character name", castOrder: "Cast order", originalLanguage: "Original language (ISO code, for example en)", selected: "Added", peopleSearchError: "Could not find people.", similarFilms: "Similar films", reviews: "Reviews", storyline: "Storyline", favoriteFilms: "Favorite films",
    noReviews: "No reviews yet.", yourReview: "Your review", publishReview: "Publish review",
    editReview: "Edit", deleteReview: "Delete review", saveReview: "Save review", cancel: "Cancel",
    reviewUpdated: "Review updated.", reviewDeleted: "Review deleted.", deleteReviewConfirm: "Delete your review? Your rating will remain.",
    loadMyReviewError: "Could not load your review.", updateReviewError: "Could not update the review.", deleteReviewError: "Could not delete the review.",
    deleteRating: "Delete rating", ratingDeleted: "Rating deleted.", deleteRatingError: "Could not delete the rating.",
    signInToReview: "to rate or write a review.", trailer: "Trailer", watchTrailer: "Watch trailer", trailerUnavailable: "A trailer has not been added yet.", noSimilarFilms: "No similar films found yet.", movieCrewUnavailable: "Cast and director information is not available yet.", movieStorylineUnavailable: "A storyline is not available yet.",
    myProfile: "My profile", displayName: "Display name", changePassword: "Change password",
    settings: "Settings", whoCanView: "Who can view", accountSettings: "Account Settings", accountSettingsIntro: "Manage your profile details, preferences, and account settings all in one place.", authentication: "Authentication", backToProfile: "Back to profile", confirmNewPassword: "Confirm new password",
    account: "Account", footerTerms: "Terms", footerContacts: "Contacts", footerInformation: "Service information",
    currentPassword: "Current password", newPassword: "New password", saving: "Saving…", deleting: "Deleting…", recentRatings: "Recent ratings",
    recentReviews: "Recent reviews", likedReviews: "Liked reviews", noLikedReviews: "No liked reviews yet.", loadLikedReviewsError: "Could not load liked reviews.", likedReviewsPagination: "Liked review pages", newList: "New list", emptyList: "This list is empty. Add films from their pages.",
    welcome: "Welcome back", email: "Email", password: "Password", showPassword: "Show password", hidePassword: "Hide password", forgotPassword: "Forgot password?",
    loggingIn: "Logging in...", noAccount: "Don't have an account?", createOne: "Create one",
    createAccount: "Create your account", username: "Username", accountCreated: "Account created", goToLogin: "Go to login", confirmEmailBeforeLogin: "Check your inbox and confirm your email before signing in.", emailConfirmedSignIn: "Email confirmed. You can now sign in.",
    alreadyAccount: "Already have an account?", return: "Return", forgotTitle: "Forgot your password?",
    forgotDescription: "Enter your email address and we will send you a link to reset your password.", dividerOr: "Or",
    forgotRequestError: "Could not send the password reset request. Please try again.",
    resetPassword: "Reset password", resetTitle: "Set a new password", confirmPassword: "Confirm password",
    changeEmail: "Change email",
    emailChangeHint: "Your new address is saved after confirmation. Check the emails you receive.",
    emailChangeSent: "Email change requested. Follow the confirmation links in the emails you receive.",
    emailChangeRequestError: "Could not request the email change. Check the address and your sign-in, then try again.",
    emailChangeRateLimit: "Too many requests. Wait before sending another request.",
    emailChangeCheck: "Check confirmation",
    emailChangeWaiting: "The change is still awaiting confirmation. Open the latest emails and confirm the address.",
    emailChangeConfirmed: "Your email has been confirmed and updated in your profile.",
    emailChangeCheckError: "Could not synchronize your profile. Try checking the confirmation again.",
    emailChangeConfirmTitle: "Confirm your email change",
    emailChangeConfirmBody: "Continue if you requested a new email address for your REWIND account.",
    emailChangePendingTitle: "Confirmation accepted",
    emailChangePendingBody: "Open any remaining confirmation email to finish the change. Then sign in to your account.",
    emailChangeCompleteTitle: "Email updated",
    emailChangeCompleteBody: "Your address has been confirmed and synchronized with your REWIND profile.",
    emailConfirmTitle: "Confirm your email", emailConfirmBody: "Your address is ready to verify. Select the button to finish confirmation and open your film diary.", emailConfirmAction: "Confirm email",
    emailRecoveryTitle: "Confirm your password change", emailRecoveryBody: "We received a request to change your password. Continue only if you made this request.", emailRecoveryConfirm: "Continue to password change",
    emailActionExpiredTitle: "This link is invalid or expired", emailActionExpiredBody: "This one-time link may have been used, expired, or become invalid. Request a new one and open the latest email.", emailActionProfileTitle: "Email confirmed", emailActionProfileError: "Your REWIND profile could not be loaded yet. Sign in again in a moment.", emailActionRequestReset: "Request a new link", emailActionRegisterAgain: "Return to registration",
    resetSuccess: "Password changed.", resetInvalid: "The link is invalid or has expired.", resetMissing: "The reset link has no token.",
    resetRequestError: "Could not change the password. Check your connection and try again.",
    supabaseLinkTitle: "Connect Supabase Auth", supabaseLinkDescription: "We will use your current password to create a secure hosted account and email you a confirmation link. Your Rewind profile, role, and data will stay unchanged.", supabaseLinkStart: "Send confirmation email", supabaseLinkEmailSent: "Email sent. Confirm your address using the link, then finish connecting your account.", supabaseLinkStartError: "Could not start account linking. Check your password and try again later.", supabaseLinkAlreadyConnected: "Your account is already connected.", supabaseLinkCompleteTitle: "Finish connecting your account", supabaseLinkCompleteHint: "Enter your current Rewind password to confirm ownership of the existing profile.", supabaseLinkComplete: "Connect account", supabaseLinkCompleteError: "Could not verify the connection. Check your password or open the newest email link.", supabaseLinkMissingToken: "The account-link email is invalid or expired. Return to account settings and request a new one.", supabaseLinkSuccess: "Account connected. Your Rewind profile and data are preserved.",
    resetSent: "If the account exists, a reset link has been sent.",
    loginError: "Invalid email or password.", weakPasswordSignIn: "This password no longer meets the updated security requirements. Reset it and choose a password with at least 8 characters.", emailNotConfirmed: "Confirm your email using the link we sent, then sign in.", confirmationCallbackError: "We couldn't finish email confirmation. Open the newest confirmation email or request a new one.", confirmationLinkExpired: "This one-time link has already been used or has expired. Try signing in; if your email is still unconfirmed, request a new email.", accountLoadError: "Your password was accepted, but your REWIND profile could not be loaded. Try again shortly.", registrationError: "Registration failed.",
    footerMade: "Made by students in Kyiv, Ukraine.", filmDataFrom: "Film data from TMDB.", tmdbDisclaimer: "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    aboutIntro: "Rewind is a film diary and community project built by students in Kyiv, Ukraine.",
    filmDataAndImages: "Film data and images", confirmMismatch: "Passwords do not match.",
    invalidMovieId: "Invalid film ID.", invalidProfileId: "Invalid profile link.", invalidReviewId: "Invalid review link.",
    loadProfileError: "Could not load your profile.", nameSaved: "Profile updated.",
    saveNameError: "Could not save the name.", saveAvatarError: "Could not update the avatar.", passwordChanged: "Password changed.",
    changePasswordError: "Check your current and new passwords.", passwordChangedSignIn: "Password changed. Please log in again.", passwordChangedLogoutError: "Password changed, but sign-out failed. Please sign out manually.", loadListsError: "Could not load lists.",
    loadItemsError: "Could not load films.", createListError: "Could not create the list.",
    removeItemError: "Could not remove the film from the list.", favoriteRemoved: "Film removed from favorites.", changeListError: "Could not update the list.",
    saveRatingError: "Could not save your rating.", rateFirst: "Rate the film first.",
    reviewPublished: "Review published.", createReviewError: "Could not add the review. One active review per film is allowed.",
    filmAdded: "Film added to the list.", addFilmError: "Could not add the film to the list.",
    commentsSection: "Comments", showComments: "Show comments", hideComments: "Hide comments", commentsPagination: "Comment pages", noComments: "No comments yet.", yourComment: "Your comment", sendComment: "Send",
    editComment: "Edit comment", deleteComment: "Delete comment", deleteCommentConfirm: "Delete this comment?", loginToComment: "Log in to leave a comment.",
    loadCommentsError: "Could not load comments.", createCommentError: "Could not add the comment.", updateCommentError: "Could not update the comment.", deleteCommentError: "Could not delete the comment.",
    listBy: "A list by", emptyPublicList: "This list has no films yet.", invalidListId: "Invalid list link.", loadPublicListError: "Could not load the public list.",
    description: "Description", listSettings: "List Settings", viewList: "View list", cancelListChanges: "Cancel changes", createListIntro: "Collect films into a list you will want to return to.", publicList: "Public list", privateList: "Private list", listName: "List name", listNameRequired: "Enter a list name.", updateListError: "Could not update the list.", reorderListError: "Could not change the film order.", deleteListError: "Could not delete the list.", listDeleted: "List deleted.", deletingList: "Deleting…", moveUp: "Move up", moveDown: "Move down", reorderItem: "Reorder:", listReorderHelp: "Drag to reorder, or use the up and down arrow keys.",
    tags: "Tags", profileListTags: "List tags", moreTags: "More", lessTags: "Less", tagsHint: "Comma-separated, up to 10", popularTags: "Popular tags", noTags: "There are no tags yet.", loadTagsError: "Could not load popular tags.", discoverLists: "Collections", listsTaggedHeading: "All lists tagged", noTaggedLists: "There are no lists for this tag yet.", listFeeds: "List feeds", featuredLists: "Featured lists", featuredListsIntro: "A starter pack from the Rewind community and platform curators.", popularListsTitle: "Popular lists", popularListsIntro: "Explore the most popular lists from the Rewind community.", recentlyLikedListsTitle: "Recently liked lists", recentlyLikedListsIntro: "Lists the community has been enjoying lately.", recentListsTitle: "Recent lists", recentListsIntro: "Fresh film collections from Rewind members.", listFeedTeamSection: "Crew lists", crewListsIntro: "Public lists from active Rewind contributors.", listFeedRecent: "Recent", listFeedPopular: "Popular", listFeedRecentlyLiked: "Recently liked", listFeedTeam: "Team lists", likeList: "Like list", unlikeList: "Unlike list", listLikeError: "Could not change the list like.",
    notificationActionError: "Could not update the notification state.", loadNotificationPreferencesError: "Could not load notification settings.", notificationsPagination: "Notification pages",
    notifications: "Notifications", noNotifications: "No notifications yet.", loadNotificationsError: "Could not load notifications.", markRead: "Mark as read", markAllNotificationsRead: "Mark all as read", notificationFollowedYou: "followed you", notificationLikedReview: "liked your review", someone: "Someone", notificationPreferences: "Notification settings", notifyOnFollow: "New followers", notifyOnReviewLike: "Likes on my reviews", notificationPreferencesSaved: "Settings saved.", notificationPreferencesError: "Could not save settings.", messages: "Messages", conversations: "Conversations", noConversations: "No conversations yet.", loadConversationsError: "Could not load conversations.", startConversationError: "Could not open this conversation.", conversationsPagination: "Conversation pages", chooseConversation: "Choose a conversation.", noMessages: "There are no messages in this conversation yet.", emptyMessageBody: "Message has no text", loadMessagesError: "Could not load or send the message.", messagesPagination: "Message pages", newerMessages: "Newer", olderMessages: "Older", messageText: "Message text", sendMessage: "Message", messagesError: "Could not load or send the message.", hq: "HQ", adminDashboard: "Admin dashboard", adminActorId: "Administrator ID", adminLoadError: "Could not load the admin dashboard.", adminSelfChangeError: "You cannot deactivate or demote your own administrator account.", adminLastAdminError: "At least one active administrator must remain.", adminUsers: "Users", adminComments: "Comments", adminCommentsTitle: "All Comments", hiddenComment: "hidden", visibleComment: "visible", hideComment: "Hide", unhideComment: "Restore", adminCommentDeleteConfirm: "Permanently delete this comment?", adminCommentDeleteError: "Could not delete the comment.", auditLogs: "Audit log", adminActivityHistory: "Moderator activity history", adminAuditDateLabel: "Date and time of action", adminAuditActionType: "Action type", noAuditLogs: "No actions yet.", adminAuditPagination: "Audit log pages", grantHq: "Grant HQ", revokeHq: "Revoke HQ", activeUsers: "Active", hqUsers: "HQ users", movies: "Films", hiddenReviews: "Hidden reviews", moderationQueue: "Moderation queue", moderationQueueTitle: "List of Content for Moderation", moderatorLogs: "Moderator Logs", noModerationItems: "The moderation queue is empty.", moderationReview: "Review", moderationComment: "Comment", moderationTypeFilter: "Moderation type", allModerationTypes: "All types", moderationSearch: "Search queue", filterModeration: "Filter", selectAllModeration: "Select all", moderationReason: "Moderation reason", hideSelectedModeration: "Hide selected", hideSelectedModerationConfirm: "Hide the selected items?", moderationDefaultReason: "Rules violation", adminGeneralSettings: "General Settings", adminSettings: "Site settings", adminSettingDefaultLocale: "Interface language", adminSettingJournalEnabled: "Journal enabled", adminSettingMaintenanceMode: "Maintenance mode", adminSettingSiteName: "Site name", noAdminSettings: "No settings yet.", saveSetting: "Save",
    profileLocation: "Location", profilePronoun: "Pronoun", profilePronounNone: "Not specified",
    profileReplyPreference: "Allow replies from", profileRepliesAnyone: "Anyone", profileRepliesFollowed: "Friends (people you follow)", profileRepliesSelf: "You",
    repliesProfileDefault: "Use profile setting",
    reviewRepliesHint: "Applies to new comments on this review. Use the profile setting to inherit future changes to it.",
    profileRepliesHint: "Applies to new comments on your reviews and lists. Each review or list can override this setting.",
    listRepliesHint: "Applies to new comments on this public list. Use the profile setting to inherit future changes to it.",
    listCommentRepliesRestricted: "The list owner has restricted comments or blocked this interaction.",
    commentRepliesRestricted: "The author has restricted comments on this review or blocked this interaction.",
    bio: "About me", bioHint: "Up to 500 characters. This text will appear on your public profile.", profileIdentity: "Profile details", editProfile: "Edit Profile", profileActions: "Profile actions", profileStats: "Statistics", ratingDistribution: "Rating distribution", noRatingDistribution: "There are no ratings yet.", publicLists: "Public lists", ratings: "Ratings", profileNotFound: "This profile does not exist or is unavailable.", loadPublicProfileError: "Could not load this user profile.",
    markMessagesReadError: "Could not mark this conversation as read.", sendMessageError: "Could not send the message.", adminSaveError: "Could not save the setting.", adminMovieCreateError: "Could not create the film.", adminMovieSaveError: "Could not save the film.", adminMovieDetailsError: "Could not load full film details for editing.", adminMovieDeleteError: "Could not delete the film.", adminArticleCreateError: "Could not create the article.", adminNewsletterError: "Could not queue the newsletter.", adminNewsletterStatusError: "Newsletter queued, but its status could not be refreshed.", adminCommentModerationError: "Could not change comment visibility.", adminConversationDeleteError: "Could not delete the conversation.", adminListVisibilityError: "Could not change list visibility.", adminListDeleteError: "Could not delete the list.", adminUserActionError: "Could not update the user.", adminReviewModerationError: "Could not change review visibility.", adminModerationActionError: "Could not perform moderation.", adminNotificationActionError: "Could not perform the notification action.", tmdbQualityError: "Could not load TMDB catalog quality.",
    profileCollections: "My films", noCollectionFilms: "There are no films in this collection yet.", loadCollectionError: "Could not load this collection.", noLists: "There are no lists yet.", listsPagination: "List pages", reviewsPagination: "Review pages",
    allRatings: "All ratings", allReviews: "All reviews", reviewsByUser: "Reviews by {name}", showFewerReviews: "Show fewer reviews", noRatings: "There are no ratings yet.", loadRatingsError: "Could not load ratings.", loadReviewsError: "Could not load reviews.",
    follow: "Follow", unfollow: "Unfollow", blockProfileUser: "Block", unblockUser: "Unblock", blockError: "Could not change the block status.", moreActions: "More actions", goToMember: "Go to member", followers: "Followers", following: "Following", networkStats: "{followers} followers, following {following}", networkStatsOne: "{followers} follower, following {following}", noFollowers: "There are no followers yet.", noFollowing: "Not following anyone yet.", loadNetworkError: "Could not load this user's network.", networkPagination: "Network pages", followError: "Could not change the follow status.", loadFollowStatusError: "Could not load the follow status.", loadBlockStatusError: "Could not load the block status.",
    likes: "Likes", like: "Like", unlike: "Unlike", likeReviewError: "Could not change the like.", review: "Review", reviewBy: "Review by", publishedAt: "Published", loadingReview: "Loading review...", reviewUnavailable: "Review unavailable", reviewNotFound: "This review does not exist or is unavailable.", loadReviewError: "Could not load this review.", backToMovie: "Back to film", moreOptions: "More options", membersWhoLikedReview: "Members who liked this review", noReviewLikes: "No one has liked this review yet.", loginToLikeReview: "Sign in to like",
    recentActivity: "Recent activity", noActivity: "No activity yet.", loadActivityError: "Could not load activity.", activityPagination: "Activity pages", activityFollowed: "followed", activityRated: "rated", activityReviewed: "reviewed", activityCreatedList: "created a list", unknownActivity: "Unknown activity", adminRole: "administrator", userRole: "user",
    avatarUrl: "Avatar URL", invalidAvatarUrl: "Enter a full image URL starting with http or https.", invalidSocialLinkUrl: "Enter a valid social profile URL starting with http or https.",
    filmography: "Filmography", filmsStarring: "Films Starring", filmsDirected: "Films Directed", invalidPersonId: "Invalid person link.", loadPersonError: "Could not load this person page.",
    poster: "Poster", minutes: "min", rate: "Rate", rateAs: "Rate as", rateFilm: "Rate film", done: "Done", share: "Share", unknownPerson: "Unnamed person", untitledFilm: "Untitled film",
    journalIntro: "Stories, conversations, and news from the Rewind community.", notificationsIntro: "Stay up to date with follows and interactions with your reviews.", messagesIntro: "Private conversations with members of the Rewind community.", unknownJournalCategory: "No section", untitledArticle: "Untitled article", noArticleContent: "This article does not have content yet.",
    mainNavigation: "Main navigation", accountEyebrow: "REWIND / ACCOUNT", journalEyebrow: "Rewind editorial", socialEyebrow: "Rewind community", discoverEyebrow: "REWIND / DISCOVER", emptyEyebrow: "REWIND / EMPTY", searchEyebrow: "REWIND / SEARCH", collectionsEyebrow: "REWIND / COLLECTIONS", listEyebrow: "REWIND / LIST", listsEyebrow: "REWIND / LISTS", previewLabel: "PREVIEW", emptyListLabel: "EMPTY LIST", journalArchiveError: "Could not load the archive.",
  },
} as const;

export type TranslationKey = keyof typeof messages.uk;
const typedMessages: Record<Language, Record<TranslationKey, string>> = messages;
export type Translator = (key: TranslationKey) => string;

export function useLocale() {
  const location = useLocation();
  const lang: Language = location.pathname.startsWith("/en/") || location.pathname === "/en" ? "en" : "uk";
  return {
    lang,
    path: (route: string) => `/${lang}${route.startsWith("/") ? route : `/${route}`}`,
    t: (key: TranslationKey) => typedMessages[lang][key] ?? key,
    otherLanguagePath: `/${lang === "uk" ? "en" : "uk"}${location.pathname.replace(/^\/(uk|en)/, "")}${location.search}${location.hash}`,
  };
}

export function localizeGenreName(name: string, lang: Language): string {
  const normalized = name.trim().toLocaleLowerCase().replace(/[\-_]+/g, " ").replace(/\s+/g, " ");
  return genreTranslations[lang][normalized] ?? name;
}

export function formatDateTime(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatJournalDate(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function formatRelativeTime(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value, lang);
  const elapsedSeconds = (date.getTime() - Date.now()) / 1000;
  const units = [
    ["year", 31_536_000], ["month", 2_592_000], ["week", 604_800],
    ["day", 86_400], ["hour", 3_600], ["minute", 60], ["second", 1],
  ] as const;
  const [unit, secondsPerUnit] = units.find(([, size]) => Math.abs(elapsedSeconds) >= size) ?? units[units.length - 1];
  return new Intl.RelativeTimeFormat(lang === "uk" ? "uk-UA" : "en-US", { numeric: "auto" })
    .format(Math.round(elapsedSeconds / secondsPerUnit), unit);
}

export function formatReviewDate(value: string, lang: Language): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-GB", { dateStyle: "medium" }).format(date);
}

export function formatArchiveMonth(year: number, month: number, lang: Language): string {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return `${year}-${month}`;
  return new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatMovieCount(count: number, lang: Language): string {
  if (lang === "en") return `${count} ${count === 1 ? "film" : "films"}`;
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "фільм"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "фільми"
      : "фільмів";
  return `${count} ${word}`;
}

export function formatReviewCount(count: number, lang: Language): string {
  if (lang === "en") return `${count.toLocaleString(lang)} ${Math.abs(count) === 1 ? "review" : "reviews"}`;
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "огляд"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "огляди"
      : "оглядів";
  return `${count.toLocaleString(lang)} ${word}`;
}

export function formatMovieYear(value: string | null | undefined, fallback: string): string {
  const year = value?.trim().slice(0, 4) ?? "";
  return /^\d{4}$/.test(year) ? year : fallback;
}

export function editorialText(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function localizeJournalCategory(value: string | null | undefined, t: Translator): string {
  const normalized = value?.trim();
  if (!normalized) return t("unknownJournalCategory");
  const key = journalCategoryKeys[normalized.toLocaleLowerCase()];
  return key ? t(key) : normalized;
}

export function localizeNotificationType(value: string, t: Translator): string {
  if (value === "FOLLOW") return t("notificationFollowType");
  if (value === "REVIEW_LIKED") return t("notificationReviewLikedType");
  return t("unknownNotificationType");
}

export function localizeActivityType(value: string, t: Translator): string {
  if (value === "WATCHED") return t("activityWatched");
  if (value === "FOLLOW") return t("activityFollowed");
  if (value === "RATING") return t("activityRated");
  if (value === "REVIEW") return t("activityReviewed");
  if (value === "LIST") return t("activityCreatedList");
  return t("unknownActivity");
}

export function localizeUserRole(value: string, t: Translator): string {
  if (value === "ADMIN") return t("adminRole");
  if (value === "USER") return t("userRole");
  return value;
}

export function localizeAuditAction(value: string, lang: Language): string {
  return auditTranslations[lang].actions[value] ?? (lang === "uk" ? "Інша дія адміністратора" : "Other administrator action");
}

export function localizeAuditTarget(value: string, lang: Language): string {
  return auditTranslations[lang].targets[value] ?? (lang === "uk" ? "Інший об’єкт" : "Other object");
}
