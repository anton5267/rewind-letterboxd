import styles from "./Footer.module.css";
import { Link } from "react-router-dom";
import { useLocale } from "../i18n";

export default function Footer() {
  const { path, t } = useLocale();
  return (
    <footer className={styles.footer}>

      {/* TOP LINE */}
      <div className={styles.top}>

        {/* LOGO */}
        <div className={styles.logo}>
          <img src="/logo.png" alt="REWIND" />
        </div>

        {/* NAV */}
        <nav className={styles.nav} aria-label={t("moreNavigation")}>
          <Link to={path("/about")}>{t("about")}</Link>
          <Link to={path("/help")}>{t("help")}</Link>
          <Link to={path("/contact")}>{t("contact")}</Link>
          <Link to={path("/rules")}>{t("rules")}</Link>
          <Link to={path("/privacy")}>{t("privacy")}</Link>
          <Link to={path("/film-data")}>{t("filmData")}</Link>
          <Link to={path("/delete-account")}>{t("deleteAccount")}</Link>
        </nav>

      </div>

      {/* SOCIAL — */}
      <div className={styles.socialCenter}>
        <i className="fa-brands fa-x-twitter" aria-hidden="true"></i>
        <i className="fa-brands fa-instagram" aria-hidden="true"></i>
        <i className="fa-brands fa-youtube" aria-hidden="true"></i>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottom}>
        © {new Date().getFullYear()} Rewind. {t("footerMade")} {t("filmDataFrom")} <Link to={path("/about")}>{t("credits")}</Link>
      </div>

    </footer>
  );
}
