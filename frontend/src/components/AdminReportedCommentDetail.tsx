import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteAdminComment, dismissAdminCommentReport, getAdminCommentHistory, getAdminReportedComments, setAdminUserActive, updateAdminCommentContent, type AdminReportedComment, type AuditLog } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import RetryNotice from "./RetryNotice";
import { formatDateTime, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminReportedCommentDetail.module.css";

export default function AdminReportedCommentDetail() {
  const [params] = useSearchParams();
  const { lang, path, t } = useLocale();
  const reportId = Number(params.get("reportId"));
  const [report, setReport] = useState<AdminReportedComment | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [complaints, setComplaints] = useState(0);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    (async () => {
      const first = await getAdminReportedComments(0);
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => getAdminReportedComments(index + 1)));
      const reports = [...first.data.content, ...rest.flatMap(page => page.data.content)];
      if (!current) return;
      const selected = reports.find(item => item.reportId === reportId) ?? null;
      setReport(selected);
      setDraft(selected?.content ?? "");
      setComplaints(selected?.reviewId == null ? 0 : reports.filter(item => item.reviewId === selected.reviewId).length);
      setHistory(selected ? (await getAdminCommentHistory(selected.id)).data : []);
    })().catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [reportId, attempt, lang]);

  const perform = async (action: "resolve" | "block" | "delete" | "edit") => {
    if (!report || busy) return;
    if (action === "delete" && !window.confirm(t("adminCommentDeleteConfirm"))) return;
    if (action === "edit" && (!draft.trim() || draft.length > 5000 || draft === report.content)) return;
    setBusy(true);
    setError(false);
    setMessage("");
    try {
      if (action === "resolve") await dismissAdminCommentReport(report.reportId);
      else if (action === "block") await setAdminUserActive(report.userId, false);
      else if (action === "delete") await deleteAdminComment(report.id);
      else {
        await updateAdminCommentContent(report.id, draft);
        setReport(current => current ? { ...current, content: draft } : current);
        setHistory((await getAdminCommentHistory(report.id)).data);
        setEditing(false);
      }
      setMessage(t(action === "resolve" ? "adminReportDismissed" : action === "block" ? "adminReportedUserBlocked" : action === "delete" ? "adminReportedCommentDeleted" : "adminReportedCommentSaved"));
      if (action === "delete" || action === "resolve") setReport(null);
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  return <section className={styles.workspace} aria-label={t("adminReportedCommentTitle")} aria-busy={loading || busy}>
    <h2>{t("adminReportedCommentTitle")}</h2>
    {error && <RetryNotice className={styles.error} message={t("adminReportedCommentLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading || busy} onRetry={() => setAttempt(value => value + 1)} />}
    {message && <p role="status" className={styles.status}>{message}</p>}
    {loading ? <AdminLoading label={t("loading")} layout="detail" /> : report ? <>
      <div className={styles.card}>
        <div className={styles.fields}>
          <Field label={t("adminReportedCommentAuthor")} value={`${getUserName({ username: report.username }, t("someone"))} · ${report.email}`} />
          <Field label={t("adminReportedCommentDate")} value={formatDateTime(report.createdAt, lang)} />
          <Field label={t("reportedReason")} value={t(`reviewReportReason_${report.reportReason}`)} />
          <Field label={t("adminReportedCommentParent")} value={report.relatedTitle ?? (report.reviewId != null ? `${t("moderationReview")} #${report.reviewId}` : report.listId != null ? `${t("adminLists")} #${report.listId}` : "—")} />
          <Field label={t("adminReportedCommentStatus")} value={report.isHidden ? t("hiddenComment") : t("visibleComment")} />
          <Field label={t("adminReportedCommentComplaintCount")} value={String(complaints)} />
        </div>
        <div className={styles.commentBlock}>
          <h3>{t("adminReportedCommentText")}</h3>
          <textarea aria-label={t("adminReportedCommentText")} maxLength={5000} value={draft} readOnly={!editing} disabled={busy} onChange={event => setDraft(event.target.value)} />
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
          <button type="button" className={styles.delete} disabled={busy} onClick={() => void perform("delete")}>{t("adminReportedCommentDelete")}</button>
          <button type="button" className={styles.block} disabled={busy} onClick={() => void perform("block")}>{t("adminReportedCommentBlock")}</button>
          <button type="button" className={styles.resolve} disabled={busy} onClick={() => void perform("resolve")}>{t("adminReportedCommentResolve")}</button>
        </div>
      </div>
      <a className={styles.back} href={`${path("/admin")}?view=moderation`}>{t("adminReportsTable")}</a>
    </> : !error && <p className={styles.empty}>{t("adminReportedCommentMissing")}</p>}
  </section>;
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className={styles.field}><h3>{label}</h3><p>{value}</p></div>;
}
