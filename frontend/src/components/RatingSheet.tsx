import { useEffect, useRef, useState } from "react";
import { getUserRating, setRating as setMovieRating } from "../api/ratings.api";
import RetryButton from "./RetryButton";
import { useLocale } from "../i18n";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import styles from "./RatingSheet.module.css";

interface RatingSheetProps {
  movieId: number;
  movieTitle: string;
  likes: number;
  liked: boolean;
  likeBusy: boolean;
  likeStatusError: boolean;
  likeStatusLoading: boolean;
  onRetryLikeStatus: () => void;
  onToggleLike: () => void;
  onClose: () => void;
}

export default function RatingSheet({
  movieId,
  movieTitle,
  likes,
  liked,
  likeBusy,
  likeStatusError,
  likeStatusLoading,
  onRetryLikeStatus,
  onToggleLike,
  onClose,
}: RatingSheetProps) {
  const { t } = useLocale();
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [ratingLoadError, setRatingLoadError] = useState(false);
  const [ratingSaveError, setRatingSaveError] = useState(false);
  const [ratingAttempt, setRatingAttempt] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const requestIdentity = useRef(0);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(true, onClose, { initialFocusRef: doneButtonRef });

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

  return <div
    className={styles.overlay}
    role="presentation"
    onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}
  >
    <section id="rating-sheet-dialog" ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="rating-sheet-title" aria-busy={ratingLoading || ratingBusy}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{t("rateFilm")}</p>
        <h2 id="rating-sheet-title">{movieTitle}</h2>
        <button
          className={styles.likeButton}
          type="button"
          disabled={likeBusy || likeStatusLoading || likeStatusError}
          aria-busy={likeBusy || likeStatusLoading}
          aria-pressed={liked}
          aria-label={`${liked ? t("unlike") : t("like")} ${movieTitle}`}
          onClick={onToggleLike}
        >
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
          <span>{likeStatusLoading ? t("loading") : likes}</span>
        </button>
      </div>

      {likeStatusError && <p className={styles.error} role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} size="large" onClick={onRetryLikeStatus} /></p>}

      <div className={styles.ratingBlock}>
        <p className={styles.ratingLabel}>{t("myRating")}</p>
        <div className={styles.stars} role="group" aria-label={t("myRating")}>
          {[1, 2, 3, 4, 5].map(value => <button
            className={`${styles.star} ${rating === value ? styles.starActive : ""}`}
            key={value}
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
        {ratingLoadError && <p className={styles.error} role="alert">{t("loadRatingsError")} <RetryButton label={t("retry")} size="large" onClick={() => setRatingAttempt(value => value + 1)} /></p>}
        {ratingSaveError && <p className={styles.error} role="alert">{t("saveRatingError")} <button type="button" onClick={() => setRatingSaveError(false)}>{t("close")}</button></p>}
      </div>

      <button className={styles.doneButton} ref={doneButtonRef} type="button" onClick={onClose}>{t("done")}</button>
    </section>
  </div>;
}
