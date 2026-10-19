import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MoviePage, type MovieSearchParams } from "../api/search.api";
import ResilientImage from "../components/ResilientImage";
import { localizeGenreName, useLocale } from "../i18n";
import styles from "./Search.module.css";

const PAGE_SIZE = 12;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

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

    const request: MovieSearchParams = {
      q: params.get("q") || undefined,
      genreId: params.get("genreId") || undefined,
      year: params.get("year") || undefined,
      minRating: params.get("minRating") || undefined,
      sort: params.get("sort") || "newest",
      page: Math.max(0, Number(params.get("page")) || 0),
      size: PAGE_SIZE,
    };
    let current = true;
    setLoading(true);
    setError("");
    searchMovies(request).then(({ data }) => { if (current) setResults(data); })
      .catch(() => { if (current) { setResults(null); setError(t("loadFilmsError")); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [searchKey, lang, retry]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

  return <main className={styles.page} aria-busy={loading || genresLoading}>
    <div className={styles.shell}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("searchEyebrow")}</p>
        <h1>{t("films")}</h1>
        <p>{t("searchIntro")}</p>
        <form className={styles.searchForm} onSubmit={applyFilters} aria-busy={loading}>
          <label className={styles.queryField} htmlFor="film-search-query">{t("searchFilms")}
            <input id="film-search-query" aria-label={t("searchFilms")} value={query} onChange={event => setQuery(event.target.value)} />
          </label>
          <button className={styles.submit} type="submit" aria-busy={loading}>{t("search")}</button>
        </form>
      </section>

      <form className={styles.filters} onSubmit={applyFilters} aria-label={t("sortBy")} aria-busy={genresLoading || loading}>
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

      {genreError && <p className={styles.alert} role="alert">{t("loadGenresError")} <button type="button" aria-busy={genresLoading} onClick={() => setGenreRetry(value => value + 1)}>{t("retry")}</button></p>}
      {loading && <p className={styles.feedback} role="status">{t("loadingFilms")}</p>}
      {error && <p className={styles.alert} role="alert">{error} <button type="button" aria-busy={loading} onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></p>}
      {!loading && !error && results?.content.length === 0 && <p className={styles.empty}>{t("noFilms")}</p>}
      {!loading && !error && results && <>
        <section className={styles.results} aria-label={t("films")}>
          <div className={styles.resultsBar}><p role="status">{t("resultsCount")}: {results.totalElements}</p><span>{results.number + 1} / {results.totalPages}</span></div>
          <div className={styles.grid}>
          {results.content.map(movie => <article className={styles.card} key={movie.id}>
            <Link className={styles.posterLink} to={path(`/films/${movie.id}`)} aria-label={`${movie.title} ${t("poster")}`}>
              <ResilientImage className={styles.poster} src={movie.photoUrl} alt={movie.title} fallback={<span className={styles.posterFallback}>{movie.title}</span>} />
            </Link>
            <h2><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link></h2>
            <p>{movie.releaseDate?.slice(0, 4) ?? t("unknownYear")}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
          </article>)}
          </div>
          {results.totalPages > 1 && <nav className={styles.pagination} aria-label={t("pagination")}><button type="button" disabled={results.number === 0} onClick={() => turnPage(results.number - 1)}>{t("previous")}</button><span>{t("page")} {results.number + 1} {t("of")} {results.totalPages}</span><button type="button" disabled={results.number >= results.totalPages - 1} onClick={() => turnPage(results.number + 1)}>{t("next")}</button></nav>}
        </section>
      </>}
    </div>
  </main>;
}
