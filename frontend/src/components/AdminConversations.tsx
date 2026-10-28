import AdminLoading from "./AdminLoading";
import { useEffect, useRef, useState } from "react";
import { deleteAdminConversation, getAdminConversations, type AdminConversation } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatDateTime, useLocale } from "../i18n";
import styles from "./AdminShared.module.css";
import dialogStyles from "./AdminConfirmDialog.module.css";

export default function AdminConversations() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AdminConversation> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ conversation: AdminConversation; trigger: HTMLButtonElement } | null>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteDialogCancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pendingDelete || !deleteDialog.current) return;
    if (!deleteDialog.current.open) deleteDialog.current.showModal();
    deleteDialogCancel.current?.focus();
  }, [pendingDelete]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminConversations(page)
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
  }, [page, revision]);

  const removeConversation = async (conversation: AdminConversation) => {
    if (deletingId !== null) return;
    setDeletingId(conversation.id);
    setActionError("");
    try {
      await deleteAdminConversation(conversation.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
    } catch {
      setActionError(t("adminConversationDeleteError"));
    } finally {
      setDeletingId(null);
    }
  };

  const requestDelete = (conversation: AdminConversation, trigger: HTMLButtonElement) => {
    if (deletingId !== null) return;
    setPendingDelete({ conversation, trigger });
  };

  const cancelDelete = () => {
    if (deleteDialog.current?.open) deleteDialog.current.close();
    const trigger = pendingDelete?.trigger;
    setPendingDelete(null);
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };

  const confirmDelete = () => {
    if (!pendingDelete || deletingId !== null) return;
    const { conversation } = pendingDelete;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    void removeConversation(conversation);
  };

  return <section className={styles.section} aria-label={t("adminConversations")} aria-busy={loading || deletingId !== null}>
    <h2 className={styles.title}>{t("adminConversations")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    {loading && <AdminLoading label={t("loading")} layout="logs" />}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminConversations")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(conversation => <li className={styles.row} key={conversation.id}>
        <div className={styles.rowContent}>{t("conversationUsers")} #{conversation.userOneId} / #{conversation.userTwoId} · {conversation.messageCount} {t("messagesCount")} · {formatDateTime(conversation.updatedAt, lang)}</div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={deletingId === conversation.id} disabled={deletingId !== null} onClick={event => requestDelete(conversation, event.currentTarget)}>{deletingId === conversation.id ? t("loading") : t("deleteConversation")}</button>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminConversationsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
    <dialog className={dialogStyles.deleteDialog} ref={deleteDialog} role="alertdialog" aria-labelledby="admin-conversation-delete-title" aria-describedby="admin-conversation-delete-description" onCancel={event => { event.preventDefault(); cancelDelete(); }}>
      <h3 id="admin-conversation-delete-title">{t("deleteConversation")}</h3>
      {pendingDelete && <p id="admin-conversation-delete-description">{t("deleteConversationConfirm")} <strong>#{pendingDelete.conversation.userOneId} / #{pendingDelete.conversation.userTwoId}</strong></p>}
      <div className={dialogStyles.deleteDialogActions}>
        <button type="button" ref={deleteDialogCancel} disabled={deletingId !== null} onClick={cancelDelete}>{t("cancel")}</button>
        <button type="button" className={dialogStyles.deleteDialogConfirm} disabled={deletingId !== null} aria-busy={deletingId === pendingDelete?.conversation.id} onClick={confirmDelete}>{deletingId === pendingDelete?.conversation.id ? t("loading") : t("deleteConversation")}</button>
      </div>
    </dialog>
  </section>;
}
