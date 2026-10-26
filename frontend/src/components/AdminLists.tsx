import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { deleteAdminList, getAdminLists, setAdminListVisibility, type AdminList } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, formatMovieCount, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

export default function AdminLists() {
  const { lang, t } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminList> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<"visibility" | "delete" | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mutationAlert = useRef<HTMLParagraphElement>(null);
  const visibilityButtons = useRef(new Map<number, HTMLButtonElement>());
  const mounted = useRef(false);
  const scopeGeneration = useRef(0);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const catalogRequest = useRef(0);
  const mutationToken = useRef<object | null>(null);
  const pendingFocus = useRef<{ scope: number; origin: HTMLElement | null; target: "heading" | "error" | "visibility"; id?: number } | null>(null);
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
  }, [page, lang, actor]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || busyId !== null || (!error && data === null)) return;
    const request = catalogRequest.current;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope || catalogRequest.current !== request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (pending.target === "error") mutationAlert.current?.focus();
      else if (pending.target === "visibility" && pending.id !== undefined) {
        const button = visibilityButtons.current.get(pending.id);
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
    getAdminLists(page)
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
  }, [page, revision, lang, actor]);

  const toggleVisibility = async (list: AdminList, origin: HTMLButtonElement) => {
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
      const { data: updated } = await setAdminListVisibility(list.id, !list.isPublic);
      if (!sameActor()) return;
      if (!sameQuery()) { setRevision(value => value + 1); return; }
      setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
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

  const remove = async (list: AdminList, origin: HTMLButtonElement) => {
    if (list.listType !== "CUSTOM" || mutationToken.current !== null || !window.confirm(t("deleteListConfirm"))) return;
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

  return <section className={`${styles.section} ${styles.listsSection}`} aria-label={t("adminLists")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title} ref={heading} tabIndex={-1}>{t("adminLists")}</h2>
    {actionError && <p className={`${styles.error} ${styles.listActionFocus}`} ref={mutationAlert} tabIndex={-1} role="alert">{t(actionError === "visibility" ? "adminListVisibilityError" : "adminListDeleteError")}</p>}
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => {
      pendingFocus.current = { scope: scopeGeneration.current, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, target: "heading" };
      setLoading(true);
      setRevision(value => value + 1);
    }} />}
    {data && data.content.length === 0 && <p>{t("noAdminLists")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(list => <li className={styles.row} key={list.id}>
        <div className={styles.listMain}>
          <strong className={styles.listIdentity}>{editorialText(list.name, t("lists"))}</strong>
          <p className={styles.listMeta}>{getUserName({ username: list.username }, t("someone"))} · {formatMovieCount(list.itemCount, lang)}</p>
          {list.description?.trim() && <p className={styles.listDescription}>{list.description}</p>}
        </div>
        <div className={styles.listSide}>
          <p className={styles.listStatus}>{list.isPublic ? t("publicList") : t("hiddenList")}</p>
          <div className={styles.rowActions}>
            <button ref={button => { if (button) visibilityButtons.current.set(list.id, button); else visibilityButtons.current.delete(list.id); }} type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={event => void toggleVisibility(list, event.currentTarget)}>{busyId === list.id ? t("loading") : list.isPublic ? t("hideList") : t("publishList")}</button>
            {list.listType === "CUSTOM" && <button type="button" aria-busy={busyId === list.id} disabled={busyId !== null} onClick={event => void remove(list, event.currentTarget)}>{busyId === list.id ? t("loading") : t("deleteList")}</button>}
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
  </section>;
}
