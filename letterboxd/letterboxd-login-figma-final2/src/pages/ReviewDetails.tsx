import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getReviewDetails, getReviewLikeStatus, likeReview, type ReviewDetails as ReviewDetailsModel, unlikeReview } from "../api/reviews.api";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, useLocale } from "../i18n";
import { safeHttpUrl } from "../utils/externalUrl";
import styles from "./ReviewDetails.module.css";

function Initial({ value }: { value: string }) {
  return <span aria-hidden="true">{value.trim().slice(0, 1).toUpperCase() || "R"}</span>;
}

export default function ReviewDetails() {
  const { id } = useParams();
  const reviewId = Number(id);
  const { isAuth, ready } = useAuth();
  const { lang, path, t } = useLocale();
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

  const load = useCallback(async () => {
    if (!Number.isInteger(reviewId) || reviewId < 1) {
      setReview(null);
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const { data } = await getReviewDetails(reviewId);
      setReview(data);
    } catch {
      setReview(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => { void load(); }, [load, retry]);

  useEffect(() => {
    if (!ready || !isAuth || !Number.isInteger(reviewId) || reviewId < 1) {
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
  }, [isAuth, ready, reviewId, likeStatusAttempt]);

  const toggleLike = async () => {
    if (!review || likeBusy) return;
    setLikeBusy(true);
    setLikeError(false);
    try {
      if (liked) await unlikeReview(review.id);
      else await likeReview(review.id);
      const nextLiked = !liked;
      setLiked(nextLiked);
      setReview(previous => previous
        ? { ...previous, likes: Math.max(0, previous.likes + (nextLiked ? 1 : -1)) }
        : previous);
    } catch {
      setLikeError(true);
    } finally {
      setLikeBusy(false);
    }
  };

  if (loading) return <main className={styles.state}><p role="status">{t("loadingReview")}</p></main>;
  if (error || !review) return <main className={styles.state}><div role="alert"><h1>{t("reviewUnavailable")}</h1><p>{t("loadReviewError")}</p><button type="button" onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></div></main>;

  const authorName = review.author.displayName || review.author.username;
  const year = review.movie.releaseDate?.slice(0, 4);
  const meta = [year, review.movie.durationMinutes ? `${review.movie.durationMinutes} ${t("minutes")}` : null, review.movie.ageRating].filter(Boolean).join(" · ");
  const trailerUrl = safeHttpUrl(review.movie.trailerUrl);

  return <main className={styles.page} aria-busy={likeStatusLoading || likeBusy}>
    <section className={styles.hero}>
      <ResilientImage className={styles.heroBackdrop} src={review.movie.backdropUrl} alt="" aria-hidden="true" loading="eager" fallback={null} />
      <div className={styles.heroShade} aria-hidden="true" />
      <div className={styles.heroInner}>
        <Link className={styles.back} to={path(`/films/${review.movie.id}`)} aria-label={t("backToMovie")}>←</Link>
        <div className={styles.filmBlock}>
          <Link className={styles.poster} to={path(`/films/${review.movie.id}`)} aria-label={`${t("poster")} ${review.movie.title}`}>
            <ResilientImage src={review.movie.photoUrl} alt={`${t("poster")} ${review.movie.title}`} fallback={<Initial value={review.movie.title} />} />
          </Link>
          <div className={styles.filmCopy}>
            <p className={styles.eyebrow}>{t("review")}</p>
            <h1><Link to={path(`/films/${review.movie.id}`)}>{review.movie.title}</Link></h1>
            {meta && <p className={styles.meta}>{meta}</p>}
            <Link className={styles.author} to={path(`/users/${review.author.id}`)}>
              <ResilientImage src={review.author.avatarUrl} alt="" fallback={<Initial value={authorName} />} />
              <span><small>{t("reviewBy")}</small><strong>{authorName}</strong></span>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <div className={styles.content}>
      <article className={styles.reviewBody}>
        <div className={styles.reviewMeta}>
          <div className={styles.stars} aria-label={`${t("rating")}: ${review.rating ?? 0}/5`}>
            {[1, 2, 3, 4, 5].map(star => <span aria-hidden="true" className={review.rating != null && star <= review.rating ? styles.starActive : ""} key={star}>★</span>)}
          </div>
          <time dateTime={review.createdAt}>{formatDateTime(review.createdAt, lang)}</time>
        </div>
        <p className={styles.reviewText}>{review.content}</p>
        {trailerUrl && <a className={styles.trailer} href={trailerUrl} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">▶</span>{t("watchTrailer")}</a>}
      </article>

      <aside className={styles.socialPanel}>
        <div className={styles.likeRow}>
          <div><p className={styles.eyebrow}>{t("community")}</p><h2>{t("membersWhoLikedReview")}</h2></div>
          <strong>{review.likes}</strong>
        </div>
        {review.likedBy.length > 0 ? <div className={styles.likers}>
          {review.likedBy.map(user => <Link className={styles.liker} to={path(`/users/${user.id}`)} aria-label={user.displayName || user.username} title={user.displayName || user.username} key={user.id}>
            <ResilientImage src={user.avatarUrl} alt={user.displayName || user.username} fallback={<Initial value={user.displayName || user.username} />} />
          </Link>)}
        </div> : <p className={styles.noLikes}>{t("noReviewLikes")}</p>}
        {isAuth && likeStatusLoading && <p className={styles.likeStatus} role="status">{t("loading")}</p>}
        {isAuth && likeStatusError && <p className={styles.likeError} role="alert">{t("likeReviewError")} <button type="button" onClick={() => setLikeStatusAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {isAuth && !likeStatusLoading && !likeStatusError && <button className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`} type="button" aria-busy={likeBusy} aria-pressed={liked} disabled={likeBusy} onClick={() => void toggleLike()}>
          <span aria-hidden="true">{liked ? "♥" : "♡"}</span>{likeBusy ? t("loading") : liked ? t("unlike") : t("like")}
        </button>}
        {!isAuth && <Link className={styles.likeButton} to={path("/login")}>♡ {t("loginToLikeReview")}</Link>}
        {likeError && <p className={styles.likeError} role="alert">{t("likeReviewError")} <button type="button" disabled={likeBusy} aria-busy={likeBusy} onClick={() => void toggleLike()}>{t("retry")}</button></p>}
      </aside>
    </div>
  </main>;
}
