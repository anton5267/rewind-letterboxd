import styles from "./Header.module.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getUnreadMessageCount } from "../api/messages.api";
import { getUnreadNotificationCount } from "../api/notifications.api";
import { UNREAD_COUNTS_CHANGED_EVENT } from "../utils/unreadEvents";
import { toTagSlug } from "../utils/tagSlug";

export default function Header() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, path, t, otherLanguagePath } = useLocale();
  const [logoutError, setLogoutError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const locationKey = `${location.pathname}${location.search}`;
  const lastLocationKeyRef = useRef(locationKey);

  useEffect(() => {
    if (!isAuth) {
      setUnreadMessages(0);
      setUnreadNotifications(0);
      return;
    }
    let active = true;
    const refreshUnread = () => {
      void getUnreadMessageCount()
        .then(({ data }) => { if (active) setUnreadMessages(data.count); })
        .catch(() => {
          // The navigation remains usable when the optional message counter fails.
        });
      void getUnreadNotificationCount()
        .then(({ data }) => { if (active) setUnreadNotifications(data.count); })
        .catch(() => {
          // The navigation remains usable when the optional notification counter fails.
        });
    };
    refreshUnread();
    window.addEventListener(UNREAD_COUNTS_CHANGED_EVENT, refreshUnread);
    const timer = window.setInterval(refreshUnread, 30_000);
    return () => {
      active = false;
      window.removeEventListener(UNREAD_COUNTS_CHANGED_EVENT, refreshUnread);
      window.clearInterval(timer);
    };
  }, [isAuth]);

  useEffect(() => {
    const locationChanged = lastLocationKeyRef.current !== locationKey;
    lastLocationKeyRef.current = locationKey;
    if (!locationChanged || !mobileMenuOpen) return;
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  }, [locationKey, mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>("a, button");
    firstFocusable?.focus();
  }, [mobileMenuOpen]);

  const handleMobileMenuKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = mobileMenuRef.current?.querySelectorAll<HTMLElement>("a, button");
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleLogout = async () => {
    setLogoutError(false);
    try {
      await logout();
      navigate(path("/login"));
    } catch {
      setLogoutError(true);
    }
  };

  const lightHeader = /^\/(uk|en)\/(journal\/|people\/)/.test(location.pathname);
  const mobileDetailHeader = /^\/(uk|en)\/(films|reviews)\/[^/]+\/?$/.test(location.pathname);
  const mobileListDetailHeader = /^\/(uk|en)\/lists\/public\/[^/]+\/?$/.test(location.pathname);
  const mobileSearchHeader = /^\/(uk|en)\/search\/?$/.test(location.pathname);
  const listParams = new URLSearchParams(location.search);
  const listsLandingHeader = /^\/(uk|en)\/lists\/discover\/?$/.test(location.pathname)
    && !listParams.get("feed") && !toTagSlug(listParams.get("tag") ?? "");

  return (
    <header className={`${styles.header} ${lightHeader ? styles.light : ""} ${mobileDetailHeader ? styles.mobileDetail : ""} ${mobileListDetailHeader ? styles.mobileListDetail : ""} ${mobileSearchHeader ? styles.mobileSearch : ""} ${listsLandingHeader ? styles.listsLanding : ""}`}>

      {listsLandingHeader && <div className={styles.listLandingControls}>
        <Link to={path("/home")} aria-label={t("home")}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></Link>
        <Link to={path("/lists/discover?feed=recent")} aria-label={t("filters")}><i className="fa-solid fa-sliders" aria-hidden="true" /></Link>
      </div>}

      {/* LOGO */}
      <Link to={path("/home")} className={styles.logo}>
        <img
          src="/logo.png"
          alt="REWIND"
          className={styles.logoImage}
        />
      </Link>

      {/* NAV */}
      <nav
        className={styles.nav}
        aria-label={t("mainNavigation")}
        onFocusCapture={event => {
          if (event.target instanceof HTMLElement) {
            event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
          }
        }}
      >
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
      {logoutError && <p className={styles.logoutError} role="alert">{t("logoutError")}</p>}

      {/* SEARCH */}
      <Link to={path("/search")} className={styles.search} aria-label={t("globalSearch")}>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
      </Link>

      <button ref={menuToggleRef} className={styles.menuToggle} type="button" aria-expanded={mobileMenuOpen} aria-controls={mobileMenuOpen ? "mobile-more-menu" : undefined} aria-label={mobileMenuOpen ? t("closeMenu") : t("menu")} onClick={() => mobileMenuOpen ? closeMobileMenu() : setMobileMenuOpen(true)}>
        <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true"></i>
      </button>

      {mobileMenuOpen && <>
        <button className={styles.menuBackdrop} type="button" aria-label={t("closeMenu")} onClick={closeMobileMenu} />
        <nav ref={mobileMenuRef} className={styles.mobileMenu} id="mobile-more-menu" aria-label={t("moreNavigation")} onKeyDown={handleMobileMenuKeyDown}>
          <Link to={path("/films")}>{t("films")}</Link>
          <Link to={path("/community")}>{t("community")}</Link>
          {isAuth ? <>
            <Link to={path("/lists")}>{t("lists")}</Link>
            <Link to={path("/notifications")}><span>{t("notifications")}</span>{unreadNotifications > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadNotifications}`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>
            <Link to={path("/messages")}><span>{t("messages")}</span>{unreadMessages > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadMessages}`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</Link>
            {user?.role === "ADMIN" && <Link to={path("/admin")}>{t("adminDashboard")}</Link>}
            <button type="button" onClick={() => { void handleLogout(); }}>{t("logout")}</button>
          </> : <>
            <Link to={path("/login")}>{t("login")}</Link>
            <Link to={path("/register")}>{t("register")}</Link>
          </>}
          <Link to={otherLanguagePath} lang={lang === "uk" ? "en" : "uk"}>{lang === "uk" ? "EN" : "УКР"}</Link>
        </nav>
      </>}

      <nav className={styles.mobileNav} aria-label={t("mainNavigation")}>
        <NavLink end to={path("/home")}><i className="fa-solid fa-house" aria-hidden="true"></i><span>{t("home")}</span></NavLink>
        <NavLink to={path("/search")}><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i><span>{t("search")}</span></NavLink>
        <NavLink to={path("/films")}><i className="fa-solid fa-circle-plus" aria-hidden="true"></i><span>{t("add")}</span></NavLink>
        <NavLink to={path("/journal")}><i className="fa-solid fa-book-open" aria-hidden="true"></i><span>{t("journal")}</span></NavLink>
        <NavLink to={path(isAuth ? "/profile" : "/login")}><i className="fa-solid fa-user" aria-hidden="true"></i><span>{isAuth ? t("profile") : t("login")}</span></NavLink>
      </nav>

    </header>
  );
}
