import { useEffect, useState } from "react";
import {
  bulkHideAdminModeration, getAdminModerationQueue, hideAdminModerationItem,
  type AdminModerationFilters, type AdminModerationQueueItem, type Page,
} from "../api/admin.api";
import { useLocale } from "../i18n";
import styles from "./AdminShared.module.css";

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
  const [mutationError, setMutationError] = useState("");
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
    setMutationError("");
    try {
      const explanation = reason.trim() || t("moderationDefaultReason");
      if (bulk) await bulkHideAdminModeration(items.map(({ type, id }) => ({ type, id })), explanation);
      else await hideAdminModerationItem(items[0], explanation);
      refresh();
    } catch { setMutationError(t("adminModerationActionError")); }
    finally { setMutating(false); }
  };
  const toggle = (item: AdminModerationQueueItem) => {
    const key = itemKey(item);
    setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  };

  return <section className={styles.section} aria-labelledby="moderation-heading" aria-busy={busy}>
    <h2 className={styles.title} id="moderation-heading">{t("moderationQueue")}</h2>
    {mutationError && <p className={styles.error} role="alert">{mutationError}</p>}
    {error && <p className={styles.error} role="alert">{t("adminLoadError")} <button type="button" onClick={refresh} disabled={busy}>{t("retry")}</button></p>}
    <form onSubmit={applyFilters}>
      <fieldset className={styles.filterset} disabled={busy}>
        <legend>{t("filterModeration")}</legend>
        <select className={styles.control} aria-label={t("moderationTypeFilter")} value={type} onChange={event => setType(event.target.value as typeof type)}>
          <option value="">{t("allModerationTypes")}</option>
          <option value="REVIEW">{t("moderationReview")}</option>
          <option value="COMMENT">{t("moderationComment")}</option>
        </select>
        <input className={styles.control} aria-label={t("moderationSearch")} placeholder={t("moderationSearch")} value={query} onChange={event => setQuery(event.target.value)} />
        <button type="submit">{t("filterModeration")}</button>
        <button type="button" disabled={!data?.content.length || error} onClick={() => setSelected(data?.content.map(itemKey) ?? [])}>{t("selectAllModeration")}</button>
        <input className={styles.control} aria-label={t("moderationReason")} placeholder={t("moderationReason")} maxLength={255} value={reason} onChange={event => setReason(event.target.value)} />
        <button type="button" aria-busy={mutating} disabled={selected.length === 0 || error} onClick={() => void hide(data?.content.filter(item => selected.includes(itemKey(item))) ?? [], true)}>
          {mutating ? t("loading") : `${t("hideSelectedModeration")} (${selected.length})`}
        </button>
      </fieldset>
    </form>
    {loading ? <p role="status">{t("loading")}</p> : !error && data && <>
      {data.content.length === 0 ? <p>{t("noModerationItems")}</p> : <ul className={styles.list}>{data.content.map(item => <li className={styles.row} key={itemKey(item)}>
        <div className={styles.rowContent}><label><input type="checkbox" disabled={busy} checked={selected.includes(itemKey(item))} onChange={() => toggle(item)} /> {item.type === "REVIEW" ? t("moderationReview") : t("moderationComment")} · {item.subject} · {item.username}: {item.content}</label></div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={mutating} disabled={busy} onClick={() => void hide([item], false)}>{mutating ? t("loading") : item.type === "REVIEW" ? t("hideReview") : t("hideComment")}</button>
        </div>
      </li>)}</ul>}
      <nav className={styles.pagination} aria-label={t("moderationQueue")}>
        <button type="button" disabled={busy || page === 0} onClick={() => changePage(page - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={busy || page + 1 >= data.totalPages} onClick={() => changePage(page + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
