import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteAdminReview, dismissAdminReviewReport, getAdminReportedReviews, getAdminReviewHistory, setAdminReviewHidden, setAdminUserActive, updateAdminReviewContent, type AdminReportedReview, type AuditLog } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import RetryNotice from "./RetryNotice";
import { formatDateTime, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminReportedCommentDetail.module.css";

export default function AdminReportedReviewDetail() {
  const [params] = useSearchParams();
  const { lang, path, t } = useLocale();
  const reportId = Number(params.get("reportId"));
  const [report, setReport] = useState<AdminReportedReview | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [complaints, setComplaints] = useState(0);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [receipt, setReceipt] = useState<"resolved" | "blocked" | "deleted" | null>(null);
  const receiptMessage = useRef<HTMLParagraphElement>(null);
  const [attempt, setAttempt] = useState(0);

  useLayoutEffect(() => {
    if (!receipt) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    receiptMessage.current?.focus({ preventScroll: true });
  }, [receipt]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    (async () => {
      const first = await getAdminReportedReviews(0);
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => getAdminReportedReviews(index + 1)));
      const reports = [...first.data.content, ...rest.flatMap(page => page.data.content)];
      if (!current) return;
      const selected = reports.find(item => item.reportId === reportId) ?? null;
      setReport(selected);
      setDraft(selected?.content ?? "");
      setComplaints(selected ? reports.filter(item => item.id === selected.id).length : 0);
      setHistory(selected ? (await getAdminReviewHistory(selected.id)).data : []);
    })().catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [reportId, attempt, lang]);

  const perform = async (action: "resolve" | "block" | "delete" | "edit" | "status") => {
    if (!report || busy) return;
    if (action === "delete" && !window.confirm(t("adminReviewDeleteConfirm"))) return;
    if (action === "edit" && (!draft.trim() || draft.length > 5000 || draft === report.content)) return;
    setBusy(true); setError(false); setMessage("");
    try {
      if (action === "resolve") await dismissAdminReviewReport(report.reportId);
      else if (action === "block") await setAdminUserActive(report.userId, false);
      else if (action === "delete") await deleteAdminReview(report.id);
      else if (action === "status") {
        const updated = await setAdminReviewHidden(report.id, !report.isHidden, report.isHidden ? "" : t("moderationDefaultReason"));
        setReport(current => current ? { ...current, isHidden: updated.data.isHidden, moderatedAt: updated.data.moderatedAt, moderatedReason: updated.data.moderatedReason } : current);
      } else {
        await updateAdminReviewContent(report.id, draft);
        setReport(current => current ? { ...current, content: draft } : current);
        setHistory((await getAdminReviewHistory(report.id)).data);
        setEditing(false);
      }
      setMessage(t(action === "resolve" ? "adminReportDismissed" : action === "block" ? "adminReportedReviewUserBlocked" : action === "delete" ? "adminReportedReviewDeleted" : action === "status" ? "adminReportedReviewStatusSaved" : "adminReportedCommentSaved"));
      if (action === "delete" || action === "resolve" || action === "block") setReceipt(action === "delete" ? "deleted" : action === "resolve" ? "resolved" : "blocked");
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  return <section className={`${styles.workspace} ${receipt ? styles.receiptWorkspace : ""}`} aria-label={t("adminReportedReviewTitle")} aria-busy={loading || busy}>
    {receipt && <div className={styles.successState}>
      <p ref={receiptMessage} role="status" tabIndex={-1} className={styles.successMessage}>{t(receipt === "resolved" ? "adminReportedReviewResolvedReceipt" : receipt === "blocked" ? "adminReportedReviewBlockedReceipt" : "adminReportedReviewDeletedReceipt")}</p>
      <a className={styles.successBack} href={`${path("/admin")}?view=reported-reviews`}>{t("adminBackToPage")}</a>
    </div>}
    {!receipt && <>
    <h2>{t("adminReportedReviewTitle")}</h2>
    {error && <RetryNotice className={styles.error} message={t("adminReportedCommentLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading || busy} onRetry={() => setAttempt(value => value + 1)} />}
    {message && <p role="status" className={styles.status}>{message}</p>}
    {loading ? <AdminLoading label={t("loading")} layout="detail" /> : report ? <>
      <div className={`${styles.card} ${styles.reviewCard}`}>
        <div className={styles.fields}>
          <Field label={t("adminReportedReviewAuthor")} value={getUserName({ username: report.username }, t("someone"))} />
          <Field label={t("adminReportedReviewYear")} value={formatDateTime(report.createdAt, lang)} />
          <Field label={t("adminReportedReviewRating")} value={report.rating == null ? "—" : `★ ${report.rating.toFixed(1)}`} />
          <Field label={t("adminReportedReviewFilm")} value={report.movieTitle} />
          <Field label={t("adminReportedCommentStatus")} value={report.isHidden ? t("hiddenComment") : t("visibleComment")} action={<button className={styles.statusAction} type="button" disabled={busy} onClick={() => void perform("status")}>{t("adminReportedReviewChangeStatus")}</button>} />
          <Field label={t("reportedReason")} value={t(`reviewReportReason_${report.reportReason}`)} />
          <Field label={t("adminReportedReviewComplaints")} value={String(complaints)} />
        </div>
        <div className={styles.commentBlock}>
          <h3>{t("adminReportedReviewText")}</h3>
          <textarea aria-label={t("adminReportedReviewText")} maxLength={5000} value={draft} readOnly={!editing} disabled={busy} onChange={event => setDraft(event.target.value)} />
          <div className={styles.textActions}>
            <button type="button" disabled={busy || (editing && (!draft.trim() || draft === report.content))} onClick={() => editing ? void perform("edit") : setEditing(true)}>{editing ? t("adminReportedCommentSaveText") : t("adminReportedCommentChangeText")}</button>
            {editing && <button type="button" disabled={busy} onClick={() => { setDraft(report.content); setEditing(false); }}>{t("cancel")}</button>}
          </div>
        </div>
        <div className={styles.history}>
          <h3>{t("adminReportedCommentHistory")}</h3>
          {history.length ? <ul>{history.map(item => <li key={item.id}>{item.action.replaceAll("_", " ")} · {formatDateTime(item.createdAt, lang)}</li>)}</ul> : report.moderatedAt ? <p>{report.moderatedReason ?? t("moderationDefaultReason")} · {formatDateTime(report.moderatedAt, lang)}</p> : <p>{t("adminReportedCommentNoHistory")}</p>}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.delete} disabled={busy} onClick={() => void perform("delete")}>{t("adminReportedReviewDelete")}</button>
          <button type="button" className={styles.block} disabled={busy} onClick={() => void perform("block")}>{t("adminReportedReviewBlock")}</button>
          <button type="button" className={styles.resolve} disabled={busy} onClick={() => void perform("resolve")}>{t("adminReportedReviewResolve")}</button>
        </div>
      </div>
      <a className={styles.back} href={`${path("/admin")}?view=moderation`}>{t("adminReportsTable")}</a>
    </> : !error && <p className={styles.empty}>{t("adminReportedCommentMissing")}</p>}
    </>}
  </section>;
}

function Field({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return <div className={styles.field}><h3>{label}</h3><div className={styles.fieldValue}><p>{value}</p>{action}</div></div>;
}
