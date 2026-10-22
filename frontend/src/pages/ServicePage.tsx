import { Link } from "react-router-dom";
import { useLocale, type TranslationKey } from "../i18n";
import styles from "./ServicePage.module.css";

type ServiceKind = "help" | "contact" | "rules" | "privacy" | "film-data" | "delete-account";
type ServiceSection = { heading: string; body: string };
type ServiceCopy = {
  title: TranslationKey;
  body: TranslationKey;
  hero: { uk: string; en: string };
  sections: { uk: ServiceSection[]; en: ServiceSection[] };
};

const content: Record<ServiceKind, ServiceCopy> = {
  help: {
    title: "helpTitle", body: "helpBody",
    hero: {
      uk: "Часті запитання Rewind допомагають розібратися із сервісом, щоб кожен читач почувався впевнено та був частиною кіноспільноти.",
      en: "Frequent Questions is Rewind’s guide to clarity, helping every reader feel confident, informed, and part of the cinema community.",
    },
    sections: {
      uk: [
        { heading: "Навіщо потрібен Rewind?", body: "Rewind створено як культурний простір для людей, які живуть кіно. Ми поєднуємо перевірену інформацію, аналіз і спільноту." },
        { heading: "Як користуватися сайтом?", body: "Переглядайте новини, огляди, списки та фестивальні оновлення з головної сторінки. Пошук і теги допоможуть знайти потрібний фільм або матеріал." },
        { heading: "Чи безкоштовний Rewind?", body: "Основні матеріали, огляди та оновлення відкриті для всіх. Окремі професійні функції можуть мати інші умови доступу." },
        { heading: "Чи можна долучитися?", body: "Ми приймаємо ідеї від критиків, журналістів і кіноманів: надсилайте пропозиції матеріалів, фестивальні звіти та спеціальні проєкти." },
        { heading: "Як Rewind працює зі спільнотою?", body: "Ми підтримуємо поважний діалог, конструктивну критику та різні погляди. Правила модерації допомагають зберігати безпечне середовище." },
        { heading: "Що відрізняє Rewind?", body: "Rewind поєднує аналіз і розповідь: ми не лише повідомляємо про прем’єри чи нагороди, а й досліджуємо вплив кіно на суспільство." },
      ],
      en: [
        { heading: "Why Rewind?", body: "Rewind is created as a cultural space for those who live and breathe cinema. We combine credibility, analysis, and community." },
        { heading: "How do I use the site?", body: "Browse news, reviews, lists, and festival updates from the homepage. Search and tags help you find films, articles, or features that match your interests." },
        { heading: "Is Rewind free?", body: "The core of Rewind is open to everyone. You can read articles, reviews, and updates without charge; some professional features may have separate terms." },
        { heading: "Can I contribute?", body: "We welcome contributions from critics, journalists, and film enthusiasts. You can pitch editorial ideas, share festival reports, or collaborate on special projects." },
        { heading: "How does Rewind handle community?", body: "Community is at the heart of Rewind. We encourage respectful dialogue, constructive criticism, and diverse perspectives." },
        { heading: "What makes Rewind different?", body: "Unlike traditional news outlets, Rewind blends analysis with storytelling and explores how cinema shapes society, identity, and imagination." },
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
        { heading: "Підтримка акаунта та дані фільмів", body: "Спочатку перевірте сторінку частих запитань. Для помилок, питань про акаунт або дані фільмів опишіть сторінку й кроки відтворення." },
        { heading: "Редакція та партнерства", body: "Надсилайте пропозиції матеріалів, фестивальні та соціальні партнерства через контактні канали проєкту." },
        { heading: "Преса та реклама", body: "Медіа-запити й рекламні пропозиції мають містити тему, організацію та зручний спосіб відповіді. Масові листи не обробляються." },
      ],
      en: [
        { heading: "Account Support + Film Data", body: "Please check the Frequent Questions page first. For account issues, bugs, or film data corrections, include the page and steps to reproduce the issue." },
        { heading: "Editorial + Partnerships", body: "Send editorial pitches, festival partnerships, social collaborations, and co-marketing enquiries through the project contact channel." },
        { heading: "Press + Advertising", body: "Press and advertising requests should include a subject, organisation, and a reliable reply address. Mass mail is ignored." },
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
        { heading: "Заборонена поведінка", body: "Заборонені мова ненависті, насильство, дискримінація, спам, маніпуляції, незаконне використання сервісу та несанкціонований доступ." },
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
        { heading: "Prohibited Conduct", body: "Hate, violence, discrimination, spam, manipulation, unlawful use, and unauthorised access are prohibited." },
        { heading: "Content Removal", body: "Rewind reserves the right to remove content that violates these rules or is deemed inappropriate." },
        { heading: "Intellectual Property", body: "Rights to software, text, images, graphics, and audiovisual content belong to Rewind or its licensors." },
        { heading: "Account Security", body: "Keep your credentials confidential. You are responsible for all activity under your account." },
        { heading: "Changes and Updates", body: "Rewind may amend these rules. Continued use of the service constitutes acceptance of the updated rules." },
      ],
    },
  },
  privacy: {
    title: "privacyTitle", body: "privacyBody",
    hero: {
      uk: "Політика приватності Rewind пояснює, як ми захищаємо дані, діємо прозоро та поважаємо кожного учасника.",
      en: "Privacy Policy is Rewind’s promise to remain transparent, safeguard data, and respect every member of our community.",
    },
    sections: {
      uk: [
        { heading: "Які дані ми використовуємо", body: "Ми збираємо лише необхідні для роботи сервісу дані: базову інформацію акаунта, технічні відомості та взаємодію зі сторінками, оцінками й оглядами." },
        { heading: "Як ми використовуємо дані", body: "Дані потрібні для роботи функцій, персоналізації, аналітики, покращення можливостей і захисту від зловживань." },
        { heading: "З ким ми ділимося даними", body: "Rewind не продає персональні дані. Обмежений доступ можуть отримувати партнери технічної підтримки за вимогами конфіденційності." },
        { heading: "Захист даних", body: "Ми використовуємо сучасні заходи безпеки, щоб захистити інформацію від несанкціонованого доступу, втрати чи зловживань." },
        { heading: "Ваші права", body: "Ви можете отримати доступ до своїх даних, виправити або видалити їх, а також змінити налаштування приватності у профілі." },
      ],
      en: [
        { heading: "What data we use", body: "We collect only the information necessary to operate the service: account details, technical information, and interaction data such as views, likes, and reviews." },
        { heading: "How we use data", body: "Data supports service functionality, personalisation, analytics, feature improvements, security, and abuse prevention." },
        { heading: "Who we share data with", body: "Rewind does not sell personal data. Information may be shared only with technical partners under strict confidentiality requirements." },
        { heading: "Data protection", body: "We use modern security measures to protect your information from unauthorised access, loss, or misuse." },
        { heading: "Your rights", body: "You have the right to access, correct, or delete your data and adjust privacy settings in your profile." },
      ],
    },
  },
  "film-data": {
    title: "filmDataTitle", body: "filmDataBody",
    hero: {
      uk: "Дані фільмів Rewind є джерелом правди для каталогу та допомагають підтримувати точність і довіру спільноти.",
      en: "Film Data is Rewind’s source of truth, ensuring accuracy, consistency, and credibility in every film we share with our community.",
    },
    sections: {
      uk: [
        { heading: "Додавання та виправлення даних", body: "Метадані, актори, режисери, студії, синопсиси, дати, трейлери та постери надходять із TMDB. Виправлення слід спочатку внести у TMDB; після цього вони з’являться в Rewind автоматично." },
        { heading: "Дублікати", body: "Якщо ви знайшли дубль фільму, повідомте команду через сторінку контактів. Ми об’єднаємо сторінки, зберігши оцінки, огляди та іншу активність." },
      ],
      en: [
        { heading: "Adding and correcting data", body: "Film metadata, cast, directors, studios, synopses, release dates, trailers, and poster art come from TMDB. Submit corrections through TMDB first; updates then appear in Rewind automatically." },
        { heading: "Duplicates", body: "If you notice duplicate pages for the same movie, contact the team through the Contacts page. We will merge them while preserving likes, reviews, and other activity." },
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
        { heading: "Що станеться після видалення", body: "Профіль зникне з пошуку, огляди, вподобання й коментарі буде видалено або знеособлено, підписки завершено. Відновити акаунт після видалення неможливо." },
        { heading: "Безпека та приватність", body: "Після видалення дані не використовуються для подальшої активності. Процес захищено сучасними заходами безпеки." },
        { heading: "Оновлення політики", body: "Правила видалення можуть оновлюватися відповідно до вимог безпеки та законодавства." },
      ],
      en: [
        { heading: "Purpose", body: "Account deletion is a final step that removes your profile and related activity from the platform. Save anything you need before confirming." },
        { heading: "What happens after deletion", body: "Your profile is no longer visible, reviews, likes, and comments are deleted or anonymised, and subscriptions end. A deleted account cannot be restored." },
        { heading: "Security and Privacy", body: "After deletion, your data is not used for further activity. Modern security measures protect the confidentiality of this process." },
        { heading: "Policy Updates", body: "Account deletion rules may be updated to comply with new security standards and legal requirements." },
      ],
    },
  },
};

interface ServicePageProps {
  kind: ServiceKind;
}

export default function ServicePage({ kind }: ServicePageProps) {
  const { lang, path, t } = useLocale();
  const copy = content[kind];
  const navigation = (Object.keys(content) as ServiceKind[]).map(value => ({ value, label: t(content[value].title) }));
  const sections = copy.sections[lang];

  return (
    <main className={styles.page} aria-labelledby="service-page-title">
      <div className={styles.hero}>
        <nav className={styles.serviceNav} aria-label={t("help")}>{navigation.map(item => <Link key={item.value} aria-current={item.value === kind ? "page" : undefined} to={path(`/${item.value}`)}>{item.label}</Link>)}</nav>
        <div>
          <p className={styles.eyebrow}>REWIND / {t(copy.title)}</p>
          <h1 className={styles.title} id="service-page-title">{t(copy.title)}</h1>
          <p className={styles.lead}>{copy.hero[lang]}</p>
        </div>
      </div>
      <article className={`${styles.content} ${styles[`content-${kind}`]}`} aria-labelledby="service-details-title">
        <h2 id="service-details-title" className="srOnly">{t(copy.title)}</h2>
        <div className={styles.detailGrid}>{sections.map((section, index) => <section key={section.heading} className={styles.detailCard}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{section.heading}</h3><p>{section.body}</p></div></section>)}</div>
      </article>
    </main>
  );
}
