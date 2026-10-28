import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPopularReviews, type RecentReview } from "../api/reviews.api";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import Pagination from "../components/Pagination";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatReviewDate, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./PopularReviews.module.css";

const PAGE_SIZE = 4;

function ReviewerAvatar({ reviewer, label }: { reviewer: PopularReviewer; label: string }) {
  const { path } = useLocale();
  return <Link className={styles.reviewerAvatar} to={path(`/users/${reviewer.id}`)} aria-label={label} title={label}>
    <ResilientImage src={reviewer.avatarUrl} alt="" fallback={<span aria-hidden="true">{getUserInitial(reviewer)}</span>} />
  </Link>;
}

function ReviewPoster({ review, label }: { review: RecentReview; label: string }) {
  const { path, t } = useLocale();
  const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
  return <Link className={styles.poster} to={path(`/films/${review.movieId}`)} aria-label={label}>
    <ResilientImage src={review.moviePhotoUrl} alt="" fallback={<span aria-hidden="true">{movieTitle.slice(0, 1).toUpperCase()}</span>} />
  </Link>;
}

export default function PopularReviews() {
  const { lang, path, t } = useLocale();
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [reviewersLoading, setReviewersLoading] = useState(true);
  const [reviewersError, setReviewersError] = useState(false);
  const [reviewersRetry, setReviewersRetry] = useState(0);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [reviewsRetry, setReviewsRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setReviewersLoading(true);
    setReviewersError(false);
    getPopularReviewers()
      .then(({ data }) => { if (current) setReviewers(data); })
      .catch(() => {
        if (!current) return;
        setReviewers([]);
        setReviewersError(true);
      })
      .finally(() => { if (current) setReviewersLoading(false); });
    return () => { current = false; };
  }, [lang, reviewersRetry]);

  useEffect(() => {
    let current = true;
    setReviewsLoading(true);
    setReviewsError(false);
    getPopularReviews(reviewsPage, PAGE_SIZE)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(reviewsPage, data.totalPages)) {
          setReviewsTotalPages(data.totalPages);
          setReviewsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setReviews(data.content);
        setReviewsTotalPages(data.totalPages);
      })
      .catch(() => {
        if (!current) return;
        setReviews([]);
        setReviewsTotalPages(0);
        setReviewsError(true);
      })
      .finally(() => { if (current) setReviewsLoading(false); });
    return () => { current = false; };
  }, [lang, reviewsPage, reviewsRetry]);

  const pageBusy = reviewersLoading || reviewsLoading;

  return <main className={styles.page} aria-labelledby="popular-reviews-title" aria-busy={pageBusy}>
    <section className={styles.hero}>
      <div className={styles.toolbar}>
        <Link className={styles.toolbarButton} to={path("/home")} aria-label={t("home")}><span aria-hidden="true">←</span></Link>
        <h1 id="popular-reviews-title">{t("homePopularReviews")}</h1>
        <Link className={styles.toolbarButton} to={path("/search")} aria-label={t("globalSearch")}><span aria-hidden="true">⌕</span></Link>
      </div>
    </section>

    <div className={styles.shell}>
      <section className={styles.reviewerSection} aria-labelledby="popular-reviewers-title" aria-busy={reviewersLoading}>
        <div className={styles.sectionHeading}>
          <h2 id="popular-reviewers-title">{t("popularReviewers")}</h2>
          <Link className={styles.reviewerMore} to={path("/community/reviewers")} aria-label={`${t("homeMore")} ${t("popularReviewers")}`}>{t("homeMore")}</Link>
        </div>
        {reviewersLoading && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.reviewerRail} aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6, 7].map(item => <div className={`${styles.reviewerAvatar} ${styles.skeleton}`} key={item} />)}</div></>}
        {reviewersError && <RetryNotice className={styles.status} message={t("loadCommunityError")} retryLabel={t("retry")} busy={reviewersLoading} onRetry={() => setReviewersRetry(value => value + 1)} />}
        {!reviewersLoading && !reviewersError && reviewers.length === 0 && <p className={styles.empty}>{t("noPopularReviewers")}</p>}
        {!reviewersLoading && !reviewersError && reviewers.length > 0 && <div className={styles.reviewerRail} role="group" aria-label={t("popularReviewers")}>
          {reviewers.map(reviewer => <ReviewerAvatar key={reviewer.id} reviewer={reviewer} label={getUserName(reviewer, t("someone"))} />)}
        </div>}
      </section>

      <section className={styles.reviewsSection} aria-labelledby="reviews-title" aria-busy={reviewsLoading}>
        <div className={styles.sectionHeading}>
          <h2 id="reviews-title">{t("homePopularReviews")}</h2>
          <span className={styles.sortLabel}>{t("sortBy")}: {t("sortPopularReviews")}</span>
        </div>
        {reviewsLoading && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.reviewList} aria-hidden="true">{[0, 1, 2, 3].map(item => <div className={styles.reviewCard} key={item}><div className={`${styles.poster} ${styles.skeleton}`} /><div className={styles.reviewCopy}><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /></div></div>)}</div></>}
        {reviewsError && <RetryNotice className={styles.status} message={t("loadReviewsError")} retryLabel={t("retry")} busy={reviewsLoading} onRetry={() => setReviewsRetry(value => value + 1)} />}
        {!reviewsLoading && !reviewsError && reviews.length === 0 && <p className={styles.empty}>{t("noRecentReviews")}</p>}
        {!reviewsLoading && !reviewsError && reviews.length > 0 && <div className={styles.reviewList}>
          {reviews.map(review => {
            const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
            return <article className={styles.reviewCard} key={review.id}>
            <ReviewPoster review={review} label={`${t("poster")} ${movieTitle}`} />
            <div className={styles.reviewCopy}>
              <div className={styles.reviewHeader}>
                <div>
                  <h3><Link to={path(`/films/${review.movieId}`)}>{movieTitle}</Link> <strong role="img" aria-label={review.rating == null ? `${t("rating")}: —` : `${t("rating")}: ${review.rating}/5`}>{review.rating != null ? <><img src="/images/movie-star.png" width={14} height={14} alt="" aria-hidden="true" />{review.rating}</> : "—"}</strong></h3>
                  <p><Link to={path(`/users/${review.userId}`)}>{getUserName({ username: review.username }, t("someone"))}</Link> · <time dateTime={review.createdAt}>{formatReviewDate(review.createdAt, lang)}</time></p>
                </div>
              </div>
              <p className={styles.reviewText}><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
            </div>
          </article>;
          })}
        </div>}
        {!reviewsError && <Pagination className={styles.pagination} page={reviewsPage} totalPages={reviewsTotalPages} label={t("reviewsPagination")} busy={reviewsLoading} onPageChange={setReviewsPage} />}
      </section>
    </div>
  </main>;
}
