import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getNotificationPreferences, getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences, type NotificationItem, type NotificationPage, type NotificationPreferences } from "../api/notifications.api";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, localizeNotificationType, useLocale } from "../i18n";
import styles from "./Notifications.module.css";

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
  const [unreadError, setUnreadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<{ type: "single"; id: number } | { type: "all" } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesError, setPreferencesError] = useState(false);
  const [preferencesRevision, setPreferencesRevision] = useState(0);
  const [preferencesBusy, setPreferencesBusy] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesSaveError, setPreferencesSaveError] = useState(false);
  const [preferencesRetry, setPreferencesRetry] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setData(null);
    setLoading(true);
    setError(false);
    getNotifications(page)
      .then(({ data: notifications }) => { if (current) setData(notifications); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isAuth, page, revision]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setUnreadError(false);
    getUnreadNotificationCount()
      .then(({ data: count }) => { if (current) setUnread(count.count); })
      .catch(() => { if (current) setUnreadError(true); });
    return () => { current = false; };
  }, [isAuth, revision]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setPreferencesLoading(true);
    setPreferencesError(false);
    getNotificationPreferences()
      .then(({ data: response }) => { if (current) { setPreferences(response); setPreferencesRetry(null); } })
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

  if (!ready) return <main className={styles.page}><div className={styles.shell}><h1 className="srOnly">{t("notifications")}</h1><p className={styles.notice}>{t("loading")}</p></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt || busyId !== null) return;
    setBusyId(item.id);
    setActionError(null);
    try {
      await markNotificationRead(item.id);
      setData(current => current ? { ...current, content: current.content.map(entry => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry) } : current);
      setUnread(current => Math.max(0, current - 1));
    } catch {
      setActionError({ type: "single", id: item.id });
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (markAllBusy || unread === 0) return;
    setMarkAllBusy(true);
    setActionError(null);
    try {
      await markAllNotificationsRead();
      setData(current => current ? { ...current, content: current.content.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : current);
      setUnread(0);
    } catch {
      setActionError({ type: "all" });
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
    setPreferencesRetry(null);
    try {
      const { data: response } = await updateNotificationPreferences(next);
      setPreferences(response);
      setPreferencesRetry(null);
      setPreferencesMessage(t("notificationPreferencesSaved"));
    } catch {
      setPreferences(previous);
      setPreferencesRetry(next);
      setPreferencesMessage(t("notificationPreferencesError"));
      setPreferencesSaveError(true);
    } finally {
      setPreferencesBusy(false);
    }
  };

  const retryPreferences = () => {
    if (preferencesRetry) void savePreferences(preferencesRetry);
  };

  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t("socialEyebrow")}</p>
          <h1>{t("notifications")}{unread > 0 ? ` (${unread})` : ""}</h1>
          <p>{t("notificationsIntro")}</p>
        </div>
        <button className={styles.primaryButton} type="button" aria-busy={markAllBusy} disabled={unread === 0 || markAllBusy} onClick={() => { void markAllRead(); }}>{markAllBusy ? t("loading") : t("markAllNotificationsRead")}</button>
      </section>

      {unreadError && <p className={styles.error} role="alert">{t("loadNotificationsError")} <button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></p>}
      {actionError && <p className={styles.error} role="alert">{t("notificationActionError")} <button type="button" disabled={busyId !== null || markAllBusy} onClick={() => {
        if (actionError.type === "all") {
          void markAllRead();
          return;
        }
        const failedItem = data?.content.find(item => item.id === actionError.id);
        if (failedItem) void markRead(failedItem);
      }}>{t("retry")}</button></p>}
      <section className={styles.card} aria-labelledby="notification-preferences" aria-busy={preferencesLoading || preferencesBusy}>
        <h2 id="notification-preferences">{t("notificationPreferences")}</h2>
        {preferencesLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {preferencesError && <div className={styles.error}><p role="alert">{t("loadNotificationPreferencesError")}</p><button type="button" onClick={() => setPreferencesRevision(value => value + 1)}>{t("retry")}</button></div>}
        {!preferencesLoading && !preferencesError && preferences && <div className={styles.preferences}>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.followsEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, followsEnabled: event.target.checked }); }} /> {t("notifyOnFollow")}</label>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.reviewLikesEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, reviewLikesEnabled: event.target.checked }); }} /> {t("notifyOnReviewLike")}</label>
        </div>}
        {preferencesMessage && <div className={preferencesSaveError ? styles.error : styles.notice}><p role={preferencesSaveError ? "alert" : "status"}>{preferencesMessage}</p>{preferencesSaveError && preferencesRetry && <button type="button" disabled={preferencesBusy} aria-busy={preferencesBusy} onClick={retryPreferences}>{t("retry")}</button>}</div>}
      </section>

      <section className={styles.card} aria-label={t("notifications")} aria-busy={loading}>
        {loading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {error && <div className={styles.error}><p role="alert">{t("loadNotificationsError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
        {!loading && !error && data && (data.content.length === 0 ? <p className={styles.empty}>{t("noNotifications")}</p> : <ul className={styles.list}>
          {data.content.map(item => <li className={`${styles.item} ${item.readAt ? "" : styles.itemUnread}`} key={item.id}>
            <div className={styles.itemBody}>
              {item.actor ? <Link to={path(`/users/${item.actor.id}`)} onClick={() => { void markRead(item); }}>{item.actor.displayName?.trim() || `@${item.actor.username}`}</Link> : t("someone")}
              {` ${label(item, t)}`}
            </div>
            <small className={styles.meta}>{formatDateTime(item.createdAt, lang)}</small>
            {!item.readAt && <button className={styles.markButton} type="button" aria-busy={busyId === item.id} disabled={busyId !== null} onClick={() => { void markRead(item); }}>{busyId === item.id ? t("loading") : t("markRead")}</button>}
          </li>)}
        </ul>)}
        {data && data.totalPages > 1 && <nav className={styles.pagination} aria-label={t("notificationsPagination")}>
          <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
          <span role="status">{t("page")} {page + 1} {t("of")} {data.totalPages}</span>
          <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
        </nav>}
      </section>
    </div>
  </main>;
}
