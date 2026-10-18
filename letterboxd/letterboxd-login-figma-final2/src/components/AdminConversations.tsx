import { useEffect, useState } from "react";
import { deleteAdminConversation, getAdminConversations, type AdminConversation, type Page } from "../api/admin.api";
import { formatDateTime, useLocale } from "../i18n";

export default function AdminConversations() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AdminConversation> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
    try {
      await deleteAdminConversation(conversation.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
    } catch {
      setError(true);
    } finally {
      setDeletingId(null);
    }
  };

  return <section aria-label={t("adminConversations")} aria-busy={loading}>
    <h2>{t("adminConversations")}</h2>
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminConversations")}</p>}
    {data && <>
      <ul>{data.content.map(conversation => <li key={conversation.id}>
        {t("conversationUsers")} #{conversation.userOneId} / #{conversation.userTwoId} · {conversation.messageCount} {t("messagesCount")} · {formatDateTime(conversation.updatedAt, lang)} {" "}
        <button type="button" disabled={deletingId !== null} onClick={() => void removeConversation(conversation)}>{t("deleteConversation")}</button>
      </li>)}</ul>
      <nav aria-label={t("adminConversationsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
