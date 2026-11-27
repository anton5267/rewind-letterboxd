import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  dismissAdminCommentReport, dismissAdminListReport, dismissAdminReviewReport,
  getAdminReportedComments, getAdminReportedLists, getAdminReportedReviews,
  type AdminReportedComment, type AdminReportedList, type AdminReportedReview,
} from "../api/admin.api";
import type { Page } from "../api/types";
import { useLocale } from "../i18n";
import AdminLoading from "./AdminLoading";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import shared from "./AdminShared.module.css";
import styles from "./AdminModerationReports.module.css";

type ReportRow = {
  key: string;
  reportId: number;
  contentId: number;
  userId: number;
  username: string;
  email: string;
  contentType: "review" | "comment" | "list";
  subject: string;
  contentPath: string;
  reason: AdminReportedReview["reportReason"];
  reportedAt: string;
};

type Loader<T> = (page: number) => Promise<{ data: Page<T> }>;

async function getAllPages<T>(load: Loader<T>): Promise<T[]> {
  const first = await load(0);
  const pages = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => load(index + 1)));
  return [...first.data.content, ...pages.flatMap(result => result.data.content)];
}

function mapReview(report: AdminReportedReview): ReportRow {
  return { key: `review:${report.reportId}`, reportId: report.reportId, contentId: report.id, userId: report.userId, username: report.username, email: report.email, contentType: "review", subject: report.movieTitle, contentPath: `/reviews/${report.id}`, reason: report.reportReason, reportedAt: report.reportCreatedAt };
}

function mapComment(report: AdminReportedComment): ReportRow {
  const parentPath = report.reviewId !== null ? `/reviews/${report.reviewId}` : report.listId != null ? `/lists/public/${report.listId}` : `/users/${report.username}`;
  return { key: `comment:${report.reportId}`, reportId: report.reportId, contentId: report.id, userId: report.userId, username: report.username, email: report.email, contentType: "comment", subject: report.content, contentPath: parentPath, reason: report.reportReason, reportedAt: report.reportCreatedAt };
}

function mapList(report: AdminReportedList): ReportRow {
  return { key: `list:${report.reportId}`, reportId: report.reportId, contentId: report.id, userId: report.userId, username: report.username, email: report.email, contentType: "list", subject: report.name, contentPath: `/lists/public/${report.id}`, reason: report.reportReason, reportedAt: report.reportCreatedAt };
}

export default function AdminModerationReports({ className = "" }: { className?: string }) {
  const { t, lang, path } = useLocale();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setDismissed(false);
    Promise.all([
      getAllPages(getAdminReportedReviews),
      getAllPages(getAdminReportedComments),
      getAllPages(getAdminReportedLists),
    ]).then(([reviews, comments, lists]) => {
      if (!current) return;
      setRows([...reviews.map(mapReview), ...comments.map(mapComment), ...lists.map(mapList)]
        .sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt)));
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [revision, lang]);

  const filtered = useMemo(() => {
    const value = search.trim().toLocaleLowerCase(lang);
    if (!value) return rows;
    return rows.filter(row => [row.username, row.email, row.subject, row.contentType, row.reason].some(field => field.toLocaleLowerCase(lang).includes(value)));
  }, [rows, search, lang]);
  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const visibleRows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const dismiss = async (row: ReportRow) => {
    if (busyKey) return;
    setBusyKey(row.key);
    setError(false);
    try {
      if (row.contentType === "review") await dismissAdminReviewReport(row.reportId);
      else if (row.contentType === "comment") await dismissAdminCommentReport(row.reportId);
      else await dismissAdminListReport(row.reportId);
      setDismissed(true);
      setRevision(value => value + 1);
    } catch {
      setError(true);
    } finally {
      setBusyKey(null);
    }
  };

  const reasonLabel = (reason: ReportRow["reason"]) => t(`reviewReportReason_${reason}`);
  const contentTypeLabel = (type: ReportRow["contentType"]) => t(type === "review" ? "moderationReview" : type === "comment" ? "moderationComment" : "adminLists");

  return <section className={`${shared.section} ${styles.section} ${className}`} aria-label={t("moderationQueueTitle")} aria-busy={loading || busyKey !== null}>
    <h2 className={styles.heading}>{t("moderationQueueTitle")}</h2>
    <form className={styles.toolbar} onSubmit={event => { event.preventDefault(); setPage(0); }}>
      <label className={styles.searchLabel}>
        <span className={styles.srOnly}>{t("adminReportSearch")}</span>
        <input className={shared.control} type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} placeholder={t("adminReportSearch")} />
      </label>
    </form>
    <Link className={styles.logsLink} to={`${path("/admin")}?view=moderator-logs`}>{t("moderatorLogs")}</Link>
    <Link className={styles.moreUsers} to={`${path("/admin")}?view=users`}>{t("adminMoreUsers")}</Link>
    {error && <RetryNotice className={shared.error} message={t("adminLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading || busyKey !== null} onRetry={() => setRevision(value => value + 1)} />}
    {dismissed && <p className={styles.status} role="status">{t("adminReportDismissed")}</p>}
    {loading ? <AdminLoading label={t("loading")} layout="logs" /> : !error && <>
      {visibleRows.length === 0 ? <p className={styles.empty}>{t("noAdminReports")}</p> : <div className={styles.tableRail}>
        <table className={styles.table}>
          <caption className={styles.srOnly}>{t("adminReportsTable")}</caption>
          <thead><tr>
            <th scope="col">{t("name")}</th>
            <th scope="col">{t("email")}</th>
            <th scope="col">{t("adminReportContentType")}</th>
            <th scope="col">{t("reportedReason")}</th>
            <th scope="col"><span className={styles.srOnly}>{t("adminReportActions")}</span></th>
          </tr></thead>
          <tbody>{visibleRows.map(row => <tr key={row.key}>
            <td><span className={styles.cellLabel}>{t("name")}</span><span title={`#${row.userId}`}>{row.username}</span></td>
            <td><span className={styles.cellLabel}>{t("email")}</span>{row.email}</td>
            <td><span className={styles.cellLabel}>{t("adminReportContentType")}</span>{contentTypeLabel(row.contentType)}<span className={styles.subject}>{row.subject}</span></td>
            <td><span className={styles.cellLabel}>{t("reportedReason")}</span>{reasonLabel(row.reason)}</td>
            <td><span className={styles.cellLabel}>{t("adminReportActions")}</span><div className={styles.actions}>
              <Link to={row.contentType === "comment" ? `${path("/admin")}?view=reported-comment&reportId=${row.reportId}` : row.contentType === "review" ? `${path("/admin")}?view=reported-review&reportId=${row.reportId}` : path(row.contentPath)} aria-label={`${t("adminOpenReportedContent")} ${contentTypeLabel(row.contentType)}: ${row.subject}`}>{t("adminOpenReportedContent")}</Link>
              <button type="button" disabled={busyKey !== null} aria-busy={busyKey === row.key} onClick={() => void dismiss(row)}>{busyKey === row.key ? t("loading") : t("dismissReport")}</button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
      <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("adminReportsPagination")} busy={loading || busyKey !== null} statusSuffix={filtered.length} onPageChange={setPage} />
    </>}
    <Link className={styles.queueLink} to={`${path("/admin")}?view=queue`}>{t("moderationQueue")}</Link>
  </section>;
}
