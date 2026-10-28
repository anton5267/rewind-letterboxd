import styles from "./Header.module.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getUnreadMessageCount } from "../api/messages.api";
import { getUnreadNotificationCount } from "../api/notifications.api";
import { UNREAD_COUNTS_CHANGED_EVENT } from "../utils/unreadEvents";
import { toTagSlug } from "../utils/tagSlug";

type MobileNavIconName = "home" | "search" | "add" | "journal" | "profile";

function MobileNavIcon({ name }: { name: MobileNavIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  switch (name) {
    case "home":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><path d="m3 10 9-7 9 7" /><path d="M5.5 9v11h5v-6h3v6h5V9" /></svg>;
    case "search":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="10.8" cy="10.8" r="7.1" /><path d="m16 16 5 5" /></svg>;
    case "add":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>;
    case "journal":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h7M9 12h7M9 16h7" /><circle cx="7" cy="8" r=".45" fill="currentColor" stroke="none" /><circle cx="7" cy="12" r=".45" fill="currentColor" stroke="none" /><circle cx="7" cy="16" r=".45" fill="currentColor" stroke="none" /></svg>;
    case "profile":
      return <svg viewBox="0 0 24 24" aria-hidden="true" {...common}><circle cx="12" cy="7.5" r="3.5" /><path d="M4.5 21v-1.4a7.5 7.5 0 0 1 15 0V21z" /></svg>;
  }
}

export default function Header() {
  const { isAuth, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, path, t, otherLanguagePath } = useLocale();
  const [logoutError, setLogoutError] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const accountToggleRef = useRef<HTMLButtonElement>(null);
  const accountAreaRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const locationKey = `${location.pathname}${location.search}`;
  const lastLocationKeyRef = useRef(locationKey);

  const focusVisibleNavigation = () => {
    const targets = [accountToggleRef.current, menuToggleRef.current, mobileNavRef.current?.querySelector<HTMLAnchorElement>("a")];
    targets.find(target => target && target.getClientRects().length > 0)?.focus();
  };

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
    if (!locationChanged) return;
    setAccountOpen(false);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      window.requestAnimationFrame(() => menuToggleRef.current?.focus());
    }
  }, [locationKey, mobileMenuOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountAreaRef.current?.contains(event.target)) setAccountOpen(false);
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeAtBreakpoint = () => {
      if (desktop.matches) return;
      setAccountOpen(false);
      window.requestAnimationFrame(focusVisibleNavigation);
    };
    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeAtBreakpoint);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeAtBreakpoint);
    };
  }, [accountOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => menuToggleRef.current?.focus());
  };

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>("a, button");
    firstFocusable?.focus();
    const mobile = window.matchMedia("(max-width: 767px)");
    const closeAtBreakpoint = () => {
      if (mobile.matches) return;
      setMobileMenuOpen(false);
      window.requestAnimationFrame(focusVisibleNavigation);
    };
    mobile.addEventListener("change", closeAtBreakpoint);
    return () => mobile.removeEventListener("change", closeAtBreakpoint);
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

  // Person/filmography pages use the same dark canvas as the Figma Actor frames;
  // only Journal keeps its light editorial header treatment.
  const mobileDetailHeader = /^\/(uk|en)\/(films|reviews)\/[^/]+\/?$/.test(location.pathname);
  const mobileFilmsHeader = /^\/(uk|en)\/films\/?$/.test(location.pathname);
  const mobileListDetailHeader = /^\/(uk|en)\/lists\/public\/[^/]+\/?$/.test(location.pathname);
  const mobileSearchHeader = /^\/(uk|en)\/search\/?$/.test(location.pathname);
  const mobileHomeHeader = /^\/(uk|en)\/home\/?$/.test(location.pathname);
  const mobileCommunityHeader = /^\/(uk|en)\/community(?:\/reviewers)?\/?$/.test(location.pathname);
  const mobilePersonHeader = /^\/(uk|en)\/people\/(actor|director|producer)\/[^/]+\/?$/.test(location.pathname);
  const mobilePublicProfileHeader = /^\/(uk|en)\/users\/\d+\/?$/.test(location.pathname);
  const mobileProfileHeader = /^\/(uk|en)\/profile\/?$/.test(location.pathname);
  const mobileUserListsHeader = /^\/(uk|en)\/lists\/?$/.test(location.pathname);
  const settingsView = new URLSearchParams(location.search).get("settings");
  const mobileProfileSettingsHeader = mobileProfileHeader && ["profile", "authentication", "avatar", "connections"].includes(settingsView ?? "");
  const mobileAuthHeader = /^\/(uk|en)\/(auth|login|register|forgot-password|reset-password)\/?$/.test(location.pathname);
  const listParams = new URLSearchParams(location.search);
  const listsLandingHeader = /^\/(uk|en)\/lists\/discover\/?$/.test(location.pathname)
    && !toTagSlug(listParams.get("tag") ?? "");
  const listsFeedHeader = listsLandingHeader && Boolean(listParams.get("feed"));

  return (
    <header className={`${styles.header} ${mobileDetailHeader ? styles.mobileDetail : ""} ${mobileFilmsHeader ? styles.mobileFilms : ""} ${mobileListDetailHeader ? styles.mobileListDetail : ""} ${mobileSearchHeader ? styles.mobileSearch : ""} ${mobileHomeHeader ? styles.mobileHome : ""} ${mobileCommunityHeader ? styles.mobileCommunity : ""} ${mobilePersonHeader ? styles.mobilePerson : ""} ${mobilePublicProfileHeader ? styles.mobilePublicProfile : ""} ${mobileProfileHeader ? styles.mobileProfile : ""} ${mobileUserListsHeader ? styles.mobileUserLists : ""} ${mobileProfileSettingsHeader ? styles.mobileProfileSettings : ""} ${mobileAuthHeader ? styles.mobileAuth : ""} ${listsLandingHeader ? styles.listsLanding : ""}`}>

      {listsLandingHeader && <div className={styles.listLandingControls}>
        <Link to={path(listsFeedHeader ? "/lists/discover" : "/home")} aria-label={listsFeedHeader ? t("discoverLists") : t("home")}><i className="fa-solid fa-chevron-left" aria-hidden="true" /></Link>
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

      <nav className={styles.desktopNav} aria-label={t("mainNavigation")}>
        <Link to={path("/films/discover")}>{t("films")}</Link>
        <Link to={path("/lists/discover")}>{t("searchLists")}</Link>
        <Link to={path("/community")}>{t("searchMembers")}</Link>
        <Link to={path("/journal")}>{t("journal")}</Link>
        <div ref={accountAreaRef} className={styles.accountArea}
          onBlurCapture={event => {
            if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setAccountOpen(false);
          }}
          onKeyDown={event => {
            if (event.key !== "Escape" || !accountOpen) return;
            event.preventDefault();
            setAccountOpen(false);
            accountToggleRef.current?.focus();
          }}>
          <button ref={accountToggleRef} className={styles.accountToggle} type="button" aria-expanded={accountOpen} aria-controls={accountOpen ? "desktop-account-links" : undefined} onClick={() => setAccountOpen(open => !open)}>
            <span>{t("account")}</span>
            {isAuth && unreadMessages + unreadNotifications > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadMessages + unreadNotifications}`}>{unreadMessages + unreadNotifications > 99 ? "99+" : unreadMessages + unreadNotifications}</span>}
          </button>
          {accountOpen && <div className={styles.accountPopover} id="desktop-account-links">
            {isAuth ? <>
              <Link to={path("/profile")}>{t("profile")}</Link>
              <Link to={path("/lists")}>{t("lists")}</Link>
              <Link to={`${path("/profile")}?settings=profile`}>{t("accountSettings")}</Link>
              <Link to={path("/notifications")}><span>{t("notifications")}</span>{unreadNotifications > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadNotifications}`}>{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>
              <Link to={path("/messages")}><span>{t("messages")}</span>{unreadMessages > 0 && <span className={styles.badge} aria-label={`${t("unread")}: ${unreadMessages}`}>{unreadMessages > 99 ? "99+" : unreadMessages}</span>}</Link>
              {user?.role === "ADMIN" && <Link to={path("/admin")}>{t("adminDashboard")}</Link>}
              <button type="button" onClick={() => { void handleLogout(); }}>{t("logout")}</button>
            </> : <>
              <Link to={path("/auth")}>{t("account")}</Link>
              <Link to={path("/login")}>{t("login")}</Link>
              <Link to={path("/register")}>{t("register")}</Link>
            </>}
            <Link to={otherLanguagePath} lang={lang === "uk" ? "en" : "uk"}>{lang === "uk" ? "EN" : "УКР"}</Link>
          </div>}
        </div>
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
            <Link to={path("/auth")}>{t("account")}</Link>
            <Link to={path("/login")}>{t("login")}</Link>
            <Link to={path("/register")}>{t("register")}</Link>
          </>}
          <Link to={otherLanguagePath} lang={lang === "uk" ? "en" : "uk"}>{lang === "uk" ? "EN" : "УКР"}</Link>
        </nav>
      </>}

      <nav ref={mobileNavRef} className={styles.mobileNav} aria-label={t("mainNavigation")}>
        <NavLink end to={path("/home")} aria-label={t("home")}><MobileNavIcon name="home" /><span className={mobileHomeHeader ? undefined : styles.visuallyHidden}>{t("home")}</span></NavLink>
        <NavLink to={path("/search")} aria-label={t("search")}><MobileNavIcon name="search" /><span className={mobileHomeHeader ? undefined : styles.visuallyHidden}>{t("search")}</span></NavLink>
        <NavLink to={path("/films")} aria-label={t("add")}><MobileNavIcon name="add" /><span className={mobileHomeHeader ? undefined : styles.visuallyHidden}>{t("add")}</span></NavLink>
        <NavLink to={path("/journal")} aria-label={t("journal")}><MobileNavIcon name="journal" /><span className={mobileHomeHeader ? undefined : styles.visuallyHidden}>{t("journal")}</span></NavLink>
        <NavLink to={path(isAuth ? "/profile" : "/auth")} aria-label={t("profile")}><MobileNavIcon name="profile" /><span className={mobileHomeHeader ? undefined : styles.visuallyHidden}>{t("profile")}</span></NavLink>
      </nav>

    </header>
  );
}
