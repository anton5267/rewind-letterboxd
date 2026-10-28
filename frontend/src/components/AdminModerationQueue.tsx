import AdminLoading from "./AdminLoading";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  bulkHideAdminModeration, getAdminModerationQueue, hideAdminModerationItem,
  type AdminModerationFilters, type AdminModerationQueueItem,
} from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";
import dialogStyles from "./AdminConfirmDialog.module.css";

const itemKey = (item: AdminModerationQueueItem) => `${item.type}:${item.id}`;

export default function AdminModerationQueue() {
  const { t, lang, path } = useLocale();
  const { user } = useAuth();
  const [type, setType] = useState<"" | AdminModerationQueueItem["type"]>("");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AdminModerationFilters>({});
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<AdminModerationQueueItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingBulkHide, setPendingBulkHide] = useState<{ items: AdminModerationQueueItem[]; trigger: HTMLButtonElement } | null>(null);

  const heading = useRef<HTMLHeadingElement>(null);
  const mutationAlert = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const scopeGeneration = useRef(0);
  const catalogRequest = useRef(0);
  const mutationToken = useRef<object | null>(null);
  const bulkDialog = useRef<HTMLDialogElement>(null);
  const bulkDialogCancel = useRef<HTMLButtonElement>(null);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const pendingFocus = useRef<{ scope: number; origin: HTMLElement | null; target: "heading" | "error" } | null>(null);
  const transitionFocus = useRef<{ filters: AdminModerationFilters; page: number; lang: string; actor: string; focus: NonNullable<typeof pendingFocus.current> } | null>(null);

  useEffect(() => {
    if (!pendingBulkHide || !bulkDialog.current) return;
    if (!bulkDialog.current.open) bulkDialog.current.showModal();
    bulkDialogCancel.current?.focus();
  }, [pendingBulkHide]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      scopeGeneration.current += 1;
      pendingFocus.current = null;
      mutationToken.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    scopeGeneration.current += 1;
    const transition = transitionFocus.current;
    pendingFocus.current = transition && transition.filters === filters && transition.page === page && transition.lang === lang && transition.actor === actor && pendingFocus.current === transition.focus
      ? { ...transition.focus, scope: scopeGeneration.current } : null;
    transitionFocus.current = null;
    setMutationError(false);
    if (currentActor.current !== actor) {
      mutationToken.current = null;
      setMutating(false);
    }
    currentActor.current = actor;
  }, [filters, page, lang, actor]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || mutating || (!error && data === null)) return;
    const request = catalogRequest.current;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope || catalogRequest.current !== request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      (pending.target === "error" ? mutationAlert.current : heading.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, mutating, error, data, mutationError, filters, page, lang, actor]);

  useEffect(() => {
    let current = true;
    const scope = scopeGeneration.current;
    const request = ++catalogRequest.current;
    const isCurrent = () => current && mounted.current && scopeGeneration.current === scope && catalogRequest.current === request;
    setLoading(true);
    setError(false);
    setData(null);
    setSelected([]);
    getAdminModerationQueue(filters, page).then(({ data: result }) => {
      if (!isCurrent()) return;
      const lastPage = Math.max(0, result.totalPages - 1);
      if (page > lastPage) {
        const focus = pendingFocus.current;
        if (focus?.target === "heading" && focus.scope === scope) transitionFocus.current = { filters, page: lastPage, lang, actor, focus };
        setPage(lastPage);
      } else setData(result);
    }).catch(() => { if (isCurrent()) setError(true); })
      .finally(() => { if (isCurrent()) setLoading(false); });
    return () => { current = false; };
  }, [filters, page, revision, lang, actor]);

  const busy = loading || mutating;
  const captureHeadingFocus = () => {
    const focus = { scope: scopeGeneration.current, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, target: "heading" as const };
    pendingFocus.current = focus;
    return focus;
  };
  const refresh = () => {
    captureHeadingFocus();
    setLoading(true);
    setRevision(value => value + 1);
  };
  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const nextFilters = { ...(type ? { type } : {}), ...(query.trim() ? { query: query.trim() } : {}) };
    const focus = captureHeadingFocus();
    transitionFocus.current = { filters: nextFilters, page: 0, lang, actor, focus };
    setLoading(true);
    setPage(0);
    setFilters(nextFilters);
  };
  const changePage = (nextPage: number) => {
    if (busy || nextPage === page) return;
    const focus = captureHeadingFocus();
    transitionFocus.current = { filters, page: nextPage, lang, actor, focus };
    setLoading(true);
    setPage(nextPage);
  };
  const hide = async (items: AdminModerationQueueItem[], bulk: boolean, origin: HTMLButtonElement) => {
    if (busy || mutationToken.current !== null || items.length === 0) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameScope = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setMutating(true);
    setError(false);
    setMutationError(false);
    try {
      const explanation = reason.trim() || t("moderationDefaultReason");
      if (bulk) await bulkHideAdminModeration(items.map(({ type, id }) => ({ type, id })), explanation);
      else await hideAdminModerationItem(items[0], explanation);
      if (!sameActor()) return;
      if (sameScope()) pendingFocus.current = { scope, origin, target: "heading" };
      setLoading(true);
      setRevision(value => value + 1);
    } catch {
      if (!sameActor()) return;
      if (!sameScope()) { setLoading(true); setRevision(value => value + 1); return; }
      setMutationError(true);
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setMutating(false); }
    }
  };
  const requestBulkHide = (items: AdminModerationQueueItem[], trigger: HTMLButtonElement) => {
    if (busy || mutationToken.current !== null || items.length === 0) return;
    setPendingBulkHide({ items, trigger });
  };
  const cancelBulkHide = () => {
    if (bulkDialog.current?.open) bulkDialog.current.close();
    const trigger = pendingBulkHide?.trigger;
    setPendingBulkHide(null);
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };
  const confirmBulkHide = () => {
    if (!pendingBulkHide || busy || mutationToken.current !== null) return;
    const { items, trigger } = pendingBulkHide;
    if (bulkDialog.current?.open) bulkDialog.current.close();
    setPendingBulkHide(null);
    void hide(items, true, trigger);
  };
  const toggle = (item: AdminModerationQueueItem) => {
    const key = itemKey(item);
    setSelected(values => values.includes(key) ? values.filter(value => value !== key) : [...values, key]);
  };

  return <section className={`${styles.section} ${styles.moderationSection}`} aria-labelledby="moderation-heading" aria-busy={busy}>
    <h2 ref={heading} tabIndex={-1} className={styles.title} id="moderation-heading">{t("moderationQueueTitle")}</h2>
    {mutationError && <p ref={mutationAlert} tabIndex={-1} className={`${styles.error} ${styles.moderationFocus}`} role="alert">{t("adminModerationActionError")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={busy} busy={busy} onRetry={refresh} />}
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
        <button type="button" aria-busy={mutating} disabled={selected.length === 0 || error} onClick={event => requestBulkHide(data?.content.filter(item => selected.includes(itemKey(item))) ?? [], event.currentTarget)}>
          {mutating ? t("loading") : `${t("hideSelectedModeration")} (${selected.length})`}
        </button>
      </fieldset>
    </form>
    <Link className={styles.moderationLogsLink} to={`${path("/admin")}?view=logs`}>{t("moderatorLogs")}</Link>
    {loading ? <AdminLoading label={t("loading")} layout="logs" /> : !error && data && <>
      {data.content.length === 0 ? <p>{t("noModerationItems")}</p> : <ul className={styles.list}>{data.content.map(item => <li className={styles.row} key={itemKey(item)}>
        <div className={styles.rowContent}><label><input type="checkbox" disabled={busy} checked={selected.includes(itemKey(item))} onChange={() => toggle(item)} /> {item.type === "REVIEW" ? t("moderationReview") : t("moderationComment")} · {item.subject} · {getUserName({ username: item.username }, t("someone"))}: {item.content}</label></div>
        <div className={styles.rowActions}>
          <button type="button" aria-busy={mutating} disabled={busy} onClick={event => void hide([item], false, event.currentTarget)}>{mutating ? t("loading") : item.type === "REVIEW" ? t("hideReview") : t("hideComment")}</button>
        </div>
      </li>)}</ul>}
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("moderationQueue")} busy={busy} statusSuffix={data.totalElements} onPageChange={changePage} />
    </>}
    <dialog className={dialogStyles.deleteDialog} ref={bulkDialog} role="alertdialog" aria-labelledby="admin-moderation-bulk-title" aria-describedby="admin-moderation-bulk-description" onCancel={event => { event.preventDefault(); cancelBulkHide(); }}>
      <h3 id="admin-moderation-bulk-title">{t("hideSelectedModeration")}</h3>
      {pendingBulkHide && <p id="admin-moderation-bulk-description">{t("hideSelectedModerationConfirm")} <strong>({pendingBulkHide.items.length})</strong></p>}
      <div className={dialogStyles.deleteDialogActions}>
        <button type="button" ref={bulkDialogCancel} disabled={busy} onClick={cancelBulkHide}>{t("cancel")}</button>
        <button type="button" className={dialogStyles.deleteDialogConfirm} disabled={busy} aria-busy={mutating} onClick={confirmBulkHide}>{mutating ? t("loading") : t("hideSelectedModeration")}</button>
      </div>
    </dialog>
  </section>;
}
