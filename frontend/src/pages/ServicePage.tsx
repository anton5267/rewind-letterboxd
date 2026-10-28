import { Link } from "react-router-dom";
import { useLocale, type TranslationKey } from "../i18n";
import ServiceNavigation from "../components/ServiceNavigation";
import styles from "./ServicePage.module.css";

type ServiceKind = "help" | "faq" | "contact" | "rules" | "privacy" | "film-data" | "important-data" | "delete-account" | "terms" | "conditions" | "safety-notice" | "hq-accounts";
type ServiceSection = { heading: string; body: string; items?: string[]; contactLink?: boolean };
type ServiceCopy = {
  title: TranslationKey;
  body: TranslationKey;
  hero: { uk: string; en: string };
  intro?: { uk: string; en: string };
  sections: { uk: ServiceSection[]; en: ServiceSection[] };
};

const content: Record<ServiceKind, ServiceCopy> = {
  terms: {
    title: "termsTitle", body: "termsBody",
    hero: { uk: "Умови користування допомагають розуміти можливості Rewind і відповідально брати участь у спільноті.", en: "Terms explain how to use Rewind and participate responsibly in its cinema community." },
    sections: {
      uk: [
        { heading: "Користування сервісом", body: "Rewind дає змогу знаходити фільми, читати огляди та переглядати публічні списки. Для оцінок, власних оглядів, списків і підписок потрібен вхід в акаунт." },
        { heading: "Акаунт і безпека", body: "Зберігайте пароль у таємниці. Змінити його можна в налаштуваннях профілю; якщо ви забули пароль, скористайтеся відновленням доступу." },
        { heading: "Контент і спільнота", body: "Публікуйте лише матеріали, якими маєте право ділитися. Поважайте інших учасників, не поширюйте спам, погрози чи чужі приватні дані. Правила користування описують очікувану поведінку." },
        { heading: "Модерація", body: "Модератори можуть приховувати огляди та коментарі, видаляти матеріали й обмежувати доступ відповідно до наявних прав модерації." },
        { heading: "Оплата й перегляд фільмів", body: "У поточному Rewind немає платних підписок, продажу чи прокату відео. Сторінки фільмів містять інформацію та активність спільноти." },
        { heading: "Ваші дані", body: "Налаштування профілю дозволяють змінювати підтримувані дані та видаляти акаунт із підтвердженням поточного пароля. Подробиці наведено на сторінках приватності й видалення акаунта." },
        { heading: "Контакти", body: "Якщо виникло питання щодо користування Rewind, додайте до звернення адресу відповідної сторінки. Не надсилайте пароль.", contactLink: true },
      ],
      en: [
        { heading: "Using the Service", body: "Rewind lets you discover films, read reviews, and browse public lists. Sign in to rate films, write reviews, create lists, and follow members." },
        { heading: "Account Security", body: "Keep your password private. Change it in Profile settings, or use password recovery if you have forgotten it." },
        { heading: "Content and Community", body: "Only publish material you have permission to share. Respect other members and avoid spam, threats, and sharing private information. Rules of Use describe expected conduct." },
        { heading: "Moderation", body: "Moderators can hide reviews and comments, remove content, and restrict access using the available moderation permissions." },
        { heading: "Payments and Film Viewing", body: "Rewind currently has no paid subscriptions, video sales, or rentals. Film pages provide information and community activity." },
        { heading: "Your Data", body: "Profile settings let you change supported details and delete your account with your current password. See Privacy Policy and Account Deletion for details." },
        { heading: "Contact Us", body: "For questions about using Rewind, include the relevant page address in your message. Never send your password.", contactLink: true },
      ],
    },
  },
  conditions: {
    title: "conditionsTitle", body: "conditionsBody",
    hero: { uk: "Умови роботи Rewind пояснюють доступність функцій, стан матеріалів і можливості спільноти.", en: "Conditions explain feature availability, content status, and the current Rewind experience." },
    sections: {
      uk: [
        { heading: "Призначення сервісу", body: "Rewind поєднує каталог фільмів, оцінки, огляди, списки та матеріали Journal." },
        { heading: "Доступність функцій", body: "Публічні матеріали доступні без входу. Особиста активність потребує авторизації. Адміністративні інструменти доступні лише користувачам із відповідними правами." },
        { heading: "Матеріали та їхній стан", body: "Видимість списків визначають їхні власники, а публікацію матеріалів Journal і модерацію контенту — користувачі з відповідними правами." },
        { heading: "Оновлення даних", body: "Каталог відображає збережені дані. Оновлення зовнішніх джерел не гарантує негайного оновлення сторінки Rewind; фіксованого інтервалу немає." },
        { heading: "Оплата", body: "Поточні можливості не потребують платної підписки. Оплата, прокат і продаж відео не підтримуються." },
        { heading: "Правила та приватність", body: "Ознайомтеся з правилами користування, політикою приватності й описом видалення акаунта в навігації цього розділу." },
      ],
      en: [
        { heading: "Purpose of the Service", body: "Rewind brings together a film catalogue, ratings, reviews, lists, and Journal articles." },
        { heading: "Feature Availability", body: "Public content is available without signing in. Personal activity requires authentication. Administrative tools require the appropriate permissions." },
        { heading: "Content and Status", body: "List owners control list visibility. Journal publishing and content moderation are available to users with the appropriate permissions." },
        { heading: "Data Updates", body: "The catalogue displays stored information. Changes at an external source do not guarantee immediate changes on Rewind; there is no fixed update interval." },
        { heading: "Payments", body: "Current features do not require a paid subscription. Payments, video rentals, and video sales are not supported." },
        { heading: "Rules and Privacy", body: "Use this section’s navigation to read Rules of Use, Privacy Policy, and Account Deletion." },
      ],
    },
  },
  "safety-notice": {
    title: "safetyNoticeTitle", body: "safetyNoticeBody",
    hero: { uk: "Безпека Rewind починається із захисту акаунта, поваги до співрозмовників і відповідального поширення інформації.", en: "Safety on Rewind starts with account protection, respectful interaction, and responsible sharing." },
    sections: {
      uk: [
        { heading: "Призначення", body: "Ця пам’ятка пояснює чинні засоби захисту та дії, які допомагають безпечно користуватися спільнотою." },
        { heading: "Захист даних", body: "Паролі зберігаються як хеші, а дані авторизованої сесії використовують HttpOnly cookies. Email не показується в публічному профілі. Не публікуйте паролі й особисті контактні дані." },
        { heading: "Контент і взаємодія", body: "Уникайте погроз, переслідування й поширення чужих приватних даних. Модератори можуть приховувати огляди й коментарі, що порушують правила." },
        { heading: "Безпека спільноти", body: "Керуйте своїми підписками й за потреби використовуйте блокування учасника. Про проблему можна повідомити команді; не додавайте пароль або токени сесії.", contactLink: true },
        { heading: "Актуальна інформація", body: "Ця сторінка описує поточні можливості Rewind. Додаткові відомості про дані й видалення акаунта наведено в сусідніх розділах." },
      ],
      en: [
        { heading: "Purpose", body: "This notice describes current safeguards and steps that help you use the community safely." },
        { heading: "Data Protection", body: "Passwords are stored as hashes, and authenticated sessions use HttpOnly cookies. Public profiles do not display email addresses. Do not publish passwords or personal contact details." },
        { heading: "Content and Interaction", body: "Avoid threats, harassment, and sharing private information about others. Moderators can hide reviews and comments that violate the rules." },
        { heading: "Community Safety", body: "Manage your follows and use member blocking when needed. Contact the team about a problem without including passwords or session tokens.", contactLink: true },
        { heading: "Current Information", body: "This page describes current Rewind capabilities. See the neighbouring sections for information about data and account deletion." },
      ],
    },
  },
  "hq-accounts": {
    title: "hqAccountsTitle", body: "hqAccountsBody",
    hero: { uk: "HQ — позначка профілю в спільноті Rewind. Вона допомагає впізнати відповідний акаунт серед інших учасників.", en: "HQ is a profile badge in the Rewind community, helping members recognise the account." },
    sections: {
      uk: [
        { heading: "Що означає HQ", body: "Позначка HQ відображається в публічному профілі та керується адміністраторами. Вона не є платною підпискою й не надає адміністративних прав." },
        { heading: "Доступні можливості", body: "Акаунт використовує наявні можливості профілю: списки фільмів, огляди, оцінки та взаємодію зі спільнотою. Видимість списків залежить від налаштувань їхнього власника." },
        { heading: "Межі поточної реалізації", body: "Окремі інструменти HQ для аналітики показів, закріплення списків, завантаження фонів чи керування командою наразі не підтримуються. Позначка HQ сама по собі не змінює правила розрахунку оцінок фільмів." },
        { heading: "Питання про акаунт", body: "З питаннями про позначку HQ звертайтеся до команди й додайте посилання на профіль.", contactLink: true },
      ],
      en: [
        { heading: "What HQ Means", body: "The HQ badge appears on a public profile and is managed by administrators. It is not a paid subscription and does not grant administrative permissions." },
        { heading: "Available Features", body: "The account uses existing profile features: film lists, reviews, ratings, and community interaction. List visibility depends on the owner’s settings." },
        { heading: "Current Limitations", body: "Separate HQ tools for impression analytics, pinned lists, background uploads, or team management are not currently supported. The HQ badge itself does not change how film ratings are calculated." },
        { heading: "Account Questions", body: "Contact the team about the HQ badge and include the profile address.", contactLink: true },
      ],
    },
  },
  help: {
    title: "helpTitle", body: "helpBody",
    hero: {
      uk: "Допомога Rewind підтримує кожного читача та робить подорож світом кіно простою, доступною і приємною.",
      en: "Help is a trusted space where Rewind supports every reader, making the journey through cinema simple, accessible, and enjoyable.",
    },
    sections: {
      uk: [
        { heading: "Розкажіть, що ви вже бачили", body: "Почніть знайомство з Rewind, позначивши вже переглянуті фільми. Увійдіть в акаунт і відкрийте сторінку фільму: тут можна позначити перегляд, додати фільм до улюблених, поставити оцінку та написати огляд. Позначені фільми з’являться у вашому профілі." },
        { heading: "Переглядайте свої фільми", body: "Додані фільми з’являються в розділі «Фільми» вашого профілю. Що більше стрічок ви позначаєте, то виразніше профіль відображає ваш смак. Перемикайтеся між переглянутими, запланованими та улюбленими фільмами або відкривайте колекції інших учасників." },
        { heading: "Додавайте фільми до списку перегляду", body: "Список перегляду допомагає зібрати фільми, які ви хочете побачити. На сторінці фільму скористайтеся дією «Список перегляду». Збережені стрічки можна знайти у відповідній вкладці профілю." },
        { heading: "Ваш акаунт і налаштування", body: "Відкрийте профіль, щоб переглянути свої фільми, огляди, списки та активність. Кнопка налаштувань веде до зміни пароля та посилань на дані профілю, аватар і соціальні мережі. Тут також можна керувати підпискою на бюлетень." },
        { heading: "Підписки та активність", body: "Читайте огляди інших учасників, знаходьте авторів, чиї думки вам близькі, і підписуйтеся на них. Профілі показують колекції, огляди та активність, а розділ спільноти допомагає відкривати нові голоси." },
        { heading: "Створюйте списки й діліться ними", body: "Списки допомагають ділитися добірками за жанром, актором, режисером або темою. Створіть власний список у розділі «Списки», додайте фільми з їхніх сторінок і зробіть список публічним, щоб ним могли користуватися інші учасники." },
      ],
      en: [
        { heading: "Tell Us What You’ve Seen", body: "Start your Rewind journey by marking films you’ve already watched. Sign in and open a film page to mark it as watched, add it to your favorites, give it a rating, or write a review. Your marked films appear in your profile." },
        { heading: "Browse Your Films", body: "Once you’ve added a few titles, they appear in your profile’s Films section. The more you add, the more your profile reflects your taste. Switch between watched films, your Watchlist, and favorites, or browse other members’ collections." },
        { heading: "Add movies to your Watchlist", body: "The Watchlist feature lets you curate a collection of movies you want to watch. Use the Watchlist action on a film page to save it for later, then find your saved films in the Watchlist tab of your profile." },
        { heading: "Your Account and Settings", body: "Open your profile for your films, reviews, lists, and recent activity. The settings button leads to password changes and links to your profile details, avatar, and social links. You can also manage your newsletter subscription there." },
        { heading: "Following and Activity", body: "Read reviews from other members to find voices you enjoy and follow them. Member profiles show collections, reviews, and activity, while the Community section helps you discover more people who share your love of cinema." },
        { heading: "Make and Share Lists", body: "Lists let you share collections of films by genre, actor, director, or theme. Create a list in your Lists section, add films from their pages, and make it public to share with other members." },
      ],
    },
  },
  faq: {
    title: "faqTitle", body: "faqBody",
    hero: {
      uk: "Поширені запитання допоможуть швидко зорієнтуватися в Rewind і знайти потрібні відомості про спільноту та можливості сервісу.",
      en: "Frequent Questions is Rewind’s guide to clarity, helping every reader feel confident, informed, and part of the cinema community.",
    },
    sections: {
      uk: [
        { heading: "Чому Rewind?", body: "Rewind створено як культурний простір для тих, хто живе кіно. Ми поєднуємо достовірну інформацію, вдумливий аналіз і спільноту глядачів." },
        { heading: "Як користуватися сайтом?", body: "Відкривайте фільми, огляди, списки та матеріали Journal через головну сторінку й навігацію. Пошук і теги допоможуть знайти фільми, статті та інші матеріали за вашими інтересами." },
        { heading: "Чи безкоштовний Rewind?", body: "Так. Основні можливості Rewind доступні без оплати: ви можете переглядати матеріали, ставити оцінки, писати огляди та створювати списки. Платної підписки в сервісі зараз немає." },
        { heading: "Чи можу я долучитися?", body: "Так. Команда відкрита до пропозицій від критиків, журналістів і шанувальників кіно. Надішліть редакційну ідею, матеріал про фестиваль або пропозицію співпраці через сторінку контактів." },
        { heading: "Як Rewind дбає про спільноту?", body: "Ми заохочуємо поважний діалог, конструктивну критику й різні погляди. Правила та модерація допомагають підтримувати безпечне й доброзичливе середовище." },
        { heading: "Чим Rewind відрізняється?", body: "Rewind поєднує аналіз із розповідями про кіно. Ми говоримо не лише про прем’єри й нагороди, а й про те, як кіно впливає на суспільство, ідентичність та уяву." },
      ],
      en: [
        { heading: "Why Rewind?", body: "Rewind is created as a cultural space for people who live and breathe cinema. We bring credible information, thoughtful analysis, and a community of film lovers together." },
        { heading: "How do I use the site?", body: "Browse films, reviews, lists, and Journal stories from the homepage and main navigation. Search and tags help you find films, articles, and other features that match your interests." },
        { heading: "Is Rewind free?", body: "Yes. Rewind’s core features are available at no charge: you can read stories, rate films, write reviews, and create lists. Rewind does not currently offer paid subscriptions." },
        { heading: "Can I contribute?", body: "Yes. We welcome ideas from critics, journalists, and film enthusiasts. Send an editorial pitch, a festival report, or a collaboration proposal through the Contact page." },
        { heading: "How does Rewind handle community?", body: "We encourage respectful dialogue, constructive criticism, and diverse perspectives. Our rules and moderation help keep discussions safe and welcoming." },
        { heading: "What makes Rewind different?", body: "Rewind blends analysis with storytelling. We look beyond premieres and awards to explore how cinema shapes society, identity, and imagination." },
      ],
    },
  },
  contact: {
    title: "contactTitle", body: "contactBody",
    hero: {
      uk: "Контакти Rewind відкриті для діалогу, співпраці та ідей, які підтримують живу кінокультуру.",
      en: "Contact is the voice of Rewind, opening space for dialogue, collaboration, and ideas that keep cinema alive.",
    },
    sections: {
      uk: [
        { heading: "Підтримка акаунта та дані фільмів", items: ["Питання щодо акаунта, повідомлення про помилки та пропозиції можливостей", "Виправлення даних фільмів і питання імпорту"], body: "Дані фільмів надходять із TMDB — виправлення спершу слід внести там." },
        { heading: "Редакція та партнерства", items: ["Партнерства та спільні кампанії", "Співпраця з кінофестивалями", "Спільні проєкти в соціальних мережах", "Пропозиції матеріалів для Rewind Journal"], body: "" },
        { heading: "Преса та реклама", items: ["Запити преси та медіа", "Рекламні пропозиції", "Міжнародні рекламні кампанії"], body: "" },
      ],
      en: [
        { heading: "Account Support + Film Data", items: ["General support enquiries, bugs and feature requests", "Film data corrections and import requests"], body: "Film data comes from TMDB — please submit changes there in the first instance." },
        { heading: "Editorial + Partnerships", items: ["Partnership and co-marketing enquiries", "Film-festival partnership enquiries", "Social-media collaboration enquiries", "Editorial pitches for Rewind Journal"], body: "" },
        { heading: "Press + Advertising", items: ["Press or media enquiries", "Advertising enquiries", "International advertising campaigns"], body: "" },
      ],
    },
  },
  rules: {
    title: "rulesTitle", body: "rulesBody",
    hero: {
      uk: "Правила користування Rewind підтримують чесність, повагу та цілісність нашої кінематографічної спільноти.",
      en: "Rules of Use are Rewind’s foundation, ensuring fairness, respect, and integrity across our cinema community.",
    },
    sections: {
      uk: [
        { heading: "Доступ і використання", body: "Користуйтеся сервісом лише за призначенням і відповідно до цих правил. Права, прямо не надані користувачам, залишаються за Rewind." },
        { heading: "Відповідальність користувача", body: "Ви відповідаєте за всю активність свого акаунта та опублікований контент у межах чинного законодавства." },
        { heading: "Вік і реєстрація", body: "Користуватися сервісом можна з 16 років. Для окремих функцій потрібна актуальна та достовірна реєстраційна інформація." },
        { heading: "Правила спільноти", body: "Поважайте інших учасників. Агресивні, образливі та недоречні висловлювання заборонені." },
        { heading: "Заборонена поведінка", items: ["Пропаганда ненависті, насильства чи дискримінації.", "Видавання себе за іншу особу, спам і маніпуляції.", "Використання сервісу з незаконною метою.", "Несанкціоноване використання технологій Rewind."], body: "" },
        { heading: "Видалення контенту", body: "Rewind може прибрати матеріал, що порушує правила або є недоречним." },
        { heading: "Інтелектуальна власність", body: "Права на програмне забезпечення, тексти, зображення, графіку й аудіовізуальні матеріали належать Rewind або його ліцензіарам." },
        { heading: "Безпека акаунта", body: "Зберігайте облікові дані конфіденційними та відповідайте за дії у своєму акаунті." },
        { heading: "Зміни правил", body: "Rewind може оновлювати правила. Подальше користування сервісом означає прийняття оновленої редакції." },
      ],
      en: [
        { heading: "Access and Use", body: "Use the service only as intended and in accordance with these rules. Rights not expressly granted to users remain with Rewind." },
        { heading: "User Responsibility", body: "You are responsible for all activity under your account and for the content you publish, to the extent permitted by law." },
        { heading: "Age and Registration", body: "You must be at least 16 years old to use the service. Some features require accurate and current registration information." },
        { heading: "Community Policy", body: "We expect courtesy and respect toward other members. Aggressive, offensive, or inappropriate remarks are prohibited." },
        { heading: "Prohibited Conduct", items: ["Promoting hate, violence, or discrimination.", "Misrepresentation of identity, spamming, or manipulation.", "Using the service for unlawful purposes.", "Unauthorised use of Rewind’s technology."], body: "" },
        { heading: "Content Removal", body: "Rewind reserves the right to remove content that violates these rules or is deemed inappropriate." },
        { heading: "Intellectual Property", body: "Rights to software, text, images, graphics, and audiovisual content belong to Rewind or its licensors." },
        { heading: "Account Security", body: "Keep your credentials confidential. You are responsible for all activity under your account." },
        { heading: "Changes and Updates", body: "Rewind may amend these rules. Continued use of the service constitutes acceptance of the updated rules." },
      ],
    },
  },
  privacy: {
    title: "privacyTitle", body: "privacyBody",
    intro: {
      uk: "Rewind цінує вашу довіру та прагне прозоро пояснювати роботу з даними. Ми використовуємо інформацію, потрібну для роботи сервісу та покращення користувацького досвіду.",
      en: "Rewind values your trust and is committed to transparency in how we handle data. We use information necessary to operate the service and improve the user experience.",
    },
    hero: {
      uk: "Політика приватності Rewind пояснює, як ми захищаємо дані, діємо прозоро та поважаємо кожного учасника.",
      en: "Privacy Policy is Rewind’s promise to remain transparent, safeguard data, and respect every member of our community.",
    },
    sections: {
      uk: [
        { heading: "Які дані ми використовуємо", items: ["Надані вами дані акаунта, зокрема ім’я та email.", "Технічні дані запитів і сесій, необхідні для входу та захисту сервісу.", "Створена вами активність: позначки фільмів, оцінки, огляди, коментарі, списки й підписки."], body: "" },
        { heading: "Як ми використовуємо дані", items: ["Для роботи сервісу та вашого акаунта.", "Для показу ваших збережених фільмів, списків, оглядів і підписок.", "Для вдосконалення платформи й усунення помилок.", "Для захисту сесій і запобігання зловживанням."], body: "" },
        { heading: "З ким ми ділимося даними", body: "Rewind не продає персональні дані. Обмежений доступ можуть отримувати партнери технічної підтримки за вимогами конфіденційності." },
        { heading: "Захист даних", body: "Ми використовуємо сучасні заходи безпеки, щоб захистити інформацію від несанкціонованого доступу, втрати чи зловживань." },
        { heading: "Ваші права", body: "У профілі можна переглянути свої дані, оновити дані профілю та скористатися формою видалення акаунта." },
      ],
      en: [
        { heading: "What data we use", items: ["Account information you provide, including your name and email.", "Technical request and session information needed to sign in and protect the service.", "Activity you create: film marks, ratings, reviews, comments, lists, and follows."], body: "" },
        { heading: "How we use data", items: ["To maintain the functionality of the service and your account.", "To show your saved films, lists, reviews, and followed members.", "To improve the platform and troubleshoot problems.", "To protect sessions and prevent misuse."], body: "" },
        { heading: "Who we share data with", body: "Rewind does not sell personal data. Information may be shared only with technical partners under strict confidentiality requirements." },
        { heading: "Data protection", body: "We use modern security measures to protect your information from unauthorised access, loss, or misuse." },
        { heading: "Your rights", body: "You can view your data, update your profile details, and use the account deletion form in your profile." },
      ],
    },
  },
  "film-data": {
    title: "filmDataTitle", body: "filmDataBody",
    intro: {
      uk: "Метадані фільмів, імена акторів і режисерів, студії, синопсиси, дати виходу, трейлери та постери надходять із The Movie Database (TMDB). Rewind використовує TMDB API, але не схвалений і не сертифікований TMDB.",
      en: "Film metadata, actor and director names, studios, synopses, release dates, trailers, and poster art come from The Movie Database (TMDB). Rewind uses the TMDB API but is not endorsed or certified by TMDB.",
    },
    hero: {
      uk: "Дані фільмів Rewind є джерелом правди для каталогу та допомагають підтримувати точність і довіру спільноти.",
      en: "Film Data is Rewind’s source of truth, ensuring accuracy, consistency, and credibility in every film we share with our community.",
    },
    sections: {
      uk: [
        { heading: "Додавання та виправлення даних", body: "Відсутні фільми та неточності в метаданих спершу виправляйте у TMDB. Внесені зміни можуть з’явитися в Rewind після оновлення даних фільму; фіксованого строку оновлення немає." },
        { heading: "Дублікати", body: "Якщо ви знайшли кілька сторінок одного фільму, підготуйте посилання на кожну з них для команди підтримки. Доступні контактні канали наведено на сторінці контактів." },
      ],
      en: [
        { heading: "Adding and correcting data", body: "Please add missing films and correct metadata through TMDB first. Changes may appear in Rewind when the film’s data is refreshed; there is no fixed update deadline." },
        { heading: "Duplicates", body: "If you find multiple pages for the same film, collect their addresses for the support team. Available contact channels are listed on the Contacts page." },
      ],
    },
  },
  "important-data": {
    title: "importantDataTitle", body: "importantDataBody",
    hero: {
      uk: "Дані фільмів Rewind допомагають підтримувати точність, послідовність і довіру до каталогу.",
      en: "Important Data is Rewind’s source of truth, ensuring accuracy, consistency, and credibility in every film we share with our community.",
    },
    intro: {
      uk: "Усі метадані фільмів у Rewind — імена акторів, режисерів і студій, синопсиси, дати виходу, трейлери та постери — надходять із The Movie Database (TMDB). Rewind використовує TMDB API, але не схвалений і не сертифікований TMDB.",
      en: "All film-related metadata used in Rewind—including actor, director, and studio names, synopses, release dates, trailers, and poster art—is supplied by The Movie Database (TMDB). Rewind uses the TMDB API but is not endorsed or certified by TMDB.",
    },
    sections: {
      uk: [
        { heading: "Джерела й оновлення", body: "Дані про акторський склад, режисерів, студії, синопсиси, дати виходу, трейлери та постери надходять із TMDB. Записи Rewind можуть оновлюватися з цього джерела; фіксованого інтервалу оновлення немає." },
        { heading: "Дублікати", body: "Якщо ви знайшли кілька сторінок одного фільму, надішліть команді посилання на кожну. Автоматичне об’єднання сторінок і перенесення активності наразі не підтримуються.", contactLink: true },
      ],
      en: [
        { heading: "Sources and Updates", body: "Film data comes from TMDB, including cast, directors, studios, synopses, release dates, trailers, and posters. Rewind records may be refreshed from this source; there is no fixed update interval." },
        { heading: "Duplicates", body: "If you find multiple pages for the same film, send the team a link to each page. Automatic merging and transfer of activity are not currently supported.", contactLink: true },
      ],
    },
  },
  "delete-account": {
    title: "deleteAccountTitle", body: "deleteAccountBody",
    hero: {
      uk: "Видалення акаунта Rewind дає кожному учаснику контроль і право залишити спільноту з гідністю та приватністю.",
      en: "Account Deletion is Rewind’s assurance of control, giving every member the right to leave with dignity and privacy.",
    },
    sections: {
      uk: [
        { heading: "Призначення", body: "Видалення акаунта — остаточний крок, який прибирає профіль і пов’язану активність із платформи. Перед підтвердженням збережіть потрібну інформацію." },
        { heading: "Що станеться після видалення", items: ["Ваш профіль більше не буде видимий іншим учасникам.", "Пов’язані з акаунтом огляди, вподобання та коментарі буде видалено.", "Ваші підписки й активні сесії буде завершено.", "Відновити видалений акаунт неможливо."], body: "" },
        { heading: "Безпека та приватність", body: "Щоб подати запит, підтвердьте його поточним паролем. Видалення акаунта відбувається через форму в налаштуваннях профілю." },
        { heading: "Оновлення політики", body: "Опис на цій сторінці стосується поточного процесу в Rewind. Перед відправленням запиту збережіть інформацію, яка може знадобитися вам пізніше." },
      ],
      en: [
        { heading: "Purpose", body: "Account deletion is a final step that removes your profile and related activity from the platform. Save anything you need before confirming." },
        { heading: "What happens after deletion", items: ["Your profile will no longer be visible to other members.", "Reviews, likes, and comments associated with your account will be deleted.", "Your follows and active sessions will end.", "Once deleted, your account cannot be restored."], body: "" },
        { heading: "Security and Privacy", body: "To submit a request, confirm it with your current password. Account deletion is handled through the form in Profile settings." },
        { heading: "Policy Updates", body: "This page describes the current Rewind process. Before submitting a request, save any information you may need later." },
      ],
    },
  },
};

// Original image nodes in Help 1062:1993; the first slot is composed below
// from the visible children of 1064:2191 rather than a screenshot of the frame.
const helpIllustrations = [
  { className: "watchedIllustration", src: null, href: "/films", label: "films" },
  { className: "browseIllustration", src: "/images/help-browse-films.png", href: "/profile", label: "profile" },
  { className: "watchlistIllustration", src: "/images/help-watchlist.png", href: "/films", label: "films" },
  { className: "settingsIllustration", src: "/images/help-account-settings.png", href: "/profile?settings=authentication", label: "accountSettings" },
  { className: "activityIllustration", src: "/images/help-following-activity.png", href: "/community", label: "community" },
  { className: "listsIllustration", src: "/images/help-share-lists.png", href: "/lists", label: "lists" },
] as const;

function WatchedIllustration() {
  const { t } = useLocale();

  return <div className={styles.watchedPreview} aria-hidden="true">
    <img className={styles.watchedBackdrop} src="/images/help-watched-backdrop.jpg" alt="" loading="lazy" />
    <span className={styles.watchedBack}><img src="/images/help-icon-back.png" alt="" loading="lazy" /></span>
    <span className={styles.watchedMore}><img src="/images/help-icon-more.png" alt="" loading="lazy" /></span>
    <strong className={styles.watchedFilmTitle}>Dune</strong>
    <span className={styles.watchedYear}>2021</span>
    <div className={styles.watchedActionSurface} />
    <div className={styles.watchedActions}>
      <span><img src="/images/help-icon-watched.png" alt="" loading="lazy" /><span>{t("watched")}</span></span>
      <span><img src="/images/help-icon-favorite.png" alt="" loading="lazy" /><span>{t("favorite")}</span></span>
      <span><img src="/images/help-icon-watchlist.png" alt="" loading="lazy" /><span>{t("watchlist")}</span></span>
    </div>
    <span className={styles.watchedHighlight} />
  </div>;
}

const helpGuides = [
  {
    image: "/images/help-film-actions.png", className: "filmActionsGuide", href: "/films", link: "films",
    uk: { heading: "Дії з фільмами", body: "На сторінці фільму можна позначити перегляд, додати стрічку до улюблених і поставити оцінку. Збережіть майбутній перегляд у своєму списку або додайте фільм до тематичної добірки. Ці дії формують ваш профіль і зберігають історію кінематографічних відкриттів." },
    en: { heading: "Film actions", body: "On a film page, you can mark a title as watched, add it to your favorites, and rate it. If you plan to see it later, add it to your Watchlist or include it in a themed list. These actions personalize your profile and track your viewing journey." },
  },
  {
    image: "/images/help-list-tags.png", className: "tagsGuide", href: "/lists", link: "lists",
    uk: { heading: "Теги списків", body: "Теги допомагають упорядковувати ваші добірки. Додавайте їх під час створення або редагування списку: зазначайте жанр, тему чи настрій. Публічні списки з тегами можна знайти в каталозі добірок, щоб інші учасники відкривали ваші рекомендації." },
    en: { heading: "Tagging lists", body: "Tags help organize your collections. Add them when creating or editing a list to describe its genre, theme, or mood. Tagged public lists can be found through the lists catalog, helping other members discover your recommendations." },
  },
  {
    image: "/images/help-lists-guide.png", className: "listsGuide", href: "/lists/discover", link: "discoverLists",
    uk: { heading: "Списки", body: "Збирайте фільми за темою, жанром, режисером чи настроєм і діліться ними. Теги допомагають знаходити ваші публічні добірки. Список із тегом «Французька нова хвиля» або «Лауреати Оскара» поєднує ваш погляд зі спільнотою." },
    en: { heading: "Lists", body: "Lists let you collect and share films by theme, genre, director, or mood. With tags, public lists become searchable, so others can find them through browsing. A list tagged “French New Wave” or “Oscar Winners” connects your curation with the community." },
  },
] as const;

interface ServicePageProps {
  kind: ServiceKind;
}

export default function ServicePage({ kind }: ServicePageProps) {
  const { lang, path, t } = useLocale();
  const copy = content[kind];
  const sections = copy.sections[lang];

  return (
    <main className={`${styles.page} ${kind === "privacy" ? styles.privacyPage : ""}`} aria-labelledby="service-page-title">
      <div className={`${styles.hero} ${kind === "help" ? styles.helpHero : ""}`}>
        <ServiceNavigation className={styles.serviceNav} />
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>REWIND / {t(copy.title)}</p>
          <h1 className={`${styles.title} ${kind === "faq" ? styles.faqTitle : ""}`} id="service-page-title">{t(copy.title)}</h1>
          <p className={styles.lead}>{copy.hero[lang]}</p>
        </div>
      </div>
      <article className={[styles.content, kind === "help" ? styles.helpContent : styles.editorialContent, kind !== "help" && kind !== "contact" ? styles.documentContent : "", kind === "delete-account" ? styles.deletionContent : "", kind === "film-data" ? styles.filmDataContent : "", kind === "privacy" ? styles.privacyContent : "", kind === "faq" ? styles.faqContent : ""].filter(Boolean).join(" ")} aria-labelledby="service-details-title">
        <h2 id="service-details-title" className="srOnly">{t(copy.title)}</h2>
        {kind === "help" ? <>
          <div className={styles.helpSteps}>{sections.map((section, index) => {
            const illustration = helpIllustrations[index];
            return <section className={styles.helpStep} key={section.heading}>
              <div className={styles.helpCopy}><h3>{section.heading}</h3><p>{section.body}</p><Link className={styles.guideLink} to={path(illustration.href)}>{t(illustration.label)} <span aria-hidden="true">→</span></Link></div>
              <div className={`${styles.helpIllustration} ${styles[illustration.className]}`} aria-hidden="true">
                {illustration.src ? <img src={illustration.src} alt="" loading="lazy" /> : <WatchedIllustration />}
              </div>
            </section>;
          })}</div>
          <div className={styles.helpGuides}>{helpGuides.map(guide => <section className={`${styles.helpGuide} ${styles[guide.className]}`} key={guide.image}>
            <div className={styles.guideImage} aria-hidden="true"><img src={guide.image} alt="" loading="lazy" /></div>
            <h3>{guide[lang].heading}</h3><p>{guide[lang].body}</p><Link className={styles.guideLink} to={path(guide.href)}>{t(guide.link)} <span aria-hidden="true">→</span></Link>
          </section>)}</div>
        </> : kind === "contact" ? <div className={styles.editorialBody}>
          <div className={styles.editorialIntro}>
            <p>{lang === "uk" ? "Будемо раді вашим думкам та ідеям про Rewind. Спершу перегляньте " : "We’d love to hear from you about any aspect of Rewind. Please check our "}<Link to={path("/faq")}>{lang === "uk" ? "сторінку поширених запитань" : "Frequent Questions page"}</Link>{lang === "uk" ? ". Якщо там немає відповіді або ви хочете надіслати загальне повідомлення про проєкт, напишіть нам на адресу нижче. Додайте сторінку чи функцію, якої стосується звернення, щоб ми краще його зрозуміли." : " first. If it does not answer your question, or you want to send a general message about the project, contact us using the address below. Please include the relevant page or feature so we can understand your enquiry."}</p>
            <p className={styles.contactAvailability}><a aria-label={lang === "uk" ? "Написати команді Rewind: anonimua910@gmail.com" : "Contact the Rewind team: anonimua910@gmail.com"} href="mailto:anonimua910@gmail.com">anonimua910@gmail.com</a></p>
          </div>
          {sections.map(section => <section key={section.heading} className={styles.editorialSection}>
            <h3>{section.heading}</h3>
            <ul>{section.items?.map(item => <li key={item}><span aria-hidden="true">✉</span>{item}</li>)}</ul>
            {section.body && <p>{section.body} <Link to={path("/film-data")}>{t("filmDataTitle")}</Link></p>}
          </section>)}
          <p className={styles.contactClosing}>{lang === "uk" ? "Для повідомлення про помилку підготуйте посилання на сторінку, кроки відтворення та опис очікуваного результату." : "For a bug report, include the page address, steps to reproduce, and the expected result."}</p>
        </div> : <div className={styles.editorialBody}>
          {copy.intro && <div className={styles.editorialIntro}><p>{copy.intro[lang]}</p></div>}
          {sections.map((section, index) => <section key={section.heading} className={styles.editorialSection}>
            <h3>{section.heading}</h3>
            {kind === "film-data" ? index === 0 ? <p>
              {lang === "uk" ? "Відсутні фільми та неточності в метаданих спершу виправляйте через " : "Please add missing films and correct metadata through "}
              <a href="https://www.themoviedb.org">TMDB</a>
              {lang === "uk" ? ". Внесені зміни можуть з’явитися в Rewind після оновлення даних фільму; фіксованого строку оновлення немає." : " first. Changes may appear in Rewind when the film’s data is refreshed; there is no fixed update deadline."}
            </p> : <p>
              {lang === "uk" ? "Якщо ви знайшли кілька сторінок одного фільму, підготуйте посилання на кожну з них для команди підтримки. Доступні контактні канали наведено на " : "If you find multiple pages for the same film, collect their addresses for the support team. Available contact channels are listed on the "}
              <Link to={path("/contact")}>{lang === "uk" ? "сторінці контактів" : "Contacts page"}</Link>.
            </p> : section.items ? <ol>{section.items.map(item => <li key={item}>{item}</li>)}</ol> : kind === "privacy" && index === sections.length - 1 ? <p>
              {lang === "uk" ? "У профілі можна " : "You can "}
              <Link to={path("/profile#profile-identity-form-title")}>{lang === "uk" ? "переглянути й оновити дані" : "view and update your profile details"}</Link>
              {lang === "uk" ? ", а для видалення акаунта скористайтеся " : ", and to delete your account use the "}
              <Link to={path("/profile#profile-delete-form-title")}>{lang === "uk" ? "формою видалення акаунта" : "account deletion form"}</Link>.
            </p> : <p>{section.body}{section.contactLink && <> {lang === "uk" ? "Зв’яжіться з командою через " : "Contact the team through "}<Link to={path("/contact")}>{lang === "uk" ? "Контакти" : "Contacts"}</Link>.</>}</p>}
          </section>)}
        </div>}
      </article>
    </main>
  );
}
