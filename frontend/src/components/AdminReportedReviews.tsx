import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminReportedReviews, type AdminReportedReview } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { useLocale } from "../i18n";
import styles from "./AdminReportedReviews.module.css";

export default function AdminReportedReviews() {
  const { lang, path, t } = useLocale();
  const [reports, setReports] = useState<AdminReportedReview[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true); setError(false);
    (async () => {
      const first = await getAdminReportedReviews(0);
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => getAdminReportedReviews(index + 1)));
      const all = [...first.data.content, ...rest.flatMap(result => result.data.content)];
      if (current) setReports(all);
    })().catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt, lang]);

  const uniqueReviews = useMemo(() => {
    const seen = new Set<number>();
    return reports.filter(report => {
      if (seen.has(report.id)) return false;
      seen.add(report.id);
      return true;
    });
  }, [reports]);
  const pageSize = 3;
  const totalPages = Math.ceil(uniqueReviews.length / pageSize);
  const visible = uniqueReviews.slice(page * pageSize, (page + 1) * pageSize);

  return <section className={styles.section} aria-label={t("adminReportedReviewsTitle")} aria-busy={loading}>
    <h2 className={styles.heading}>{t("adminReportedReviewsTitle")}</h2>
    <div className={styles.cards}>
      {error && <RetryNotice className={styles.error} message={t("adminReportedCommentLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading} onRetry={() => setAttempt(value => value + 1)} />}
      {loading ? <AdminLoading label={t("loading")} layout="lists" /> : visible.map(report => <article className={styles.card} key={report.id}>
        <div className={styles.review}>
          <h3>{report.movieTitle}</h3>
          <p className={styles.author}>{report.username}</p>
          <p className={styles.content}>{report.content}</p>
        </div>
        <Metric label={t("adminReportedReviewRating")} value={report.rating == null ? "—" : `★ ${report.rating.toFixed(1)}`} />
        <Metric label={t("adminReportedReviewYear")} value={new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(report.createdAt))} />
        <div className={styles.reportMeta}>
          <Metric label={t("reportedReason")} value={t(`reviewReportReason_${report.reportReason}`)} />
          <Metric label={t("adminReportedReviewLikes")} value={String(report.likesCount)} />
          <Metric label={t("adminReportedReviewComments")} value={String(report.commentsCount)} />
          <Link className={styles.edit} to={`${path("/admin")}?view=reported-review&reportId=${report.reportId}`}>{t("adminReportedReviewEdit")}</Link>
        </div>
      </article>)}
      {!loading && !error && visible.length === 0 && <p className={styles.empty}>{t("adminReportedReviewsEmpty")}</p>}
    </div>
    <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("adminReportsPagination")} onPageChange={setPage} />
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className={styles.metric}><h4>{label}</h4><p>{value}</p></div>;
}
