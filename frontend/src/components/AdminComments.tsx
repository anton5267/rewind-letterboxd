import { useEffect, useState } from "react";
import { getAdminComments, setAdminCommentHidden, type AdminComment } from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminShared.module.css";

type VisibilityFilter = "all" | "visible" | "hidden";

const hiddenValue = (filter: VisibilityFilter) => filter === "all" ? undefined : filter === "hidden";

export default function AdminComments() {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminComment> | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

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
  }, [filter, page, revision]);

  const changeFilter = (next: VisibilityFilter) => {
    setFilter(next);
    setPage(0);
  };

  const toggleHidden = async (comment: AdminComment) => {
    if (busyId !== null) return;
    setBusyId(comment.id);
    setActionError("");
    try {
      const { data: updated } = await setAdminCommentHidden(comment.id, !comment.isHidden, comment.isHidden ? "" : t("moderationDefaultReason"));
      const leavesFilter = filter !== "all" && updated.isHidden !== hiddenValue(filter);
      if (leavesFilter) {
        if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
        else setRevision(value => value + 1);
      } else {
        setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      }
    } catch {
      setActionError(t("adminCommentModerationError"));
    } finally {
      setBusyId(null);
    }
  };

  return <section className={`${styles.section} ${styles.commentsSection}`} aria-label={t("adminComments")} aria-busy={loading || busyId !== null}>
    <h2 className={styles.title}>{t("adminComments")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <label className={styles.filter}>{t("adminVisibilityFilter")}{" "}
      <select className={styles.control} value={filter} onChange={event => changeFilter(event.target.value as VisibilityFilter)}>
        <option value="all">{t("allVisibilityStates")}</option>
        <option value="visible">{t("visibleOnly")}</option>
        <option value="hidden">{t("hiddenOnly")}</option>
      </select>
    </label>
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminComments")}</p>}
    {data && <>
      <ul className={styles.list}>{data.content.map(comment => <li className={styles.row} key={comment.id}>
        <div className={styles.commentMain}>
          <strong className={styles.commentIdentity}>{getUserName({ username: comment.username }, t("someone"))}</strong>
          <p className={styles.commentText}>{comment.content}</p>
        </div>
        <div className={styles.commentSide}>
          <p className={styles.commentStatus}>{comment.isHidden ? t("hiddenComment") : t("visibleComment")}</p>
          <div className={styles.rowActions}>
            <button type="button" aria-busy={busyId === comment.id} disabled={busyId !== null} onClick={() => void toggleHidden(comment)}>{busyId === comment.id ? t("loading") : comment.isHidden ? t("unhideComment") : t("hideComment")}</button>
          </div>
        </div>
      </li>)}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminCommentsPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
