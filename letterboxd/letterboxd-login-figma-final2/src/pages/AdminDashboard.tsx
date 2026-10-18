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

export default function AdminDashboard() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isAuth || user?.role !== "ADMIN") return;
    let current = true;
    setLoading(true);
    setError(false);
    Promise.all([getAdminDashboard(), getAdminSettings()]).then(([summary, settingsResponse]) => {
      if (!current) return;
      setDashboard(summary.data); setSettings(settingsResponse.data);
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isAuth, user?.role, attempt]);

  const updateMovieCount = useCallback((movies: number) => {
    setDashboard(current => current ? { ...current, movies } : current);
  }, []);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth || user?.role !== "ADMIN") return <Navigate to={path("/home")} replace />;
  const saveSetting = async (setting: AdminSetting) => {
    try { const { data } = await updateAdminSetting(setting.key, setting.value); setSettings(current => current.map(item => item.key === data.key ? data : item)); }
    catch { setError(true); }
  };
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("adminDashboard")}</h1>
    {loading && <p role="status" aria-busy="true">{t("loading")}</p>}
    {error && <p role="alert">{t("adminLoadError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
    {dashboard && <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
      {([["users", dashboard.users], ["activeUsers", dashboard.activeUsers], ["hqUsers", dashboard.hqUsers], ["movies", dashboard.movies], ["reviews", dashboard.reviews], ["hiddenReviews", dashboard.hiddenReviews]] as const).map(([key, value]) => <div key={key} style={{ padding: 14, border: "1px solid #444", borderRadius: 8 }}><strong>{t(key)}</strong><div style={{ fontSize: 24 }}>{value}</div></div>)}
    </section>}
    <AdminUsers onHqCountChange={delta => setDashboard(current => current ? { ...current, hqUsers: current.hqUsers + delta } : current)} />
    <AdminComments />
    <AdminReviews />
    <AdminModerationQueue />
    <section><h2>{t("adminSettings")}</h2>{loading && settings.length === 0 ? <p role="status">{t("loading")}</p> : settings.length === 0 ? <p>{t("noAdminSettings")}</p> : <ul>{settings.map(setting => <li key={setting.key} style={{ marginBottom: 8 }}><label>{setting.key} <input value={setting.value} onChange={event => setSettings(current => current.map(item => item.key === setting.key ? { ...item, value: event.target.value } : item))} /></label> <button type="button" onClick={() => { void saveSetting(setting); }}>{t("saveSetting")}</button></li>)}</ul>}</section>
    <AdminMovies onTotalChange={updateMovieCount} />
    <AdminLists />
    <AdminConversations />
    <AdminNotifications />
    <AdminArticles />
    <AdminAuditLogs />
  </main>;
}
