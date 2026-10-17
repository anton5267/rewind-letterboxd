import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import { useState } from "react";

export default function Header() {
  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, path, t, otherLanguagePath } = useLocale();
  const [logoutError, setLogoutError] = useState(false);

  const handleLogout = async () => {
    setLogoutError(false);
    try {
      await logout();
      navigate(path("/login"));
    } catch {
      setLogoutError(true);
    }
  };

  return (
    <header className={styles.header}>

      {/* LOGO */}
      <Link to={path("/home")} className={styles.logo}>
        <img
          src="/logo.png.png"
          alt="REWIND"
          className={styles.logoImage}
        />
      </Link>

      {/* NAV */}
      <nav className={styles.nav}>
        <Link to={path("/home")}>{t("home")}</Link>
        <Link to={path("/films")}>{t("films")}</Link>
        {isAuth ? (
          <>
            <Link to={path("/lists")}>{t("lists")}</Link>
            <Link to={path("/profile")}>{t("profile")}</Link>
            <Link to={path("/notifications")}>{t("notifications")}</Link>
            <button type="button" onClick={() => { void handleLogout(); }}>{t("logout")}</button>
          </>
        ) : (
          <>
            <Link to={path("/login")}>{t("login")}</Link>
            <Link to={path("/register")}>{t("register")}</Link>
          </>
        )}
        <Link to={otherLanguagePath} lang={lang === "uk" ? "en" : "uk"}>{lang === "uk" ? "EN" : "УКР"}</Link>
      </nav>
      {logoutError && <p role="alert">{t("logoutError")}</p>}

      {/* SEARCH */}
      <Link to={path("/films")} className={styles.search} aria-label={t("browseFilms")}>
        <i className="fa-solid fa-magnifying-glass"></i>
      </Link>

    </header>
  );
}
