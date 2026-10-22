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
    adminUserProfile: "Профіль користувача", viewUserProfile: "Переглянути профіль", close: "Закрити", loadAdminUserError: "Не вдалося завантажити профіль користувача.", loadAdminUserOverviewError: "Не вдалося завантажити зведення користувача.", userCreatedAt: "Дата реєстрації", userStatus: "Статус", userHqStatus: "Статус HQ", hqMember: "HQ-учасник", notHqMember: "Без HQ", viewPublicProfile: "Публічний профіль", openConversation: "Написати повідомлення", adminUserStats: "Активність користувача", adminWatchedMovies: "Переглянуто фільмів", adminUserReviewsCount: "Оглядів", adminUserLikesComments: "Вподобання / коментарі", adminUserListsCount: "Створених списків", adminActionHistory: "Історія дій адміністратора", noAdminHistory: "Дій над користувачем поки немає.",
  },
  en: {
    adminUserProfile: "User profile", viewUserProfile: "View profile", close: "Close", loadAdminUserError: "Could not load this user profile.", loadAdminUserOverviewError: "Could not load this user's activity summary.", userCreatedAt: "Registered", userStatus: "Status", userHqStatus: "HQ status", hqMember: "HQ member", notHqMember: "No HQ role", viewPublicProfile: "Public profile", openConversation: "Send message", adminUserStats: "User Activity", adminWatchedMovies: "Films watched", adminUserReviewsCount: "Reviews", adminUserLikesComments: "Likes / comments", adminUserListsCount: "User-created lists", adminActionHistory: "Administrator action history", noAdminHistory: "No administrator actions for this user yet.",
  },
} as const;

const messages = {
  uk: {
    ...adminUserMessages.uk,
    interactionBlocked: "Взаємодію заблоковано",
    passwordByteLimitHint: "До 72 байтів UTF-8. Українські літери та emoji можуть займати кілька байтів.",
    passwordByteLimitError: "Пароль перевищує 72 байти UTF-8. Скоротіть його.",
    podcastAudioLoadError: "Не вдалося завантажити аудіо подкасту.",
    articleLanguageUk: "Українська", articleLanguageEn: "Англійська", tmdbIdsHint: "Напр.: 550, 603",
    noAdminArticles: "Статей не знайдено.", adminArticlesPagination: "Сторінки статей", articleLanguage: "Мова статті",
    articleCoverUrl: "URL обкладинки", editArticle: "Редагувати статтю", articleDraft: "Чернетка", articlePublished: "Опубліковано", adminArticleSaveError: "Не вдалося зберегти статтю.",
    articleCurrentCategory: "Поточна категорія",
    noAdminNotifications: "Сповіщень не знайдено.", adminNotificationsPagination: "Сторінки сповіщень",
    noAdminConversations: "Діалогів не знайдено.", adminConversationsPagination: "Сторінки діалогів",
    newsletter: "Бюлетень", newsletterEnabled: "Отримувати нові випуски на email", newsletterSaved: "Налаштування бюлетеня збережено.", newsletterError: "Не вдалося зберегти налаштування бюлетеня.", loadNewsletterError: "Не вдалося завантажити налаштування бюлетеня.", sendNewsletter: "Поставити в чергу", newsletterQueueStatus: "Черга / надіслано / помилки",
    noAdminLists: "Списків не знайдено.", adminListsPagination: "Сторінки списків", noAdminComments: "Коментарів не знайдено.", noAdminReviews: "Оглядів не знайдено.", adminCommentsPagination: "Сторінки коментарів", adminReviewsPagination: "Сторінки оглядів", adminVisibilityFilter: "Видимість", allVisibilityStates: "Усі", visibleOnly: "Лише видимі", hiddenOnly: "Лише приховані",
    adminMovies: "Фільми", noAdminMovies: "Фільмів не знайдено.", adminMovieResults: "Фільми каталогу", adminMoviesPagination: "Сторінки фільмів в адмінці", movieTitle: "Назва фільму", releaseDate: "Дата виходу", rating: "Рейтинг", posterUrl: "URL постера", editMovie: "Редагувати", deleteMovie: "Видалити", deleteMovieConfirm: "Видалити фільм", tmdbId: "TMDB ID", tmdbIds: "TMDB ID", syncTmdb: "Синхронізувати TMDB", tmdbIdRequired: "Вкажіть коректний TMDB ID.", tmdbSyncDone: "TMDB оновлено", tmdbSyncError: "Не вдалося синхронізувати TMDB.", tmdbImportTitle: "Імпорт фільмів із TMDB", tmdbQualityTitle: "Якість каталогу TMDB", tmdbQualitySummary: "Прив'язані фільми / весь каталог", tmdbCoverage: "Покриття", tmdbCompleteness: "Повнота", tmdbMissingPoster: "Без постера", tmdbMissingBackdrop: "Без backdrop", tmdbMissingPlot: "Без опису", tmdbMissingRuntime: "Без тривалості", tmdbMissingTrailer: "Без трейлера", tmdbMissingRating: "Без рейтингу TMDB", tmdbImport: "Імпортувати ID", tmdbImportLimit: "Вкажіть від 1 до 20 коректних TMDB ID.", tmdbImportDone: "Імпорт завершено", tmdbDiscoveryImport: "Знайти й імпортувати", tmdbDiscoveryInvalid: "Сторінка має бути 1–500, кількість — 1–20.", tmdbDiscoveryDone: "Discovery-імпорт завершено", tmdbImportError: "Не вдалося імпортувати фільми з TMDB.", genres: "жанрів",
    adminLists: "Списки", items: "фільмів", hiddenList: "прихований", hideList: "Приховати", publishList: "Опублікувати", deleteList: "Видалити список", deleteListConfirm: "Видалити цей кастомний список?", adminConversations: "Діалоги", adminNotifications: "Сповіщення", conversationUsers: "Користувачі", deleteConversation: "Видалити діалог", deleteNotification: "Видалити сповіщення", deleteConversationConfirm: "Видалити цей діалог і всі повідомлення?", deleteNotificationConfirm: "Видалити це сповіщення?", createNotification: "Створити сповіщення", notificationType: "Тип сповіщення", notificationFollowType: "Нова підписка", notificationReviewLikedType: "Вподобання огляду", unknownNotificationType: "Невідомий тип", notificationRecipientId: "ID отримувача", notificationActorId: "ID ініціатора", notificationReviewId: "ID огляду", notificationTypeFilter: "Фільтр типу", notificationReadFilter: "Фільтр стану", notificationRecipientFilter: "ID отримувача для фільтра", allNotificationTypes: "Усі типи", allNotificationStates: "Усі стани", filterNotifications: "Фільтрувати", markFilteredNotificationsRead: "Позначити відфільтровані прочитаними", deleteFilteredNotifications: "Видалити відфільтровані", deleteFilteredNotificationsConfirm: "Видалити всі сповіщення за поточним фільтром?", markNotificationRead: "Позначити прочитаним", markNotificationUnread: "Позначити непрочитаним", messagesCount: "повідомлень", notificationRecipient: "отримувач", notificationActor: "ініціатор", read: "прочитано", unread: "не прочитано", userSearch: "Пошук користувача", noAdminUsers: "Користувачів не знайдено.", adminUsersPagination: "Сторінки користувачів", activeUser: "активний", blockedUser: "заблокований", blockUser: "Заблокувати", activateUser: "Активувати",
    journal: "Журнал", journalRead: "Читати", journalCategory: "Розділ", allJournalCategories: "Усі розділи", journalNews: "Новини", journalAwards: "Винагороди", journalCommunity: "Спільнота", journalInterviews: "Інтерв'ю", journalPlatform: "Платформа", journalPodcasts: "Подкасти", journalNewsletter: "Бюлетень", journalArchive: "Архів", noJournalArchive: "Архів поки порожній.", clearArchive: "Показати всі місяці", journalLoadError: "Не вдалося завантажити журнал.", noJournalArticles: "Опублікованих статей поки немає.", journalEditor: "Редактор журналу", articleSlug: "Slug статті", articleTitle: "Заголовок", articleCategory: "Категорія", articleExcerpt: "Короткий опис", articleContent: "Текст статті", audioUrl: "URL аудіо подкасту", podcastAudio: "Аудіо подкасту", podcastAudioUnavailable: "Ваш браузер не підтримує аудіо.", publishArticle: "Опублікувати", adminReviews: "Огляди", hiddenReview: "прихований", visibleReview: "видимий", hideReview: "Приховати", unhideReview: "Повернути", help: "Допомога", contact: "Контакти", rules: "Правила", privacy: "Приватність", filmData: "Дані фільмів", deleteAccount: "Видалення акаунта", helpTitle: "Допомога", helpBody: "Якщо виникла проблема, перевірте вхід, cookies і з'єднання з API. Для повідомлення про помилку підготуйте URL і час події.", contactTitle: "Контакти", contactBody: "Напишіть команді Rewind через контактний канал вашого навчального проєкту. Не надсилайте пароль або refresh token.", rulesTitle: "Правила користування", rulesBody: "Поважайте інших учасників, не публікуйте незаконний або шкідливий контент і не обходьте обмеження доступу. Порушення можуть бути приховані модераторами.", privacyTitle: "Політика приватності", privacyBody: "Публічні профілі не містять email і службових полів. Дані сесії зберігаються в HttpOnly cookies, а пароль — лише як хеш.", filmDataTitle: "Дані фільмів", filmDataBody: "Каталог і зображення фільмів надходять із дозволених зовнішніх джерел. Зовнішній рейтинг показується лише коли він фактично збережений.", deleteAccountTitle: "Видалення акаунта", deleteAccountBody: "Увійдіть у профіль і скористайтеся формою видалення акаунта. Потрібен поточний пароль; усі списки, оцінки, огляди та сесії буде видалено.",
    home: "Головна", films: "Фільми", login: "Увійти", logout: "Вийти", logoutError: "Не вдалося вийти. Спробуйте ще раз.", register: "Реєстрація", menu: "Меню", closeMenu: "Закрити меню", moreNavigation: "Додаткова навігація", deleteAccountConfirm: "Видалити акаунт і всі пов'язані дані? Цю дію не можна скасувати.", deleteAccountWarning: "Видалення акаунта назавжди прибере ваші списки, оцінки, огляди та сесію.", deleteAccountError: "Не вдалося видалити акаунт. Перевірте пароль.",
    lists: "Мої списки", profile: "Профіль", users: "Користувачі", browseFilms: "Переглянути фільми", globalSearch: "Глобальний пошук", globalSearchIntro: "Знайдіть фільми, людей, списки, теги та матеріали журналу.", globalSearchPlaceholder: "Пошук у Rewind", globalSearchResults: "Категорії результатів", searchShortcuts: "Швидкі переходи пошуку", popularFilms: "Популярні фільми", searchMembers: "Учасники", searchLists: "Списки", searchTags: "Теги", searchPeople: "Актори й команда", searchReviews: "Огляди", searchJournal: "Журнал", loadingSearch: "Пошук у Rewind...", searchError: "Не вдалося виконати пошук.", noGlobalResults: "Нічого не знайдено.", noGlobalResultsHint: "Спробуйте змінити запит або перегляньте всі категорії.", discoverListsIntro: "Колекції фільмів, до яких хочеться повертатися.",
    searchFilms: "Пошук фільмів", search: "Пошук", searchIntro: "Знайдіть наступний фільм для свого списку.", loadingFilms: "Завантаження фільмів...",
    genre: "Жанр", allGenres: "Усі жанри", year: "Рік", minRating: "Рейтинг від", anyRating: "Будь-який", filters: "Фільтри",
    sortBy: "Сортувати", sortNewest: "Новіші", sortOldest: "Старіші", sortBestRated: "Найвища оцінка", sortLowestRated: "Найнижча оцінка", sortTitle: "За назвою", sortPopularReviews: "Популярністю",
    applyFilters: "Застосувати", loadGenresError: "Не вдалося завантажити жанри.", retry: "Спробувати ще", resultsCount: "Знайдено фільмів",
    pagination: "Сторінки фільмів", profileCollectionPagination: "Сторінки колекції профілю", publicProfileListsPagination: "Сторінки публічних списків профілю", publicListsPagination: "Сторінки публічних списків", journalPagination: "Сторінки журналу", previous: "Назад", next: "Далі", page: "Сторінка", of: "з", limit: "Кількість",
      homeEyebrow: "Rewind — ваш кіножурнал", homeTitle: "Позначайте переглянуті фільми. Зберігайте ті, що хочете подивитися. Діліться враженнями з друзями.", homeSubtitle: "Відкривайте стрічки, діліться оцінками та збирайте власні списки.", joinRewind: "Створити акаунт", getStarted: "Почати", homeGuestReleases: "Rewind допомагає вам…", homeGuestExplainerTitle: "Зберігайте свою історію переглядів", homeGuestExplainerText: "Позначайте переглянуті фільми або зберігайте ті, що хочете подивитися.",
      homeWelcomeTitle: "З поверненням. Ось що ми дивимося…", homeWelcomeSubtitle: "Головна стане персоналізованою, щойно ви почнете стежити за активними учасниками Rewind.", homeNewOnRewind: "Нове у Rewind", homeYourActivity: "Ваша активність",
    loadingHome: "Завантаження головної сторінки...", loadHomeError: "Не вдалося завантажити головну сторінку.", popularThisWeek: "Популярне", newReleases: "Нові релізи", viewAll: "Переглянути всі", readMore: "Читати далі",
    allSearchResults: "Усі", showingSearchMatches: "Результати для", showSearchResultsFor: "Показати результати", backToHome: "На головну", notFoundTitle: "Ой! Сторінку не знайдено", notFoundMessage: "Схоже, цей фрагмент вирізали з фінального монтажу. Сторінка зникла, але ви завжди можете повернутися до Rewind.",
    listsLandingIntro: "Колекції фільмів, до яких хочеться повертатися. Збирайте, упорядковуйте й діліться ними.", startOwnLists: "Створіть власний список",
    listInformation: "Інформація про список",
    popularReviewers: "Популярні рецензенти", popularReviewersIntro: "Переглядайте профілі найпопулярніших і найшанованіших рецензентів.", sortByPopularity: "За популярністю", reviewerMetrics: "Статистика рецензента", reviewCountUnit: "оглядів", name: "Ім’я", noPopularReviewers: "Рецензентів з вподобаннями поки немає.", socialLinks: "Соціальні посилання", noSocialLinks: "Соціальні посилання не додані.", socialLinksSaved: "Соціальні посилання збережено.", loadSocialLinksError: "Не вдалося завантажити соціальні посилання.", socialLinksSaveError: "Не вдалося зберегти соціальні посилання.", community: "Спільнота", communitySubtitle: "Знайомтеся з активними рецензентами, HQ-учасниками та користувачами Rewind.", loadCommunityError: "Не вдалося завантажити спільноту.", noHqUsers: "HQ-учасників поки немає.", allUsers: "Усі користувачі", noUsers: "Користувачів поки немає.", communityUsersPagination: "Сторінки користувачів спільноти", searchUsers: "Пошук користувачів", recentWatched: "Щойно переглянуто", noRecentWatched: "Щойно переглянутих фільмів поки немає.", activityWatched: "переглянув(-ла)",
    socialWebsite: "Вебсайт", socialInstagram: "Instagram", socialTiktok: "TikTok", socialLetterboxd: "Letterboxd",
    latestJournal: "Останнє з журналу", noLatestJournal: "Новин журналу поки немає.", homePopularReviews: "Популярні огляди", popularLists: "Публічні списки", noRecentReviews: "Оглядів поки немає.", noPublicLists: "Публічних списків поки немає.", byUser: "від",
    loadFilmsError: "Не вдалося завантажити фільми. Перевірте API.", noFilms: "Фільмів не знайдено.",
    unknownYear: "Рік невідомий", about: "Про нас", credits: "Джерела",
    loading: "Завантаження...", appErrorTitle: "Сталася помилка", appErrorMessage: "Перезавантажте сторінку та спробуйте ще раз.", reload: "Перезавантажити", save: "Зберегти", create: "Створити", add: "Додати", remove: "Прибрати",
    loadMovieError: "Не вдалося завантажити фільм.", saved: "Збережено.", watched: "Переглянуто",
    watchlist: "До перегляду", favorite: "Улюблене", myActions: "Мої дії", myRating: "Ваша оцінка",
    none: "немає", addToList: "Додати в список", chooseList: "Оберіть список",
    actors: "Актори", directors: "Режисери", producers: "Продюсери", similarFilms: "Схожі фільми", reviews: "Огляди", storyline: "Сюжет", favoriteFilms: "Улюблені фільми",
    noReviews: "Оглядів поки немає.", yourReview: "Ваш огляд", publishReview: "Опублікувати огляд",
    editReview: "Редагувати", deleteReview: "Видалити огляд", saveReview: "Зберегти огляд", cancel: "Скасувати",
    reviewUpdated: "Огляд оновлено.", reviewDeleted: "Огляд видалено.", deleteReviewConfirm: "Видалити ваш огляд? Оцінка залишиться.",
    loadMyReviewError: "Не вдалося завантажити ваш огляд.", updateReviewError: "Не вдалося оновити огляд.", deleteReviewError: "Не вдалося видалити огляд.",
    deleteRating: "Видалити оцінку", ratingDeleted: "Оцінку видалено.", deleteRatingError: "Не вдалося видалити оцінку.",
    signInToReview: "щоб оцінити чи написати огляд.", trailer: "Трейлер", watchTrailer: "Переглянути трейлер", trailerUnavailable: "Трейлер ще не додано.", noSimilarFilms: "Схожі фільми поки не знайдені.",
    myProfile: "Мій профіль", displayName: "Відображуване ім'я", changePassword: "Змінити пароль",
    currentPassword: "Поточний пароль", newPassword: "Новий пароль", saving: "Збереження…", deleting: "Видалення…", recentRatings: "Останні оцінки",
    recentReviews: "Останні огляди", likedReviews: "Вподобані огляди", noLikedReviews: "Вподобаних оглядів поки немає.", loadLikedReviewsError: "Не вдалося завантажити вподобані огляди.", likedReviewsPagination: "Сторінки вподобаних оглядів", newList: "Новий список", emptyList: "Тут поки немає фільмів. Додайте їх зі сторінки фільму.",
    welcome: "З поверненням", email: "Електронна пошта", password: "Пароль", forgotPassword: "Забули пароль?", signInWith: "Увійти через",
    loggingIn: "Вхід...", noAccount: "Немає акаунта?", createOne: "Створити",
    createAccount: "Створити акаунт", username: "Нікнейм", accountCreated: "Акаунт створено", goToLogin: "Перейти до входу",
    alreadyAccount: "Вже маєте акаунт?", return: "Назад", forgotTitle: "Забули пароль?",
    forgotDescription: "Введіть електронну пошту, і ми надішлемо посилання для відновлення пароля.",
    resetPassword: "Відновити пароль", resetTitle: "Встановити новий пароль", confirmPassword: "Повторіть пароль",
    resetSuccess: "Пароль змінено.", resetInvalid: "Посилання недійсне або його час минув.", resetMissing: "У посиланні немає токена відновлення.",
    resetSent: "Якщо акаунт існує, лист із посиланням надіслано.",
    loginError: "Невірна пошта або пароль.", registrationError: "Не вдалося зареєструватися.",
    footerMade: "Створено студентами в Києві, Україна.", filmDataFrom: "Дані фільмів з TMDB.", tmdbDisclaimer: "Цей продукт використовує TMDB API, але не схвалений і не сертифікований TMDB.",
    aboutIntro: "Rewind — щоденник фільмів і спільнота, створена студентами в Києві, Україна.",
    filmDataAndImages: "Дані та зображення фільмів", confirmMismatch: "Паролі не збігаються.",
    invalidMovieId: "Некоректний номер фільму.", invalidProfileId: "Некоректне посилання на профіль.", invalidReviewId: "Некоректне посилання на огляд.",
    loadProfileError: "Не вдалося завантажити профіль.", nameSaved: "Ім'я оновлено.",
    saveNameError: "Не вдалося зберегти ім'я.", passwordChanged: "Пароль змінено.",
    changePasswordError: "Перевірте поточний і новий пароль.", passwordChangedSignIn: "Пароль змінено. Увійдіть знову.", passwordChangedLogoutError: "Пароль змінено, але не вдалося вийти. Спробуйте вийти вручну.", loadListsError: "Не вдалося завантажити списки.",
    loadItemsError: "Не вдалося завантажити фільми.", createListError: "Не вдалося створити список.",
    removeItemError: "Не вдалося видалити фільм зі списку.", changeListError: "Не вдалося змінити список.",
    saveRatingError: "Не вдалося зберегти оцінку.", rateFirst: "Спочатку поставте оцінку.",
    reviewPublished: "Огляд опубліковано.", createReviewError: "Не вдалося додати огляд. На один фільм дозволено один активний огляд.",
    filmAdded: "Фільм додано до списку.", addFilmError: "Не вдалося додати фільм до списку.",
    commentsSection: "Коментарі", showComments: "Показати коментарі", hideComments: "Сховати коментарі", commentsPagination: "Сторінки коментарів", noComments: "Коментарів поки немає.", yourComment: "Ваш коментар", sendComment: "Надіслати",
    editComment: "Редагувати коментар", deleteComment: "Видалити коментар", deleteCommentConfirm: "Видалити цей коментар?", loginToComment: "Увійдіть, щоб залишити коментар.",
    loadCommentsError: "Не вдалося завантажити коментарі.", createCommentError: "Не вдалося додати коментар.", updateCommentError: "Не вдалося оновити коментар.", deleteCommentError: "Не вдалося видалити коментар.",
    listBy: "Список від", emptyPublicList: "У цьому списку поки немає фільмів.", invalidListId: "Некоректне посилання на список.", loadPublicListError: "Не вдалося завантажити публічний список.",
    description: "Опис", createListIntro: "Збирайте фільми в добірку, до якої захочеться повертатися.", publicList: "Публічний список", privateList: "Приватний список", listName: "Назва списку", updateListError: "Не вдалося оновити список.", reorderListError: "Не вдалося змінити порядок фільмів.", deleteListError: "Не вдалося видалити список.", listDeleted: "Список видалено.", deletingList: "Видалення…", moveUp: "Перемістити вище", moveDown: "Перемістити нижче",
    tags: "Теги", tagsHint: "Через кому, до 10", popularTags: "Популярні теги", noTags: "Тегів поки немає.", loadTagsError: "Не вдалося завантажити популярні теги.", discoverLists: "Добірки", listsTaggedHeading: "Усі списки за тегом", noTaggedLists: "За цим тегом списків поки немає.", listFeeds: "Добірки списків", featuredLists: "Вибрані добірки", featuredListsIntro: "Стартовий набір від спільноти Rewind та авторів платформи.", popularListsTitle: "Популярні добірки", popularListsIntro: "Переглядайте найпопулярніші добірки від спільноти Rewind.", recentlyLikedListsTitle: "Нещодавно вподобані добірки", recentlyLikedListsIntro: "Добірки, які останнім часом сподобалися спільноті.", recentListsTitle: "Нові добірки", recentListsIntro: "Свіжі добірки фільмів від авторів Rewind.", listFeedTeamSection: "Спільнота Rewind", listFeedRecent: "Нові", listFeedPopular: "Популярні", listFeedRecentlyLiked: "Нещодавно вподобані", listFeedTeam: "Списки команди", likeList: "Вподобати список", unlikeList: "Прибрати вподобання", listLikeError: "Не вдалося змінити вподобання списку.",
    notificationActionError: "Не вдалося змінити стан сповіщення.", loadNotificationPreferencesError: "Не вдалося завантажити налаштування сповіщень.", notificationsPagination: "Сторінки сповіщень",
    notifications: "Сповіщення", noNotifications: "Нових сповіщень немає.", loadNotificationsError: "Не вдалося завантажити сповіщення.", markRead: "Прочитано", markAllNotificationsRead: "Позначити все прочитаним", notificationFollowedYou: "підписався(-лася) на вас", notificationLikedReview: "вподобав(-ла) ваш огляд", someone: "Хтось", notificationPreferences: "Налаштування сповіщень", notifyOnFollow: "Нові підписки", notifyOnReviewLike: "Вподобання моїх оглядів", notificationPreferencesSaved: "Налаштування збережено.", notificationPreferencesError: "Не вдалося зберегти налаштування.", messages: "Повідомлення", conversations: "Діалоги", noConversations: "Діалогів поки немає.", loadConversationsError: "Не вдалося завантажити діалоги.", startConversationError: "Не вдалося відкрити діалог.", conversationsPagination: "Сторінки діалогів", chooseConversation: "Оберіть діалог.", noMessages: "У цьому діалозі ще немає повідомлень.", emptyMessageBody: "Повідомлення без тексту", loadMessagesError: "Не вдалося завантажити або надіслати повідомлення.", messagesPagination: "Сторінки повідомлень", newerMessages: "Новіші", olderMessages: "Старіші", messageText: "Текст повідомлення", sendMessage: "Написати", messagesError: "Не вдалося завантажити або надіслати повідомлення.", hq: "HQ", adminDashboard: "Панель адміністратора", adminLoadError: "Не вдалося завантажити адмін-панель.", adminSelfChangeError: "Не можна деактивувати або понизити власний акаунт адміністратора.", adminLastAdminError: "Має залишатися хоча б один активний адміністратор.", adminUsers: "Користувачі", adminComments: "Коментарі", hiddenComment: "прихований", visibleComment: "видимий", hideComment: "Приховати", unhideComment: "Повернути", auditLogs: "Журнал дій", noAuditLogs: "Дій поки немає.", adminAuditPagination: "Сторінки журналу дій", grantHq: "Призначити HQ", revokeHq: "Зняти HQ", activeUsers: "Активні", hqUsers: "HQ-користувачі", movies: "Фільми", hiddenReviews: "Приховані огляди", moderationQueue: "Черга модерації", noModerationItems: "Черга модерації порожня.", moderationReview: "Огляд", moderationComment: "Коментар", moderationTypeFilter: "Фільтр типу модерації", allModerationTypes: "Усі типи", moderationSearch: "Пошук у черзі", filterModeration: "Фільтрувати", selectAllModeration: "Вибрати все", moderationReason: "Причина модерації", hideSelectedModeration: "Приховати вибране", hideSelectedModerationConfirm: "Приховати вибрані елементи?", moderationDefaultReason: "Порушення правил", adminSettings: "Налаштування сайту", noAdminSettings: "Налаштувань поки немає.", saveSetting: "Зберегти",
    profileIdentity: "Дані профілю", profileStats: "Статистика", ratingDistribution: "Розподіл оцінок", noRatingDistribution: "Оцінок поки немає.", publicLists: "Публічні списки", ratings: "Оцінки", loadPublicProfileError: "Не вдалося завантажити профіль користувача.",
    markMessagesReadError: "Не вдалося позначити діалог прочитаним.", sendMessageError: "Не вдалося надіслати повідомлення.", adminSaveError: "Не вдалося зберегти налаштування.", adminMovieCreateError: "Не вдалося створити фільм.", adminMovieSaveError: "Не вдалося зберегти фільм.", adminMovieDeleteError: "Не вдалося видалити фільм.", adminArticleCreateError: "Не вдалося створити статтю.", adminNewsletterError: "Не вдалося поставити бюлетень у чергу.", adminCommentModerationError: "Не вдалося змінити видимість коментаря.", adminConversationDeleteError: "Не вдалося видалити діалог.", adminListVisibilityError: "Не вдалося змінити видимість списку.", adminListDeleteError: "Не вдалося видалити список.", adminUserActionError: "Не вдалося змінити користувача.", adminReviewModerationError: "Не вдалося змінити видимість огляду.", adminModerationActionError: "Не вдалося виконати модерацію.", adminNotificationActionError: "Не вдалося виконати дію зі сповіщенням.", tmdbQualityError: "Не вдалося завантажити якість каталогу TMDB.",
    profileCollections: "Мої фільми", noCollectionFilms: "У цій добірці поки немає фільмів.", loadCollectionError: "Не вдалося завантажити добірку.", noLists: "Списків поки немає.", listsPagination: "Сторінки списків", reviewsPagination: "Сторінки оглядів",
    allRatings: "Усі оцінки", allReviews: "Усі огляди", noRatings: "Оцінок поки немає.", loadRatingsError: "Не вдалося завантажити оцінки.", loadReviewsError: "Не вдалося завантажити огляди.",
    follow: "Підписатися", unfollow: "Відписатися", blockProfileUser: "Заблокувати", unblockUser: "Розблокувати", blockError: "Не вдалося змінити блокування.", followers: "Підписники", following: "Підписки", noFollowers: "Підписників поки немає.", noFollowing: "Підписок поки немає.", loadNetworkError: "Не вдалося завантажити мережу користувача.", networkPagination: "Сторінки мережі", followError: "Не вдалося змінити підписку.", loadFollowStatusError: "Не вдалося перевірити стан підписки.", loadBlockStatusError: "Не вдалося перевірити стан блокування.",
    likes: "Вподобання", like: "Вподобати", unlike: "Прибрати вподобання", likeReviewError: "Не вдалося змінити вподобання.", review: "Огляд", reviewBy: "Огляд від", loadingReview: "Завантаження огляду...", reviewUnavailable: "Огляд недоступний", loadReviewError: "Не вдалося завантажити цей огляд.", backToMovie: "Назад до фільму", membersWhoLikedReview: "Кому сподобався цей огляд", noReviewLikes: "Цей огляд ще ніхто не вподобав.", loginToLikeReview: "Увійдіть, щоб вподобати",
    recentActivity: "Остання активність", noActivity: "Активності поки немає.", loadActivityError: "Не вдалося завантажити активність.", activityPagination: "Сторінки активності", activityFollowed: "підписався(-лася) на", activityRated: "оцінив(-ла)", activityReviewed: "написав(-ла) огляд до", activityCreatedList: "створив(-ла) список", unknownActivity: "Невідома активність", adminRole: "роль адміністратора", userRole: "роль користувача",
    avatarUrl: "Посилання на аватар", invalidAvatarUrl: "Вкажіть повне посилання на зображення (http або https).", invalidSocialLinkUrl: "Вкажіть коректне посилання на соціальний профіль (http або https).",
    filmography: "Фільмографія", invalidPersonId: "Некоректне посилання на персоналію.", loadPersonError: "Не вдалося завантажити сторінку персоналії.",
    poster: "Постер", minutes: "хв", rateAs: "Оцінити на", rateFilm: "Оцінити фільм", done: "Готово", share: "Поділитися", unknownPerson: "Персоналія без імені", untitledFilm: "Фільм без назви",
    journalIntro: "Історії, розмови й новини спільноти Rewind.", notificationsIntro: "Будьте в курсі підписок і взаємодії з вашими оглядами.", messagesIntro: "Приватні розмови з учасниками спільноти Rewind.", unknownJournalCategory: "Без розділу", untitledArticle: "Стаття без заголовка", noArticleContent: "Текст цієї статті ще не додано.",
    mainNavigation: "Головна навігація", accountEyebrow: "REWIND / АКАУНТ", journalEyebrow: "Редакція Rewind", socialEyebrow: "Спільнота Rewind", discoverEyebrow: "REWIND / ВІДКРИТТЯ", emptyEyebrow: "REWIND / ПОРОЖНЬО", searchEyebrow: "REWIND / ПОШУК", collectionsEyebrow: "REWIND / ДОБІРКИ", listEyebrow: "REWIND / СПИСОК", listsEyebrow: "REWIND / СПИСКИ", previewLabel: "ПЕРЕГЛЯД", emptyListLabel: "ПОРОЖНІЙ СПИСОК", journalArchiveError: "Не вдалося завантажити архів.",
  },
  en: {
    ...adminUserMessages.en,
    interactionBlocked: "Interaction blocked",
    passwordByteLimitHint: "Up to 72 UTF-8 bytes. Ukrainian letters and emoji may use multiple bytes.",
    passwordByteLimitError: "Password exceeds 72 UTF-8 bytes. Shorten it.",
    podcastAudioLoadError: "Could not load podcast audio.",
    articleLanguageUk: "Ukrainian", articleLanguageEn: "English", tmdbIdsHint: "e.g. 550, 603",
    noAdminArticles: "No articles found.", adminArticlesPagination: "Article pages", articleLanguage: "Article language",
    articleCoverUrl: "Cover URL", editArticle: "Edit article", articleDraft: "Draft", articlePublished: "Published", adminArticleSaveError: "Could not save the article.",
    articleCurrentCategory: "Current category",
    noAdminNotifications: "No notifications found.", adminNotificationsPagination: "Notification pages",
    noAdminConversations: "No conversations found.", adminConversationsPagination: "Conversation pages",
    newsletter: "Newsletter", newsletterEnabled: "Receive new issues by email", newsletterSaved: "Newsletter settings saved.", newsletterError: "Could not save newsletter settings.", loadNewsletterError: "Could not load newsletter settings.", sendNewsletter: "Queue newsletter", newsletterQueueStatus: "Queued / sent / failed",
    noAdminLists: "No lists found.", adminListsPagination: "List pages", noAdminComments: "No comments found.", noAdminReviews: "No reviews found.", adminCommentsPagination: "Comment pages", adminReviewsPagination: "Review pages", adminVisibilityFilter: "Visibility", allVisibilityStates: "All", visibleOnly: "Visible only", hiddenOnly: "Hidden only",
    adminMovies: "Films", noAdminMovies: "No films found.", adminMovieResults: "Catalog films", adminMoviesPagination: "Admin film pages", movieTitle: "Film title", releaseDate: "Release date", rating: "Rating", posterUrl: "Poster URL", editMovie: "Edit", deleteMovie: "Delete", deleteMovieConfirm: "Delete film", tmdbId: "TMDB ID", tmdbIds: "TMDB IDs", syncTmdb: "Sync TMDB", tmdbIdRequired: "Enter a valid TMDB ID.", tmdbSyncDone: "TMDB updated", tmdbSyncError: "Could not sync TMDB.", tmdbImportTitle: "Import films from TMDB", tmdbQualityTitle: "TMDB catalog quality", tmdbQualitySummary: "Linked films / full catalog", tmdbCoverage: "Coverage", tmdbCompleteness: "Completeness", tmdbMissingPoster: "Missing poster", tmdbMissingBackdrop: "Missing backdrop", tmdbMissingPlot: "Missing plot", tmdbMissingRuntime: "Missing runtime", tmdbMissingTrailer: "Missing trailer", tmdbMissingRating: "Missing TMDB rating", tmdbImport: "Import IDs", tmdbImportLimit: "Enter 1 to 20 valid TMDB IDs.", tmdbImportDone: "Import completed", tmdbDiscoveryImport: "Discover and import", tmdbDiscoveryInvalid: "Page must be 1–500 and count must be 1–20.", tmdbDiscoveryDone: "Discovery import completed", tmdbImportError: "Could not import films from TMDB.", genres: "genres",
    adminLists: "Lists", items: "films", hiddenList: "hidden", hideList: "Hide", publishList: "Publish", deleteList: "Delete list", deleteListConfirm: "Delete this custom list?", adminConversations: "Conversations", adminNotifications: "Notifications", conversationUsers: "Users", deleteConversation: "Delete conversation", deleteNotification: "Delete notification", deleteConversationConfirm: "Delete this conversation and all messages?", deleteNotificationConfirm: "Delete this notification?", createNotification: "Create notification", notificationType: "Notification type", notificationFollowType: "New follower", notificationReviewLikedType: "Review liked", unknownNotificationType: "Unknown type", notificationRecipientId: "Recipient ID", notificationActorId: "Actor ID", notificationReviewId: "Review ID", notificationTypeFilter: "Type filter", notificationReadFilter: "Read state filter", notificationRecipientFilter: "Recipient ID filter", allNotificationTypes: "All types", allNotificationStates: "All states", filterNotifications: "Filter", markFilteredNotificationsRead: "Mark filtered as read", deleteFilteredNotifications: "Delete filtered", deleteFilteredNotificationsConfirm: "Delete all notifications matching the current filter?", markNotificationRead: "Mark as read", markNotificationUnread: "Mark as unread", messagesCount: "messages", notificationRecipient: "recipient", notificationActor: "actor", read: "read", unread: "unread", userSearch: "Search users", noAdminUsers: "No users found.", adminUsersPagination: "User pages", activeUser: "active", blockedUser: "blocked", blockUser: "Block", activateUser: "Activate",
    journal: "Journal", journalRead: "Read", journalCategory: "Section", allJournalCategories: "All sections", journalNews: "News", journalAwards: "Awards", journalCommunity: "Community", journalInterviews: "Interviews", journalPlatform: "Platform", journalPodcasts: "Podcasts", journalNewsletter: "Newsletter", journalArchive: "Archive", noJournalArchive: "The archive is empty.", clearArchive: "Show all months", journalLoadError: "Could not load the journal.", noJournalArticles: "No published articles yet.", journalEditor: "Journal editor", articleSlug: "Article slug", articleTitle: "Title", articleCategory: "Category", articleExcerpt: "Excerpt", articleContent: "Article content", audioUrl: "Podcast audio URL", podcastAudio: "Podcast audio", podcastAudioUnavailable: "Your browser does not support audio.", publishArticle: "Publish", adminReviews: "Reviews", hiddenReview: "hidden", visibleReview: "visible", hideReview: "Hide", unhideReview: "Restore", help: "Help", contact: "Contact", rules: "Rules", privacy: "Privacy", filmData: "Film data", deleteAccount: "Delete account", helpTitle: "Help", helpBody: "If something is wrong, check your sign-in, cookies, and API connection. Include the URL and time when reporting an error.", contactTitle: "Contact", contactBody: "Contact the Rewind team through the channel for your education project. Never send a password or refresh token.", rulesTitle: "Terms of use", rulesBody: "Respect other members, do not publish illegal or harmful content, and do not bypass access controls. Moderators may hide violations.", privacyTitle: "Privacy policy", privacyBody: "Public profiles do not expose email or service fields. Session data uses HttpOnly cookies, and passwords are stored only as hashes.", filmDataTitle: "Film data", filmDataBody: "Film metadata and images come from permitted external sources. An external rating is shown only when it is actually stored.", deleteAccountTitle: "Delete account", deleteAccountBody: "Sign in, open your profile, and use the delete account form. Your current password is required; lists, ratings, reviews, and sessions will be removed.",
    home: "Home", films: "Films", login: "Log in", logout: "Log out", logoutError: "Could not log out. Please try again.", register: "Register", menu: "Menu", closeMenu: "Close menu", moreNavigation: "More navigation", deleteAccountConfirm: "Delete the account and all related data? This cannot be undone.", deleteAccountWarning: "Deleting the account permanently removes your lists, ratings, reviews, and sessions.", deleteAccountError: "Could not delete the account. Check your password.",
    lists: "My lists", profile: "Profile", users: "Users", browseFilms: "Browse films", globalSearch: "Global search", globalSearchIntro: "Find films, people, lists, tags, and journal stories.", globalSearchPlaceholder: "Search Rewind", globalSearchResults: "Search result categories", searchShortcuts: "Search shortcuts", popularFilms: "Popular films", searchMembers: "Members", searchLists: "Lists", searchTags: "Tags", searchPeople: "Cast & crew", searchReviews: "Reviews", searchJournal: "Journal", loadingSearch: "Searching Rewind...", searchError: "Could not complete the search.", noGlobalResults: "No matches found.", noGlobalResultsHint: "Try a different query or browse all result categories.", discoverListsIntro: "Film collections worth coming back to.",
    searchFilms: "Search films", search: "Search", searchIntro: "Find the next film for your list.", loadingFilms: "Loading films...",
    genre: "Genre", allGenres: "All genres", year: "Year", minRating: "Minimum rating", anyRating: "Any", filters: "Filters",
    sortBy: "Sort by", sortNewest: "Newest", sortOldest: "Oldest", sortBestRated: "Highest rated", sortLowestRated: "Lowest rated", sortTitle: "Title", sortPopularReviews: "Popularity",
    applyFilters: "Apply", loadGenresError: "Could not load genres.", retry: "Retry", resultsCount: "Films found",
    pagination: "Film pages", profileCollectionPagination: "Profile collection pages", publicProfileListsPagination: "Public profile list pages", publicListsPagination: "Public list pages", journalPagination: "Journal pages", previous: "Previous", next: "Next", page: "Page", of: "of", limit: "Count",
      homeEyebrow: "Rewind — your film diary", homeTitle: "Track films you’ve watched. Save those you want to see. Tell your friends what’s good.", homeSubtitle: "Discover films, share your ratings, and build your own lists.", joinRewind: "Create account", getStarted: "Get Started", homeGuestReleases: "Rewind lets you…", homeGuestExplainerTitle: "Keep track of every film you’ve ever watched", homeGuestExplainerText: "or just start from the day you join.",
      homeWelcomeTitle: "Welcome back. Here’s what we’ve been watching…", homeWelcomeSubtitle: "This homepage will become customized as you follow active members on Rewind.", homeNewOnRewind: "New on Rewind", homeYourActivity: "Your activity",
    loadingHome: "Loading the home page...", loadHomeError: "Could not load the home page.", popularThisWeek: "Popular now", newReleases: "New releases", viewAll: "View all", readMore: "Read more",
    allSearchResults: "All", showingSearchMatches: "Showing matches for", showSearchResultsFor: "Show results for", backToHome: "Back to home", notFoundTitle: "Ooops! Page not found", notFoundMessage: "Looks like you’ve reached a moment that was cut from the final edit. This page is missing, but you can always rewind.",
    listsLandingIntro: "Film collections worth coming back to. Collect, curate, and share them.", startOwnLists: "Start your own lists",
    listInformation: "List information",
    popularReviewers: "Popular reviewers", popularReviewersIntro: "Explore the profiles of our most followed and respected reviewers.", sortByPopularity: "Sort by popularity", reviewerMetrics: "Reviewer statistics", reviewCountUnit: "reviews", name: "Name", noPopularReviewers: "No reviewers have likes yet.", socialLinks: "Social links", noSocialLinks: "No social links added.", socialLinksSaved: "Social links saved.", loadSocialLinksError: "Could not load social links.", socialLinksSaveError: "Could not save social links.", community: "Community", communitySubtitle: "Meet active reviewers, HQ members, and Rewind users.", loadCommunityError: "Could not load the community.", noHqUsers: "There are no HQ members yet.", allUsers: "All users", noUsers: "There are no users yet.", communityUsersPagination: "Community user pages", searchUsers: "Search users", recentWatched: "Recently watched", noRecentWatched: "No recently watched films yet.", activityWatched: "watched",
    socialWebsite: "Website", socialInstagram: "Instagram", socialTiktok: "TikTok", socialLetterboxd: "Letterboxd",
    latestJournal: "Latest from the journal", noLatestJournal: "No journal updates yet.", homePopularReviews: "Popular reviews", popularLists: "Public lists", noRecentReviews: "No reviews yet.", noPublicLists: "No public lists yet.", byUser: "by",
    loadFilmsError: "Could not load films. Check that the API is running.", noFilms: "No films found.",
    unknownYear: "Year unknown", about: "About us", credits: "Credits",
    loading: "Loading...", appErrorTitle: "Something went wrong", appErrorMessage: "Reload the page and try again.", reload: "Reload", save: "Save", create: "Create", add: "Add", remove: "Remove",
    loadMovieError: "Could not load the film.", saved: "Saved.", watched: "Watched",
    watchlist: "Watchlist", favorite: "Favorite", myActions: "My actions", myRating: "Your rating",
    none: "none", addToList: "Add to list", chooseList: "Choose a list",
    actors: "Cast", directors: "Directors", producers: "Producers", similarFilms: "Similar films", reviews: "Reviews", storyline: "Storyline", favoriteFilms: "Favorite films",
    noReviews: "No reviews yet.", yourReview: "Your review", publishReview: "Publish review",
    editReview: "Edit", deleteReview: "Delete review", saveReview: "Save review", cancel: "Cancel",
    reviewUpdated: "Review updated.", reviewDeleted: "Review deleted.", deleteReviewConfirm: "Delete your review? Your rating will remain.",
    loadMyReviewError: "Could not load your review.", updateReviewError: "Could not update the review.", deleteReviewError: "Could not delete the review.",
    deleteRating: "Delete rating", ratingDeleted: "Rating deleted.", deleteRatingError: "Could not delete the rating.",
    signInToReview: "to rate or write a review.", trailer: "Trailer", watchTrailer: "Watch trailer", trailerUnavailable: "A trailer has not been added yet.", noSimilarFilms: "No similar films found yet.",
    myProfile: "My profile", displayName: "Display name", changePassword: "Change password",
    currentPassword: "Current password", newPassword: "New password", saving: "Saving…", deleting: "Deleting…", recentRatings: "Recent ratings",
    recentReviews: "Recent reviews", likedReviews: "Liked reviews", noLikedReviews: "No liked reviews yet.", loadLikedReviewsError: "Could not load liked reviews.", likedReviewsPagination: "Liked review pages", newList: "New list", emptyList: "This list is empty. Add films from their pages.",
    welcome: "Welcome back", email: "Email", password: "Password", forgotPassword: "Forgot password?", signInWith: "Sign in with",
    loggingIn: "Logging in...", noAccount: "Don't have an account?", createOne: "Create one",
    createAccount: "Create your account", username: "Username", accountCreated: "Account created", goToLogin: "Go to login",
    alreadyAccount: "Already have an account?", return: "Return", forgotTitle: "Forgot your password?",
    forgotDescription: "Enter your email address and we will send you a link to reset your password.",
    resetPassword: "Reset password", resetTitle: "Set a new password", confirmPassword: "Confirm password",
    resetSuccess: "Password changed.", resetInvalid: "The link is invalid or has expired.", resetMissing: "The reset link has no token.",
    resetSent: "If the account exists, a reset link has been sent.",
    loginError: "Invalid email or password.", registrationError: "Registration failed.",
    footerMade: "Made by students in Kyiv, Ukraine.", filmDataFrom: "Film data from TMDB.", tmdbDisclaimer: "This product uses the TMDB API but is not endorsed or certified by TMDB.",
    aboutIntro: "Rewind is a film diary and community project built by students in Kyiv, Ukraine.",
    filmDataAndImages: "Film data and images", confirmMismatch: "Passwords do not match.",
    invalidMovieId: "Invalid film ID.", invalidProfileId: "Invalid profile link.", invalidReviewId: "Invalid review link.",
    loadProfileError: "Could not load your profile.", nameSaved: "Name updated.",
    saveNameError: "Could not save the name.", passwordChanged: "Password changed.",
    changePasswordError: "Check your current and new passwords.", passwordChangedSignIn: "Password changed. Please log in again.", passwordChangedLogoutError: "Password changed, but sign-out failed. Please sign out manually.", loadListsError: "Could not load lists.",
    loadItemsError: "Could not load films.", createListError: "Could not create the list.",
    removeItemError: "Could not remove the film from the list.", changeListError: "Could not update the list.",
    saveRatingError: "Could not save your rating.", rateFirst: "Rate the film first.",
    reviewPublished: "Review published.", createReviewError: "Could not add the review. One active review per film is allowed.",
    filmAdded: "Film added to the list.", addFilmError: "Could not add the film to the list.",
    commentsSection: "Comments", showComments: "Show comments", hideComments: "Hide comments", commentsPagination: "Comment pages", noComments: "No comments yet.", yourComment: "Your comment", sendComment: "Send",
    editComment: "Edit comment", deleteComment: "Delete comment", deleteCommentConfirm: "Delete this comment?", loginToComment: "Log in to leave a comment.",
    loadCommentsError: "Could not load comments.", createCommentError: "Could not add the comment.", updateCommentError: "Could not update the comment.", deleteCommentError: "Could not delete the comment.",
    listBy: "A list by", emptyPublicList: "This list has no films yet.", invalidListId: "Invalid list link.", loadPublicListError: "Could not load the public list.",
    description: "Description", createListIntro: "Collect films into a list you will want to return to.", publicList: "Public list", privateList: "Private list", listName: "List name", updateListError: "Could not update the list.", reorderListError: "Could not change the film order.", deleteListError: "Could not delete the list.", listDeleted: "List deleted.", deletingList: "Deleting…", moveUp: "Move up", moveDown: "Move down",
    tags: "Tags", tagsHint: "Comma-separated, up to 10", popularTags: "Popular tags", noTags: "There are no tags yet.", loadTagsError: "Could not load popular tags.", discoverLists: "Collections", listsTaggedHeading: "All lists tagged", noTaggedLists: "There are no lists for this tag yet.", listFeeds: "List feeds", featuredLists: "Featured lists", featuredListsIntro: "A starter pack from the Rewind community and platform curators.", popularListsTitle: "Popular lists", popularListsIntro: "Explore the most popular lists from the Rewind community.", recentlyLikedListsTitle: "Recently liked lists", recentlyLikedListsIntro: "Lists the community has been enjoying lately.", recentListsTitle: "Recent lists", recentListsIntro: "Fresh film collections from Rewind members.", listFeedTeamSection: "Rewind community", listFeedRecent: "Recent", listFeedPopular: "Popular", listFeedRecentlyLiked: "Recently liked", listFeedTeam: "Team lists", likeList: "Like list", unlikeList: "Unlike list", listLikeError: "Could not change the list like.",
    notificationActionError: "Could not update the notification state.", loadNotificationPreferencesError: "Could not load notification settings.", notificationsPagination: "Notification pages",
    notifications: "Notifications", noNotifications: "No notifications yet.", loadNotificationsError: "Could not load notifications.", markRead: "Mark as read", markAllNotificationsRead: "Mark all as read", notificationFollowedYou: "followed you", notificationLikedReview: "liked your review", someone: "Someone", notificationPreferences: "Notification settings", notifyOnFollow: "New followers", notifyOnReviewLike: "Likes on my reviews", notificationPreferencesSaved: "Settings saved.", notificationPreferencesError: "Could not save settings.", messages: "Messages", conversations: "Conversations", noConversations: "No conversations yet.", loadConversationsError: "Could not load conversations.", startConversationError: "Could not open this conversation.", conversationsPagination: "Conversation pages", chooseConversation: "Choose a conversation.", noMessages: "There are no messages in this conversation yet.", emptyMessageBody: "Message has no text", loadMessagesError: "Could not load or send the message.", messagesPagination: "Message pages", newerMessages: "Newer", olderMessages: "Older", messageText: "Message text", sendMessage: "Message", messagesError: "Could not load or send the message.", hq: "HQ", adminDashboard: "Admin dashboard", adminLoadError: "Could not load the admin dashboard.", adminSelfChangeError: "You cannot deactivate or demote your own administrator account.", adminLastAdminError: "At least one active administrator must remain.", adminUsers: "Users", adminComments: "Comments", hiddenComment: "hidden", visibleComment: "visible", hideComment: "Hide", unhideComment: "Restore", auditLogs: "Audit log", noAuditLogs: "No actions yet.", adminAuditPagination: "Audit log pages", grantHq: "Grant HQ", revokeHq: "Revoke HQ", activeUsers: "Active", hqUsers: "HQ users", movies: "Films", hiddenReviews: "Hidden reviews", moderationQueue: "Moderation queue", noModerationItems: "The moderation queue is empty.", moderationReview: "Review", moderationComment: "Comment", moderationTypeFilter: "Moderation type", allModerationTypes: "All types", moderationSearch: "Search queue", filterModeration: "Filter", selectAllModeration: "Select all", moderationReason: "Moderation reason", hideSelectedModeration: "Hide selected", hideSelectedModerationConfirm: "Hide the selected items?", moderationDefaultReason: "Rules violation", adminSettings: "Site settings", noAdminSettings: "No settings yet.", saveSetting: "Save",
    profileIdentity: "Profile details", profileStats: "Statistics", ratingDistribution: "Rating distribution", noRatingDistribution: "There are no ratings yet.", publicLists: "Public lists", ratings: "Ratings", loadPublicProfileError: "Could not load this user profile.",
    markMessagesReadError: "Could not mark this conversation as read.", sendMessageError: "Could not send the message.", adminSaveError: "Could not save the setting.", adminMovieCreateError: "Could not create the film.", adminMovieSaveError: "Could not save the film.", adminMovieDeleteError: "Could not delete the film.", adminArticleCreateError: "Could not create the article.", adminNewsletterError: "Could not queue the newsletter.", adminCommentModerationError: "Could not change comment visibility.", adminConversationDeleteError: "Could not delete the conversation.", adminListVisibilityError: "Could not change list visibility.", adminListDeleteError: "Could not delete the list.", adminUserActionError: "Could not update the user.", adminReviewModerationError: "Could not change review visibility.", adminModerationActionError: "Could not perform moderation.", adminNotificationActionError: "Could not perform the notification action.", tmdbQualityError: "Could not load TMDB catalog quality.",
    profileCollections: "My films", noCollectionFilms: "There are no films in this collection yet.", loadCollectionError: "Could not load this collection.", noLists: "There are no lists yet.", listsPagination: "List pages", reviewsPagination: "Review pages",
    allRatings: "All ratings", allReviews: "All reviews", noRatings: "There are no ratings yet.", loadRatingsError: "Could not load ratings.", loadReviewsError: "Could not load reviews.",
    follow: "Follow", unfollow: "Unfollow", blockProfileUser: "Block", unblockUser: "Unblock", blockError: "Could not change the block status.", followers: "Followers", following: "Following", noFollowers: "There are no followers yet.", noFollowing: "Not following anyone yet.", loadNetworkError: "Could not load this user's network.", networkPagination: "Network pages", followError: "Could not change the follow status.", loadFollowStatusError: "Could not load the follow status.", loadBlockStatusError: "Could not load the block status.",
    likes: "Likes", like: "Like", unlike: "Unlike", likeReviewError: "Could not change the like.", review: "Review", reviewBy: "Review by", loadingReview: "Loading review...", reviewUnavailable: "Review unavailable", loadReviewError: "Could not load this review.", backToMovie: "Back to film", membersWhoLikedReview: "Members who liked this review", noReviewLikes: "No one has liked this review yet.", loginToLikeReview: "Sign in to like",
    recentActivity: "Recent activity", noActivity: "No activity yet.", loadActivityError: "Could not load activity.", activityPagination: "Activity pages", activityFollowed: "followed", activityRated: "rated", activityReviewed: "reviewed", activityCreatedList: "created a list", unknownActivity: "Unknown activity", adminRole: "administrator", userRole: "user",
    avatarUrl: "Avatar URL", invalidAvatarUrl: "Enter a full image URL starting with http or https.", invalidSocialLinkUrl: "Enter a valid social profile URL starting with http or https.",
    filmography: "Filmography", invalidPersonId: "Invalid person link.", loadPersonError: "Could not load this person page.",
    poster: "Poster", minutes: "min", rateAs: "Rate as", rateFilm: "Rate film", done: "Done", share: "Share", unknownPerson: "Unnamed person", untitledFilm: "Untitled film",
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
