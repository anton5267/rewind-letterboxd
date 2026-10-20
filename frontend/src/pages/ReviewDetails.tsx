import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReviewDetails, getReviewLikeStatus, likeReview, type ReviewDetails as ReviewDetailsModel, unlikeReview } from "../api/reviews.api";
import RatingSheet from "../components/RatingSheet";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, formatMovieYear, useLocale } from "../i18n";
import { safeHttpUrl } from "../utils/externalUrl";
import { getUserName } from "../utils/userIdentity";
import styles from "./ReviewDetails.module.css";

function Initial({ value }: { value: string }) {
  return <span aria-hidden="true">{value.trim().slice(0, 1).toUpperCase() || "R"}</span>;
}

export default function ReviewDetails() {
  const { id } = useParams();
  const reviewId = Number(id);
  const { isAuth, ready } = useAuth();
  const { lang, path, t } = useLocale();
  const validReviewId = Number.isSafeInteger(reviewId) && reviewId > 0;
  const [review, setReview] = useState<ReviewDetailsModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeStatusLoading, setLikeStatusLoading] = useState(false);
  const [likeStatusError, setLikeStatusError] = useState(false);
  const [likeStatusAttempt, setLikeStatusAttempt] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [ratingSheetOpen, setRatingSheetOpen] = useState(false);
  const loadRequest = useRef(0);
  const mutationRequest = useRef(0);
  const currentReviewId = useRef(reviewId);
  currentReviewId.current = reviewId;

  useEffect(() => {
    mutationRequest.current += 1;
    setLikeBusy(false);
    setLikeError(false);
    setRatingSheetOpen(false);
  }, [reviewId, isAuth]);

  const load = useCallback(async () => {
    const requestId = ++loadRequest.current;
    if (!validReviewId) {
      setReview(null);
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const { data } = await getReviewDetails(reviewId);
      if (requestId !== loadRequest.current) return;
      setReview(data);
    } catch {
      if (requestId === loadRequest.current) {
        setReview(null);
        setError(true);
      }
    } finally {
      if (requestId === loadRequest.current) setLoading(false);
    }
  }, [reviewId, validReviewId]);

  useEffect(() => { void load(); }, [load, retry]);

  useEffect(() => {
    if (!ready || !isAuth || !validReviewId) {
      setLiked(false);
      setLikeStatusLoading(false);
      setLikeStatusError(false);
      return;
    }
    let current = true;
    setLikeStatusLoading(true);
    setLikeStatusError(false);
    setLikeError(false);
    getReviewLikeStatus(reviewId)
      .then(({ data }) => {
        if (!current) return;
        setLiked(data.liked);
        setReview(previous => previous ? { ...previous, likes: data.likes } : previous);
      })
      .catch(() => {
        if (!current) return;
        setLiked(false);
        setLikeStatusError(true);
      })
      .finally(() => { if (current) setLikeStatusLoading(false); });
    return () => { current = false; };
  }, [isAuth, ready, reviewId, validReviewId, likeStatusAttempt]);

  const toggleLike = async () => {
    if (!review || likeBusy) return;
    const requestId = ++mutationRequest.current;
    const reviewIdAtStart = review.id;
    const likedAtStart = liked;
    setLikeBusy(true);
    setLikeError(false);
    try {
      if (likedAtStart) await unlikeReview(reviewIdAtStart);
      else await likeReview(reviewIdAtStart);
      if (requestId !== mutationRequest.current || currentReviewId.current !== reviewIdAtStart) return;
      const nextLiked = !likedAtStart;
      setLiked(nextLiked);
      setReview(previous => previous
        ? { ...previous, likes: Math.max(0, previous.likes + (nextLiked ? 1 : -1)) }
        : previous);
    } catch {
      if (requestId === mutationRequest.current && currentReviewId.current === reviewIdAtStart) setLikeError(true);
    } finally {
      if (requestId === mutationRequest.current && currentReviewId.current === reviewIdAtStart) setLikeBusy(false);
    }
  };

  const closeRatingSheet = useCallback(() => setRatingSheetOpen(false), []);

  if (loading) return <main className={styles.state} aria-labelledby="review-state-title" aria-busy={true}><h1 id="review-state-title" className="srOnly">{t("review")}</h1><p className={styles.stateLoading} role="status">{t("loadingReview")}</p></main>;
  if (error || !review) return <main className={styles.state} aria-labelledby="review-state-title" aria-busy={false}><div className={styles.stateError} role="alert"><h1 id="review-state-title">{t("reviewUnavailable")}</h1><p>{!validReviewId ? t("invalidReviewId") : t("loadReviewError")}</p>{validReviewId && <RetryButton label={t("retry")} onClick={() => setRetry(value => value + 1)} />}</div></main>;

  const authorName = getUserName(review.author, t("someone"));
  const movieTitle = editorialText(review.movie.title, t("untitledFilm"));
  const year = formatMovieYear(review.movie.releaseDate, t("unknownYear"));
  const metaItems = [year, review.movie.durationMinutes ? `${review.movie.durationMinutes} ${t("minutes")}` : null, review.movie.ageRating].filter((item): item is string => Boolean(item));
  const trailerUrl = safeHttpUrl(review.movie.trailerUrl);

  return <main className={styles.page} aria-labelledby="review-title" aria-busy={likeStatusLoading || likeBusy}>
    <section className={styles.hero}>
      <ResilientImage className={styles.heroBackdrop} src={review.movie.backdropUrl} alt="" aria-hidden="true" loading="eager" fallback={null} />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroInner}>
        <Link className={styles.back} to={path(`/films/${review.movie.id}`)} aria-label={t("backToMovie")}>←</Link>
        <div className={styles.filmBlock}>
          <div className={styles.posterColumn}>
            <Link className={styles.poster} to={path(`/films/${review.movie.id}`)} aria-label={`${t("poster")} ${movieTitle}`}>
              <ResilientImage src={review.movie.photoUrl} alt={`${t("poster")} ${movieTitle}`} fallback={<Initial value={movieTitle} />} />
            </Link>
            {trailerUrl && <a className={styles.trailer} href={trailerUrl} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▶</span>{t("watchTrailer")}</a>}
          </div>
          <div className={styles.filmCopy}>
            <p className={styles.eyebrow}>{t("review")}</p>
            <h1 id="review-title"><Link to={path(`/films/${review.movie.id}`)}>{movieTitle}</Link></h1>
            {metaItems.length > 0 && <ul className={styles.meta} aria-label={t("filmData")}>{metaItems.map((item, index) => <li className={item === review.movie.ageRating ? styles.ageRating : undefined} key={`${item}-${index}`}>{item}</li>)}</ul>}
            <Link className={styles.author} to={path(`/users/${review.author.id}`)}>
              <ResilientImage src={review.author.avatarUrl} alt="" fallback={<Initial value={authorName} />} />
              <span><small>{t("reviewBy")}</small>{" "}<strong>{authorName}</strong></span>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <div className={styles.content}>
      <article className={styles.reviewBody}>
        <p className={styles.reviewText}>{review.content}</p>
        <div className={styles.reviewMeta}>
          <div className={styles.reviewMetaPrimary}>
            <div className={styles.stars} role="img" aria-label={`${t("rating")}: ${review.rating ?? 0}/5`}>
              {[1, 2, 3, 4, 5].map(star => <span aria-hidden="true" className={review.rating != null && star <= review.rating ? styles.starActive : ""} key={star}>★</span>)}
            </div>
            {isAuth && <button className={styles.rateTrigger} type="button" aria-haspopup="dialog" aria-controls={ratingSheetOpen ? "rating-sheet-dialog" : undefined} aria-expanded={ratingSheetOpen} onClick={() => setRatingSheetOpen(true)}>
              <span aria-hidden="true">★</span>{t("rateFilm")}
            </button>}
          </div>
          <time dateTime={review.createdAt}>{formatDateTime(review.createdAt, lang)}</time>
        </div>
      </article>

      <aside className={styles.socialPanel}>
        <div className={styles.likeRow}>
          <div><p className={styles.eyebrow}>{t("community")}</p><h2>{t("membersWhoLikedReview")}</h2></div>
          <strong>{review.likes}</strong>
        </div>
        {review.likedBy.length > 0 ? <div className={styles.likers} onFocusCapture={event => {
          if (event.target instanceof HTMLElement) event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
        }}>
          {review.likedBy.map(user => <Link className={styles.liker} to={path(`/users/${user.id}`)} aria-label={getUserName(user, t("someone"))} title={getUserName(user, t("someone"))} key={user.id}>
            <ResilientImage src={user.avatarUrl} alt={getUserName(user, t("someone"))} fallback={<Initial value={getUserName(user, t("someone"))} />} />
          </Link>)}
        </div> : <p className={styles.noLikes}>{t("noReviewLikes")}</p>}
        {isAuth && likeStatusLoading && <p className={styles.likeStatus} role="status">{t("loading")}</p>}
        {isAuth && likeStatusError && <p className={styles.likeError} role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} onClick={() => setLikeStatusAttempt(value => value + 1)} /></p>}
        {isAuth && !likeStatusLoading && !likeStatusError && <button className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`} type="button" aria-busy={likeBusy} aria-pressed={liked} disabled={likeBusy} onClick={() => void toggleLike()}>
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>{likeBusy ? t("loading") : liked ? t("unlike") : t("like")}
        </button>}
        {!isAuth && <Link className={styles.likeButton} to={path("/login")}>♡ {t("loginToLikeReview")}</Link>}
        {likeError && <p className={styles.likeError} role="alert">{t("likeReviewError")} <RetryButton label={t("retry")} disabled={likeBusy} busy={likeBusy} onClick={() => void toggleLike()} /></p>}
      </aside>
    </div>
    {ratingSheetOpen && isAuth && <RatingSheet
      movieId={review.movie.id}
      movieTitle={movieTitle}
      likes={review.likes}
      liked={liked}
      likeBusy={likeBusy}
      likeStatusError={likeStatusError}
      likeStatusLoading={likeStatusLoading}
      onRetryLikeStatus={() => setLikeStatusAttempt(value => value + 1)}
      onToggleLike={() => void toggleLike()}
      onClose={closeRatingSheet}
    />}
  </main>;
}
