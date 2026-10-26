import { useEffect, useState, type FocusEvent } from "react";
import { Link } from "react-router-dom";
import { searchMovies, type MovieCard } from "../api/search.api";
import { getPopularReviews, getRecentReviews, type RecentReview } from "../api/reviews.api";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatReviewDate, formatMovieYear, useLocale } from "../i18n";
import { getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./FilmsDiscover.module.css";

type FeedKey = "popular" | "recent" | "reviews";

function revealFocusedPoster(event: FocusEvent<HTMLAnchorElement>) {
  event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export default function FilmsDiscover() {
  const { lang, path, t } = useLocale();
  const [popular, setPopular] = useState<MovieCard[]>([]);
  const [recent, setRecent] = useState<RecentReview[]>([]);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState<Record<FeedKey, boolean>>({ popular: true, recent: true, reviews: true });
  const [errors, setErrors] = useState<Partial<Record<FeedKey, boolean>>>({});
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading({ popular: true, recent: true, reviews: true });
    setErrors({});
    setPopular([]);
    setRecent([]);
    setReviews([]);

    const run = <T,>(key: FeedKey, request: Promise<{ data: T }>, onSuccess: (data: T) => void) => {
      request.then(({ data }) => { if (current) onSuccess(data); })
        .catch(() => { if (current) setErrors(value => ({ ...value, [key]: true })); })
        .finally(() => { if (current) setLoading(value => ({ ...value, [key]: false })); });
    };

    run("popular", searchMovies({ sort: "rating_desc", page: 0, size: 6 }), data => setPopular(data.content));
    run("recent", getRecentReviews(0, 20), data => {
      const movies = new Map<number, RecentReview>();
      data.content.forEach(review => { if (!movies.has(review.movieId)) movies.set(review.movieId, review); });
      setRecent([...movies.values()].slice(0, 8));
    });
    run("reviews", getPopularReviews(0, 4), data => setReviews(data.content));

    return () => { current = false; };
  }, [lang, retry]);

  const busy = Object.values(loading).some(Boolean);
  const filmErrorMessage = t("loadFilmsError");
  const reviewErrorMessage = t("loadReviewsError");

  return <main className={styles.page} aria-labelledby="films-discover-title" aria-busy={busy}>
    <nav className={styles.mobileToolbar} aria-label={t("browseFilms")}>
      <Link to={path("/films")} aria-label={t("browseFilms")}><span aria-hidden="true">←</span></Link>
      <Link className={styles.mobileViewAll} to={path("/films?sort=rating_desc")} aria-label={t("viewAll")}>
        <span aria-hidden="true"><i className="fa-solid fa-sliders" /></span>
      </Link>
    </nav>
    <header className={styles.hero}>
      <p className={styles.eyebrow}>{t("films")}</p>
      <h1 id="films-discover-title">{t("filmsDiscoverTitle")}</h1>
      <p>{t("filmsDiscoverIntro")}</p>
    </header>

    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="popular-films-title" aria-busy={loading.popular}>
        <div className={`${styles.heading} ${styles.popularHeading}`}><h2 id="popular-films-title">{t("popularFilms")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        {loading.popular && <p className={styles.status} role="status">{t("loading")}</p>}
        {errors.popular && <RetryNotice className={styles.status} message={filmErrorMessage} retryLabel={t("retry")} busy={loading.popular} onRetry={() => setRetry(value => value + 1)} />}
        {!loading.popular && !errors.popular && popular.length === 0 && <p className={styles.empty}>{t("noFilms")}</p>}
        {!loading.popular && !errors.popular && popular.length > 0 && <ol className={styles.popularGrid}>
          {popular.map((movie, index) => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}>
              <Link className={styles.poster} to={path(`/films/${movie.id}`)} aria-label={`${index + 1}. ${title}`} title={title} onFocus={revealFocusedPoster}>
                <span className={styles.rank} aria-hidden="true">{index + 1}</span>
                <ResilientImage src={movie.photoUrl} alt="" fallback={<span className={styles.fallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{title}</Link></h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p>
            </li>;
          })}
        </ol>}
      </section>

      <section className={styles.section} aria-labelledby="recent-films-title" aria-busy={loading.recent}>
        <div className={styles.heading}><h2 id="recent-films-title">{t("homeJustReviewed")}</h2><Link to={path("/reviews")}>{t("homeMore")}</Link></div>
        {loading.recent && <p className={styles.status} role="status">{t("loading")}</p>}
        {errors.recent && <RetryNotice className={styles.status} message={reviewErrorMessage} retryLabel={t("retry")} busy={loading.recent} onRetry={() => setRetry(value => value + 1)} />}
        {!loading.recent && !errors.recent && recent.length === 0 && <p className={styles.empty}>{t("noRecentReviews")}</p>}
        {!loading.recent && !errors.recent && recent.length > 0 && <div className={styles.posterRail} role="group" aria-label={t("homeJustReviewed")}>
          {recent.map(review => {
            const title = editorialText(review.movieTitle, t("untitledFilm"));
            return <Link className={styles.railPoster} key={review.movieId} to={path(`/films/${review.movieId}`)} aria-label={title} title={title} onFocus={revealFocusedPoster}>
              <ResilientImage src={review.moviePhotoUrl} alt="" loading="lazy" fallback={<span aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
            </Link>;
          })}
        </div>}
      </section>

      <section className={styles.section} aria-labelledby="popular-reviews-title" aria-busy={loading.reviews}>
        <div className={styles.heading}><h2 id="popular-reviews-title">{t("homePopularReviewsThisWeek")}</h2><Link to={path("/reviews")}>{t("viewAll")}</Link></div>
        {loading.reviews && <p className={styles.status} role="status">{t("loading")}</p>}
        {errors.reviews && <RetryNotice className={styles.status} message={reviewErrorMessage} retryLabel={t("retry")} busy={loading.reviews} onRetry={() => setRetry(value => value + 1)} />}
        {!loading.reviews && !errors.reviews && reviews.length === 0 && <p className={styles.empty}>{t("noRecentReviews")}</p>}
        {!loading.reviews && !errors.reviews && reviews.length > 0 && <div className={styles.reviewGrid}>
          {reviews.map(review => {
            const title = editorialText(review.movieTitle, t("untitledFilm"));
            return <article className={styles.reviewCard} key={review.id}>
              <Link className={styles.reviewAvatar} to={path(`/users/${review.userId}`)} aria-label={getUserName({ username: review.username }, t("someone"))}>
                <ResilientImage src={review.userAvatarUrl} alt="" loading="lazy" fallback={<span aria-hidden="true">{getUserInitial({ username: review.username })}</span>} />
              </Link>
              <Link className={styles.reviewPoster} to={path(`/films/${review.movieId}`)} aria-label={`${t("poster")} ${title}`}>
                <ResilientImage src={review.moviePhotoUrl} alt="" loading="lazy" fallback={<span aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <div className={styles.reviewCopy}>
                <h3><Link to={path(`/films/${review.movieId}`)}>{title}</Link></h3>
                <p className={styles.byline}><Link to={path(`/users/${review.userId}`)}>{getUserName({ username: review.username }, t("someone"))}</Link><span aria-hidden="true"> · </span><time dateTime={review.createdAt}>{formatReviewDate(review.createdAt, lang)}</time></p>
                <p className={styles.excerpt}><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
              </div>
              {review.rating != null && <strong className={styles.reviewRating} role="img" aria-label={`${t("rating")}: ${review.rating}/5`}>★{review.rating.toFixed(1)}</strong>}
            </article>;
          })}
        </div>}
      </section>

      <section className={`${styles.section} ${styles.crewSection}`} aria-labelledby="crew-picks-title">
        <div className={styles.heading}><h2 id="crew-picks-title">{t("crewPicks")}</h2></div>
        <p className={styles.empty}>{t("crewPicksUnavailable")}</p>
      </section>
    </div>
  </main>;
}
