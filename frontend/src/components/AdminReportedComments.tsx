import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminReportedComments, type AdminReportedComment } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { useLocale } from "../i18n";
import styles from "./AdminReportedComments.module.css";

export default function AdminReportedComments() {
  const { lang, path, t } = useLocale();
  const [reports, setReports] = useState<AdminReportedComment[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true); setError(false);
    (async () => {
      const first = await getAdminReportedComments(0);
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => getAdminReportedComments(index + 1)));
      const all = [...first.data.content, ...rest.flatMap(result => result.data.content)];
      if (current) setReports(all);
    })().catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [attempt, lang]);

  const uniqueComments = useMemo(() => {
    const seen = new Set<number>();
    return reports.filter(report => {
      if (seen.has(report.id)) return false;
      seen.add(report.id);
      return true;
    });
  }, [reports]);
  const pageSize = 3;
  const totalPages = Math.ceil(uniqueComments.length / pageSize);
  const visible = uniqueComments.slice(page * pageSize, (page + 1) * pageSize);

  return <section className={styles.section} aria-label={t("adminReportedCommentsTitle")} aria-busy={loading}>
    <h2 className={styles.heading}>{t("adminReportedCommentsTitle")}</h2>
    <div className={styles.cards}>
      {error && <RetryNotice className={styles.error} message={t("adminReportedCommentLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading} onRetry={() => setAttempt(value => value + 1)} />}
      {loading ? <AdminLoading label={t("loading")} layout="comments" /> : visible.map(report => <article className={styles.card} key={report.id}>
        <div className={styles.comment}>
          <h3>{report.relatedTitle ?? (report.reviewId != null ? `${t("moderationReview")} #${report.reviewId}` : report.listId != null ? `${t("adminLists")} #${report.listId}` : t("adminReportedCommentTitle"))}</h3>
          <p className={styles.author}>{report.username}</p>
          <p className={styles.content}>{report.content}</p>
        </div>
        <Metric label={t("year")} value={new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(report.reportCreatedAt))} className={styles.date} />
        <Metric label={t("adminReportedCommentsLikes")} value={String(report.parentLikesCount)} className={styles.likes} />
        <Metric label={t("adminReportedCommentsReplies")} value={String(report.parentRepliesCount)} className={styles.replies} />
        <div className={styles.reason}>
          <Metric label={t("reportedReason")} value={t(`reviewReportReason_${report.reportReason}`)} />
        </div>
        <Link className={styles.edit} to={`${path("/admin")}?view=reported-comment&reportId=${report.reportId}`}>{t("adminReportedCommentsEdit")}</Link>
      </article>)}
      {!loading && !error && visible.length === 0 && <p className={styles.empty}>{t("adminReportedCommentsEmpty")}</p>}
    </div>
    <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("adminReportsPagination")} onPageChange={setPage} />
  </section>;
}

function Metric({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return <div className={`${styles.metric} ${className}`}><h4>{label}</h4><p>{value}</p></div>;
}
