import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getNotificationPreferences, getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences, type NotificationItem, type NotificationPage, type NotificationPreferences } from "../api/notifications.api";
import { useAuth } from "../context/AuthContext";
import { localizeNotificationType, useLocale } from "../i18n";

function label(item: NotificationItem, t: (key: string) => string) {
  if (item.type === "FOLLOW") return t("notificationFollowedYou");
  if (item.type === "REVIEW_LIKED") return t("notificationLikedReview");
  return localizeNotificationType(item.type, t);
}

export default function Notifications() {
  const { isAuth, ready } = useAuth();
  const { lang, path, t } = useLocale();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<NotificationPage | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState(false);
  const [preferencesRevision, setPreferencesRevision] = useState(0);
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesSaveError, setPreferencesSaveError] = useState(false);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setData(null);
    setLoading(true);
    setError(false);
    Promise.all([getNotifications(page), getUnreadNotificationCount()])
      .then(([notifications, count]) => {
        if (!current) return;
        setData(notifications.data);
        setUnread(count.data.count);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isAuth, page, revision]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setPreferencesLoading(true);
    setPreferencesError(false);
    getNotificationPreferences()
      .then(({ data: response }) => { if (current) setPreferences(response); })
      .catch(() => { if (current) setPreferencesError(true); })
      .finally(() => { if (current) setPreferencesLoading(false); });
    return () => { current = false; };
  }, [isAuth, preferencesRevision]);

  useEffect(() => {
    if (!isAuth) return;
    let source: EventSource | null = null;
    let retry: number | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/notifications/stream");
      source.addEventListener("notification", () => setRevision(value => value + 1));
      source.onerror = () => {
        source?.close();
        if (!stopped) retry = window.setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { stopped = true; source?.close(); if (retry) window.clearTimeout(retry); };
  }, [isAuth]);

  if (!ready) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt || busyId !== null) return;
    setBusyId(item.id);
    setActionError(false);
    try {
      await markNotificationRead(item.id);
      setData(current => current ? { ...current, content: current.content.map(entry => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry) } : current);
      setUnread(current => Math.max(0, current - 1));
    } catch {
      setActionError(true);
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (markAllBusy || unread === 0) return;
    setMarkAllBusy(true);
    setActionError(false);
    try {
      await markAllNotificationsRead();
      setData(current => current ? { ...current, content: current.content.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : current);
      setUnread(0);
    } catch {
      setActionError(true);
    } finally {
      setMarkAllBusy(false);
    }
  };

  const savePreferences = async (next: NotificationPreferences) => {
    if (!preferences || preferencesBusy) return;
    const previous = preferences;
    setPreferences(next);
    setPreferencesBusy(true);
    setPreferencesMessage("");
    setPreferencesSaveError(false);
    try {
      const { data: response } = await updateNotificationPreferences(next);
      setPreferences(response);
      setPreferencesMessage(t("notificationPreferencesSaved"));
    } catch {
      setPreferences(previous);
      setPreferencesMessage(t("notificationPreferencesError"));
      setPreferencesSaveError(true);
    } finally {
      setPreferencesBusy(false);
    }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <h1>{t("notifications")}{unread > 0 ? ` (${unread})` : ""}</h1>
      <button type="button" disabled={unread === 0 || markAllBusy} onClick={() => { void markAllRead(); }}>{markAllBusy ? t("loading") : t("markAllNotificationsRead")}</button>
    </div>
    {actionError && <p role="alert">{t("notificationActionError")}</p>}
    <section aria-labelledby="notification-preferences" aria-busy={preferencesLoading} style={{ margin: "20px 0", padding: 16, border: "1px solid #444", borderRadius: 8 }}>
      <h2 id="notification-preferences">{t("notificationPreferences")}</h2>
      {preferencesLoading && <p role="status">{t("loading")}</p>}
      {preferencesError && <div><p role="alert">{t("loadNotificationPreferencesError")}</p><button type="button" onClick={() => setPreferencesRevision(value => value + 1)}>{t("retry")}</button></div>}
      {!preferencesLoading && !preferencesError && preferences && <>
        <label style={{ display: "block", marginBottom: 8 }}><input type="checkbox" checked={preferences.followsEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, followsEnabled: event.target.checked }); }} /> {t("notifyOnFollow")}</label>
        <label style={{ display: "block" }}><input type="checkbox" checked={preferences.reviewLikesEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, reviewLikesEnabled: event.target.checked }); }} /> {t("notifyOnReviewLike")}</label>
      </>}
      {preferencesMessage && <p role={preferencesSaveError ? "alert" : "status"}>{preferencesMessage}</p>}
    </section>
    <section aria-label={t("notifications")} aria-busy={loading}>
      {loading && <p role="status">{t("loading")}</p>}
      {error && <div><p role="alert">{t("loadNotificationsError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
      {!loading && !error && data && (data.content.length === 0 ? <p>{t("noNotifications")}</p> : <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 10 }}>
        {data.content.map(item => <li key={item.id} style={{ padding: 16, border: "1px solid #444", borderRadius: 8, background: item.readAt ? "transparent" : "#242424" }}>
          <div>
            {item.actor ? <Link to={path(`/users/${item.actor.id}`)} onClick={() => { void markRead(item); }}>{item.actor.displayName || `@${item.actor.username}`}</Link> : t("someone")}
            {` ${label(item, t)}`}
          </div>
          <small>{new Date(item.createdAt).toLocaleString(lang === "uk" ? "uk-UA" : "en-US")}</small>
          {!item.readAt && <button type="button" disabled={busyId !== null} style={{ marginLeft: 12 }} onClick={() => { void markRead(item); }}>{busyId === item.id ? t("loading") : t("markRead")}</button>}
        </li>)}
      </ul>)}
      {data && data.totalPages > 1 && <nav aria-label={t("notificationsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {data.totalPages}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>}
    </section>
  </main>;
}
