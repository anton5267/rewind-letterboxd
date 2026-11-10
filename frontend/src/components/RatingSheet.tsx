import { useEffect, useRef, useState } from "react";
import { getUserRating, setRating as setMovieRating } from "../api/ratings.api";
import { getMyReviewReport, reportReview, type ReviewReportReason } from "../api/reviews.api";
import RetryButton from "./RetryButton";
import { useLocale } from "../i18n";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import styles from "./RatingSheet.module.css";

interface RatingSheetProps {
  movieId: number;
  movieTitle: string;
  subtitle?: string;
  likes: number;
  liked: boolean;
  likeBusy: boolean;
  likeError: boolean;
  likeStatusError: boolean;
  likeStatusLoading: boolean;
  onRetryLikeStatus: () => void;
  onRetryLike: () => void;
  onToggleLike: () => void;
  onClose: () => void;
  reportReviewId?: number;
}

export default function RatingSheet({
  movieId,
  movieTitle,
  subtitle,
  likes,
  liked,
  likeBusy,
  likeError,
  likeStatusError,
  likeStatusLoading,
  onRetryLikeStatus,
  onRetryLike,
  onToggleLike,
  onClose,
  reportReviewId,
}: RatingSheetProps) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [ratingLoadError, setRatingLoadError] = useState(false);
  const [ratingSaveError, setRatingSaveError] = useState(false);
  const [ratingAttempt, setRatingAttempt] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [reportReason, setReportReason] = useState<ReviewReportReason>("SPAM");
  const [reportStatus, setReportStatus] = useState<{ reported: boolean; reason: ReviewReportReason | null } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportAttempt, setReportAttempt] = useState(0);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState(false);
  const requestIdentity = useRef(0);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const firstRatingRef = useRef<HTMLButtonElement>(null);
  const retryFocus = useRef<{ kind: "like-status" | "rating" | "like-mutation"; origin: HTMLElement | null; started: boolean } | null>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(true, onClose, { initialFocusRef: doneButtonRef });

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending) return;
    const loading = pending.kind === "rating" ? ratingLoading : pending.kind === "like-status" ? likeStatusLoading : likeBusy;
    if (loading) {
      pending.started = true;
      return;
    }
    if (!pending.started) return;
    const frame = window.requestAnimationFrame(() => {
      if (retryFocus.current !== pending) return;
      retryFocus.current = null;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const failed = pending.kind === "rating" ? ratingLoadError : pending.kind === "like-status" ? likeStatusError : likeError;
      const target = failed
        ? sheetRef.current?.querySelector<HTMLButtonElement>(pending.kind === "rating"
          ? "[data-rating-load-error] [data-retry-button]"
          : pending.kind === "like-status" ? "[data-like-status-error] [data-retry-button]" : "[data-like-mutation-error] [data-retry-button]")
        : pending.kind === "rating" ? firstRatingRef.current : likeButtonRef.current;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [likeBusy, likeError, likeStatusError, likeStatusLoading, ratingLoadError, ratingLoading]);

  const toggleLike = () => {
    retryFocus.current = { kind: "like-mutation", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, started: false };
    onToggleLike();
  };

  const retryLike = () => {
    retryFocus.current = { kind: "like-mutation", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, started: false };
    onRetryLike();
  };

  const retryLikeStatus = () => {
    retryFocus.current = { kind: "like-status", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, started: false };
    onRetryLikeStatus();
  };

  const retryRating = () => {
    retryFocus.current = { kind: "rating", origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, started: false };
    setRatingLoading(true);
    setRatingAttempt(value => value + 1);
  };

  useEffect(() => {
    const requestId = ++requestIdentity.current;
    let current = true;
    setRatingLoading(true);
    setRatingLoadError(false);
    getUserRating(movieId)
      .then(({ data }) => {
        if (current && requestId === requestIdentity.current) setRating(data?.rating ?? 0);
      })
      .catch(() => {
        if (current && requestId === requestIdentity.current) {
          setRating(0);
          setRatingLoadError(true);
        }
      })
      .finally(() => {
        if (current && requestId === requestIdentity.current) setRatingLoading(false);
      });

    return () => {
      current = false;
      requestIdentity.current += 1;
    };
  }, [movieId, ratingAttempt]);

  useEffect(() => {
    if (!reportReviewId) return;
    let current = true;
    setReportLoading(true);
    setReportError(false);
    getMyReviewReport(reportReviewId)
      .then(({ data }) => { if (current) setReportStatus({ reported: data.reported, reason: data.report?.reason ?? null }); })
      .catch(() => { if (current) setReportError(true); })
      .finally(() => { if (current) setReportLoading(false); });
    return () => { current = false; };
  }, [reportReviewId, reportAttempt]);

  const saveRating = async (value: number) => {
    if (ratingBusy || ratingLoading) return;
    const requestId = ++requestIdentity.current;
    setRatingBusy(true);
    setRatingSaveError(false);
    try {
      await setMovieRating(movieId, value);
      if (requestId !== requestIdentity.current) return;
      setRating(value);
    } catch {
      if (requestId === requestIdentity.current) setRatingSaveError(true);
    } finally {
      if (requestId === requestIdentity.current) setRatingBusy(false);
    }
  };

  const submitReport = async () => {
    if (!reportReviewId || reportBusy || reportLoading || reportError || reportStatus?.reported) return;
    setReportBusy(true);
    setReportError(false);
    try {
      const { data } = await reportReview(reportReviewId, reportReason);
      setReportStatus({ reported: true, reason: data.reason });
    } catch {
      setReportError(true);
    } finally {
      setReportBusy(false);
    }
  };

  return <div
    className={styles.overlay}
    role="presentation"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section id="rating-sheet-dialog" ref={sheetRef} className={`${styles.sheet} ${subtitle ? styles.reviewSheet : ""}`} role="dialog" aria-modal="true" aria-labelledby="rating-sheet-title" aria-busy={ratingLoading || ratingBusy}>
      <div className={styles.header}>
        {!subtitle && <p className={styles.eyebrow}>{t("rateFilm")}</p>}
        <h2 id="rating-sheet-title">{movieTitle}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {!subtitle && <button
          ref={likeButtonRef}
          className={styles.likeButton}
          type="button"
          disabled={likeBusy || likeStatusLoading || likeStatusError}
          aria-busy={likeBusy || likeStatusLoading}
          aria-pressed={liked}
          aria-label={`${liked ? t("unlike") : t("like")} ${movieTitle}`}
          onClick={toggleLike}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          <span>{likeStatusLoading ? t("loading") : likes}</span>
        </button>}
        {likeError && !subtitle && <p className={styles.error} data-like-mutation-error role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} size="large" onClick={retryLike} /></p>}
      </div>

      {subtitle && <div className={`${styles.reviewCard} ${likeStatusError ? styles.reviewCardError : ""}`}>
        <button
          ref={likeButtonRef}
          className={`${styles.likeButton} ${styles.reviewLikeButton}`}
          type="button"
          disabled={likeBusy || likeStatusLoading || likeStatusError}
          aria-busy={likeBusy || likeStatusLoading}
          aria-pressed={liked}
          aria-label={`${liked ? t("unlike") : t("like")} ${movieTitle}`}
          onClick={toggleLike}
        >
          <img src="/images/movie-action-favorite.png" width={51} height={51} alt="" aria-hidden="true" />
          <span>{likeStatusLoading ? t("loading") : likes}</span>
        </button>
        {likeError && <p className={styles.error} data-like-mutation-error role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} size="large" onClick={retryLike} /></p>}
        {likeStatusError && <p className={styles.error} data-like-status-error role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} size="large" onClick={retryLikeStatus} /></p>}
        <div className={styles.reviewRatingArea}>
          <p className={styles.ratingLabel}>{t("rate")}</p>
          <div className={styles.stars} role="group" aria-label={t("myRating")}>
            {[1, 2, 3, 4, 5].map(value => <button
              className={`${styles.star} ${rating === value ? styles.starActive : ""}`}
              key={value}
              ref={value === 1 ? firstRatingRef : undefined}
              type="button"
              disabled={ratingLoading || ratingBusy}
              aria-pressed={rating === value}
              aria-label={`${t("rateAs")} ${value}`}
              onClick={() => void saveRating(value)}
            >
              <img src={`/images/rating-star-${value % 2 === 0 ? 38 : 37}.svg`} alt="" aria-hidden="true" />
            </button>)}
          </div>
          {ratingLoading && <p className={styles.status} role="status">{t("loading")}</p>}
          {ratingLoadError && <p className={styles.error} data-rating-load-error role="alert">{t("loadRatingsError")} <RetryButton label={t("retry")} size="large" onClick={retryRating} /></p>}
          {ratingSaveError && <p className={styles.error} role="alert">{t("saveRatingError")} <button type="button" onClick={() => setRatingSaveError(false)}>{t("close")}</button></p>}
        </div>
      </div>}

      {likeStatusError && !subtitle && <p className={styles.error} data-like-status-error role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} size="large" onClick={retryLikeStatus} /></p>}

      {subtitle && reportReviewId !== undefined && <div className={styles.reportBlock}>
        <p className={styles.ratingLabel}>{t("reportReview")}</p>
        {reportLoading && <p className={styles.status} role="status">{t("loading")}</p>}
        {reportError && <p className={styles.error} role="alert">{t("reportReviewError")} <button type="button" onClick={() => setReportAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!reportLoading && !reportError && reportStatus?.reported && <p className={styles.status} role="status">{t("reviewReported")}{reportStatus.reason ? ` · ${t(`reviewReportReason_${reportStatus.reason}`)}` : ""}</p>}
        {!reportLoading && !reportError && !reportStatus?.reported && <>
          <label className={styles.reportLabel} htmlFor="review-report-reason">{t("reportedReason")}</label>
          <select id="review-report-reason" className={styles.reportSelect} value={reportReason} onChange={event => setReportReason(event.target.value as ReviewReportReason)}>
            <option value="SPAM">{t("reviewReportReason_SPAM")}</option>
            <option value="INAPPROPRIATE_CONTENT">{t("reviewReportReason_INAPPROPRIATE_CONTENT")}</option>
            <option value="BULLYING">{t("reviewReportReason_BULLYING")}</option>
          </select>
          <button className={styles.reportButton} type="button" disabled={reportBusy} aria-busy={reportBusy} onClick={() => void submitReport()}>{reportBusy ? t("loading") : t("submitReport")}</button>
        </>}
      </div>}

      {!subtitle && <div className={styles.ratingBlock}>
        <p className={styles.ratingLabel}>{t("myRating")}</p>
        <div className={styles.stars} role="group" aria-label={t("myRating")}>
          {[1, 2, 3, 4, 5].map(value => <button
            className={`${styles.star} ${rating === value ? styles.starActive : ""}`}
            key={value}
            ref={value === 1 ? firstRatingRef : undefined}
            type="button"
            disabled={ratingLoading || ratingBusy}
            aria-pressed={rating === value}
            aria-label={`${t("rateAs")} ${value}`}
            onClick={() => void saveRating(value)}
          >
            <span aria-hidden="true">★</span>
          </button>)}
        </div>
        {ratingLoading && <p className={styles.status} role="status">{t("loading")}</p>}
        {ratingLoadError && <p className={styles.error} data-rating-load-error role="alert">{t("loadRatingsError")} <RetryButton label={t("retry")} size="large" onClick={retryRating} /></p>}
        {ratingSaveError && <p className={styles.error} role="alert">{t("saveRatingError")} <button type="button" onClick={() => setRatingSaveError(false)}>{t("close")}</button></p>}
      </div>}

      <button className={styles.doneButton} ref={doneButtonRef} type="button" onClick={onClose}>{t("done")}</button>
    </section>
  </div>;
}
