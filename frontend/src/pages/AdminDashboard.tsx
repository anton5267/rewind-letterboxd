import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { getAdminDashboard, getAdminSettings, updateAdminSetting, type AdminDashboard as Dashboard, type AdminSetting } from "../api/admin.api";
import AdminAuditLogs from "../components/AdminAuditLogs";
import AdminArticles from "../components/AdminArticles";
import AdminComments from "../components/AdminComments";
import AdminConversations from "../components/AdminConversations";
import AdminLists from "../components/AdminLists";
import AdminModerationQueue from "../components/AdminModerationQueue";
import AdminMovies from "../components/AdminMovies";
import AdminPersonalMetrics from "../components/AdminPersonalMetrics";
import AdminLoading from "../components/AdminLoading";
import AdminNotifications from "../components/AdminNotifications";
import AdminReviews from "../components/AdminReviews";
import AdminUsers from "../components/AdminUsers";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { localizeUserRole, useLocale } from "../i18n";
import styles from "./AdminDashboard.module.css";

const adminViews = ["dashboard", "users", "user-profile", "movies", "reviews", "comments", "lists", "moderation", "conversations", "notifications", "articles", "logs", "settings"] as const;

function revealNavigationLink(nav: HTMLElement, link: HTMLElement) {
  const rail = nav.getBoundingClientRect();
  const item = link.getBoundingClientRect();
  const inset = 10;
  if (item.left < rail.left + inset) nav.scrollLeft += item.left - rail.left - inset;
  else if (item.right > rail.right - inset) nav.scrollLeft += item.right - rail.right + inset;
}

export default function AdminDashboard() {
  const { isAuth, ready, user } = useAuth();
  const { lang, path, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view") ?? "dashboard";
  const activeView = adminViews.find(view => view === requestedView) ?? "dashboard";
  const rawProfileUserId = searchParams.get("user");
  const parsedProfileUserId = rawProfileUserId && /^\d+$/.test(rawProfileUserId) ? Number(rawProfileUserId) : NaN;
  const profileUserId = Number.isSafeInteger(parsedProfileUserId) && parsedProfileUserId > 0 ? parsedProfileUserId : undefined;
  const navigation = [
    { id: "dashboard", label: t("adminDashboard"), icon: "fa-solid fa-chart-line" },
    { id: "users", label: t("adminUsers"), icon: "fa-solid fa-users" },
    { id: "movies", label: t("adminMovies"), icon: "fa-solid fa-film" },
    { id: "reviews", label: t("adminReviews"), icon: "fa-solid fa-star" },
    { id: "comments", label: t("adminComments"), icon: "fa-solid fa-comment" },
    { id: "lists", label: t("adminLists"), icon: "fa-solid fa-list" },
    { id: "moderation", label: t("moderationQueue"), icon: "fa-solid fa-shield-halved" },
    { id: "conversations", label: t("adminConversations"), icon: "fa-solid fa-comments" },
    { id: "notifications", label: t("adminNotifications"), icon: "fa-solid fa-bell" },
    { id: "articles", label: t("journalEditor"), icon: "fa-solid fa-newspaper" },
    { id: "logs", label: t("auditLogs"), icon: "fa-solid fa-clock-rotate-left" },
    { id: "settings", label: t("adminSettings"), icon: "fa-solid fa-gear" },
  ] as const;
  const activeTitle = activeView === "user-profile" ? t("adminUserProfile") : navigation.find(item => item.id === activeView)?.label;
  const navAssets: Record<string, string> = Object.fromEntries(["dashboard", "users", "movies", "reviews", "comments", "lists", "moderation", "settings"].map(id => [id, `/images/admin-nav-${id}.svg`]));
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [dashboardError, setDashboardError] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [failedSettingKey, setFailedSettingKey] = useState<string | null>(null);
  const [saveBusyKey, setSaveBusyKey] = useState<string | null>(null);
  const [dashboardAttempt, setDashboardAttempt] = useState(0);
  const [dashboardSettled, setDashboardSettled] = useState(0);
  const dashboardTitle = useRef<HTMLHeadingElement>(null);
  const dashboardAlert = useRef<HTMLParagraphElement>(null);
  const dashboardMounted = useRef(false);
  const dashboardScope = useRef(0);
  const dashboardFocusScope = useRef(0);
  const dashboardRequest = useRef(0);
  const dashboardFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null } | null>(null);
  const [settingsAttempt, setSettingsAttempt] = useState(0);
  const settingsTitle = useRef<HTMLHeadingElement>(null);
  const settingsSaveAlert = useRef<HTMLParagraphElement>(null);
  const settingButtons = useRef(new Map<string, HTMLButtonElement>());
  const settingsScope = useRef(0);
  const settingsMounted = useRef(false);
  const settingSaveToken = useRef<object | null>(null);
  const settingsFocus = useRef<{ scope: number; origin: HTMLElement | null; target: "title" | "error" | "save"; key?: string } | null>(null);
  const adminNavigation = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const nav = adminNavigation.current;
    if (!nav) return;
    const revealSelected = () => {
      const focused = document.activeElement;
      const selected = focused instanceof HTMLElement && nav.contains(focused) ? focused.closest<HTMLElement>("a") : nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (selected) revealNavigationLink(nav, selected);
    };
    revealSelected();
    const observer = new ResizeObserver(revealSelected);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeView, lang, ready, isAuth, user?.role]);

  useLayoutEffect(() => {
    dashboardMounted.current = true;
    return () => {
      dashboardMounted.current = false;
      dashboardScope.current += 1;
      dashboardFocus.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    dashboardScope.current += 1;
    setDashboard(null);
    setDashboardLoading(true);
    setDashboardError(false);
  }, [activeView, ready, isAuth, user?.id, user?.role]);

  useLayoutEffect(() => {
    dashboardFocusScope.current += 1;
    dashboardFocus.current = null;
  }, [activeView, lang, ready, isAuth, user?.id, user?.role]);

  useEffect(() => {
    const pending = dashboardFocus.current;
    if (!pending || dashboardLoading || activeView !== "dashboard" || dashboardSettled !== pending.request) return;
    const frame = window.requestAnimationFrame(() => {
      if (dashboardFocus.current !== pending) return;
      dashboardFocus.current = null;
      if (!dashboardMounted.current || dashboardFocusScope.current !== pending.scope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      (dashboardError ? dashboardAlert.current : dashboardTitle.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, lang, dashboardLoading, dashboardError, dashboardSettled]);

  useLayoutEffect(() => {
    settingsMounted.current = true;
    return () => {
      settingsMounted.current = false;
      settingsScope.current += 1;
      settingsFocus.current = null;
      settingSaveToken.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    settingsScope.current += 1;
    settingsFocus.current = null;
    settingSaveToken.current = null;
    setSaveBusyKey(null);
    setSaveError(false);
    setFailedSettingKey(null);
  }, [activeView, lang, ready, isAuth, user?.id, user?.role]);

  useEffect(() => {
    const pending = settingsFocus.current;
    if (!pending || settingsLoading || saveBusyKey !== null || activeView !== "settings") return;
    const frame = window.requestAnimationFrame(() => {
      if (settingsFocus.current !== pending) return;
      settingsFocus.current = null;
      if (!settingsMounted.current || settingsScope.current !== pending.scope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const target = pending.target === "error" ? settingsSaveAlert.current
        : pending.target === "save" && pending.key ? settingButtons.current.get(pending.key)
        : settingsTitle.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeView, lang, settingsLoading, settingsError, settings, saveBusyKey, saveError]);

  useEffect(() => {
    if (!ready || !isAuth || user?.role !== "ADMIN" || activeView !== "dashboard") return;
    let current = true;
    const scope = dashboardScope.current;
    const request = ++dashboardRequest.current;
    const isCurrent = () => current && dashboardMounted.current && dashboardScope.current === scope && dashboardRequest.current === request;
    setDashboard(null);
    setDashboardLoading(true);
    setDashboardError(false);
    getAdminDashboard()
      .then(({ data }) => { if (isCurrent()) setDashboard(data); })
      .catch(() => { if (isCurrent()) setDashboardError(true); })
      .finally(() => {
        if (!isCurrent()) return;
        setDashboardSettled(request);
        setDashboardLoading(false);
      });
    return () => { current = false; };
  }, [ready, isAuth, user?.id, user?.role, dashboardAttempt, activeView]);

  useEffect(() => {
    if (!ready || !isAuth || user?.role !== "ADMIN" || activeView !== "settings") return;
    let current = true;
    setSettingsLoading(true);
    setSettingsError(false);
    getAdminSettings()
      .then(({ data }) => { if (current) setSettings(data); })
      .catch(() => { if (current) setSettingsError(true); })
      .finally(() => { if (current) setSettingsLoading(false); });
    return () => { current = false; };
  }, [ready, isAuth, user?.id, user?.role, lang, settingsAttempt, activeView]);

  const updateMovieCount = useCallback((movies: number) => {
    setDashboard(current => current ? { ...current, movies } : current);
  }, []);

  if (!ready) return <main className={styles.page} aria-labelledby="admin-dashboard-loading-title" aria-busy={true}><h1 id="admin-dashboard-loading-title" className="srOnly">{t("adminDashboard")}</h1><p className={styles.feedback} role="status">{t("loading")}</p></main>;
  if (!isAuth || user?.role !== "ADMIN") return <Navigate to={path("/home")} replace />;
  if (activeView === "user-profile" && profileUserId === undefined) return <Navigate to={path("/admin?view=users")} replace />;
  const saveSetting = async (setting: AdminSetting, origin: HTMLElement | null) => {
    if (settingSaveToken.current !== null) return;
    const token = {};
    settingSaveToken.current = token;
    const scope = settingsScope.current;
    const isCurrent = () => settingsMounted.current && settingsScope.current === scope && settingSaveToken.current === token;
    settingsFocus.current = null;
    setSaveError(false);
    setFailedSettingKey(null);
    setSaveBusyKey(setting.key);
    try {
      const { data } = await updateAdminSetting(setting.key, setting.value);
      if (!isCurrent()) return;
      setSettings(current => current.map(item => item.key === data.key ? data : item));
      settingsFocus.current = { scope, origin, target: "save", key: setting.key };
    } catch {
      if (!isCurrent()) return;
      setFailedSettingKey(setting.key);
      setSaveError(true);
      settingsFocus.current = { scope, origin, target: "error" };
    } finally {
      if (isCurrent()) {
        settingSaveToken.current = null;
        setSaveBusyKey(null);
      }
    }
  };

  const retrySettingSave = () => {
    if (!failedSettingKey) return;
    const setting = settings.find(item => item.key === failedSettingKey);
    if (setting) void saveSetting(setting, document.activeElement instanceof HTMLElement ? document.activeElement : null);
  };
  const settingLabel = (key: string) => {
    switch (key) {
      case "default_locale": return t("adminSettingDefaultLocale");
      case "journal_enabled": return t("adminSettingJournalEnabled");
      case "maintenance_mode": return t("adminSettingMaintenanceMode");
      case "site_name": return t("adminSettingSiteName");
      default: return key;
    }
  };
  const pageBusy = (activeView === "dashboard" && dashboardLoading) || (activeView === "settings" && (settingsLoading || saveBusyKey !== null));
  const settingsPanel = (
    <section className={styles.settings} aria-labelledby="admin-settings-title" aria-busy={settingsLoading || saveBusyKey !== null}>
      <h2 className={styles.settingsTitle} id="admin-settings-title" ref={settingsTitle} tabIndex={-1}>{t("adminSettings")}</h2>
      <div className={styles.settingsWorkspace}>
      {settingsLoading && settings.length === 0 ? <AdminLoading label={t("loading")} layout="settings" />
        : settingsError ? <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={settingsLoading} busy={settingsLoading} onRetry={() => {
          settingsFocus.current = { scope: settingsScope.current, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, target: "title" };
          setSettingsLoading(true);
          setSettingsAttempt(value => value + 1);
        }} />
          : settings.length === 0 ? <p>{t("noAdminSettings")}</p>
            : <ul className={styles.settingsList}>{settings.map(setting => <li className={styles.settingRow} key={setting.key}>
              {setting.key === "default_locale" ? <label className={styles.settingField}>{settingLabel(setting.key)}<select className={styles.settingInput} value={setting.value} disabled={saveBusyKey !== null} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: event.target.value } : item))}>
                <option value="uk">{lang === "uk" ? "Українська" : "Ukrainian"}</option>
                <option value="en">{lang === "uk" ? "Англійська" : "English"}</option>
              </select></label>
                : setting.key === "maintenance_mode" || setting.key === "journal_enabled" ? <label className={styles.settingToggle}>
                  <input type="checkbox" checked={setting.value.toLowerCase() === "true"} disabled={saveBusyKey !== null} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: String(event.target.checked) } : item))} />
                  <span>{settingLabel(setting.key)}</span>
                </label>
                  : <label className={styles.settingField}>{settingLabel(setting.key)}<input className={styles.settingInput} value={setting.value} disabled={saveBusyKey !== null} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: event.target.value } : item))} /></label>}
              <button ref={button => { if (button) settingButtons.current.set(setting.key, button); else settingButtons.current.delete(setting.key); }} type="button" disabled={saveBusyKey !== null} aria-busy={saveBusyKey === setting.key} onClick={event => { void saveSetting(setting, event.currentTarget); }}>{saveBusyKey === setting.key ? t("loading") : t("saveSetting")}</button>
            </li>)}</ul>}
      {saveError && <p className={styles.error} role="alert" ref={settingsSaveAlert} tabIndex={-1}>{t("adminSaveError")} {failedSettingKey && <RetryButton label={t("retry")} disabled={saveBusyKey !== null} busy={saveBusyKey !== null} onClick={retrySettingSave} />}</p>}
      </div>
    </section>
  );

  return <main className={`${styles.page} ${activeView === "settings" ? styles.settingsPage : ""} ${activeView === "user-profile" ? styles.userProfilePage : ""}`} aria-labelledby="admin-dashboard-title" aria-busy={pageBusy}>
    <header className={styles.hero}>
      <div className={styles.profileHeader}>
      <div className={styles.avatar} aria-hidden="true"><ResilientImage src={user.avatarUrl} alt="" fallback={user.username.slice(0, 1).toUpperCase()} /></div>
      <div className={styles.identity}>
      <h1 className={styles.title} id="admin-dashboard-title">{user.username}</h1>
      <p>{localizeUserRole(user.role, t)}</p>
      </div>
      </div>
      <nav className={styles.adminNav} ref={adminNavigation} aria-label={t("adminDashboard")} onFocusCapture={event => {
        const link = (event.target as HTMLElement).closest("a");
        if (link) revealNavigationLink(event.currentTarget, link);
      }}>
        {navigation.map(item => <Link key={item.id} to={`${path("/admin")}${item.id === "dashboard" ? "" : `?view=${item.id}`}`} aria-label={item.label} aria-current={activeView === item.id || (activeView === "user-profile" && item.id === "users") ? "page" : undefined} title={item.label}>
          {navAssets[item.id] ? <img src={navAssets[item.id]} alt="" /> : <i className={item.icon} aria-hidden="true" />}
          <span className={styles.navLabel} aria-hidden="true">{item.label}</span>
        </Link>)}
      </nav>
    </header>
    <h2 className={styles.workspaceTitle}>{activeView === "dashboard" ? t("adminWorkspace") : activeTitle}</h2>
    {activeView === "dashboard" && <>
    <AdminPersonalMetrics key={user.id} userId={user.id} />
    <h3 className={styles.platformTitle} ref={dashboardTitle} tabIndex={-1}>{t("adminPlatformMetrics")}</h3>
    {dashboardLoading && <section className={styles.summary} aria-label={t("loading")} aria-busy={true}>{Array.from({ length: 6 }, (_, index) => <div className={`${styles.summaryCard} ${styles.skeleton}`} key={index} aria-hidden="true" />)}</section>}
    {dashboardError && <p className={styles.error} role="alert" ref={dashboardAlert} tabIndex={-1}>{t("adminLoadError")} <RetryButton label={t("retry")} disabled={dashboardLoading} busy={dashboardLoading} onClick={() => {
      if (dashboardLoading) return;
      dashboardFocus.current = { scope: dashboardFocusScope.current, request: dashboardRequest.current + 1, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
      setDashboard(null);
      setDashboardError(false);
      setDashboardLoading(true);
      setDashboardAttempt(value => value + 1);
    }} /></p>}
    {!dashboardLoading && !dashboardError && dashboard && <section className={styles.summary} aria-label={t("adminPlatformMetrics")}>
      {([["users", dashboard.users], ["activeUsers", dashboard.activeUsers], ["hqUsers", dashboard.hqUsers], ["movies", dashboard.movies], ["reviews", dashboard.reviews], ["hiddenReviews", dashboard.hiddenReviews]] as const).map(([key, value]) => <div className={styles.summaryCard} key={key}><strong>{t(key)}</strong><div className={styles.summaryValue}>{value}</div></div>)}
    </section>}
    </>}
    {(activeView === "users" || activeView === "user-profile") && <AdminUsers
      onHqCountChange={delta => setDashboard(current => current ? { ...current, hqUsers: current.hqUsers + delta } : current)}
      profileUserId={activeView === "user-profile" ? profileUserId : undefined}
      onOpenUserProfile={id => setSearchParams({ view: "user-profile", user: String(id) })}
      onCloseUserProfile={() => {
        const logId = searchParams.get("focusLog");
        if (searchParams.get("from") === "logs" && logId && /^\d+$/.test(logId)) setSearchParams({ view: "logs", focusLog: logId });
        else setSearchParams({ view: "users" });
      }}
    />}
    {activeView === "movies" && <AdminMovies onTotalChange={updateMovieCount} />}
    {activeView === "reviews" && <AdminReviews />}
    {activeView === "comments" && <AdminComments />}
    {activeView === "lists" && <AdminLists />}
    {activeView === "moderation" && <AdminModerationQueue />}
    {activeView === "conversations" && <AdminConversations />}
    {activeView === "notifications" && <AdminNotifications />}
    {activeView === "articles" && <AdminArticles />}
    {activeView === "logs" && <AdminAuditLogs onOpenUserProfile={(id, logId) => setSearchParams({ view: "user-profile", user: String(id), from: "logs", focusLog: String(logId) })} />}
    {activeView === "settings" && settingsPanel}
  </main>;
}
