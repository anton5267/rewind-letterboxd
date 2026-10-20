import { useEffect, useState } from "react";
import { deleteAdminConversation, getAdminConversations, type AdminConversation } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatDateTime, useLocale } from "../i18n";
import styles from "./AdminShared.module.css";

export default function AdminConversations() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AdminConversation> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (deletingId !== null || !window.confirm(t("deleteConversationConfirm"))) return;
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

  return <section className={styles.section} aria-label={t("adminConversations")} aria-busy={loading || deletingId !== null}>
    <h2 className={styles.title}>{t("adminConversations")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminConversations")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(conversation => <li className={styles.row} key={conversation.id}>
        <div className={styles.rowContent}>{t("conversationUsers")} #{conversation.userOneId} / #{conversation.userTwoId} · {conversation.messageCount} {t("messagesCount")} · {formatDateTime(conversation.updatedAt, lang)}</div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={deletingId === conversation.id} disabled={deletingId !== null} onClick={() => void removeConversation(conversation)}>{deletingId === conversation.id ? t("loading") : t("deleteConversation")}</button>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminConversationsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
