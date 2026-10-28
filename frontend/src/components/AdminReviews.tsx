import AdminLoading from "./AdminLoading";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { deleteAdminReview, getAdminReviews, setAdminReviewHidden, type AdminReview } from "../api/admin.api";
import type { Page } from "../api/types";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, formatReviewDate, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";
import dialogStyles from "./AdminConfirmDialog.module.css";

type VisibilityFilter = "all" | "visible" | "hidden";

const hiddenValue = (filter: VisibilityFilter) => filter === "all" ? undefined : filter === "hidden";
export default function AdminReviews() {
  const { t, lang } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminReview> | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<"moderate" | "delete" | false>(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ review: AdminReview; trigger: HTMLButtonElement } | null>(null);
  const [receipt, setReceipt] = useState<"deleted" | "hidden" | null>(null);
  const receiptMessage = useRef<HTMLParagraphElement>(null);
  const receiptOrigin = useRef<HTMLElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteDialogCancel = useRef<HTMLButtonElement>(null);
  const focusAfterReload = useRef(false);
  const reloadFocusOrigin = useRef<HTMLElement | null>(null);
  const queryGeneration = useRef(0);
  const mounted = useRef(true);
  const actor = `${user?.id ?? ""}:${user?.role ?? ""}`;
  const currentActor = useRef(actor);
  const mutationToken = useRef<object | null>(null);

  useEffect(() => { setReceipt(null); }, [filter, lang, actor]);
  useEffect(() => {
    if (!receipt) return;
    const active = document.activeElement;
    if (active === document.body || active === receiptOrigin.current) receiptMessage.current?.focus();
  }, [receipt]);

  useLayoutEffect(() => {
    queryGeneration.current += 1;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
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
    if (!pendingDelete || !deleteDialog.current) return;
    if (!deleteDialog.current.open) deleteDialog.current.showModal();
    deleteDialogCancel.current?.focus();
  }, [pendingDelete]);

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
    getAdminReviews(page, hiddenValue(filter))
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

  const toggleHidden = async (review: AdminReview, origin: HTMLButtonElement) => {
    if (busyId !== null || currentActor.current !== actor) return;
    const token = {};
    mutationToken.current = token;
    const isCurrentActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    const generation = queryGeneration.current;
    setBusyId(review.id);
    setActionError(false);
    try {
      const { data: updated } = await setAdminReviewHidden(review.id, !review.isHidden, review.isHidden ? "" : t("moderationDefaultReason"));
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
      if (updated.isHidden) {
        focusAfterReload.current = false;
        receiptOrigin.current = origin;
        setReceipt("hidden");
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

  const deleteReview = async (review: AdminReview, origin: HTMLButtonElement) => {
    if (busyId !== null || currentActor.current !== actor) return;
    const token = {};
    mutationToken.current = token;
    const isCurrentActor = () => mounted.current && currentActor.current === actor && mutationToken.current === token;
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    const generation = queryGeneration.current;
    setBusyId(review.id);
    setActionError(false);
    try {
      await deleteAdminReview(review.id);
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
      focusAfterReload.current = false;
      receiptOrigin.current = origin;
      setReceipt("deleted");
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

  const requestDelete = (review: AdminReview, trigger: HTMLButtonElement) => {
    if (busyId !== null || currentActor.current !== actor) return;
    focusAfterReload.current = false;
    reloadFocusOrigin.current = null;
    setPendingDelete({ review, trigger });
  };

  const cancelDelete = () => {
    if (deleteDialog.current?.open) deleteDialog.current.close();
    const trigger = pendingDelete?.trigger;
    setPendingDelete(null);
    window.requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
  };

  const confirmDelete = () => {
    if (!pendingDelete || busyId !== null) return;
    const { review, trigger } = pendingDelete;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    void deleteReview(review, trigger);
  };

  if (receipt) return <section className={`${styles.section} ${styles.actionReceipt}`} aria-label={t("adminReviews")}>
    <p ref={receiptMessage} className={styles.receiptMessage} tabIndex={-1} role="status">{t(receipt === "deleted" ? "adminReviewDeletedSuccess" : "adminReviewHiddenSuccess")}</p>
    <button type="button" onClick={() => {
      setReceipt(null);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    }}>{t("adminReturnToReviews")}</button>
  </section>;

  return <section className={`${styles.section} ${styles.reviewsSection}`} aria-label={t("adminReviews")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title} ref={headingRef} tabIndex={-1}>{t("adminReviewsTitle")}</h2>
    {actionError && <p className={styles.error} role="alert">{t(actionError === "delete" ? "adminReviewDeleteError" : "adminReviewModerationError")}</p>}
    <label className={styles.filter}>{t("adminVisibilityFilter")}{" "}
      <select className={styles.control} value={filter} onChange={event => changeFilter(event.target.value as VisibilityFilter)}>
        <option value="all">{t("allVisibilityStates")}</option>
        <option value="visible">{t("visibleOnly")}</option>
        <option value="hidden">{t("hiddenOnly")}</option>
      </select>
    </label>
    {loading && <AdminLoading label={t("loading")} layout="reviews" />}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => { reloadFocusOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; focusAfterReload.current = true; setRevision(value => value + 1); }} />}
    {data && data.content.length === 0 && <p>{t("noAdminReviews")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(review => {
        const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
        return <li className={styles.row} key={review.id}>
          <div className={styles.reviewMain}>
            <div className={styles.reviewIdentity}>
              <strong>{movieTitle}</strong>
              <span>{getUserName({ username: review.username }, t("someone"))}</span>
            </div>
            <p className={styles.reviewText}>{review.content}</p>
          </div>
          <div className={styles.reviewSide}>
            <div className={styles.reviewRating}>
              <span>{t("rating")}</span>
              <strong>{review.rating !== null && <img src="/images/admin-review-star.svg" alt="" />} {review.rating ?? "—"}</strong>
            </div>
            <div className={styles.reviewDate}>
              <span>{t("year")}</span>
              <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt, lang)}</time>
            </div>
            <p className={styles.reviewStatus}>{review.isHidden ? t("hiddenReview") : t("visibleReview")}</p>
            <div className={styles.rowActions}>
              <button type="button" aria-busy={busyId === review.id} disabled={busyId !== null} onClick={event => void toggleHidden(review, event.currentTarget)}>{busyId === review.id ? t("loading") : review.isHidden ? t("unhideReview") : t("hideReview")}</button>
              <button type="button" aria-busy={busyId === review.id} disabled={busyId !== null} onClick={event => requestDelete(review, event.currentTarget)}>{busyId === review.id ? t("loading") : t("deleteReview")}</button>
            </div>
          </div>
      </li>;
      })}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminReviewsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={nextPage => { focusAfterReload.current = false; reloadFocusOrigin.current = null; setPage(nextPage); }} />
    </>}
    <dialog className={dialogStyles.deleteDialog} ref={deleteDialog} role="alertdialog" aria-labelledby="admin-review-delete-title" aria-describedby="admin-review-delete-description" onCancel={event => { event.preventDefault(); cancelDelete(); }}>
      <h3 id="admin-review-delete-title">{t("deleteReview")}</h3>
      {pendingDelete && <p id="admin-review-delete-description">{t("adminReviewDeleteConfirm")} <strong>{editorialText(pendingDelete.review.movieTitle, t("untitledFilm"))} · {getUserName({ username: pendingDelete.review.username }, t("someone"))}</strong></p>}
      <div className={dialogStyles.deleteDialogActions}>
        <button type="button" ref={deleteDialogCancel} disabled={busyId !== null} onClick={cancelDelete}>{t("cancel")}</button>
        <button type="button" className={dialogStyles.deleteDialogConfirm} disabled={busyId !== null} aria-busy={busyId === pendingDelete?.review.id} onClick={confirmDelete}>{busyId === pendingDelete?.review.id ? t("loading") : t("deleteReview")}</button>
      </div>
    </dialog>
  </section>;
}
