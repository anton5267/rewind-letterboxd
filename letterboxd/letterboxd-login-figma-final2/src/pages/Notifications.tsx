import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, type NotificationItem, type NotificationPage } from "../api/notifications.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

function label(item: NotificationItem, t: (key: string) => string) {
  if (item.type === "FOLLOW") return t("notificationFollowedYou");
  if (item.type === "REVIEW_LIKED") return t("notificationLikedReview");
  return item.type;
}

export default function Notifications() {
  const { isAuth, ready } = useAuth();
  const { path, t } = useLocale();
  const [page, setPage] = useState(0);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    return Promise.all([getNotifications(page), getUnreadNotificationCount()])
      .then(([notifications, count]) => { setData(notifications.data); setUnread(count.data.count); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuth) void load();
  }, [isAuth, page]);

  useEffect(() => {
    if (!isAuth) return;
    let source: EventSource | null = null;
    let retry: number | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/notifications/stream");
      source.addEventListener("notification", () => { void load(); });
      source.onerror = () => {
        source?.close();
        if (!stopped) retry = window.setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { stopped = true; source?.close(); if (retry) window.clearTimeout(retry); };
  }, [isAuth, page]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt) return;
    await markNotificationRead(item.id);
    setData(current => current ? { ...current, content: current.content.map(entry => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry) } : current);
    setUnread(current => Math.max(0, current - 1));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setData(current => current ? { ...current, content: current.content.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : current);
    setUnread(0);
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <h1>{t("notifications")}{unread > 0 ? ` (${unread})` : ""}</h1>
      <button type="button" disabled={unread === 0} onClick={() => { void markAllRead(); }}>{t("markAllNotificationsRead")}</button>
    </div>
    {loading && <p>{t("loading")}</p>}
    {error && <p role="alert">{t("loadNotificationsError")}</p>}
    {!loading && !error && data && (data.content.length === 0 ? <p>{t("noNotifications")}</p> : <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
      {data.content.map(item => <li key={item.id} style={{ padding: 16, border: "1px solid #444", borderRadius: 8, background: item.readAt ? "transparent" : "#242424" }}>
        <div>
          {item.actor ? <Link to={path(`/users/${item.actor.id}`)} onClick={() => { void markRead(item); }}>{item.actor.displayName || `@${item.actor.username}`}</Link> : t("someone")}
          {` ${label(item, t)}`}
        </div>
        <small>{new Date(item.createdAt).toLocaleString()}</small>
        {!item.readAt && <button type="button" style={{ marginLeft: 12 }} onClick={() => { void markRead(item); }}>{t("markRead")}</button>}
      </li>)}
    </ul>)}
    {data && data.totalPages > 1 && <nav aria-label={t("pagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
      <span>{t("page")} {page + 1} {t("of")} {data.totalPages}</span>
      <button type="button" disabled={page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
    </nav>}
  </main>;
}
