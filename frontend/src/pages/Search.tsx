import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MoviePage, type MovieSearchParams } from "../api/search.api";
import { discoverTmdbMovies, importTmdbMovie, searchTmdbMovies, type TmdbMovieCandidate } from "../api/movies.api";
import { useAuth } from "../context/AuthContext";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatMovieCount, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import styles from "./Search.module.css";

const PAGE_ROWS = 6;
const getPageSize = () => window.matchMedia("(max-width: 820px)").matches
  ? 4 * PAGE_ROWS
  : window.matchMedia("(max-width: 1100px)").matches
    ? 5 * PAGE_ROWS
    : 6 * PAGE_ROWS;
const MAX_PAGE = 2_147_483_647; // The API binds page to a Java int.

function getVisiblePages(page: number, totalPages: number) {
  const pages = [...new Set([0, 1, 2, page - 1, page, page + 1, totalPages - 1])]
    .filter(value => value >= 0 && value < totalPages)
    .sort((left, right) => left - right);

  return pages.flatMap((value, index) => [
    ...(index > 0 && value - pages[index - 1] > 1 ? [{ type: "ellipsis" as const }] : []),
    { type: "page" as const, value },
  ]);
}

export default function Search() {
  const { lang, path, t } = useLocale();
  const { isAuth, ready } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [genreId, setGenreId] = useState(searchParams.get("genreId") ?? "");
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);
  const [genreError, setGenreError] = useState(false);
  const [genreRetry, setGenreRetry] = useState(0);
  const [results, setResults] = useState<MoviePage | null>(null);
  const [pageSize, setPageSize] = useState(getPageSize);
  const pageSizeRef = useRef(pageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [tmdbResults, setTmdbResults] = useState<TmdbMovieCandidate[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState(false);
  const [tmdbImportId, setTmdbImportId] = useState<number | null>(null);
  const [tmdbImportError, setTmdbImportError] = useState(false);
  const [tmdbPage, setTmdbPage] = useState(1);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(0);
  const [tmdbDiscoverResults, setTmdbDiscoverResults] = useState<TmdbMovieCandidate[]>([]);
  const [tmdbDiscoverTotalPages, setTmdbDiscoverTotalPages] = useState(0);
  const [tmdbDiscoverLoading, setTmdbDiscoverLoading] = useState(false);
  const [tmdbDiscoverError, setTmdbDiscoverError] = useState(false);
  const [tmdbDiscoverRetry, setTmdbDiscoverRetry] = useState(0);
  const [tmdbDiscoveryOpen, setTmdbDiscoveryOpen] = useState(false);
  const [tmdbYearFilter, setTmdbYearFilter] = useState(searchParams.get("tmdbYear") ?? "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filtersFormRef = useRef<HTMLFormElement>(null);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const filterWasOpen = useRef(false);
  const searchRetryScope = JSON.stringify([lang, searchKey, pageSize]);
  const pendingSearchRetryFocus = useRef<{ target: "genres" | "results"; scope: string; origin: HTMLElement | null } | null>(null);

  useEffect(() => {
    if (pendingSearchRetryFocus.current?.scope !== searchRetryScope) pendingSearchRetryFocus.current = null;
  }, [searchRetryScope]);

  useEffect(() => {
    const pending = pendingSearchRetryFocus.current;
    if (!pending) return;
    const isLoading = pending.target === "genres" ? genresLoading : loading;
    if (isLoading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingSearchRetryFocus.current !== pending) return;
      pendingSearchRetryFocus.current = null;
      if (pending.scope !== searchRetryScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const failed = pending.target === "genres" ? genreError : Boolean(error);
      if (failed) {
        document.querySelector<HTMLButtonElement>(`[data-search-retry="${pending.target}"] [data-retry-button]`)?.focus();
      } else if (pending.target === "genres") {
        const genre = document.getElementById("film-search-genre");
        if (genre?.getClientRects().length) genre.focus();
        else filterToggleRef.current?.focus();
      } else {
        document.querySelector<HTMLElement>("[data-search-results-focus]")?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, genreError, genres, genresLoading, loading, results, searchRetryScope]);

  const retrySearchRequest = (target: "genres" | "results") => {
    pendingSearchRetryFocus.current = { target, scope: searchRetryScope, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    if (target === "genres") {
      setGenresLoading(true); setGenreError(false); setGenreRetry(value => value + 1);
    } else {
      setLoading(true); setError(""); setRetry(value => value + 1);
    }
  };

  useEffect(() => {
    const updatePageSize = () => {
      const nextPageSize = getPageSize();
      const previousPageSize = pageSizeRef.current;
      if (nextPageSize === previousPageSize) return;

      const params = new URLSearchParams(window.location.search);
      const currentPage = Number(params.get("page") ?? 0);
      const safePage = Number.isSafeInteger(currentPage) && currentPage >= 0 ? currentPage : 0;
      const nextPage = Math.min(MAX_PAGE, Math.floor((safePage * previousPageSize) / nextPageSize));
      if (nextPage > 0) params.set("page", String(nextPage));
      else params.delete("page");

      pageSizeRef.current = nextPageSize;
      setPageSize(nextPageSize);
      setSearchParams(params, { replace: true });
    };
    window.addEventListener("resize", updatePageSize, { passive: true });
    return () => window.removeEventListener("resize", updatePageSize);
  }, [setSearchParams]);

  useEffect(() => {
    setGenreError(false);
    setGenresLoading(true);
    let current = true;
    getGenres().then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) { setGenres([]); setGenreError(true); } })
      .finally(() => { if (current) setGenresLoading(false); });
    return () => { current = false; };
  }, [lang, genreRetry]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    setQuery(params.get("q") ?? "");
    setGenreId(params.get("genreId") ?? "");
    setYear(params.get("year") ?? "");
    setMinRating(params.get("minRating") ?? "");
    setSort(params.get("sort") ?? "newest");

    const requestedPage = Number(params.get("page") ?? 0);
    const validPage = Number.isSafeInteger(requestedPage) && requestedPage >= 0 && requestedPage <= MAX_PAGE;
    if (params.has("page") && !validPage) {
      params.set("page", "0");
      setSearchParams(params, { replace: true });
      return;
    }

    const request: MovieSearchParams = {
      q: params.get("q") || undefined,
      genreId: params.get("genreId") || undefined,
      year: params.get("year") || undefined,
      minRating: params.get("minRating") || undefined,
      sort: params.get("sort") || "newest",
      page: requestedPage,
      size: pageSize,
    };
    let current = true;
    setLoading(true);
    setError("");
    searchMovies(request).then(({ data }) => {
      if (!current) return;
      if (isPageOutOfRange(request.page, data.totalPages)) {
        const next = new URLSearchParams(params);
        next.set("page", String(getLastPageIndex(data.totalPages)));
        setSearchParams(next, { replace: true });
        return;
      }
      setResults(data);
    })
      .catch(() => { if (current) { setResults(null); setError(t("loadFilmsError")); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [searchKey, lang, retry, pageSize]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const q = params.get("q")?.trim() ?? "";
    setTmdbResults([]);
    setTmdbError(false);
    setTmdbImportError(false);
    setTmdbPage(1);
    setTmdbTotalPages(0);
    if (q.length < 2) { setTmdbLoading(false); return; }
    let current = true;
    setTmdbLoading(true);
    const timer = window.setTimeout(() => {
      searchTmdbMovies(q, params.get("year") || undefined, 1, lang)
        .then(({ data }) => { if (current) { setTmdbResults(data.content); setTmdbTotalPages(data.totalPages); } })
        .catch(() => { if (current) setTmdbError(true); })
        .finally(() => { if (current) setTmdbLoading(false); });
    }, 250);
    return () => { current = false; window.clearTimeout(timer); };
  }, [searchKey, lang]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    setTmdbYearFilter(params.get("tmdbYear") ?? "");
    if ((params.get("q")?.trim().length ?? 0) >= 2) {
      setTmdbDiscoveryOpen(false);
      setTmdbDiscoverLoading(false);
      return;
    }
    if (!tmdbDiscoveryOpen) {
      setTmdbDiscoverLoading(false);
      return;
    }
    const parsePositive = (value: string | null, max: number) => {
      if (!value || !/^\d+$/.test(value)) return undefined;
      const parsed = Number(value);
      return Number.isSafeInteger(parsed) && parsed > 0 && parsed <= max ? parsed : undefined;
    };
    const page = parsePositive(params.get("tmdbPage"), 500) ?? 1;
    const genreId = parsePositive(params.get("tmdbGenreId"), 2_147_483_647);
    const rawYear = parsePositive(params.get("tmdbYear"), 2100);
    const year = rawYear !== undefined && rawYear >= 1888 ? rawYear : undefined;
    const minRating = params.get("tmdbMinRating");
    const rating = minRating && /^(?:[0-9](?:\.[0-9])?|10(?:\.0)?)$/.test(minRating) ? Number(minRating) : undefined;
    if (rating !== undefined && (rating < 0 || rating > 10)) return;
    let current = true;
    setTmdbDiscoverLoading(true);
    setTmdbDiscoverError(false);
    discoverTmdbMovies({ page, genreId, year, minRating: rating, language: lang })
      .then(({ data }) => { if (current) { setTmdbDiscoverResults(data.content); setTmdbDiscoverTotalPages(data.totalPages); } })
      .catch(() => { if (current) { setTmdbDiscoverResults([]); setTmdbDiscoverTotalPages(0); setTmdbDiscoverError(true); } })
      .finally(() => { if (current) setTmdbDiscoverLoading(false); });
    return () => { current = false; };
  }, [searchKey, lang, tmdbDiscoverRetry, tmdbDiscoveryOpen]);

  const loadTmdbPage = (page: number) => {
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || page < 1 || page > 500) return;
    setTmdbLoading(true); setTmdbError(false); setTmdbImportError(false);
    searchTmdbMovies(q, searchParams.get("year") || undefined, page, lang)
      .then(({ data }) => { setTmdbResults(data.content); setTmdbTotalPages(data.totalPages); setTmdbPage(data.page); })
      .catch(() => setTmdbError(true))
      .finally(() => setTmdbLoading(false));
  };

  const addTmdbMovie = async (candidate: TmdbMovieCandidate) => {
    if (!isAuth) {
      navigate(path("/login"), { state: { returnTo: `${location.pathname}${location.search}${location.hash}` } });
      return;
    }
    setTmdbImportId(candidate.tmdbId); setTmdbImportError(false);
    try {
      const { data } = await importTmdbMovie(candidate.tmdbId);
      navigate(path(`/films/${data.movieId}`));
    } catch {
      setTmdbImportError(true);
    } finally { setTmdbImportId(null); }
  };

  useEffect(() => {
    if (mobileFiltersOpen && !filterWasOpen.current) {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        const firstControl = queryInputRef.current ?? filtersFormRef.current?.querySelector<HTMLElement>("select:not(:disabled), input:not(:disabled), button:not(:disabled)");
        firstControl?.focus();
      }));
    } else if (!mobileFiltersOpen && filterWasOpen.current) {
      window.requestAnimationFrame(() => filterToggleRef.current?.focus());
    }
    filterWasOpen.current = mobileFiltersOpen;
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setMobileFiltersOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileFiltersOpen]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filtersForm = filtersFormRef.current;
    if (filtersForm && event.currentTarget !== filtersForm && !filtersForm.reportValidity()) return;
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (genreId) next.set("genreId", genreId);
    if (year) next.set("year", year);
    if (minRating) next.set("minRating", minRating);
    if (sort !== "newest") next.set("sort", sort);
    setSearchParams(next);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLElement) {
      window.requestAnimationFrame(() => {
        if (submitter.isConnected && !submitter.matches(":disabled")) submitter.focus({ preventScroll: true });
      });
    }
  };

  const applyDesktopFilterChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    if (!window.matchMedia("(min-width: 1400px)").matches) return;
    const form = event.currentTarget;
    if (!form.checkValidity()) return;
    const value = (id: string) => form.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value ?? "";
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    const nextGenre = value("film-search-genre");
    const nextYear = value("film-search-year");
    const nextRating = value("film-search-rating");
    const nextSort = value("film-search-sort");
    if (nextGenre) next.set("genreId", nextGenre);
    if (nextYear) next.set("year", nextYear);
    if (nextRating) next.set("minRating", nextRating);
    if (nextSort !== "newest") next.set("sort", nextSort);
    setSearchParams(next);
  };

  const turnPage = (page: number) => {
    const next = new URLSearchParams(searchKey);
    next.set("page", String(page));
    setSearchParams(next);
  };

  const clearFilmQuery = () => {
    setQuery("");
    const next = new URLSearchParams(searchKey);
    next.delete("q");
    next.delete("page");
    setSearchParams(next);
  };

  const updateTmdbDiscoveryFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchKey);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("tmdbPage");
    setSearchParams(next);
  };

  const turnTmdbDiscoveryPage = (page: number) => {
    const next = new URLSearchParams(searchKey);
    if (page <= 1) next.delete("tmdbPage");
    else next.set("tmdbPage", String(page));
    setSearchParams(next);
  };

  return <main className={styles.page} aria-labelledby="films-page-title" aria-busy={loading || genresLoading}>
    <div className={styles.shell}>
      <section className={`${styles.hero} ${mobileFiltersOpen ? styles.heroFiltersOpen : ""}`}>
        <div className={styles.heroBar}>
          <Link className={styles.mobileBack} to={path("/home")} aria-label={t("home")}>←</Link>
          <div className={styles.heroTitle}>
            <p className={styles.eyebrow}>{t("searchEyebrow")}</p>
            <h1 id="films-page-title">{t("films")}</h1>
          </div>
          <button
            ref={filterToggleRef}
            className={styles.filterToggle}
            type="button"
            aria-controls="film-filter-controls"
            aria-expanded={mobileFiltersOpen}
            aria-label={mobileFiltersOpen ? t("close") : t("filters")}
            onClick={() => setMobileFiltersOpen(open => !open)}
          >
            <span className={styles.filterIcon} aria-hidden="true"><i className="fa-solid fa-sliders" /></span>
          </button>
          <div className={styles.filterSummary} aria-hidden="true">
            <span>{t("year")}</span><span className={styles.filterSummaryArrow}>⌄</span>
            <span>{t("rating")}</span><span className={styles.filterSummaryArrow}>⌄</span>
            <span>{t("genre")}</span>
          </div>
        </div>
        <p className={styles.heroIntro}>{t("searchIntro")}</p>
        <form className={styles.searchForm} onSubmit={applyFilters} aria-busy={loading}>
          <label className={styles.queryField} htmlFor="film-search-query">{t("searchFilms")}
            <input ref={queryInputRef} id="film-search-query" aria-label={t("searchFilms")} placeholder={results ? `${t("resultsCount")}: ${results.totalElements}` : t("searchFilms")} value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <button className={styles.submit} type="submit" aria-label={t("search")} aria-busy={loading}><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /><span className={styles.submitLabel}>{t("search")}</span></button>
          {results && <p className={styles.catalogCount} role="status">{lang === "uk" ? "У каталозі" : "There are"} {formatMovieCount(results.totalElements, lang)}.</p>}
        </form>
      </section>

      <form ref={filtersFormRef} id="film-filter-controls" className={`${styles.filters} ${mobileFiltersOpen ? styles.filtersOpen : ""}`} onSubmit={applyFilters} onChange={applyDesktopFilterChange} aria-label={t("filters")} aria-busy={genresLoading || loading}>
        <label htmlFor="film-search-year">{t("year")}
          <input id="film-search-year" type="number" min="1888" max="2100" placeholder={t("year")} value={year} onChange={event => setYear(event.target.value)} />
        </label>
        <label htmlFor="film-search-rating">{t("minRating")}
          <select id="film-search-rating" value={minRating} onChange={event => setMinRating(event.target.value)}>
          <option value="">{t("rating")}</option>
            {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}
          </select>
        </label>
        <label htmlFor="film-search-genre">{t("genre")}
          <select id="film-search-genre" aria-busy={genresLoading} value={genreId} disabled={genresLoading || genreError} onChange={event => setGenreId(event.target.value)}>
            <option value="">{t("genre")}</option>
            {genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}
          </select>
        </label>
        <label htmlFor="film-search-sort">{t("sortBy")}
          <select id="film-search-sort" value={sort} onChange={event => setSort(event.target.value)}>
            <option value="newest">{t("sortNewest")}</option>
            <option value="oldest">{t("sortOldest")}</option>
            <option value="rating_desc">{t("sortBestRated")}</option>
            <option value="rating_asc">{t("sortLowestRated")}</option>
            <option value="title_asc">{t("sortTitle")}</option>
          </select>
        </label>
        <button className={styles.filterSubmit} type="submit">{t("applyFilters")}</button>
      </form>

      {genreError && <div data-search-retry="genres"><RetryNotice className={styles.alert} message={t("loadGenresError")} retryLabel={t("retry")} busy={genresLoading} onRetry={() => retrySearchRequest("genres")} /></div>}
      {loading && <><p className="srOnly" role="status">{t("loadingFilms")}</p><div className={styles.grid} aria-hidden="true">{Array.from({ length: 12 }, (_, item) => <div className={styles.card} key={item}><div className={`${styles.posterLink} ${styles.skeleton}`} /></div>)}</div></>}
      {error && <div data-search-retry="results"><RetryNotice className={styles.alert} message={error} retryLabel={t("retry")} busy={loading} onRetry={() => retrySearchRequest("results")} /></div>}
      {!loading && !error && results?.content.length === 0 && <div className={styles.emptyState}>
        <p className={styles.empty}>{t("noFilms")}</p>
        {searchParams.get("q")?.trim() && <button className={styles.clearSearch} type="button" onClick={clearFilmQuery}>{t("clearSearch")}</button>}
      </div>}
      {!loading && !error && results && <>
        <section className={styles.results} aria-label={t("films")} tabIndex={-1} data-search-results-focus="true">
          <div className={styles.resultsBar}><p role="status">{t("resultsCount")}: {results.totalElements}</p>{results.totalPages > 0 && <span>{results.number + 1} / {results.totalPages}</span>}</div>
          <div className={styles.grid}>
          {results.content.map(movie => {
            const movieTitle = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.card} key={movie.id}>
              <Link className={styles.posterLink} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
                <ResilientImage className={styles.poster} src={movie.photoUrl} alt={movieTitle} fallback={<span className={styles.posterFallback}>{movieTitle}</span>} />
                <span className={styles.posterHoverOverlay} data-poster-hover-overlay aria-hidden="true">
                  <span className={styles.posterActionTray} data-poster-action-tray>
                    <i className="fa-regular fa-eye" />
                    <i className="fa-regular fa-heart" />
                    <i className="fa-solid fa-ellipsis" />
                  </span>
                </span>
              </Link>
              <h2><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h2>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
            </article>;
          })}
          </div>
          {results.totalPages > 1 && <nav className={styles.pagination} aria-label={t("pagination")} aria-busy={loading}>
            <button
              className={styles.mobilePageControl}
              type="button"
              disabled={loading || results.number === 0}
              aria-label={t("previous")}
              onClick={() => turnPage(results.number - 1)}
            ><span aria-hidden="true">‹</span>{t("previous")}</button>
            {getVisiblePages(results.number, results.totalPages).map((item, index) => item.type === "ellipsis"
              ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
              : <button
                key={item.value}
                className={styles.pageNumber}
                type="button"
                aria-label={`${t("page")} ${item.value + 1}`}
                aria-current={item.value === results.number ? "page" : undefined}
                disabled={loading}
                onClick={() => turnPage(item.value)}
              >{item.value + 1}</button>)}
            <button
              className={styles.mobilePageControl}
              type="button"
              disabled={loading || results.number + 1 >= results.totalPages}
              aria-label={t("next")}
              onClick={() => turnPage(results.number + 1)}
            >{t("next")}<span aria-hidden="true">›</span></button>
            <span className={styles.visuallyHidden} role="status">{t("page")} {results.number + 1} {t("of")} {results.totalPages}</span>
          </nav>}
        </section>
      </>}

      {(searchParams.get("q")?.trim().length ?? 0) >= 2 && <section className={styles.tmdbSection} aria-labelledby="tmdb-film-results-title" aria-busy={tmdbLoading}>
        <div className={styles.tmdbHeading}>
          <div><h2 id="tmdb-film-results-title">{t("tmdbSearchTitle")}</h2><p>{t("tmdbSearchHint")}</p></div>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="TMDB">TMDB</a>
        </div>
        {tmdbLoading && <p role="status" className={styles.tmdbStatus}>{t("loading")}</p>}
        {tmdbError && <div className={styles.alert} role="alert">{t("tmdbSearchError")} <button type="button" onClick={() => loadTmdbPage(tmdbPage)}>{t("retry")}</button></div>}
        {tmdbImportError && <p className={styles.alert} role="alert">{t("tmdbImportMovieError")}</p>}
        {!tmdbLoading && !tmdbError && tmdbResults.length === 0 && <p className={styles.tmdbStatus}>{t("tmdbNoMatches")}</p>}
        {!tmdbLoading && !tmdbError && tmdbResults.length > 0 && <div className={styles.tmdbGrid}>
          {tmdbResults.map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.tmdbCard} key={movie.tmdbId}>
              <a className={styles.tmdbPoster} href={`https://www.themoviedb.org/movie/${movie.tmdbId}`} target="_blank" rel="noreferrer" aria-label={`${title} · TMDB`}>
                <ResilientImage className={styles.poster} src={movie.posterUrl} alt="" fallback={<span className={styles.posterFallback}>{title}</span>} />
              </a>
              <h3>{title}</h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))} · TMDB</p>
              {movie.overview?.trim() && <p className={styles.tmdbOverview}>{movie.overview}</p>}
              {isAuth
                ? <button className={styles.tmdbAdd} type="button" disabled={!ready || tmdbImportId !== null} onClick={() => void addTmdbMovie(movie)}>{tmdbImportId === movie.tmdbId ? t("loading") : t("tmdbAddToRewind")}</button>
                : <Link className={styles.tmdbAdd} to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}>{t("login")}</Link>}
            </article>;
          })}
        </div>}
        {!tmdbLoading && !tmdbError && tmdbTotalPages > 1 && <nav className={styles.tmdbPagination} aria-label={t("tmdbSearchTitle")}>
          <button type="button" disabled={tmdbPage <= 1} onClick={() => loadTmdbPage(tmdbPage - 1)}>{t("previous")}</button>
          <span>{tmdbPage} / {tmdbTotalPages}</span>
          <button type="button" disabled={tmdbPage >= tmdbTotalPages} onClick={() => loadTmdbPage(tmdbPage + 1)}>{t("next")}</button>
        </nav>}
      </section>}

      {(searchParams.get("q")?.trim().length ?? 0) < 2 && <details className={styles.tmdbSection} aria-busy={tmdbDiscoverLoading} onToggle={event => setTmdbDiscoveryOpen(event.currentTarget.open)}>
        <summary className={styles.tmdbSummary}>
          <span className={styles.tmdbHeading}>
            <span><span id="tmdb-discover-title" role="heading" aria-level={2}>{t("tmdbDiscoverTitle")}</span><span className={styles.tmdbHint}>{t("tmdbDiscoverHint")}</span></span>
            <span aria-hidden="true">TMDB</span>
          </span>
        </summary>
        {tmdbDiscoveryOpen && <div>
        <div className={styles.tmdbFilters} aria-label={t("filters")}>
          <label htmlFor="tmdb-discover-genre">{t("genre")}
            <select id="tmdb-discover-genre" value={searchParams.get("tmdbGenreId") ?? ""} disabled={genresLoading || genreError} onChange={event => updateTmdbDiscoveryFilter("tmdbGenreId", event.target.value)}>
              <option value="">{t("allGenres")}</option>
              {genres.filter(genre => Number.isSafeInteger(genre.tmdbId) && Number(genre.tmdbId) > 0).map(genre => <option key={genre.id} value={genre.tmdbId!}>{localizeGenreName(genre.name, lang)}</option>)}
            </select>
          </label>
          <label htmlFor="tmdb-discover-year">{t("year")}
            <input id="tmdb-discover-year" type="number" min="1888" max="2100" value={tmdbYearFilter} onChange={event => {
              const value = event.target.value;
              setTmdbYearFilter(value);
              if (!value || (/^\d{4}$/.test(value) && Number(value) >= 1888 && Number(value) <= 2100)) updateTmdbDiscoveryFilter("tmdbYear", value);
            }} />
          </label>
          <label htmlFor="tmdb-discover-rating">{t("minRating")}
            <select id="tmdb-discover-rating" value={searchParams.get("tmdbMinRating") ?? ""} onChange={event => updateTmdbDiscoveryFilter("tmdbMinRating", event.target.value)}>
              <option value="">{t("anyRating")}</option>
              {[5, 6, 7, 8].map(value => <option key={value} value={value}>{value}+</option>)}
            </select>
          </label>
        </div>
        {genreError && <p className={styles.tmdbStatus}>{t("loadGenresError")}</p>}
        {tmdbDiscoverLoading && <p role="status" className={styles.tmdbStatus}>{t("loading")}</p>}
        {tmdbDiscoverError && <div className={styles.alert} role="alert">{t("tmdbDiscoverError")} <button type="button" onClick={() => setTmdbDiscoverRetry(value => value + 1)}>{t("retry")}</button></div>}
        {tmdbImportError && <p className={styles.alert} role="alert">{t("tmdbImportMovieError")}</p>}
        {!tmdbDiscoverLoading && !tmdbDiscoverError && tmdbDiscoverResults.length === 0 && <p className={styles.tmdbStatus}>{t("tmdbDiscoverEmpty")}</p>}
        {!tmdbDiscoverLoading && !tmdbDiscoverError && tmdbDiscoverResults.length > 0 && <div className={styles.tmdbGrid}>
          {tmdbDiscoverResults.map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.tmdbCard} key={movie.tmdbId}>
              <a className={styles.tmdbPoster} href={`https://www.themoviedb.org/movie/${movie.tmdbId}`} target="_blank" rel="noreferrer" aria-label={`${title} · TMDB`}>
                <ResilientImage className={styles.poster} src={movie.posterUrl} alt="" fallback={<span className={styles.posterFallback}>{title}</span>} />
              </a>
              <h3>{title}</h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.voteAverage != null ? ` · ★ ${movie.voteAverage.toFixed(1)}` : ""} · TMDB</p>
              {movie.overview?.trim() && <p className={styles.tmdbOverview}>{movie.overview}</p>}
              {isAuth
                ? <button className={styles.tmdbAdd} type="button" disabled={!ready || tmdbImportId !== null} onClick={() => void addTmdbMovie(movie)}>{tmdbImportId === movie.tmdbId ? t("loading") : t("tmdbAddToRewind")}</button>
                : <Link className={styles.tmdbAdd} to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}>{t("login")}</Link>}
            </article>;
          })}
        </div>}
        {!tmdbDiscoverLoading && !tmdbDiscoverError && <nav className={styles.tmdbPagination} aria-label={t("tmdbDiscoverTitle")}>
          <button type="button" disabled={(Number(searchParams.get("tmdbPage")) || 1) <= 1} onClick={() => turnTmdbDiscoveryPage((Number(searchParams.get("tmdbPage")) || 1) - 1)}>{t("previous")}</button>
          <span>{Number(searchParams.get("tmdbPage")) || 1}</span>
          <button type="button" disabled={(Number(searchParams.get("tmdbPage")) || 1) >= tmdbDiscoverTotalPages} onClick={() => turnTmdbDiscoveryPage((Number(searchParams.get("tmdbPage")) || 1) + 1)}>{t("next")}</button>
        </nav>}
        <p className={styles.tmdbAttribution}>{t("tmdbAttribution")}</p>
        </div>}
      </details>}
    </div>
  </main>;
}
