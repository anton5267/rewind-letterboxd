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
          <img src="/logo.png.png" alt="REWIND" />
        </div>

        {/* NAV */}
        <nav className={styles.nav}>
          <Link to={path("/about")}>{t("about")}</Link>
        </nav>

      </div>

      {/* SOCIAL — */}
      <div className={styles.socialCenter}>
        <i className="fa-brands fa-x-twitter"></i>
        <i className="fa-brands fa-instagram"></i>
        <i className="fa-brands fa-youtube"></i>
      </div>

      {/* BOTTOM */}
      <div className={styles.bottom}>
        © {new Date().getFullYear()} Rewind. {t("footerMade")} {t("filmDataFrom")} <Link to={path("/about")}>{t("credits")}</Link>
      </div>

    </footer>
  );
}
