import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { deleteAdminComment, getAdminComments, setAdminCommentHidden, type AdminComment } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { formatReviewDate, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

type VisibilityFilter = "all" | "visible" | "hidden";

const hiddenValue = (filter: VisibilityFilter) => filter === "all" ? undefined : filter === "hidden";
export default function AdminComments() {
  const { t, lang } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminComment> | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<"moderate" | "delete" | false>(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusAfterReload = useRef(false);
  const reloadFocusOrigin = useRef<HTMLElement | null>(null);
  const queryGeneration = useRef(0);
  const mounted = useRef(true);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const mutationToken = useRef<object | null>(null);

  useLayoutEffect(() => {
    queryGeneration.current += 1;
    if (currentActor.current !== actor) {
      currentActor.current = actor;
      mutationToken.current = null;
      setBusyId(null);
      setData(null);
      setLoading(true);
      setError(false);
      setActionError(false);
      focusAfterReload.current = false;
      reloadFocusOrigin.current = null;
    }
  }, [filter, page, lang, actor]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => { focusAfterReload.current = false; reloadFocusOrigin.current = null; }, [lang]);

  useEffect(() => {
    if (!focusAfterReload.current || loading || busyId !== null) return;
    if (!error && data === null) return;
    const generation = queryGeneration.current;
    const frame = window.requestAnimationFrame(() => {
      if (!focusAfterReload.current) return;
      const origin = reloadFocusOrigin.current;
      focusAfterReload.current = false;
      reloadFocusOrigin.current = null;
      if (!mounted.current || queryGeneration.current !== generation || !origin) return;
      const active = document.activeElement;
      if (active !== document.body) return;
      if (origin.isConnected && !origin.matches(":disabled")) origin.focus();
      else if (!origin.isConnected) headingRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, data, lang, busyId]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminComments(page, hiddenValue(filter))
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
  }, [filter, page, revision, actor]);

  const changeFilter = (next: VisibilityFilter) => {
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    setFilter(next);
    setPage(0);
  };

  const toggleHidden = async (comment: AdminComment, origin: HTMLButtonElement) => {
    if (busyId !== null || currentActor.current !== actor) return;
    const token = {};
    mutationToken.current = token;
    const isCurrentActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    const generation = queryGeneration.current;
    setBusyId(comment.id);
    setActionError(false);
    try {
      const { data: updated } = await setAdminCommentHidden(comment.id, !comment.isHidden, comment.isHidden ? "" : t("moderationDefaultReason"));
      if (!isCurrentActor()) return;
      // A response from the previous filter/page/locale must not update the
      // new view with captured pagination or move focus away from its control.
      if (queryGeneration.current !== generation) {
        focusAfterReload.current = false;
        setRevision(value => value + 1);
        return;
      }
      reloadFocusOrigin.current = origin;
      focusAfterReload.current = true;
      const leavesFilter = filter !== "all" && updated.isHidden !== hiddenValue(filter);
      if (leavesFilter) {
        if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
        else setRevision(value => value + 1);
      } else {
        setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      }
    } catch {
      if (!isCurrentActor()) return;
      setActionError("moderate");
      if (queryGeneration.current !== generation) {
        focusAfterReload.current = false;
        setRevision(value => value + 1);
      } else {
        reloadFocusOrigin.current = origin;
        focusAfterReload.current = true;
      }
    } finally {
      if (isCurrentActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  const deleteComment = async (comment: AdminComment, origin: HTMLButtonElement) => {
    if (busyId !== null || currentActor.current !== actor || !window.confirm(t("adminCommentDeleteConfirm"))) return;
    const token = {};
    mutationToken.current = token;
    const isCurrentActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    const generation = queryGeneration.current;
    setBusyId(comment.id);
    setActionError(false);
    try {
      await deleteAdminComment(comment.id);
      if (!isCurrentActor()) return;
      if (queryGeneration.current !== generation) {
        focusAfterReload.current = false;
        setRevision(value => value + 1);
        return;
      }
      reloadFocusOrigin.current = origin;
      focusAfterReload.current = true;
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
    } catch {
      if (!isCurrentActor()) return;
      setActionError("delete");
      if (queryGeneration.current !== generation) {
        focusAfterReload.current = false;
        setRevision(value => value + 1);
      } else {
        reloadFocusOrigin.current = origin;
        focusAfterReload.current = true;
      }
    } finally {
      if (isCurrentActor()) { mutationToken.current = null; setBusyId(null); }
    }
  };

  return <section className={`${styles.section} ${styles.commentsSection}`} aria-label={t("adminComments")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title} ref={headingRef} tabIndex={-1}>{t("adminComments")}</h2>
    {actionError && <p className={styles.error} role="alert">{t(actionError === "delete" ? "adminCommentDeleteError" : "adminCommentModerationError")}</p>}
    <label className={styles.filter}>{t("adminVisibilityFilter")}{" "}
      <select className={styles.control} value={filter} onChange={event => changeFilter(event.target.value as VisibilityFilter)}>
        <option value="all">{t("allVisibilityStates")}</option>
        <option value="visible">{t("visibleOnly")}</option>
        <option value="hidden">{t("hiddenOnly")}</option>
      </select>
    </label>
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => { reloadFocusOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; focusAfterReload.current = true; setRevision(value => value + 1); }} />}
    {data && data.content.length === 0 && <p>{t("noAdminComments")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(comment => {
        return <li className={styles.row} key={comment.id}>
        <div className={styles.commentMain}>
          <strong className={styles.commentIdentity}>{getUserName({ username: comment.username }, t("someone"))}</strong>
          <p className={styles.commentText}>{comment.content}</p>
        </div>
        <div className={styles.commentSide}>
          <div className={styles.commentDate}>
            <span>{t("year")}</span>
            <time dateTime={comment.createdAt}>{formatReviewDate(comment.createdAt, lang)}</time>
          </div>
          <p className={styles.commentStatus}>{comment.isHidden ? t("hiddenComment") : t("visibleComment")}</p>
          <div className={styles.rowActions}>
            <button type="button" aria-busy={busyId === comment.id} disabled={busyId !== null} onClick={event => void toggleHidden(comment, event.currentTarget)}>{busyId === comment.id ? t("loading") : comment.isHidden ? t("unhideComment") : t("hideComment")}</button>
            <button type="button" aria-busy={busyId === comment.id} disabled={busyId !== null} onClick={event => void deleteComment(comment, event.currentTarget)}>{busyId === comment.id ? t("loading") : t("deleteComment")}</button>
          </div>
        </div>
      </li>;
      })}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminCommentsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={nextPage => { focusAfterReload.current = false; reloadFocusOrigin.current = null; setPage(nextPage); }} />
    </>}
  </section>;
}
