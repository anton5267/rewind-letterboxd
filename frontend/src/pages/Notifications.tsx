import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { getNotificationPreferences, getNotifications, getUnreadNotificationCount, markAllNotificationsRead, markNotificationRead, updateNotificationPreferences, type NotificationItem, type NotificationPage, type NotificationPreferences } from "../api/notifications.api";
import Pagination from "../components/Pagination";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, localizeNotificationType, useLocale, type Translator } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { getUserIdentity } from "../utils/userIdentity";
import { notifyUnreadCountsChanged } from "../utils/unreadEvents";
import styles from "./Notifications.module.css";

function label(item: NotificationItem, t: Translator) {
  if (item.type === "FOLLOW") return t("notificationFollowedYou");
  if (item.type === "REVIEW_LIKED") return t("notificationLikedReview");
  return localizeNotificationType(item.type, t);
}

export default function Notifications() {
  const { isAuth, ready, user } = useAuth();
  const { lang, path, t } = useLocale();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [notificationsRevision, setNotificationsRevision] = useState(0);
  const [unreadRevision, setUnreadRevision] = useState(0);
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
  const activeUserId = useRef<number | null>(null);
  const markMutation = useRef(0);
  const markAllMutation = useRef(0);
  const preferencesMutation = useRef(0);

  activeUserId.current = user?.id ?? null;

  useEffect(() => {
    markMutation.current += 1;
    markAllMutation.current += 1;
    preferencesMutation.current += 1;
    setBusyId(null);
    setMarkAllBusy(false);
    setPreferencesBusy(false);
  }, [isAuth, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setData(null);
    setLoading(true);
    setError(false);
    getNotifications(page)
      .then(({ data: notifications }) => {
        if (!current) return;
        if (isPageOutOfRange(page, notifications.totalPages)) {
          setPage(getLastPageIndex(notifications.totalPages));
          return;
        }
        setData(notifications);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isAuth, page, notificationsRevision, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let current = true;
    setUnreadError(false);
    getUnreadNotificationCount()
      .then(({ data: count }) => { if (current) setUnread(count.count); })
      .catch(() => { if (current) setUnreadError(true); });
    return () => { current = false; };
  }, [isAuth, unreadRevision, user?.id]);

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
  }, [isAuth, preferencesRevision, user?.id]);

  useEffect(() => {
    if (!isAuth) return;
    let source: EventSource | null = null;
    let retry: number | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      source = new EventSource("/api/notifications/stream");
      source.addEventListener("notification", () => {
        notifyUnreadCountsChanged("notifications");
        setNotificationsRevision(value => value + 1);
        setUnreadRevision(value => value + 1);
      });
      source.onerror = () => {
        source?.close();
        if (!stopped) retry = window.setTimeout(connect, 3000);
      };
    };
    connect();
    return () => { stopped = true; source?.close(); if (retry) window.clearTimeout(retry); };
  }, [isAuth, user?.id]);

  if (!ready) return <main className={styles.page} aria-labelledby="notifications-title" aria-busy={!ready}><div className={styles.shell}><h1 id="notifications-title" className="srOnly">{t("notifications")}</h1><p className={styles.notice} role="status">{t("loading")}</p></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }} replace />;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt || busyId !== null || markAllBusy) return;
    const requestId = ++markMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && markMutation.current === requestId;
    setBusyId(item.id);
    setActionError(null);
    try {
      await markNotificationRead(item.id);
      if (!isCurrentRequest()) return;
      setData(current => current ? { ...current, content: current.content.map(entry => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry) } : current);
      setUnread(current => Math.max(0, current - 1));
      notifyUnreadCountsChanged("notifications");
    } catch {
      if (isCurrentRequest()) setActionError({ type: "single", id: item.id });
    } finally {
      if (isCurrentRequest()) setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (markAllBusy || busyId !== null || unread === 0) return;
    const requestId = ++markAllMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && markAllMutation.current === requestId;
    setMarkAllBusy(true);
    setActionError(null);
    try {
      await markAllNotificationsRead();
      if (!isCurrentRequest()) return;
      setData(current => current ? { ...current, content: current.content.map(item => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })) } : current);
      setUnread(0);
      notifyUnreadCountsChanged("notifications");
    } catch {
      if (isCurrentRequest()) setActionError({ type: "all" });
    } finally {
      if (isCurrentRequest()) setMarkAllBusy(false);
    }
  };

  const savePreferences = async (next: NotificationPreferences) => {
    if (!preferences || preferencesBusy) return;
    const requestId = ++preferencesMutation.current;
    const requestUserId = activeUserId.current;
    const isCurrentRequest = () => requestUserId !== null && activeUserId.current === requestUserId && preferencesMutation.current === requestId;
    const previous = preferences;
    setPreferences(next);
    setPreferencesBusy(true);
    setPreferencesMessage("");
    setPreferencesSaveError(false);
    setPreferencesRetry(null);
    try {
      const { data: response } = await updateNotificationPreferences(next);
      if (!isCurrentRequest()) return;
      setPreferences(response);
      setPreferencesRetry(null);
      setPreferencesMessage(t("notificationPreferencesSaved"));
    } catch {
      if (!isCurrentRequest()) return;
      setPreferences(previous);
      setPreferencesRetry(next);
      setPreferencesMessage(t("notificationPreferencesError"));
      setPreferencesSaveError(true);
    } finally {
      if (isCurrentRequest()) setPreferencesBusy(false);
    }
  };

  const retryPreferences = () => {
    if (preferencesRetry) void savePreferences(preferencesRetry);
  };

  const pageBusy = loading || preferencesLoading || preferencesBusy || markAllBusy || busyId !== null;

  return <main className={styles.page} aria-labelledby="notifications-title" aria-busy={pageBusy}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t("socialEyebrow")}</p>
          <h1 id="notifications-title">{t("notifications")}{unread > 0 ? ` (${unread})` : ""}</h1>
          <p>{t("notificationsIntro")}</p>
        </div>
        <button className={styles.primaryButton} type="button" aria-busy={markAllBusy} disabled={unread === 0 || markAllBusy || busyId !== null} onClick={() => { void markAllRead(); }}>{markAllBusy ? t("loading") : t("markAllNotificationsRead")}</button>
      </section>

      {unreadError && <RetryNotice className={styles.error} message={t("loadNotificationsError")} retryLabel={t("retry")} onRetry={() => setUnreadRevision(value => value + 1)} />}
      {actionError && <p className={styles.error} role="alert">{t("notificationActionError")} <RetryButton label={t("retry")} disabled={busyId !== null || markAllBusy} onClick={() => {
        if (actionError.type === "all") {
          void markAllRead();
          return;
        }
        const failedItem = data?.content.find(item => item.id === actionError.id);
        if (failedItem) void markRead(failedItem);
      }} /></p>}
      <section className={styles.card} aria-labelledby="notification-preferences" aria-busy={preferencesLoading || preferencesBusy}>
        <h2 id="notification-preferences">{t("notificationPreferences")}</h2>
        {preferencesLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {preferencesError && <RetryNotice className={styles.error} message={t("loadNotificationPreferencesError")} retryLabel={t("retry")} onRetry={() => setPreferencesRevision(value => value + 1)} />}
        {!preferencesLoading && !preferencesError && preferences && <div className={styles.preferences}>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.followsEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, followsEnabled: event.target.checked }); }} /> {t("notifyOnFollow")}</label>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.reviewLikesEnabled} disabled={preferencesBusy} onChange={event => { void savePreferences({ ...preferences, reviewLikesEnabled: event.target.checked }); }} /> {t("notifyOnReviewLike")}</label>
        </div>}
        {preferencesMessage && <div className={preferencesSaveError ? styles.error : styles.notice}><p role={preferencesSaveError ? "alert" : "status"}>{preferencesMessage}</p>{preferencesSaveError && preferencesRetry && <RetryButton label={t("retry")} disabled={preferencesBusy} busy={preferencesBusy} onClick={retryPreferences} />}</div>}
      </section>

      <section className={styles.card} aria-label={t("notifications")} aria-busy={loading}>
        {loading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {error && <RetryNotice className={styles.error} message={t("loadNotificationsError")} retryLabel={t("retry")} onRetry={() => setNotificationsRevision(value => value + 1)} />}
        {!loading && !error && data && (data.content.length === 0 ? <p className={styles.empty}>{t("noNotifications")}</p> : <ul className={styles.list}>
          {data.content.map(item => <li className={`${styles.item} ${item.readAt ? "" : styles.itemUnread}`} key={item.id}>
            <div className={styles.itemBody}>
              {item.actor ? <Link to={path(`/users/${item.actor.id}`)} onClick={() => { void markRead(item); }}>{getUserIdentity(item.actor, t("someone"))}</Link> : t("someone")}
              {` ${label(item, t)}`}
            </div>
            <small className={styles.meta}>{formatDateTime(item.createdAt, lang)}</small>
            {!item.readAt && <button className={styles.markButton} type="button" aria-busy={busyId === item.id} disabled={busyId !== null || markAllBusy} onClick={() => { void markRead(item); }}>{busyId === item.id ? t("loading") : t("markRead")}</button>}
          </li>)}
        </ul>)}
        {data && <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("notificationsPagination")} busy={loading || busyId !== null || markAllBusy} onPageChange={setPage} />}
      </section>
    </div>
  </main>;
}
