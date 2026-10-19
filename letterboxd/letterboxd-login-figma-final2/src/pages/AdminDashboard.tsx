import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAdminDashboard, getAdminSettings, updateAdminSetting, type AdminDashboard as Dashboard, type AdminSetting } from "../api/admin.api";
import AdminAuditLogs from "../components/AdminAuditLogs";
import AdminArticles from "../components/AdminArticles";
import AdminComments from "../components/AdminComments";
import AdminConversations from "../components/AdminConversations";
import AdminLists from "../components/AdminLists";
import AdminModerationQueue from "../components/AdminModerationQueue";
import AdminMovies from "../components/AdminMovies";
import AdminNotifications from "../components/AdminNotifications";
import AdminReviews from "../components/AdminReviews";
import AdminUsers from "../components/AdminUsers";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
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
  const [settingsAttempt, setSettingsAttempt] = useState(0);

  useEffect(() => {
    if (!isAuth || user?.role !== "ADMIN") return;
    let current = true;
    setDashboardLoading(true);
    setDashboardError(false);
    getAdminDashboard()
      .then(({ data }) => { if (current) setDashboard(data); })
      .catch(() => { if (current) setDashboardError(true); })
      .finally(() => { if (current) setDashboardLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.role, dashboardAttempt]);

  useEffect(() => {
    if (!isAuth || user?.role !== "ADMIN") return;
    let current = true;
    setSettingsLoading(true);
    setSettingsError(false);
    getAdminSettings()
      .then(({ data }) => { if (current) setSettings(data); })
      .catch(() => { if (current) setSettingsError(true); })
      .finally(() => { if (current) setSettingsLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.role, settingsAttempt]);

  const updateMovieCount = useCallback((movies: number) => {
    setDashboard(current => current ? { ...current, movies } : current);
  }, []);

  if (!ready) return <main className={styles.page}><p className={styles.feedback} role="status">{t("loading")}</p></main>;
  if (!isAuth || user?.role !== "ADMIN") return <Navigate to={path("/home")} replace />;
  const saveSetting = async (setting: AdminSetting) => {
    if (saveBusyKey !== null) return;
    setSaveError(false);
    setFailedSettingKey(null);
    setSaveBusyKey(setting.key);
    try {
      const { data } = await updateAdminSetting(setting.key, setting.value);
      setSettings(current => current.map(item => item.key === data.key ? data : item));
    } catch {
      setFailedSettingKey(setting.key);
      setSaveError(true);
    } finally {
      setSaveBusyKey(null);
    }
  };

  const retrySettingSave = () => {
    if (!failedSettingKey) return;
    const setting = settings.find(item => item.key === failedSettingKey);
    if (setting) void saveSetting(setting);
  };
  return <main className={styles.page}>
    <h1 className={styles.title}>{t("adminDashboard")}</h1>
    {dashboardLoading && <p className={styles.feedback} role="status" aria-busy={true}>{t("loading")}</p>}
    {dashboardError && <p className={styles.error} role="alert">{t("adminLoadError")} <button type="button" onClick={() => setDashboardAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {saveError && <p className={styles.error} role="alert">{t("adminSaveError")} {failedSettingKey && <button type="button" disabled={saveBusyKey !== null} aria-busy={saveBusyKey !== null} onClick={retrySettingSave}>{t("retry")}</button>}</p>}
    {dashboard && <section className={styles.summary} aria-label={t("adminDashboard")}>
      {([["users", dashboard.users], ["activeUsers", dashboard.activeUsers], ["hqUsers", dashboard.hqUsers], ["movies", dashboard.movies], ["reviews", dashboard.reviews], ["hiddenReviews", dashboard.hiddenReviews]] as const).map(([key, value]) => <div className={styles.summaryCard} key={key}><strong>{t(key)}</strong><div className={styles.summaryValue}>{value}</div></div>)}
    </section>}
    <AdminUsers onHqCountChange={delta => setDashboard(current => current ? { ...current, hqUsers: current.hqUsers + delta } : current)} />
    <AdminComments />
    <AdminReviews />
    <AdminModerationQueue />
    <section className={styles.settings} aria-labelledby="admin-settings-title" aria-busy={settingsLoading || saveBusyKey !== null}><h2 className={styles.settingsTitle} id="admin-settings-title">{t("adminSettings")}</h2>{settingsLoading && settings.length === 0 ? <p className={styles.feedback} role="status">{t("loading")}</p> : settingsError ? <p className={styles.error} role="alert">{t("adminLoadError")} <button type="button" onClick={() => setSettingsAttempt(value => value + 1)}>{t("retry")}</button></p> : settings.length === 0 ? <p>{t("noAdminSettings")}</p> : <ul className={styles.settingsList}>{settings.map(setting => <li className={styles.settingRow} key={setting.key}><label className={styles.settingField}>{setting.key}<input className={styles.settingInput} value={setting.value} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: event.target.value } : item))} /></label> <button type="button" disabled={saveBusyKey !== null} aria-busy={saveBusyKey === setting.key} onClick={() => { void saveSetting(setting); }}>{saveBusyKey === setting.key ? t("loading") : t("saveSetting")}</button></li>)}</ul>}</section>
    <AdminMovies onTotalChange={updateMovieCount} />
    <AdminLists />
    <AdminConversations />
    <AdminNotifications />
    <AdminArticles />
    <AdminAuditLogs />
  </main>;
}
