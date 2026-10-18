import styles from "./Header.module.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import { useEffect, useState } from "react";
import { getUnreadMessageCount } from "../api/messages.api";
import { getUnreadNotificationCount } from "../api/notifications.api";

export default function Header() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const { lang, path, t, otherLanguagePath } = useLocale();
  const [logoutError, setLogoutError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuth) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }
    let active = true;
    const refreshUnread = () => {
      void Promise.all([getUnreadMessageCount(), getUnreadNotificationCount()])
        .then(([messagesResponse, notificationsResponse]) => {
          if (!active) return;
          setUnreadMessages(messagesResponse.data.count);
          setUnreadNotifications(notificationsResponse.data.count);
        })
        .catch(() => {
          // The navigation remains usable when optional counters fail.
        });
    };
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isAuth]);

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
        <Link to={path("/community")}>{t("community")}</Link>
        <Link to={path("/journal")}>{t("journal")}</Link>
        {isAuth ? (
          <>
            <Link to={path("/lists")}>{t("lists")}</Link>
            <Link to={path("/profile")}>{t("profile")}</Link>
            <Link to={path("/notifications")}><span>{t("notifications")}</span>{unreadNotifications > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadNotifications}`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>
            <Link to={path("/messages")}><span>{t("messages")}</span>{unreadMessages > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadMessages}`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</Link>
            {user?.role === "ADMIN" && <Link to={path("/admin")}>{t("adminDashboard")}</Link>}
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
