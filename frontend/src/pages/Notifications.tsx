import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { useNotificationUpdates } from "../hooks/useNotificationUpdates";
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
  const [unreadLoading, setUnreadLoading] = useState(true);
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
  const notificationHeadingRef = useRef<HTMLHeadingElement>(null);
  const markAllButtonRef = useRef<HTMLButtonElement>(null);
  const actionErrorRef = useRef<HTMLParagraphElement>(null);
  const pendingPreferenceFocus = useRef<HTMLInputElement | null>(null);
  const lastPreferenceInput = useRef<HTMLInputElement | null>(null);
  const pendingPreferenceRetryFocus = useRef<{ origin: HTMLElement | null; input: HTMLInputElement | null } | null>(null);
  const pendingMarkFocus = useRef<{ type: "single"; id: number; origin: HTMLElement | null } | { type: "all"; origin: HTMLElement | null } | null>(null);
  const markMutation = useRef(0);
  const markAllMutation = useRef(0);
  const preferencesMutation = useRef(0);
  const notificationReadRetryFocus = useRef<{ target: "unread" | "preferences" | "feed" | "refresh"; scope: string; origin: HTMLElement | null } | null>(null);
  const notificationReadRetryScope = JSON.stringify([lang, isAuth, user?.id ?? null, page]);

  activeUserId.current = user?.id ?? null;

  const updates = useNotificationUpdates({
    userId: ready && isAuth ? user?.id ?? null : null,
    page,
    unread,
    paused: loading || error || unreadLoading || unreadError || busyId !== null || markAllBusy,
    onNotifications: notifications => {
      if (isPageOutOfRange(page, notifications.totalPages)) setPage(getLastPageIndex(notifications.totalPages));
      else setData(notifications);
    },
    onUnread: setUnread,
    onLocalNotification: () => {
      setNotificationsRevision(value => value + 1);
      setUnreadRevision(value => value + 1);
    },
  });

  useEffect(() => {
    if (notificationReadRetryFocus.current?.scope !== notificationReadRetryScope) notificationReadRetryFocus.current = null;
  }, [notificationReadRetryScope]);

  useEffect(() => {
    const pending = notificationReadRetryFocus.current;
    if (!pending) return;
    const state = pending.target === "refresh" ? { loading: updates.refreshing, error: updates.error } :
      pending.target === "unread" ? { loading: unreadLoading, error: unreadError } :
      pending.target === "preferences" ? { loading: preferencesLoading, error: preferencesError } : { loading, error };
    if (state.loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (notificationReadRetryFocus.current !== pending) return;
      notificationReadRetryFocus.current = null;
      if (pending.scope !== notificationReadRetryScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const section = document.querySelector<HTMLElement>(`[data-notification-retry="${pending.target}"]`);
      if (state.error) section?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else if (pending.target === "preferences") document.getElementById("notification-preferences")?.focus();
      else notificationHeadingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, loading, notificationReadRetryScope, preferencesError, preferencesLoading, unreadError, unreadLoading, updates.error, updates.refreshing]);

  const retryNotificationRead = (target: "unread" | "preferences" | "feed" | "refresh") => {
    notificationReadRetryFocus.current = { target, scope: notificationReadRetryScope, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    if (target === "refresh") {
      updates.refresh();
    } else if (target === "unread") {
      setUnreadLoading(true); setUnreadError(false); setUnreadRevision(value => value + 1);
    } else if (target === "preferences") {
      setPreferencesLoading(true); setPreferencesError(false); setPreferencesRevision(value => value + 1);
    } else {
      setLoading(true); setError(false); setNotificationsRevision(value => value + 1);
    }
  };

  useEffect(() => {
    markMutation.current += 1;
    markAllMutation.current += 1;
    preferencesMutation.current += 1;
    pendingPreferenceFocus.current = null;
    lastPreferenceInput.current = null;
    pendingPreferenceRetryFocus.current = null;
    pendingMarkFocus.current = null;
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
    setUnreadLoading(true);
    setUnreadError(false);
    getUnreadNotificationCount()
      .then(({ data: count }) => { if (current) setUnread(count.count); })
      .catch(() => { if (current) setUnreadError(true); })
      .finally(() => { if (current) setUnreadLoading(false); });
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

  useLayoutEffect(() => {
    const pending = pendingMarkFocus.current;
    if (!pending || busyId !== null || markAllBusy) return;
    if (document.activeElement !== document.body && document.activeElement !== pending.origin) {
      pendingMarkFocus.current = null;
      return;
    }
    pendingMarkFocus.current = null;
    if (actionError) {
      const retry = actionErrorRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]");
      if (retry && !retry.disabled) {
        retry.focus();
        return;
      }
    }
    if (pending.type === "single" && !actionError) {
      const nextAction = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-notification-mark-unread]"))
        .find(button => button.dataset.notificationMarkUnread !== String(pending.id) && button.getClientRects().length > 0 && !button.disabled);
      if (nextAction) {
        nextAction.focus();
        return;
      }
    }
    if (actionError?.type === "single" && pending.type === "single") {
      const originalAction = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-notification-mark-unread]"))
        .find(button => button.dataset.notificationMarkUnread === String(pending.id) && button.getClientRects().length > 0 && !button.disabled);
      if (originalAction) {
        originalAction.focus();
        return;
      }
    }
    if (document.activeElement === document.body || document.activeElement === pending.origin) {
      if (pending.type === "all" && actionError && markAllButtonRef.current && !markAllButtonRef.current.disabled) {
        markAllButtonRef.current.focus();
      } else {
        notificationHeadingRef.current?.focus();
      }
    }
  }, [actionError, busyId, markAllBusy, data]);

  useLayoutEffect(() => {
    if (preferencesBusy) return;
    const retry = pendingPreferenceRetryFocus.current;
    if (retry && preferencesMessage) {
      pendingPreferenceRetryFocus.current = null;
      pendingPreferenceFocus.current = null;
      if (document.activeElement !== document.body && document.activeElement !== retry.origin) return;
      if (preferencesSaveError) document.querySelector<HTMLButtonElement>('[data-notification-preferences-save-retry] [data-retry-button]')?.focus();
      else retry.input?.focus();
      return;
    }
    const input = pendingPreferenceFocus.current;
    if (!input) return;
    pendingPreferenceFocus.current = null;
    if (document.activeElement === document.body || document.activeElement === input) input.focus();
  }, [preferencesBusy, preferencesMessage, preferencesSaveError]);

  if (!ready) return <main className={styles.page} aria-labelledby="notifications-title" aria-busy={!ready}><div className={styles.shell}><h1 id="notifications-title" className="srOnly">{t("notifications")}</h1><p className={styles.notice} role="status">{t("loading")}</p></div></main>;
  if (!isAuth) return <Navigate to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }} replace />;

  const markRead = async (item: NotificationItem) => {
    if (item.readAt || busyId !== null || markAllBusy) return;
    const requestId = ++markMutation.current;
    pendingMarkFocus.current = { type: "single", id: item.id, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
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
    pendingMarkFocus.current = { type: "all", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
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
    if (!preferencesRetry) return;
    pendingPreferenceRetryFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, input: lastPreferenceInput.current };
    void savePreferences(preferencesRetry);
  };

  const pageBusy = loading || unreadLoading || preferencesLoading || preferencesBusy || markAllBusy || busyId !== null;

  return <main className={styles.page} aria-labelledby="notifications-title" aria-busy={pageBusy}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t("socialEyebrow")}</p>
          <h1 ref={notificationHeadingRef} id="notifications-title" tabIndex={-1}>{t("notifications")}{unread > 0 ? ` (${unread})` : ""}</h1>
          <p>{t("notificationsIntro")}</p>
        </div>
        <button ref={markAllButtonRef} className={styles.primaryButton} type="button" aria-busy={markAllBusy} disabled={unread === 0 || markAllBusy || busyId !== null} onClick={() => { void markAllRead(); }}>{markAllBusy ? t("loading") : t("markAllNotificationsRead")}</button>
      </section>

      {unreadError && <div data-notification-retry="unread"><RetryNotice className={styles.error} message={t("loadNotificationsError")} retryLabel={t("retry")} onRetry={() => retryNotificationRead("unread")} /></div>}
      {updates.error && <div data-notification-retry="refresh"><RetryNotice className={styles.error} message={t("refreshNotificationsError")} retryLabel={t("retry")} disabled={pageBusy || updates.refreshing} busy={updates.refreshing} onRetry={() => retryNotificationRead("refresh")} /></div>}
      {actionError && <p ref={actionErrorRef} className={styles.error} role="alert">{t("notificationActionError")} <RetryButton label={t("retry")} disabled={busyId !== null || markAllBusy} onClick={() => {
        if (actionError.type === "all") {
          void markAllRead();
          return;
        }
        const failedItem = data?.content.find(item => item.id === actionError.id);
        if (failedItem) void markRead(failedItem);
      }} /></p>}
      <section className={styles.card} aria-labelledby="notification-preferences" aria-busy={preferencesLoading || preferencesBusy} data-notification-retry="preferences">
        <h2 id="notification-preferences" tabIndex={-1}>{t("notificationPreferences")}</h2>
        {preferencesLoading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {preferencesError && <RetryNotice className={styles.error} message={t("loadNotificationPreferencesError")} retryLabel={t("retry")} onRetry={() => retryNotificationRead("preferences")} />}
        {!preferencesLoading && !preferencesError && preferences && <div className={styles.preferences}>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.followsEnabled} disabled={preferencesBusy} onChange={event => { pendingPreferenceFocus.current = event.currentTarget; lastPreferenceInput.current = event.currentTarget; void savePreferences({ ...preferences, followsEnabled: event.currentTarget.checked }); }} /> {t("notifyOnFollow")}</label>
          <label className={styles.preference}><input type="checkbox" aria-busy={preferencesBusy} checked={preferences.reviewLikesEnabled} disabled={preferencesBusy} onChange={event => { pendingPreferenceFocus.current = event.currentTarget; lastPreferenceInput.current = event.currentTarget; void savePreferences({ ...preferences, reviewLikesEnabled: event.currentTarget.checked }); }} /> {t("notifyOnReviewLike")}</label>
        </div>}
        {preferencesMessage && <div data-notification-preferences-save-retry className={preferencesSaveError ? styles.error : styles.notice}><p role={preferencesSaveError ? "alert" : "status"}>{preferencesMessage}</p>{preferencesSaveError && preferencesRetry && <RetryButton label={t("retry")} disabled={preferencesBusy} busy={preferencesBusy} onClick={retryPreferences} />}</div>}
      </section>

      <section className={styles.card} aria-label={t("notifications")} aria-busy={loading} data-notification-retry="feed">
        {loading && <p className={styles.notice} role="status">{t("loading")}</p>}
        {error && <RetryNotice className={styles.error} message={t("loadNotificationsError")} retryLabel={t("retry")} onRetry={() => retryNotificationRead("feed")} />}
        {!loading && !error && data && (data.content.length === 0 ? <p className={styles.empty}>{t("noNotifications")}</p> : <ul className={styles.list}>
          {data.content.map(item => <li className={`${styles.item} ${item.readAt ? "" : styles.itemUnread}`} key={item.id}>
            <div className={styles.itemBody}>
              {item.actor ? <Link to={path(`/users/${item.actor.id}`)} onClick={() => { void markRead(item); }}>{getUserIdentity(item.actor, t("someone"))}</Link> : t("someone")}
              {" "}{item.type === "REVIEW_LIKED" && item.reviewId
                ? <Link to={path(`/reviews/${item.reviewId}`)} onClick={() => { void markRead(item); }}>{label(item, t)}</Link>
                : label(item, t)}
            </div>
            <small className={styles.meta}>{formatDateTime(item.createdAt, lang)}</small>
            {!item.readAt && <button className={styles.markButton} type="button" data-notification-mark-unread={item.id} aria-busy={busyId === item.id} disabled={busyId !== null || markAllBusy} onClick={() => { void markRead(item); }}>{busyId === item.id ? t("loading") : t("markRead")}</button>}
          </li>)}
        </ul>)}
        {data && <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("notificationsPagination")} busy={loading || busyId !== null || markAllBusy} onPageChange={setPage} />}
      </section>
    </div>
  </main>;
}
