import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getAdminDashboard, getAdminUsers, getAuditLogs, setAdminHq, type AdminDashboard as Dashboard, type AdminUser, type AuditLog } from "../api/admin.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

export default function AdminDashboard() {
  const { isAuth, ready, user } = useAuth();
  const { path, t } = useLocale();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuth || user?.role !== "ADMIN") return;
    Promise.all([getAdminDashboard(), getAdminUsers(), getAuditLogs()]).then(([summary, usersResponse, logsResponse]) => {
      setDashboard(summary.data); setUsers(usersResponse.data.content); setLogs(logsResponse.data.content);
    }).catch(() => setError(true));
  }, [isAuth, user?.role]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth || user?.role !== "ADMIN") return <Navigate to={path("/home")} replace />;
  const toggleHq = async (target: AdminUser) => {
    try { const { data } = await setAdminHq(target.id, !target.isHq); setUsers(current => current.map(item => item.id === data.id ? data : item)); setDashboard(current => current ? { ...current, hqUsers: current.hqUsers + (data.isHq ? 1 : -1) } : current); }
    catch { setError(true); }
  };
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("adminDashboard")}</h1>
    {error && <p role="alert">{t("adminLoadError")}</p>}
    {dashboard && <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12 }}>
      {([["users", dashboard.users], ["activeUsers", dashboard.activeUsers], ["hqUsers", dashboard.hqUsers], ["movies", dashboard.movies], ["reviews", dashboard.reviews], ["hiddenReviews", dashboard.hiddenReviews]] as const).map(([key, value]) => <div key={key} style={{ padding: 14, border: "1px solid #444", borderRadius: 8 }}><strong>{t(key)}</strong><div style={{ fontSize: 24 }}>{value}</div></div>)}
    </section>}
    <section><h2>{t("adminUsers")}</h2><ul>{users.map(target => <li key={target.id} style={{ marginBottom: 8 }}>{target.displayName || target.username} · {target.role} <button type="button" onClick={() => { void toggleHq(target); }}>{target.isHq ? t("revokeHq") : t("grantHq")}</button></li>)}</ul></section>
    <section><h2>{t("auditLogs")}</h2>{logs.length === 0 ? <p>{t("noAuditLogs")}</p> : <ul>{logs.map(log => <li key={log.id}>{log.action} · {log.targetType} #{log.targetId ?? "—"} · {new Date(log.createdAt).toLocaleString()}</li>)}</ul>}</section>
  </main>;
}
