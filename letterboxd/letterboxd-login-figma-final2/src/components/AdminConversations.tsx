import { useEffect, useState } from "react";
import { deleteAdminConversation, getAdminConversations, type AdminConversation, type Page } from "../api/admin.api";
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
      .then(({ data: response }) => { if (current) setData(response); })
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
    {loading && <p className={styles.feedback}>{t("loading")}</p>}
    {error && <div><p className={styles.error} role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminConversations")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(conversation => <li className={styles.row} key={conversation.id}>
        <div className={styles.rowContent}>{t("conversationUsers")} #{conversation.userOneId} / #{conversation.userTwoId} · {conversation.messageCount} {t("messagesCount")} · {formatDateTime(conversation.updatedAt, lang)}</div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={deletingId === conversation.id} disabled={deletingId !== null} onClick={() => void removeConversation(conversation)}>{deletingId === conversation.id ? t("loading") : t("deleteConversation")}</button>
        </div>
      </li>)}</ul>
      <nav className={styles.pagination} aria-label={t("adminConversationsPagination")}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
