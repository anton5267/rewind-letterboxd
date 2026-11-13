import { useState } from "react";
import { getMyCommentReport, reportComment } from "../api/comments.api";
import { getMyListReport, reportList } from "../api/lists.api";
import type { ReviewReportReason } from "../api/reviews.api";
import { useLocale } from "../i18n";
import styles from "./ContentReportAction.module.css";

type Target = { type: "comment" | "list"; id: number };

export default function ContentReportAction({ type, id }: Target) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [reported, setReported] = useState(false);
  const [reason, setReason] = useState<ReviewReportReason>("SPAM");

  const checkStatus = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = type === "comment" ? await getMyCommentReport(id) : await getMyListReport(id);
      setReported(response.data.reported);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (busy || loading || error || reported) return;
    setBusy(true);
    setError(false);
    try {
      if (type === "comment") await reportComment(id, reason);
      else await reportList(id, reason);
      setReported(true);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return <div className={styles.report} data-content-report-type={type}>
    {!open && <button type="button" className={styles.trigger} onClick={() => { setOpen(true); void checkStatus(); }}>{t(type === "comment" ? "reportComment" : "reportList")}</button>}
    {open && <div className={styles.panel} aria-busy={loading || busy}>
      {loading && <p role="status">{t("loading")}</p>}
      {error && <p className={styles.error} role="alert">{t("contentReportError")} <button type="button" onClick={() => void checkStatus()}>{t("retry")}</button></p>}
      {!loading && !error && reported && <p role="status">{t("contentReported")}</p>}
      {!loading && !error && !reported && <>
        <label className={styles.reason}>{t("reportedReason")}
          <select value={reason} onChange={event => setReason(event.target.value as ReviewReportReason)} disabled={busy}>
            <option value="SPAM">{t("reviewReportReason_SPAM")}</option>
            <option value="INAPPROPRIATE_CONTENT">{t("reviewReportReason_INAPPROPRIATE_CONTENT")}</option>
            <option value="BULLYING">{t("reviewReportReason_BULLYING")}</option>
          </select>
        </label>
        <button type="button" disabled={busy} aria-busy={busy} onClick={() => void submit()}>{busy ? t("loading") : t("submitReport")}</button>
      </>}
      <button type="button" className={styles.close} onClick={() => { setOpen(false); setError(false); }}>{t("cancel")}</button>
    </div>}
  </div>;
}
