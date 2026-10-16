import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

export default function Header() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, path, t, otherLanguagePath } = useLocale();

  return (
    <header className={styles.header}>

      {/* LOGO */}
      <Link to={path("/films")} className={styles.logo}>
        <img
          src="/logo.png.png"
          alt="REWIND"
          className={styles.logoImage}
        />
      </Link>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link to={path("/films")}>{t("films")}</Link>
        {isAuth ? (
          <>
            <Link to={path("/lists")}>{t("lists")}</Link>
            <Link to={path("/profile")}>{t("profile")}</Link>
            <button type="button" onClick={() => { logout(); navigate(path("/login")); }}>{t("logout")}</button>
          </>
        ) : (
          <>
            <Link to={path("/login")}>{t("login")}</Link>
            <Link to={path("/register")}>{t("register")}</Link>
          </>
        )}
        <Link to={otherLanguagePath} lang={lang === "uk" ? "en" : "uk"}>{lang === "uk" ? "EN" : "УКР"}</Link>
      </nav>

      {/* SEARCH */}
      <Link to={path("/films")} className={styles.search} aria-label={t("browseFilms")}>
        <i className="fa-solid fa-magnifying-glass"></i>
      </Link>

    </header>
  );
}
