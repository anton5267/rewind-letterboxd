import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Link } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MovieCard } from "../api/search.api";
import { getPopularReviews, getRecentReviews, type RecentReview } from "../api/reviews.api";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatReviewDate, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import { getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./FilmsDiscover.module.css";

type FeedKey = "popular" | "recent" | "reviews";

function revealFocusedPoster(event: FocusEvent<HTMLAnchorElement>) {
  event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export default function FilmsDiscover() {
  const { lang, path, t } = useLocale();
  const [popular, setPopular] = useState<MovieCard[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState(false);
  const [genresRetry, setGenresRetry] = useState(0);
  const [filmInput, setFilmInput] = useState("");
  const [filmQuery, setFilmQuery] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [genreId, setGenreId] = useState("");
  const [recent, setRecent] = useState<RecentReview[]>([]);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState<Record<FeedKey, boolean>>({ popular: true, recent: true, reviews: true });
  const [errors, setErrors] = useState<Partial<Record<FeedKey, boolean>>>({});
  const [retry, setRetry] = useState<Record<FeedKey, number>>({ popular: 0, recent: 0, reviews: 0 });
  const retryFocus = useRef<Partial<Record<FeedKey, { origin: HTMLElement; lang: string }>>>({});

  useEffect(() => {
    let current = true;
    setLoading(value => ({ ...value, popular: true }));
    setErrors(value => { const next = { ...value }; delete next.popular; return next; });
    setPopular([]);
    searchMovies({
      sort: "rating_desc", page: 0, size: 6,
      q: filmQuery || undefined,
      year: year || undefined,
      minRating: minRating || undefined,
      genreId: genreId || undefined,
    })
      .then(({ data }) => { if (current) setPopular(data.content); })
      .catch(() => { if (current) setErrors(value => ({ ...value, popular: true })); })
      .finally(() => { if (current) setLoading(value => ({ ...value, popular: false })); });
    return () => { current = false; };
  }, [lang, retry.popular, filmQuery, year, minRating, genreId]);

  useEffect(() => {
    let current = true;
    setGenresLoading(true);
    setGenresError(false);
    getGenres().then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) setGenresError(true); })
      .finally(() => { if (current) setGenresLoading(false); });
    return () => { current = false; };
  }, [lang, genresRetry]);

  useEffect(() => {
    let current = true;
    setLoading(value => ({ ...value, recent: true }));
    setErrors(value => { const next = { ...value }; delete next.recent; return next; });
    setRecent([]);
    getRecentReviews(0, 20).then(({ data }) => {
      if (!current) return;
      const movies = new Map<number, RecentReview>();
      data.content.forEach(review => { if (!movies.has(review.movieId)) movies.set(review.movieId, review); });
      setRecent([...movies.values()].slice(0, 8));
    }).catch(() => { if (current) setErrors(value => ({ ...value, recent: true })); })
      .finally(() => { if (current) setLoading(value => ({ ...value, recent: false })); });
    return () => { current = false; };
  }, [lang, retry.recent]);

  useEffect(() => {
    let current = true;
    setLoading(value => ({ ...value, reviews: true }));
    setErrors(value => { const next = { ...value }; delete next.reviews; return next; });
    setReviews([]);
    getPopularReviews(0, 4)
      .then(({ data }) => { if (current) setReviews(data.content); })
      .catch(() => { if (current) setErrors(value => ({ ...value, reviews: true })); })
      .finally(() => { if (current) setLoading(value => ({ ...value, reviews: false })); });
    return () => { current = false; };
  }, [lang, retry.reviews]);

  useEffect(() => {
    const readyKeys = (Object.keys(retryFocus.current) as FeedKey[]).filter(key => retryFocus.current[key] && !loading[key]);
    if (readyKeys.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      readyKeys.forEach(key => {
        const pending = retryFocus.current[key];
        if (!pending || loading[key]) return;
        delete retryFocus.current[key];
        if (pending.lang !== lang) return;
        const active = document.activeElement;
        if (pending.origin.isConnected || (active !== document.body && active !== null)) return;
        const headingId = key === "popular" ? "popular-films-title" : key === "recent" ? "recent-films-title" : "popular-reviews-title";
        document.getElementById(headingId)?.focus();
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lang, loading]);

  const retryFeed = (key: FeedKey) => {
    const origin = document.activeElement;
    if (origin instanceof HTMLElement) retryFocus.current[key] = { origin, lang };
    setRetry(value => ({ ...value, [key]: value[key] + 1 }));
  };

  const submitFilmSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilmQuery(filmInput.trim());
  };

  const busy = Object.values(loading).some(Boolean);
  const filmErrorMessage = t("loadFilmsError");
  const reviewErrorMessage = t("loadReviewsError");

  return <main className={styles.page} aria-labelledby="films-discover-title" aria-busy={busy}>
    <nav className={styles.mobileToolbar} aria-label={t("browseFilms")}>
      <Link to={path("/films")} aria-label={t("browseFilms")}><span aria-hidden="true"><img src="/images/help-icon-back.png" width={25} height={25} alt="" /></span></Link>
      <Link className={styles.mobileViewAll} to={path("/films?sort=rating_desc")} aria-label={t("viewAll")}>
        <span aria-hidden="true"><img src="/images/search-filter.png" width={20} height={20} alt="" /></span>
      </Link>
    </nav>
    <h1 className={styles.visuallyHidden} id="films-discover-title">{t("films")}</h1>
    <header className={styles.hero} aria-label={t("filters")}>
      <div className={styles.desktopToolbar}>
        <div className={styles.filterControls} role="group" aria-label={t("filters")} aria-busy={genresLoading}>
          <label><select aria-label={t("year")} value={year} onChange={event => setYear(event.target.value)}><option value="">{t("year")}</option>{Array.from({ length: Math.max(0, new Date().getFullYear() - 1887) }, (_, index) => new Date().getFullYear() - index).map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <label><select aria-label={t("minRating")} value={minRating} onChange={event => setMinRating(event.target.value)}><option value="">{t("rating")}</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}</select></label>
          <label><select aria-label={t("genre")} value={genreId} disabled={genresLoading || genresError} onChange={event => setGenreId(event.target.value)}><option value="">{t("genre")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
        </div>
        <form className={styles.movieSearch} onSubmit={submitFilmSearch}>
          <label className={styles.visuallyHidden} htmlFor="discover-film-query">{t("searchFilms")}</label>
          <input id="discover-film-query" value={filmInput} onChange={event => setFilmInput(event.target.value)} placeholder={t("searchFilms")} />
          <button type="submit" aria-label={t("search")}><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></button>
        </form>
      </div>
      {genresError && <RetryNotice className={styles.genreRetry} message={t("loadGenresError")} retryLabel={t("retry")} busy={genresLoading} onRetry={() => setGenresRetry(value => value + 1)} />}
    </header>

    <div className={styles.content}>
      <section className={styles.section} aria-labelledby="popular-films-title" aria-busy={loading.popular}>
        <div className={`${styles.heading} ${styles.popularHeading}`}><h2 id="popular-films-title" tabIndex={-1}>{t("popularFilms")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        {loading.popular && <><p className="srOnly" role="status">{t("loading")}</p><ol className={styles.popularGrid} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(item => <li key={item}><div className={`${styles.poster} ${styles.skeleton}`} /></li>)}</ol></>}
        {errors.popular && <RetryNotice className={styles.status} message={filmErrorMessage} retryLabel={t("retry")} busy={loading.popular} onRetry={() => retryFeed("popular")} />}
        {!loading.popular && !errors.popular && popular.length === 0 && <p className={styles.empty}>{t("noFilms")}</p>}
        {!loading.popular && !errors.popular && popular.length > 0 && <ol className={styles.popularGrid}>
          {popular.map((movie, index) => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}>
              <Link className={styles.poster} to={path(`/films/${movie.id}`)} aria-label={`${index + 1}. ${title}`} title={title} onFocus={revealFocusedPoster}>
                <span className={styles.rank} aria-hidden="true">{index + 1}</span>
                <ResilientImage src={movie.photoUrl} alt="" fallback={<span className={styles.fallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <Link className={styles.addFilm} to={path(`/films/${movie.id}`)} aria-label={`${t("openFilmDetails")}: ${title}`}><span aria-hidden="true">+</span></Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{title}</Link></h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p>
            </li>;
          })}
        </ol>}
      </section>

      <section className={styles.section} aria-labelledby="recent-films-title" aria-busy={loading.recent}>
        <div className={styles.heading}><h2 id="recent-films-title" tabIndex={-1}>{t("homeJustReviewed")}</h2><Link to={path("/reviews")}>{t("homeMore")}</Link></div>
        {loading.recent && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.posterRail} aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6, 7].map(item => <div className={`${styles.railPoster} ${styles.skeleton}`} key={item} />)}</div></>}
        {errors.recent && <RetryNotice className={styles.status} message={reviewErrorMessage} retryLabel={t("retry")} busy={loading.recent} onRetry={() => retryFeed("recent")} />}
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
        <div className={styles.heading}><h2 id="popular-reviews-title" tabIndex={-1}>{t("homePopularReviewsThisWeek")}</h2><Link to={path("/reviews")}>{t("viewAll")}</Link></div>
        {loading.reviews && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.reviewGrid} aria-hidden="true">{[0, 1, 2, 3].map(item => <div className={`${styles.reviewCard} ${styles.skeleton}`} key={item} />)}</div></>}
        {errors.reviews && <RetryNotice className={styles.status} message={reviewErrorMessage} retryLabel={t("retry")} busy={loading.reviews} onRetry={() => retryFeed("reviews")} />}
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
              {review.rating != null && <strong className={styles.reviewRating} role="img" aria-label={`${t("rating")}: ${review.rating}/5`}><img src="/images/movie-star.png" width={8} height={8} alt="" aria-hidden="true" />{review.rating.toFixed(1)}</strong>}
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
