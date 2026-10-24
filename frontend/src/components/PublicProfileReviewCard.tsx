import { Link } from "react-router-dom";
import type { PublicProfileReview, PublicProfileResponse } from "../api/profile.api";
import { editorialText, formatDateTime, useLocale } from "../i18n";
import { getUserName } from "../utils/userIdentity";
import { usePublicProfilePoster } from "./PublicProfilePoster";
import ResilientImage from "./ResilientImage";
import RetryButton from "./RetryButton";
import styles from "./PublicProfileReviewCard.module.css";

interface Props { review: PublicProfileReview; profile: PublicProfileResponse }

export default function PublicProfileReviewCard({ review, profile }: Props) {
  const { path, t, lang } = useLocale();
  const title = editorialText(review.movieTitle, t("untitledFilm"));
  const poster = usePublicProfilePoster(review.movieId, review.id);
  return <li className={styles.card}>
    <div className={styles.posterWrap} aria-busy={poster.loading}>
      <Link className={styles.posterLink} to={path(`/films/${review.movieId}`)} aria-label={title}>
        <ResilientImage className={styles.poster} src={poster.photoUrl} alt="" loading="lazy" fallback={<span className={styles.fallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
      </Link>
      {poster.error && <div className={styles.retry} role="group" aria-label={`${title}: ${t("loadReviewError")}`}><RetryButton label={t("retry")} onClick={poster.retry} /></div>}
    </div>
    <div className={styles.copy}>
      <h3><Link className={styles.titleLink} to={path(`/films/${review.movieId}`)}>{title}</Link></h3>
      <div className={styles.meta}>
        <span>{t("reviewBy")} {getUserName(profile, t("someone"))}</span>
        {review.rating !== null && <span className={styles.rating}>★ {review.rating}/5</span>}
        {review.updatedAt && <time dateTime={review.updatedAt}>{formatDateTime(review.updatedAt, lang)}</time>}
      </div>
      {poster.unavailable ? <p className={styles.unavailable}>{t("reviewUnavailable")}</p> : <Link className={styles.content} to={path(`/reviews/${review.id}`)}>{review.content}</Link>}
    </div>
  </li>;
}
