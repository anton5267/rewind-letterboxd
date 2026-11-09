import AdminLoading from "./AdminLoading";
import { useEffect, useRef, useState } from "react";
import {
  createAdminNotification,
  deleteAdminNotification,
  deleteAdminNotifications,
  getAdminNotifications,
  markAdminNotificationsRead,
  setAdminNotificationRead,
  type AdminNotification,
  type AdminNotificationFilters,
  type AdminNotificationWrite,
} from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { useLocale, type Translator } from "../i18n";
import styles from "./AdminNotifications.module.css";
import dialogStyles from "./AdminConfirmDialog.module.css";

const emptyDraft: AdminNotificationWrite = { recipientId: 0, type: "FOLLOW", actorId: null, relatedUserId: null, reviewId: null };

const notificationTypeLabel = (type: string, t: Translator) => {
  if (type === "FOLLOW") return t("notificationFollowType");
  if (type === "REVIEW_LIKED") return t("notificationReviewLikedType");
  return t("unknownNotificationType");
};

export default function AdminNotifications() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AdminNotification> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [filters, setFilters] = useState<AdminNotificationFilters>({});
  const [typeFilter, setTypeFilter] = useState<"" | AdminNotificationWrite["type"]>("");
  const [readFilter, setReadFilter] = useState<"" | "read" | "unread">("");
  const [recipientFilter, setRecipientFilter] = useState("");
  const [draft, setDraft] = useState<AdminNotificationWrite>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "one"; notification: AdminNotification; trigger: HTMLButtonElement }
    | { kind: "filtered"; filters: AdminNotificationFilters; trigger: HTMLButtonElement }
    | null
  >(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const retryFocusScope = JSON.stringify([lang, page, filters]);
  const retryFocus = useRef<{ scope: string; origin: HTMLElement | null } | null>(null);
  const pendingActionFocus = useRef<{ origin: HTMLElement | null; successTarget?: "origin" | "heading" } | null>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteDialogCancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (retryFocus.current?.scope !== retryFocusScope) retryFocus.current = null;
  }, [retryFocusScope]);

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      if (pending.scope !== retryFocusScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      if (error) sectionRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else headingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, loading, retryFocusScope]);

  const retryLoad = () => {
    retryFocus.current = { scope: retryFocusScope, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setLoading(true);
    setError(false);
    setRevision(value => value + 1);
  };

  useEffect(() => {
    if (!pendingDelete || !deleteDialog.current) return;
    if (!deleteDialog.current.open) deleteDialog.current.showModal();
    deleteDialogCancel.current?.focus();
  }, [pendingDelete]);

  useEffect(() => {
    if (busy || !pendingActionFocus.current) return;
    const pending = pendingActionFocus.current;
    pendingActionFocus.current = null;
    const active = document.activeElement;
    if (active !== document.body && active !== pending.origin) return;
    if (!actionError && pending.successTarget === "heading") headingRef.current?.focus();
    else if (pending.origin?.isConnected && !pending.origin.matches(":disabled")) pending.origin.focus();
  }, [busy, actionError]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminNotifications(filters, page)
      .then(({ data: response }) => {
        if (!current) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [filters, page, revision]);

  const draftFilters = (): AdminNotificationFilters => ({
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(readFilter ? { read: readFilter === "read" } : {}),
    ...(recipientFilter.trim() ? { recipientId: Number(recipientFilter) } : {}),
  });

  const refreshAfterRemoval = () => {
    if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
    else setRevision(value => value + 1);
  };

  const submitFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setFilters(draftFilters());
    setRevision(value => value + 1);
  };

  const createNotification = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const actorId = Number(draft.actorId);
    const recipientId = Number(draft.recipientId);
    const validEvent = recipientId > 0 && actorId > 0 && recipientId !== actorId
      && (draft.type === "FOLLOW" || Number(draft.reviewId) > 0);
    if (busy || !validEvent) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    pendingActionFocus.current = { origin: submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setBusy(true);
    setActionError("");
    try {
      await createAdminNotification({
        ...draft,
        recipientId,
        actorId,
        relatedUserId: draft.type === "FOLLOW" ? actorId : null,
        reviewId: draft.type === "REVIEW_LIKED" ? Number(draft.reviewId) : null,
      });
      setDraft(emptyDraft);
      if (page === 0) setRevision(value => value + 1); else setPage(0);
    } catch {
      setActionError(t("adminNotificationActionError"));
    } finally {
      setBusy(false);
    }
  };

  const canCreateNotification = Number(draft.recipientId) > 0
    && Number(draft.actorId) > 0
    && Number(draft.recipientId) !== Number(draft.actorId)
    && (draft.type === "FOLLOW" || Number(draft.reviewId) > 0);

  const toggleRead = async (notification: AdminNotification, origin: HTMLButtonElement) => {
    if (busy) return;
    pendingActionFocus.current = { origin };
    setBusy(true);
    setActionError("");
    try {
      await setAdminNotificationRead(notification.id, !notification.readAt);
      if (filters.read === undefined) {
        setData(current => current ? { ...current, content: current.content.map(item => item.id === notification.id ? { ...item, readAt: item.readAt ? null : new Date().toISOString() } : item) } : current);
      } else refreshAfterRemoval();
    } catch {
      setActionError(t("adminNotificationActionError"));
    } finally {
      setBusy(false);
    }
  };

  const removeNotification = async (notification: AdminNotification, trigger: HTMLButtonElement) => {
    if (busy) return;
    setBusy(true);
    setActionError("");
    pendingActionFocus.current = { origin: trigger, successTarget: "heading" };
    try {
      await deleteAdminNotification(notification.id);
      refreshAfterRemoval();
    } catch {
      setActionError(t("adminNotificationActionError"));
    } finally {
      setBusy(false);
    }
  };

  const markFilteredRead = async (origin: HTMLButtonElement) => {
    if (busy || filters.read === true) return;
    pendingActionFocus.current = { origin };
    setBusy(true);
    setActionError("");
    try {
      await markAdminNotificationsRead({ type: filters.type, recipientId: filters.recipientId });
      setPage(0);
      setRevision(value => value + 1);
    } catch {
      setActionError(t("adminNotificationActionError"));
    } finally {
      setBusy(false);
    }
  };

  const deleteFiltered = async (targetFilters: AdminNotificationFilters, trigger: HTMLButtonElement) => {
    if (busy) return;
    setBusy(true);
    setActionError("");
    pendingActionFocus.current = { origin: trigger, successTarget: "heading" };
    try {
      await deleteAdminNotifications(targetFilters);
      setPage(0);
      setRevision(value => value + 1);
    } catch {
      setActionError(t("adminNotificationActionError"));
    } finally {
      setBusy(false);
    }
  };

  const requestDeleteNotification = (notification: AdminNotification, trigger: HTMLButtonElement) => {
    if (busy) return;
    setPendingDelete({ kind: "one", notification, trigger });
  };

  const requestDeleteFiltered = (trigger: HTMLButtonElement) => {
    if (busy) return;
    setPendingDelete({ kind: "filtered", filters: { ...filters }, trigger });
  };

  const cancelDelete = () => {
    if (deleteDialog.current?.open) deleteDialog.current.close();
    const trigger = pendingDelete?.trigger;
    setPendingDelete(null);
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };

  const confirmDelete = () => {
    if (!pendingDelete || busy) return;
    const action = pendingDelete;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    if (action.kind === "one") void removeNotification(action.notification, action.trigger);
    else void deleteFiltered(action.filters, action.trigger);
  };

  return <section ref={sectionRef} className={styles.section} aria-label={t("adminNotifications")} aria-busy={loading || busy}>
    <h2 className={styles.title} ref={headingRef} tabIndex={-1}>{t("adminNotifications")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <form className={styles.createForm} onSubmit={createNotification} aria-busy={busy}>
      <input className={styles.control} required min="1" type="number" aria-label={t("notificationRecipientId")} placeholder={t("notificationRecipientId")} value={draft.recipientId || ""} onChange={event => setDraft({ ...draft, recipientId: Number(event.target.value) })} />
      <select className={styles.control} aria-label={t("notificationType")} value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as AdminNotificationWrite["type"] })}><option value="FOLLOW">{t("notificationFollowType")}</option><option value="REVIEW_LIKED">{t("notificationReviewLikedType")}</option></select>
      <input className={styles.control} required min="1" type="number" aria-label={t("notificationActorId")} placeholder={t("notificationActorId")} value={draft.actorId || ""} onChange={event => setDraft({ ...draft, actorId: event.target.value ? Number(event.target.value) : null })} />
      <input className={styles.control} required={draft.type === "REVIEW_LIKED"} min="1" type="number" aria-label={t("notificationReviewId")} placeholder={t("notificationReviewId")} value={draft.reviewId || ""} onChange={event => setDraft({ ...draft, reviewId: event.target.value ? Number(event.target.value) : null })} />
      <button type="submit" aria-busy={busy} disabled={busy || !canCreateNotification}>{busy ? t("loading") : t("createNotification")}</button>
    </form>
    <form className={styles.filterForm} onSubmit={submitFilters}>
      <select className={styles.control} aria-label={t("notificationTypeFilter")} value={typeFilter} onChange={event => setTypeFilter(event.target.value as "" | AdminNotificationWrite["type"])}><option value="">{t("allNotificationTypes")}</option><option value="FOLLOW">{t("notificationFollowType")}</option><option value="REVIEW_LIKED">{t("notificationReviewLikedType")}</option></select>
      <select className={styles.control} aria-label={t("notificationReadFilter")} value={readFilter} onChange={event => setReadFilter(event.target.value as "" | "read" | "unread")}><option value="">{t("allNotificationStates")}</option><option value="read">{t("read")}</option><option value="unread">{t("unread")}</option></select>
      <input className={styles.control} type="number" min="1" aria-label={t("notificationRecipientFilter")} placeholder={t("notificationRecipientFilter")} value={recipientFilter} onChange={event => setRecipientFilter(event.target.value)} />
      <button type="submit" disabled={busy}>{t("filterNotifications")}</button>
      <button type="button" aria-busy={busy} disabled={busy || filters.read === true} onClick={event => void markFilteredRead(event.currentTarget)}>{busy ? t("loading") : t("markFilteredNotificationsRead")}</button>
      <button type="button" aria-busy={busy} disabled={busy} onClick={event => requestDeleteFiltered(event.currentTarget)}>{busy ? t("loading") : t("deleteFilteredNotifications")}</button>
    </form>
    {loading && <AdminLoading label={t("loading")} layout="logs" />}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={retryLoad} />}
    {data && data.content.length === 0 && <p>{t("noAdminNotifications")}</p>}
    {data && <>
      <ul className={styles.notificationList}>{data.content.map(notification => <li className={styles.notificationRow} key={notification.id}>
        <div className={styles.notificationContent}>{notificationTypeLabel(notification.type, t)} · {t("notificationRecipient")} #{notification.recipientId} · {notification.actorId ? `${t("notificationActor")} #${notification.actorId}` : ""} · {notification.readAt ? t("read") : t("unread")}</div>
        <div className={styles.notificationActions}>
          <button type="button" aria-busy={busy} disabled={busy} onClick={event => void toggleRead(notification, event.currentTarget)}>{busy ? t("loading") : notification.readAt ? t("markNotificationUnread") : t("markNotificationRead")}</button>
          <button type="button" aria-busy={busy} disabled={busy} onClick={event => requestDeleteNotification(notification, event.currentTarget)}>{busy ? t("loading") : t("deleteNotification")}</button>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminNotificationsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
    <dialog className={dialogStyles.deleteDialog} ref={deleteDialog} role="alertdialog" aria-labelledby="admin-notification-delete-title" aria-describedby="admin-notification-delete-description" onCancel={event => { event.preventDefault(); cancelDelete(); }}>
      <h3 id="admin-notification-delete-title">{pendingDelete?.kind === "filtered" ? t("deleteFilteredNotifications") : t("deleteNotification")}</h3>
      {pendingDelete && <p id="admin-notification-delete-description">{pendingDelete.kind === "filtered" ? t("deleteFilteredNotificationsConfirm") : <>{t("deleteNotificationConfirm")} <strong>{notificationTypeLabel(pendingDelete.notification.type, t)} · {t("notificationRecipient")} #{pendingDelete.notification.recipientId}</strong></>}</p>}
      <div className={dialogStyles.deleteDialogActions}>
        <button type="button" ref={deleteDialogCancel} disabled={busy} onClick={cancelDelete}>{t("cancel")}</button>
        <button type="button" className={dialogStyles.deleteDialogConfirm} disabled={busy} aria-busy={busy} onClick={confirmDelete}>{busy ? t("loading") : pendingDelete?.kind === "filtered" ? t("deleteFilteredNotifications") : t("deleteNotification")}</button>
      </div>
    </dialog>
  </section>;
}
