import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MoviePage, type MovieSearchParams } from "../api/search.api";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const filtersFormRef = useRef<HTMLFormElement>(null);
  const filterToggleRef = useRef<HTMLButtonElement>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const filterWasOpen = useRef(false);

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
  };

  const turnPage = (page: number) => {
    const next = new URLSearchParams(searchKey);
    next.set("page", String(page));
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
          <label className={styles.sortControl} htmlFor="film-search-sort">{t("sortBy")}
            <select id="film-search-sort" value={sort} onChange={event => setSort(event.target.value)}>
              <option value="newest">{t("sortNewest")}</option>
              <option value="oldest">{t("sortOldest")}</option>
              <option value="rating_desc">{t("sortBestRated")}</option>
              <option value="rating_asc">{t("sortLowestRated")}</option>
              <option value="title_asc">{t("sortTitle")}</option>
            </select>
          </label>
          <button className={styles.submit} type="submit" aria-busy={loading}>{t("search")}</button>
        </form>
      </section>

      <form ref={filtersFormRef} id="film-filter-controls" className={`${styles.filters} ${mobileFiltersOpen ? styles.filtersOpen : ""}`} onSubmit={applyFilters} aria-label={t("filters")} aria-busy={genresLoading || loading}>
        <label htmlFor="film-search-genre">{t("genre")}
          <select id="film-search-genre" aria-busy={genresLoading} value={genreId} disabled={genresLoading || genreError} onChange={event => setGenreId(event.target.value)}>
            <option value="">{t("allGenres")}</option>
            {genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}
          </select>
        </label>
        <label htmlFor="film-search-year">{t("year")}
          <input id="film-search-year" type="number" min="1888" max="2100" value={year} onChange={event => setYear(event.target.value)} />
        </label>
        <label htmlFor="film-search-rating">{t("minRating")}
          <select id="film-search-rating" value={minRating} onChange={event => setMinRating(event.target.value)}>
            <option value="">{t("anyRating")}</option>
            {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}
          </select>
        </label>
        <button className={styles.filterSubmit} type="submit">{t("applyFilters")}</button>
      </form>

      {genreError && <RetryNotice className={styles.alert} message={t("loadGenresError")} retryLabel={t("retry")} busy={genresLoading} onRetry={() => setGenreRetry(value => value + 1)} />}
      {loading && <><p className="srOnly" role="status">{t("loadingFilms")}</p><div className={styles.grid} aria-hidden="true">{Array.from({ length: 12 }, (_, item) => <div className={styles.card} key={item}><div className={`${styles.posterLink} ${styles.skeleton}`} /></div>)}</div></>}
      {error && <RetryNotice className={styles.alert} message={error} retryLabel={t("retry")} busy={loading} onRetry={() => setRetry(value => value + 1)} />}
      {!loading && !error && results?.content.length === 0 && <p className={styles.empty}>{t("noFilms")}</p>}
      {!loading && !error && results && <>
        <section className={styles.results} aria-label={t("films")}>
          <div className={styles.resultsBar}><p role="status">{t("resultsCount")}: {results.totalElements}</p>{results.totalPages > 0 && <span>{results.number + 1} / {results.totalPages}</span>}</div>
          <div className={styles.grid}>
          {results.content.map(movie => {
            const movieTitle = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.card} key={movie.id}>
              <Link className={styles.posterLink} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
                <ResilientImage className={styles.poster} src={movie.photoUrl} alt={movieTitle} fallback={<span className={styles.posterFallback}>{movieTitle}</span>} />
              </Link>
              <h2><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h2>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
            </article>;
          })}
          </div>
          {results.totalPages > 1 && <nav className={styles.pagination} aria-label={t("pagination")} aria-busy={loading}>
            {getVisiblePages(results.number, results.totalPages).map((item, index) => item.type === "ellipsis"
              ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
              : <button
                key={item.value}
                type="button"
                aria-label={`${t("page")} ${item.value + 1}`}
                aria-current={item.value === results.number ? "page" : undefined}
                disabled={loading}
                onClick={() => turnPage(item.value)}
              >{item.value + 1}</button>)}
            <span className={styles.visuallyHidden} role="status">{t("page")} {results.number + 1} {t("of")} {results.totalPages}</span>
          </nav>}
        </section>
      </>}
    </div>
  </main>;
}
