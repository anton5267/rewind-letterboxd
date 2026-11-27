import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { deleteAdminReview, getAdminReviewHistory, getAdminReviews, setAdminReviewHidden, setAdminUserActive, updateAdminReviewContent, type AdminReview, type AuditLog } from "../api/admin.api";
import AdminLoading from "./AdminLoading";
import RetryNotice from "./RetryNotice";
import { formatDateTime, formatReviewDate, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import styles from "./AdminReviewDetail.module.css";

export default function AdminReviewDetail() {
  const [params] = useSearchParams();
  const { lang, path, t } = useLocale();
  const reviewId = Number(params.get("reviewId"));
  const [review, setReview] = useState<AdminReview | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [receipt, setReceipt] = useState<"blocked" | "deleted" | null>(null);
  const receiptMessage = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    if (!receipt) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    receiptMessage.current?.focus({ preventScroll: true });
  }, [receipt]);

  useEffect(() => {
    let current = true;
    setLoading(true); setError(false);
    (async () => {
      const first = await getAdminReviews(0);
      const rest = await Promise.all(Array.from({ length: Math.max(0, first.data.totalPages - 1) }, (_, index) => getAdminReviews(index + 1)));
      const reviews = [...first.data.content, ...rest.flatMap(page => page.data.content)];
      if (!current) return;
      const selected = reviews.find(item => item.id === reviewId) ?? null;
      setReview(selected); setDraft(selected?.content ?? "");
      setHistory(selected ? (await getAdminReviewHistory(selected.id)).data : []);
    })().catch(() => { if (current) setError(true); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [reviewId, attempt, lang]);

  const act = async (action: "edit" | "status" | "block" | "delete") => {
    if (!review || busy) return;
    if (action === "delete" && !window.confirm(t("adminReviewDeleteConfirm"))) return;
    if (action === "edit" && (!draft.trim() || draft.length > 5000 || draft === review.content)) return;
    setBusy(true); setError(false);
    try {
      if (action === "edit") {
        const updated = await updateAdminReviewContent(review.id, draft);
        setReview(current => current ? { ...current, ...updated.data } : current);
        setHistory((await getAdminReviewHistory(review.id)).data);
        setEditing(false);
      } else if (action === "status") {
        const updated = await setAdminReviewHidden(review.id, !review.isHidden, review.isHidden ? "" : t("moderationDefaultReason"));
        setReview(current => current ? { ...current, isHidden: updated.data.isHidden, moderatedAt: updated.data.moderatedAt, moderatedReason: updated.data.moderatedReason } : current);
        setHistory((await getAdminReviewHistory(review.id)).data);
      } else if (action === "block") {
        await setAdminUserActive(review.userId, false);
        setReceipt("blocked");
      } else {
        await deleteAdminReview(review.id);
        setReceipt("deleted");
      }
    } catch { setError(true); }
    finally { setBusy(false); }
  };

  if (receipt) return <section className={`${styles.workspace} ${styles.receiptWorkspace}`} aria-label={t("adminReviewDetailTitle")}>
    <p ref={receiptMessage} className={styles.success} role="status" tabIndex={-1}>{t(receipt === "blocked" ? "adminReviewBlockedReceipt" : "adminReviewDeletedSuccess")}</p>
    <Link className={styles.back} to={`${path("/admin")}?view=reviews`}>{t("adminBackToPage")}</Link>
  </section>;

  return <section className={styles.workspace} aria-label={t("adminReviewDetailTitle")} aria-busy={loading || busy}>
    <h2>{t("adminReviewDetailTitle")}</h2>
    {error && <RetryNotice className={styles.error} message={t("adminReportedCommentLoadError")} retryLabel={t("retry")} busy={loading} disabled={loading || busy} onRetry={() => setAttempt(value => value + 1)} />}
    {loading ? <AdminLoading label={t("loading")} layout="detail" /> : review ? <div className={styles.card}>
      <div className={styles.fields}>
        <Field label={t("adminReviewAuthorLabel")} value={getUserName({ username: review.username }, t("someone"))} />
        <Field label={t("adminReviewYearLabel")} value={formatReviewDate(review.createdAt, lang)} />
        <Field label={t("adminReviewRatingLabel")} value={review.rating == null ? "—" : review.rating.toFixed(1)} rating={review.rating !== null} />
        <Field label={t("adminReviewFilmLabel")} value={review.movieTitle} />
        <div className={styles.field}>
          <h3>{t("adminReviewStatusLabel")}</h3>
          <div className={styles.statusControl}>
            <span>{review.isHidden ? t("hiddenReview") : t("adminReviewPublished")}</span>
            <button type="button" disabled={busy} onClick={() => void act("status")}>{t("adminReviewChangeStatus")}</button>
          </div>
        </div>
      </div>
      <div className={styles.reviewText}>
        <h3>{t("adminReviewTextLabel")}</h3>
        <textarea aria-label={t("adminReviewTextLabel")} maxLength={5000} value={draft} readOnly={!editing} disabled={busy} onChange={event => setDraft(event.target.value)} />
        <div className={styles.textActions}>
          <button type="button" disabled={busy || (editing && (!draft.trim() || draft === review.content))} onClick={() => editing ? void act("edit") : setEditing(true)}>{editing ? t("adminReportedCommentSaveText") : t("adminReviewChangeText")}</button>
          {editing && <button type="button" disabled={busy} onClick={() => { setDraft(review.content); setEditing(false); }}>{t("cancel")}</button>}
        </div>
      </div>
      <div className={styles.history}>
        <h3>{t("adminReviewHistoryLabel")}</h3>
        {history.length ? <ul>{history.map(item => <li key={item.id}>{item.action.replaceAll("_", " ")} · {formatDateTime(item.createdAt, lang)}</li>)}</ul> : <p>{t("adminReviewNoHistoryLabel")}</p>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.delete} disabled={busy} onClick={() => void act("delete")}>{t("adminReviewDeleteAction")}</button>
        <button type="button" className={styles.block} disabled={busy} onClick={() => void act("block")}>{t("adminReviewBlockAction")}</button>
      </div>
    </div> : !error && <p className={styles.empty}>{t("adminReportedCommentMissing")}</p>}
  </section>;
}

function Field({ label, value, rating = false }: { label: string; value: string; rating?: boolean }) {
  return <div className={styles.field}><h3>{label}</h3><p>{rating && <img className={styles.ratingStar} src="/images/admin-review-star.svg" alt="" />}{value}</p></div>;
}
