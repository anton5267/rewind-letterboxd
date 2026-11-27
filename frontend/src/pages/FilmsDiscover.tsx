import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MovieCard } from "../api/search.api";
import { getPopularReviews, getRecentReviews, type RecentReview } from "../api/reviews.api";
import { getPublicListFeed, type MoviePreview, type PublicList } from "../api/lists.api";
import { getPublicWatchedFilmCount } from "../api/stats.api";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatReviewDate, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import { getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./FilmsDiscover.module.css";

type FeedKey = "popular" | "recent" | "reviews" | "crew";

function revealFocusedPoster(event: FocusEvent<HTMLAnchorElement>) {
  event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
}

export default function FilmsDiscover() {
  const { lang, path, t } = useLocale();
  const navigate = useNavigate();
  const [popular, setPopular] = useState<MovieCard[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genresError, setGenresError] = useState(false);
  const [genresRetry, setGenresRetry] = useState(0);
  const [filmInput, setFilmInput] = useState("");
  const [filmQuery, setFilmQuery] = useState("");
  const [filmSuggestions, setFilmSuggestions] = useState<MovieCard[]>([]);
  const [filmSuggestionsLoading, setFilmSuggestionsLoading] = useState(false);
  const [filmSuggestionsError, setFilmSuggestionsError] = useState(false);
  const [filmSuggestionsRetry, setFilmSuggestionsRetry] = useState(0);
  const [filmSearchFocused, setFilmSearchFocused] = useState(false);
  const [filmSearchDismissed, setFilmSearchDismissed] = useState(false);
  const [activeFilmSuggestion, setActiveFilmSuggestion] = useState(-1);
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [genreId, setGenreId] = useState("");
  const [recent, setRecent] = useState<RecentReview[]>([]);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [crewPicks, setCrewPicks] = useState<PublicList[]>([]);
  const [watchedFilmCount, setWatchedFilmCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<Record<FeedKey, boolean>>({ popular: true, recent: true, reviews: true, crew: true });
  const [errors, setErrors] = useState<Partial<Record<FeedKey, boolean>>>({});
  const [retry, setRetry] = useState<Record<FeedKey, number>>({ popular: 0, recent: 0, reviews: 0, crew: 0 });
  const retryFocus = useRef<Partial<Record<FeedKey, { origin: HTMLElement; lang: string }>>>({});
  const genreSelectRef = useRef<HTMLSelectElement>(null);
  const genreFeedbackRef = useRef<HTMLDivElement>(null);
  const genreRetryFocus = useRef<{ origin: Element | null; lang: string } | null>(null);

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
    const pending = genreRetryFocus.current;
    if (!pending || genresLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (genreRetryFocus.current !== pending) return;
      genreRetryFocus.current = null;
      if (pending.lang !== lang) return;
      if (document.activeElement === document.body || document.activeElement === pending.origin) {
        if (genresError) genreFeedbackRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
        else genreSelectRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [genresLoading, genresError, lang]);

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
    let current = true;
    setLoading(value => ({ ...value, crew: true }));
    setErrors(value => { const next = { ...value }; delete next.crew; return next; });
    setCrewPicks([]);
    getPublicListFeed("team", 0, undefined, 6)
      .then(({ data }) => { if (current) setCrewPicks(data.content); })
      .catch(() => { if (current) setErrors(value => ({ ...value, crew: true })); })
      .finally(() => { if (current) setLoading(value => ({ ...value, crew: false })); });
    return () => { current = false; };
  }, [lang, retry.crew]);

  useEffect(() => {
    let current = true;
    getPublicWatchedFilmCount()
      .then(({ data }) => {
        if (current && Number.isSafeInteger(data.count) && data.count >= 0) setWatchedFilmCount(data.count);
      })
      .catch(() => { if (current) setWatchedFilmCount(null); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    const query = filmInput.trim();
    setFilmSuggestions([]);
    setFilmSuggestionsError(false);
    setActiveFilmSuggestion(-1);
    if (!query) {
      setFilmSuggestionsLoading(false);
      return;
    }
    let current = true;
    setFilmSuggestionsLoading(true);
    const timer = window.setTimeout(() => {
      searchMovies({ q: query, sort: "newest", page: 0, size: 3 })
        .then(({ data }) => { if (current) setFilmSuggestions(data.content.slice(0, 3)); })
        .catch(() => { if (current) setFilmSuggestionsError(true); })
        .finally(() => { if (current) setFilmSuggestionsLoading(false); });
    }, 200);
    return () => { current = false; window.clearTimeout(timer); };
  }, [filmInput, filmSuggestionsRetry]);

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
        const section = document.querySelector<HTMLElement>(`[data-films-feed="${key}"]`);
        if (errors[key]) section?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
        else {
          const headingId = key === "popular" ? "popular-films-title" : key === "recent" ? "recent-films-title" : key === "reviews" ? "popular-reviews-title" : "crew-picks-title";
          document.getElementById(headingId)?.focus();
        }
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lang, loading, errors]);

  const retryFeed = (key: FeedKey) => {
    const origin = document.activeElement;
    if (origin instanceof HTMLElement) retryFocus.current[key] = { origin, lang };
    setRetry(value => ({ ...value, [key]: value[key] + 1 }));
  };

  const submitFilmSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (activeFilmSuggestion >= 0 && filmSuggestions[activeFilmSuggestion]) {
      navigate(path(`/films/${filmSuggestions[activeFilmSuggestion].id}`));
      setFilmSearchFocused(false);
      return;
    }
    setFilmQuery(filmInput.trim());
  };

  const filmSuggestionsOpen = filmSearchFocused && !filmSearchDismissed && Boolean(filmInput.trim())
    && (filmSuggestionsLoading || filmSuggestionsError || filmSuggestions.length > 0);

  const handleFilmSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && filmSuggestionsOpen) {
      event.preventDefault();
      setFilmSearchDismissed(true);
      setActiveFilmSuggestion(-1);
      return;
    }
    if (filmSuggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveFilmSuggestion(index => Math.min(index + 1, filmSuggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveFilmSuggestion(index => Math.max(index - 1, -1));
    }
  };

  const busy = Object.values(loading).some(Boolean);
  const crewMovies: MoviePreview[] = [];
  const seenCrewMovies = new Set<number>();
  crewPicks.forEach(list => {
    list.previewMovies?.forEach(movie => {
      if (seenCrewMovies.has(movie.id) || crewMovies.length >= 8) return;
      seenCrewMovies.add(movie.id);
      crewMovies.push(movie);
    });
  });
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
          <label><select ref={genreSelectRef} aria-label={t("genre")} value={genreId} disabled={genresLoading || genresError} onChange={event => setGenreId(event.target.value)}><option value="">{t("genre")}</option>{genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}</select></label>
        </div>
        <form className={styles.movieSearch} onSubmit={submitFilmSearch} onFocusCapture={() => setFilmSearchFocused(true)} onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFilmSearchFocused(false);
        }}>
          <label className={styles.visuallyHidden} htmlFor="discover-film-query">{t("searchFilms")}</label>
          <input id="discover-film-query" role="combobox" aria-autocomplete="list" aria-expanded={filmSuggestionsOpen} aria-controls="discover-film-suggestions" aria-activedescendant={activeFilmSuggestion >= 0 ? `discover-film-suggestion-${filmSuggestions[activeFilmSuggestion]?.id}` : undefined} value={filmInput} onKeyDown={handleFilmSearchKeyDown} onChange={event => { setFilmInput(event.target.value); setFilmSearchDismissed(false); }} placeholder={t("searchFilms")} />
          <button type="submit" aria-label={t("search")}><img src="/images/figma-movie-search.svg" width={31} height={31} alt="" /></button>
          {filmSuggestionsOpen && <>
            {filmSuggestionsLoading && <p className={styles.movieSearchStatus} role="status">{t("loading")}</p>}
            {filmSuggestionsError && <div className={styles.movieSearchStatus} role="alert">{t("loadFilmsError")} <button type="button" onClick={() => setFilmSuggestionsRetry(value => value + 1)}>{t("retry")}</button></div>}
            {!filmSuggestionsLoading && !filmSuggestionsError && filmSuggestions.length > 0 && <ul className={styles.movieSuggestions} id="discover-film-suggestions" role="listbox" aria-label={t("searchFilms")}>
              {filmSuggestions.map((movie, index) => <li key={movie.id}>
                <Link id={`discover-film-suggestion-${movie.id}`} role="option" aria-selected={activeFilmSuggestion === index} to={path(`/films/${movie.id}`)} onPointerDown={event => event.preventDefault()} onClick={() => setFilmSearchFocused(false)}>
                  {editorialText(movie.title, t("untitledFilm"))} ({formatMovieYear(movie.releaseDate, t("unknownYear"))})
                </Link>
              </li>)}
            </ul>}
          </>}
        </form>
      </div>
      {genresError && <div ref={genreFeedbackRef}><RetryNotice className={styles.genreRetry} message={t("loadGenresError")} retryLabel={t("retry")} busy={genresLoading} onRetry={() => {
        genreRetryFocus.current = { origin: document.activeElement, lang };
        setGenresRetry(value => value + 1);
      }} /></div>}
    </header>

    <div className={styles.content}>
      <section className={styles.section} data-films-feed="popular" aria-labelledby="popular-films-title" aria-busy={loading.popular}>
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
                <ResilientImage src={movie.photoUrl} alt="" fallback={<span className={styles.fallback} aria-hidden="true">{title}</span>} />
              </Link>
              <Link className={styles.addFilm} to={path(`/films/${movie.id}`)} aria-label={`${t("openFilmDetails")}: ${title}`}><span aria-hidden="true">+</span></Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{title}</Link></h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p>
            </li>;
          })}
        </ol>}
      </section>

      <section className={styles.section} data-films-feed="recent" data-empty-feed={!loading.recent && !errors.recent && recent.length === 0 ? "true" : undefined} aria-labelledby="recent-films-title" aria-busy={loading.recent}>
        <div className={`${styles.heading} ${styles.recentHeading}`}><h2 id="recent-films-title" tabIndex={-1}>{t("homeJustReviewed")}</h2>{watchedFilmCount !== null && <span className={styles.watchedFilmCount} data-testid="films-watched-count">{watchedFilmCount.toLocaleString(lang === "uk" ? "uk-UA" : "en-US")} {t("filmsWatched")}</span>}</div>
        {loading.recent && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.posterRail} aria-hidden="true">{[0, 1, 2, 3, 4, 5, 6, 7].map(item => <div className={`${styles.railPoster} ${styles.skeleton}`} key={item} />)}</div></>}
        {errors.recent && <RetryNotice className={styles.status} message={reviewErrorMessage} retryLabel={t("retry")} busy={loading.recent} onRetry={() => retryFeed("recent")} />}
        {!loading.recent && !errors.recent && recent.length === 0 && <p className={styles.empty}>{t("noRecentReviews")}</p>}
        {!loading.recent && !errors.recent && recent.length > 0 && <div className={styles.posterRail} role="group" aria-label={t("homeJustReviewed")}>
          {recent.map(review => {
            const title = editorialText(review.movieTitle, t("untitledFilm"));
            return <Link className={styles.railPoster} key={review.movieId} to={path(`/films/${review.movieId}`)} aria-label={title} title={title} onFocus={revealFocusedPoster}>
              <ResilientImage src={review.moviePhotoUrl} alt="" loading="lazy" fallback={<span className={styles.railFallback} aria-hidden="true">{title}</span>} />
            </Link>;
          })}
        </div>}
      </section>

      <section className={styles.section} data-films-feed="reviews" data-empty-feed={!loading.reviews && !errors.reviews && reviews.length === 0 ? "true" : undefined} aria-labelledby="popular-reviews-title" aria-busy={loading.reviews}>
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
                <ResilientImage src={review.moviePhotoUrl} alt="" loading="lazy" fallback={<span className={styles.fallback} aria-hidden="true">{title}</span>} />
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

      <section className={`${styles.section} ${styles.crewSection}`} data-films-feed="crew" data-after-empty-reviews={!loading.recent && !errors.recent && recent.length === 0 && !loading.reviews && !errors.reviews && reviews.length === 0 ? "true" : undefined} aria-labelledby="crew-picks-title" aria-busy={loading.crew}>
        <div className={styles.heading}><h2 id="crew-picks-title" tabIndex={-1}>{t("crewPicks")}</h2><Link to={path("/lists/discover?feed=team")}>{t("homeMore")}</Link></div>
        {loading.crew && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.posterRail} aria-hidden="true">{[0, 1, 2, 3].map(item => <div className={`${styles.railPoster} ${styles.skeleton}`} key={item} />)}</div></>}
        {errors.crew && <RetryNotice className={styles.status} message={t("loadCrewPicksError")} retryLabel={t("retry")} busy={loading.crew} onRetry={() => retryFeed("crew")} />}
        {!loading.crew && !errors.crew && crewMovies.length === 0 && <p className={styles.empty}>{t("noCrewPicks")}</p>}
        {!loading.crew && !errors.crew && crewMovies.length > 0 && <div className={styles.posterRail} role="group" aria-label={t("crewPicks")}>
          {crewMovies.map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <Link className={styles.railPoster} key={movie.id} to={path(`/films/${movie.id}`)} aria-label={title} title={title} onFocus={revealFocusedPoster}>
              <ResilientImage src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.railFallback} aria-hidden="true">{title}</span>} />
            </Link>;
          })}
        </div>}
      </section>

    </div>
  </main>;
}
