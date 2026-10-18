import { useEffect, useState } from "react";
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
  type Page,
} from "../api/admin.api";
import { useLocale } from "../i18n";

const emptyDraft: AdminNotificationWrite = { recipientId: 0, type: "FOLLOW", actorId: null, relatedUserId: null, reviewId: null };

const notificationTypeLabel = (type: string, t: (key: string) => string) => {
  if (type === "FOLLOW") return t("notificationFollowType");
  if (type === "REVIEW_LIKED") return t("notificationReviewLikedType");
  return t("unknownNotificationType");
};

export default function AdminNotifications() {
  const { t } = useLocale();
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminNotifications(filters, page)
      .then(({ data: response }) => { if (current) setData(response); })
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

  const createNotification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await createAdminNotification({ ...draft, recipientId: Number(draft.recipientId), actorId: draft.actorId || null, relatedUserId: draft.relatedUserId || null, reviewId: draft.reviewId || null });
      setDraft(emptyDraft);
      if (page === 0) setRevision(value => value + 1); else setPage(0);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const toggleRead = async (notification: AdminNotification) => {
    if (busy) return;
    setBusy(true);
    try {
      await setAdminNotificationRead(notification.id, !notification.readAt);
      if (filters.read === undefined) {
        setData(current => current ? { ...current, content: current.content.map(item => item.id === notification.id ? { ...item, readAt: item.readAt ? null : new Date().toISOString() } : item) } : current);
      } else refreshAfterRemoval();
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const removeNotification = async (notification: AdminNotification) => {
    if (busy || !window.confirm(t("deleteNotificationConfirm"))) return;
    setBusy(true);
    try {
      await deleteAdminNotification(notification.id);
      refreshAfterRemoval();
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const markFilteredRead = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await markAdminNotificationsRead({ type: filters.type, recipientId: filters.recipientId });
      setPage(0);
      setRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const deleteFiltered = async () => {
    if (busy || !window.confirm(t("deleteFilteredNotificationsConfirm"))) return;
    setBusy(true);
    try {
      await deleteAdminNotifications(filters);
      setPage(0);
      setRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return <section aria-label={t("adminNotifications")} aria-busy={loading}>
    <h2>{t("adminNotifications")}</h2>
    <form onSubmit={createNotification} style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 12 }}>
      <input required min="1" type="number" aria-label={t("notificationRecipientId")} placeholder={t("notificationRecipientId")} value={draft.recipientId || ""} onChange={event => setDraft({ ...draft, recipientId: Number(event.target.value) })} />
      <select aria-label={t("notificationType")} value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value as AdminNotificationWrite["type"] })}><option value="FOLLOW">{t("notificationFollowType")}</option><option value="REVIEW_LIKED">{t("notificationReviewLikedType")}</option></select>
      <input min="1" type="number" aria-label={t("notificationActorId")} placeholder={t("notificationActorId")} value={draft.actorId || ""} onChange={event => setDraft({ ...draft, actorId: event.target.value ? Number(event.target.value) : null })} />
      <input min="1" type="number" aria-label={t("notificationReviewId")} placeholder={t("notificationReviewId")} value={draft.reviewId || ""} onChange={event => setDraft({ ...draft, reviewId: event.target.value ? Number(event.target.value) : null })} />
      <button type="submit" disabled={busy}>{t("createNotification")}</button>
    </form>
    <form onSubmit={submitFilters} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      <select aria-label={t("notificationTypeFilter")} value={typeFilter} onChange={event => setTypeFilter(event.target.value as "" | AdminNotificationWrite["type"])}><option value="">{t("allNotificationTypes")}</option><option value="FOLLOW">{t("notificationFollowType")}</option><option value="REVIEW_LIKED">{t("notificationReviewLikedType")}</option></select>
      <select aria-label={t("notificationReadFilter")} value={readFilter} onChange={event => setReadFilter(event.target.value as "" | "read" | "unread")}><option value="">{t("allNotificationStates")}</option><option value="read">{t("read")}</option><option value="unread">{t("unread")}</option></select>
      <input type="number" min="1" aria-label={t("notificationRecipientFilter")} placeholder={t("notificationRecipientFilter")} value={recipientFilter} onChange={event => setRecipientFilter(event.target.value)} />
      <button type="submit" disabled={busy}>{t("filterNotifications")}</button>
      <button type="button" disabled={busy} onClick={() => void markFilteredRead()}>{t("markFilteredNotificationsRead")}</button>
      <button type="button" disabled={busy} onClick={() => void deleteFiltered()}>{t("deleteFilteredNotifications")}</button>
    </form>
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminNotifications")}</p>}
    {data && <>
      <ul>{data.content.map(notification => <li key={notification.id}>{notificationTypeLabel(notification.type, t)} · {t("notificationRecipient")} #{notification.recipientId} · {notification.actorId ? `${t("notificationActor")} #${notification.actorId}` : ""} · {notification.readAt ? t("read") : t("unread")} {" "}<button type="button" disabled={busy} onClick={() => void toggleRead(notification)}>{notification.readAt ? t("markNotificationUnread") : t("markNotificationRead")}</button> <button type="button" disabled={busy} onClick={() => void removeNotification(notification)}>{t("deleteNotification")}</button></li>)}</ul>
      <nav aria-label={t("adminNotificationsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
