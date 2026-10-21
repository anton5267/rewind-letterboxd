import { Link } from "react-router-dom";
import { useLocale, type TranslationKey } from "../i18n";
import styles from "./ServicePage.module.css";

type ServiceKind = "help" | "contact" | "rules" | "privacy" | "film-data" | "delete-account";
type ServiceCopy = { title: TranslationKey; body: TranslationKey };

const content: Record<ServiceKind, ServiceCopy> = {
  help: { title: "helpTitle", body: "helpBody" },
  contact: { title: "contactTitle", body: "contactBody" },
  rules: { title: "rulesTitle", body: "rulesBody" },
  privacy: { title: "privacyTitle", body: "privacyBody" },
  "film-data": { title: "filmDataTitle", body: "filmDataBody" },
  "delete-account": { title: "deleteAccountTitle", body: "deleteAccountBody" },
};

interface ServicePageProps {
  kind: ServiceKind;
}

export default function ServicePage({ kind }: ServicePageProps) {
  const { lang, path, t } = useLocale();
  const copy = content[kind];
  const navigation = (Object.keys(content) as ServiceKind[]).map(value => ({ value, label: t(content[value].title) }));
  const details = lang === "uk" ? {
    help: ["Перевірте підключення та повторіть дію", "Скористайтеся пошуком фільмів і списків", "Керуйте оцінками, оглядами та добірками у профілі"],
    contact: ["Опишіть сторінку, на якій виникла проблема", "Додайте час події та кроки для повторення", "Не надсилайте паролі, cookies або токени"],
    rules: ["Поважайте інших учасників", "Публікуйте власний і законний контент", "Не обходьте блокування та обмеження доступу"],
    privacy: ["Email і службові поля не показуються публічно", "Сесії захищені HttpOnly cookies і CSRF", "Акаунт і пов’язані дані можна видалити з профілю"],
    "film-data": ["Метадані та зображення надходять із TMDB", "Рейтинги спільноти зберігаються окремо", "Відсутні дані не підміняються вигаданими значеннями"],
    "delete-account": ["Відкрийте налаштування власного профілю", "Підтвердьте дію поточним паролем", "Після видалення активні сесії буде завершено"],
  }[kind] : {
    help: ["Check your connection and retry the action", "Use search to browse films and lists", "Manage ratings, reviews and collections from your profile"],
    contact: ["Include the page where the issue occurred", "Add the event time and steps to reproduce it", "Never send passwords, cookies or tokens"],
    rules: ["Respect other community members", "Publish content you are allowed to share", "Do not bypass blocks or access restrictions"],
    privacy: ["Email and service fields are never public", "Sessions use HttpOnly cookies and CSRF protection", "Your account and related data can be deleted from your profile"],
    "film-data": ["Metadata and artwork are provided through TMDB", "Community ratings are stored separately", "Missing data is never replaced with invented values"],
    "delete-account": ["Open your profile settings", "Confirm the action with your current password", "Active sessions end after deletion"],
  }[kind];

  return (
    <main className={styles.page} aria-labelledby="service-page-title">
      <div className={styles.hero}>
        <nav className={styles.serviceNav} aria-label={t("help")}>{navigation.map(item => <Link key={item.value} aria-current={item.value === kind ? "page" : undefined} to={path(`/${item.value}`)}>{item.label}</Link>)}</nav>
        <div>
          <p className={styles.eyebrow}>REWIND / {t(copy.title)}</p>
          <h1 className={styles.title} id="service-page-title">{t(copy.title)}</h1>
          <p className={styles.lead}>{t(copy.body)}</p>
        </div>
      </div>
      <article className={styles.content} aria-labelledby="service-details-title">
        <h2 id="service-details-title">{lang === "uk" ? "Корисна інформація" : "Useful information"}</h2>
        <div className={styles.detailGrid}>{details.map((detail, index) => <section key={detail} className={styles.detailCard}><span aria-hidden="true">0{index + 1}</span><h3>{detail}</h3></section>)}</div>
      </article>
    </main>
  );
}
