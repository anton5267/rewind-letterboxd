import { useEffect, useState } from "react";
import { getAdminReviews, setAdminReviewHidden, type AdminReview, type Page } from "../api/admin.api";
import { useLocale } from "../i18n";

type VisibilityFilter = "all" | "visible" | "hidden";

const hiddenValue = (filter: VisibilityFilter) => filter === "all" ? undefined : filter === "hidden";

export default function AdminReviews() {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminReview> | null>(null);
  const [filter, setFilter] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminReviews(page, hiddenValue(filter))
      .then(({ data: response }) => { if (current) setData(response); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [filter, page, revision]);

  const changeFilter = (next: VisibilityFilter) => {
    setFilter(next);
    setPage(0);
  };

  const toggleHidden = async (review: AdminReview) => {
    if (busyId !== null) return;
    setBusyId(review.id);
    try {
      const { data: updated } = await setAdminReviewHidden(review.id, !review.isHidden, review.isHidden ? "" : "Moderated by administrator");
      const leavesFilter = filter !== "all" && updated.isHidden !== hiddenValue(filter);
      if (leavesFilter) {
        if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
        else setRevision(value => value + 1);
      } else {
        setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      }
      setError(false);
    } catch {
      setError(true);
    } finally {
      setBusyId(null);
    }
  };

  return <section aria-label={t("adminReviews")} aria-busy={loading}>
    <h2>{t("adminReviews")}</h2>
    <label>{t("adminVisibilityFilter")}{" "}
      <select value={filter} onChange={event => changeFilter(event.target.value as VisibilityFilter)}>
        <option value="all">{t("allVisibilityStates")}</option>
        <option value="visible">{t("visibleOnly")}</option>
        <option value="hidden">{t("hiddenOnly")}</option>
      </select>
    </label>
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminReviews")}</p>}
    {data && <>
      <ul>{data.content.map(review => <li key={review.id} style={{ marginBottom: 8 }}>
        {review.movieTitle} · {review.username}: {review.content} · {review.isHidden ? t("hiddenReview") : t("visibleReview")}{" "}
        <button type="button" disabled={busyId !== null} onClick={() => void toggleHidden(review)}>{review.isHidden ? t("unhideReview") : t("hideReview")}</button>
      </li>)}</ul>
      <nav aria-label={t("adminReviewsPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
