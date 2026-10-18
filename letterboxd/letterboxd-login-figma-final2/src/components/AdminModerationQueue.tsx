import { useEffect, useState } from "react";
import {
  bulkHideAdminModeration, getAdminModerationQueue, hideAdminModerationItem,
  type AdminModerationFilters, type AdminModerationQueueItem, type Page,
} from "../api/admin.api";
import { useLocale } from "../i18n";

const itemKey = (item: AdminModerationQueueItem) => `${item.type}:${item.id}`;

export default function AdminModerationQueue() {
  const { t } = useLocale();
  const [type, setType] = useState<"" | AdminModerationQueueItem["type"]>("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AdminModerationFilters>({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminModerationQueueItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setSelected([]);
    getAdminModerationQueue(filters, page).then(({ data: result }) => {
      if (!current) return;
      const lastPage = Math.max(0, result.totalPages - 1);
      if (page > lastPage) {
        setPage(lastPage);
      } else {
        setData(result);
      }
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [filters, page, revision]);

  const busy = loading || mutating;
  const refresh = () => {
    setLoading(true);
    setRevision(value => value + 1);
  };
  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setPage(0);
    setFilters({ ...(type ? { type } : {}), ...(query.trim() ? { query: query.trim() } : {}) });
  };
  const changePage = (nextPage: number) => {
    setLoading(true);
    setPage(nextPage);
  };
  const hide = async (items: AdminModerationQueueItem[], bulk: boolean) => {
    if (busy || items.length === 0) return;
    if (bulk && !window.confirm(t("hideSelectedModerationConfirm"))) return;
    setMutating(true);
    setError(false);
    try {
      const explanation = reason.trim() || t("moderationDefaultReason");
      if (bulk) await bulkHideAdminModeration(items.map(({ type, id }) => ({ type, id })), explanation);
      else await hideAdminModerationItem(items[0], explanation);
      refresh();
    } catch { setError(true); }
    finally { setMutating(false); }
  };
  const toggle = (item: AdminModerationQueueItem) => {
    const key = itemKey(item);
    setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  };

  return <section aria-labelledby="moderation-heading" aria-busy={busy}>
    <h2 id="moderation-heading">{t("moderationQueue")}</h2>
    {error && <p role="alert">{t("adminLoadError")} <button type="button" onClick={refresh} disabled={busy}>{t("retry")}</button></p>}
    <form onSubmit={applyFilters}>
      <fieldset disabled={busy} style={{ display: "flex", flexWrap: "wrap", gap: 8, border: 0, padding: 0, marginBottom: 12 }}>
        <legend>{t("filterModeration")}</legend>
        <select aria-label={t("moderationTypeFilter")} value={type} onChange={event => setType(event.target.value as typeof type)}>
          <option value="">{t("allModerationTypes")}</option>
          <option value="REVIEW">{t("moderationReview")}</option>
          <option value="COMMENT">{t("moderationComment")}</option>
        </select>
        <input aria-label={t("moderationSearch")} placeholder={t("moderationSearch")} value={query} onChange={event => setQuery(event.target.value)} />
        <button type="submit">{t("filterModeration")}</button>
        <button type="button" disabled={!data?.content.length || error} onClick={() => setSelected(data?.content.map(itemKey) ?? [])}>{t("selectAllModeration")}</button>
        <input aria-label={t("moderationReason")} placeholder={t("moderationReason")} maxLength={255} value={reason} onChange={event => setReason(event.target.value)} />
        <button type="button" disabled={selected.length === 0 || error} onClick={() => void hide(data?.content.filter(item => selected.includes(itemKey(item))) ?? [], true)}>
          {t("hideSelectedModeration")} ({selected.length})
        </button>
      </fieldset>
    </form>
    {loading ? <p role="status">{t("loading")}</p> : !error && data && <>
      {data.content.length === 0 ? <p>{t("noModerationItems")}</p> : <ul>{data.content.map(item => <li key={itemKey(item)} style={{ marginBottom: 8 }}>
        <label><input type="checkbox" disabled={busy} checked={selected.includes(itemKey(item))} onChange={() => toggle(item)} /> {item.type === "REVIEW" ? t("moderationReview") : t("moderationComment")} · {item.subject} · {item.username}: {item.content}</label>{" "}
        <button type="button" disabled={busy} onClick={() => void hide([item], false)}>{t("hideComment")}</button>
      </li>)}</ul>}
      <nav aria-label={t("moderationQueue")} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" disabled={busy || page === 0} onClick={() => changePage(page - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={busy || page + 1 >= data.totalPages} onClick={() => changePage(page + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
