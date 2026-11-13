import AdminLoading from "./AdminLoading";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { deleteAdminList, dismissAdminListReport, getAdminLists, getAdminReportedLists, moveAdminListFeatured, setAdminListFeatured, setAdminListVisibility, type AdminList, type AdminReportedList } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, formatMovieCount, formatReviewDate, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";
import dialogStyles from "./AdminConfirmDialog.module.css";

export default function AdminLists() {
  const { lang, t } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminList | AdminReportedList> | null>(null);
  const [page, setPage] = useState(0);
  const [reportedOnly, setReportedOnly] = useState(false);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<"visibility" | "featured" | "featuredBoundary" | "delete" | "report" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ list: AdminList; trigger: HTMLButtonElement } | null>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteDialogCancel = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const mutationAlert = useRef<HTMLParagraphElement>(null);
  const visibilityButtons = useRef(new Map<number, HTMLButtonElement>());
  const featuredButtons = useRef(new Map<number, HTMLButtonElement>());
  const mounted = useRef(false);
  const scopeGeneration = useRef(0);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const catalogRequest = useRef(0);
  const mutationToken = useRef<object | null>(null);
  const pendingFocus = useRef<{ scope: number; origin: HTMLElement | null; target: "heading" | "error" | "retry" | "visibility" | "featured"; id?: number } | null>(null);
  const internalClamp = useRef<{ page: number; lang: string; actor: string; focus: NonNullable<typeof pendingFocus.current> } | null>(null);

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
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    const clamp = internalClamp.current;
    pendingFocus.current = clamp && clamp.page === page && clamp.lang === lang && clamp.actor === actor && pendingFocus.current === clamp.focus
      ? { ...clamp.focus, scope: scopeGeneration.current } : null;
    internalClamp.current = null;
    setActionError(null);
    if (currentActor.current !== actor) {
      mutationToken.current = null;
      setBusyId(null);
    }
    currentActor.current = actor;
  }, [page, lang, actor, reportedOnly]);

  useEffect(() => {
    if (!pendingDelete || !deleteDialog.current) return;
    if (!deleteDialog.current.open) deleteDialog.current.showModal();
    deleteDialogCancel.current?.focus();
  }, [pendingDelete]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || busyId !== null || (!error && data === null)) return;
    const request = catalogRequest.current;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope || catalogRequest.current !== request) return;
      const expectedHeadingFocus = pending.target === "retry" && error && document.activeElement === heading.current;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin && !expectedHeadingFocus) return;
      if (pending.target === "error") mutationAlert.current?.focus();
      else if (pending.target === "retry" && error) sectionRef.current?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else if (pending.target === "visibility" && pending.id !== undefined) {
        const button = visibilityButtons.current.get(pending.id);
        if (button && !button.disabled) button.focus();
        else heading.current?.focus();
      } else if (pending.target === "featured" && pending.id !== undefined) {
        const button = featuredButtons.current.get(pending.id);
        if (button && !button.disabled) button.focus();
        else heading.current?.focus();
      } else heading.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, busyId, error, data, actionError, page, lang, actor]);

  useEffect(() => {
    let current = true;
    const scope = scopeGeneration.current;
    const request = ++catalogRequest.current;
    const isCurrent = () => current && mounted.current && scopeGeneration.current === scope && catalogRequest.current === request;
    setLoading(true);
    setError(false);
    setData(null);
    (reportedOnly ? getAdminReportedLists(page) : getAdminLists(page))
      .then(({ data: response }) => {
        if (!isCurrent()) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          const focus = pendingFocus.current;
          if (focus?.target === "heading" && focus.scope === scope) internalClamp.current = { page: lastPage, lang, actor, focus };
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (isCurrent()) setError(true); })
      .finally(() => { if (isCurrent()) setLoading(false); });
    return () => { current = false; };
  }, [page, revision, lang, actor, reportedOnly]);

  const toggleVisibility = async (list: AdminList, origin: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || mutationToken.current !== null) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameQuery = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setBusyId(list.id);
    setActionError(null);
    try {
      const { data: updated } = await setAdminListVisibility(list.id, !list.isPublic);
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? { ...item, ...updated } : item) } : current);
      pendingFocus.current = { scope, origin, target: "visibility", id: list.id };
    } catch {
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setActionError("visibility");
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const toggleFeatured = async (list: AdminList, origin: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || (!list.isPublic && list.featuredPosition === null) || mutationToken.current !== null) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameQuery = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setBusyId(list.id);
    setActionError(null);
    try {
      const { data: updated } = await setAdminListFeatured(list.id, list.featuredPosition === null);
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? { ...item, ...updated } : item) } : current);
      pendingFocus.current = { scope, origin, target: "featured", id: list.id };
    } catch {
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setActionError("featured");
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const moveFeatured = async (list: AdminList, direction: "up" | "down", origin: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || list.featuredPosition === null || mutationToken.current !== null) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameQuery = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setBusyId(list.id);
    setActionError(null);
    try {
      await moveAdminListFeatured(list.id, direction);
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      pendingFocus.current = { scope, origin, target: "featured", id: list.id };
      setLoading(true);
      setRevision(value => value + 1);
    } catch (error) {
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      const response = typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { status?: number; data?: { message?: string } } }).response : undefined;
      setActionError(response?.status === 409 && response.data?.message === "List is already at that end of the featured order" ? "featuredBoundary" : "featured");
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const remove = async (list: AdminList, origin: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || mutationToken.current !== null) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameQuery = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setBusyId(list.id);
    setActionError(null);
    try {
      await deleteAdminList(list.id);
      if (!sameActor()) return;
      if (sameQuery()) pendingFocus.current = { scope, origin, target: "heading" };
      // Reload the current page; the GET's last-page clamp handles deletion without captured pagination.
      setLoading(true);
      setRevision(value => value + 1);
    } catch {
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setActionError("delete");
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const requestDelete = (list: AdminList, trigger: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || mutationToken.current !== null) return;
    pendingFocus.current = null;
    setPendingDelete({ list, trigger });
  };

  const dismissReport = async (list: AdminReportedList, origin: HTMLButtonElement) => {
    if (mutationToken.current !== null) return;
    const token = {};
    mutationToken.current = token;
    const scope = scopeGeneration.current;
    const sameActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    const sameQuery = () => sameActor() && scopeGeneration.current === scope;
    pendingFocus.current = null;
    setBusyId(list.id);
    setActionError(null);
    try {
      await dismissAdminListReport(list.reportId);
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      pendingFocus.current = { scope, origin, target: "heading" };
      setLoading(true);
      setRevision(value => value + 1);
    } catch {
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setActionError("report");
      pendingFocus.current = { scope, origin, target: "error" };
    } finally {
      if (sameActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const cancelDelete = () => {
    if (deleteDialog.current?.open) deleteDialog.current.close();
    const trigger = pendingDelete?.trigger;
    setPendingDelete(null);
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };

  const confirmDelete = () => {
    if (!pendingDelete || mutationToken.current !== null) return;
    const { list, trigger } = pendingDelete;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    void remove(list, trigger);
  };

  return <section ref={sectionRef} className={`${styles.section} ${styles.listsSection}`} aria-label={t("adminAllLists")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title} ref={heading} tabIndex={-1}>{t("adminAllLists")}</h2>
    {actionError && <p className={`${styles.error} ${styles.listActionFocus}`} ref={mutationAlert} tabIndex={-1} role="alert">{t(actionError === "visibility" ? "adminListVisibilityError" : actionError === "featuredBoundary" ? "adminListFeaturedBoundary" : actionError === "featured" ? "adminListFeaturedError" : actionError === "report" ? "adminReviewReportDismissError" : "adminListDeleteError")}</p>}
    <button type="button" aria-pressed={reportedOnly} onClick={() => { setLoading(true); setPage(0); setReportedOnly(value => !value); }}>{reportedOnly ? t("allVisibilityStates") : t("reportedOnly")}</button>
    {loading && <AdminLoading label={t("loading")} layout="lists" />}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => {
      pendingFocus.current = { scope: scopeGeneration.current, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, target: "retry" };
      setLoading(true);
      setRevision(value => value + 1);
    }} />}
    {data && data.content.length === 0 && <p>{t("noAdminLists")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(list => <li className={styles.row} key={"reportId" in list ? list.reportId : list.id}>
        <div className={styles.listMain}>
          <strong className={styles.listIdentity}>{editorialText(list.name, t("lists"))}</strong>
          <p className={styles.listMeta}>{getUserName({ username: list.username }, t("someone"))} · {formatMovieCount(list.itemCount, lang)}</p>
          {list.description?.trim() && <p className={styles.listDescription}>{list.description}</p>}
          {reportedOnly && "reportId" in list && <p className={styles.listDescription}>{t("reportedReason")}: {t(`reviewReportReason_${list.reportReason}`)} · {formatReviewDate(list.reportCreatedAt, lang)}</p>}
        </div>
        <div className={styles.listSide}>
          <div className={styles.listCreated}>
            <span>{t("adminListCreatedDate")}</span>
            <time dateTime={list.createdAt}>{formatReviewDate(list.createdAt, lang)}</time>
          </div>
          <p className={styles.listStatus}>{list.isPublic ? t("publicList") : t("hiddenList")}</p>
          {list.featuredPosition !== null && <p className={styles.listStatus}>{t("featuredPositionLabel")} {list.featuredPosition + 1}</p>}
          <div className={styles.rowActions}>
            {reportedOnly && "reportId" in list && <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={event => void dismissReport(list, event.currentTarget)}>{busyId === list.id ? t("loading") : t("dismissReport")}</button>}
            {list.listType === "CUSTOM" && <button ref={button => { if (button) visibilityButtons.current.set(list.id, button); else visibilityButtons.current.delete(list.id); }} type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={event => void toggleVisibility(list, event.currentTarget)}>{busyId === list.id ? t("loading") : list.isPublic ? t("hideList") : t("publishList")}</button>}
            {list.listType === "CUSTOM" && <button ref={button => { if (button) featuredButtons.current.set(list.id, button); else featuredButtons.current.delete(list.id); }} type="button" aria-busy={busyId === list.id} disabled={busyId !== null || (!list.isPublic && list.featuredPosition === null)} onClick={event => void toggleFeatured(list, event.currentTarget)}>{busyId === list.id ? t("loading") : t(list.featuredPosition === null ? "featureList" : "unfeatureList")}</button>}
            {list.listType === "CUSTOM" && list.featuredPosition !== null && <>
              <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null || list.featuredPosition === 0} aria-label={`${t("moveFeaturedUp")} ${editorialText(list.name, t("lists"))}`} onClick={event => void moveFeatured(list, "up", event.currentTarget)}>↑</button>
              <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} aria-label={`${t("moveFeaturedDown")} ${editorialText(list.name, t("lists"))}`} onClick={event => void moveFeatured(list, "down", event.currentTarget)}>↓</button>
            </>}
            {list.listType === "CUSTOM" && <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={event => requestDelete(list, event.currentTarget)}>{busyId === list.id ? t("loading") : t("deleteList")}</button>}
          </div>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminListsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={nextPage => {
        if (nextPage === page) return;
        const focus = { scope: scopeGeneration.current, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, target: "heading" as const };
        pendingFocus.current = focus;
        internalClamp.current = { page: nextPage, lang, actor, focus };
        setLoading(true);
        setPage(nextPage);
      }} />
    </>}
    <dialog className={dialogStyles.deleteDialog} ref={deleteDialog} role="alertdialog" aria-labelledby="admin-list-delete-title" aria-describedby="admin-list-delete-description" onCancel={event => { event.preventDefault(); cancelDelete(); }}>
      <h3 id="admin-list-delete-title">{t("deleteList")}</h3>
      {pendingDelete && <p id="admin-list-delete-description">{t("deleteListConfirm")} <strong>{editorialText(pendingDelete.list.name, t("lists"))}</strong> · {getUserName({ username: pendingDelete.list.username }, t("someone"))}</p>}
      <div className={dialogStyles.deleteDialogActions}>
        <button type="button" ref={deleteDialogCancel} disabled={busyId !== null} onClick={cancelDelete}>{t("cancel")}</button>
        <button type="button" className={dialogStyles.deleteDialogConfirm} disabled={busyId !== null} aria-busy={busyId === pendingDelete?.list.id} onClick={confirmDelete}>{busyId === pendingDelete?.list.id ? t("loading") : t("deleteList")}</button>
      </div>
    </dialog>
  </section>;
}
