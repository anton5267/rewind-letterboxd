import { useEffect, useState, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getGenres, searchMovies, type Genre, type MoviePage, type MovieSearchParams } from "../api/search.api";
import { localizeGenreName, useLocale } from "../i18n";

const PAGE_SIZE = 12;
const fieldStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 };
const inputStyle: CSSProperties = { padding: 10, borderRadius: 6, border: "1px solid #777", background: "#252525", color: "white", minWidth: 0 };

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
  const [genreError, setGenreError] = useState(false);
  const [genreRetry, setGenreRetry] = useState(0);
  const [results, setResults] = useState<MoviePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setGenreError(false);
    let current = true;
    getGenres().then(({ data }) => { if (current) setGenres(data); })
      .catch(() => { if (current) setGenreError(true); });
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

  return <main style={{ background: "#151515", color: "#fff", minHeight: "70vh", padding: "110px 5% 32px", fontFamily: "Arial, sans-serif" }}>
    <h1>{t("films")}</h1>
    <form onSubmit={applyFilters} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 12, alignItems: "end" }}>
      <label style={fieldStyle}>{t("searchFilms")}
        <input aria-label={t("searchFilms")} value={query} onChange={event => setQuery(event.target.value)} style={inputStyle} />
      </label>
      <label style={fieldStyle}>{t("genre")}
        <select value={genreId} onChange={event => setGenreId(event.target.value)} style={inputStyle}>
          <option value="">{t("allGenres")}</option>
          {genres.map(genre => <option key={genre.id} value={genre.id}>{localizeGenreName(genre.name, lang)}</option>)}
        </select>
      </label>
      <label style={fieldStyle}>{t("year")}
        <input type="number" min="1888" max="2100" value={year} onChange={event => setYear(event.target.value)} style={inputStyle} />
      </label>
      <label style={fieldStyle}>{t("minRating")}
        <select value={minRating} onChange={event => setMinRating(event.target.value)} style={inputStyle}>
          <option value="">{t("anyRating")}</option>
          {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}+</option>)}
        </select>
      </label>
      <label style={fieldStyle}>{t("sortBy")}
        <select value={sort} onChange={event => setSort(event.target.value)} style={inputStyle}>
          <option value="newest">{t("sortNewest")}</option>
          <option value="oldest">{t("sortOldest")}</option>
          <option value="rating_desc">{t("sortBestRated")}</option>
          <option value="rating_asc">{t("sortLowestRated")}</option>
          <option value="title_asc">{t("sortTitle")}</option>
        </select>
      </label>
      <button type="submit" style={{ padding: "11px 16px", borderRadius: 6, cursor: "pointer" }}>{t("applyFilters")}</button>
    </form>
    {genreError && <p role="alert">{t("loadGenresError")} <button type="button" onClick={() => setGenreRetry(value => value + 1)}>{t("retry")}</button></p>}
    {loading && <p>{t("loadingFilms")}</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></p>}
    {!loading && !error && results?.content.length === 0 && <p>{t("noFilms")}</p>}
    {!loading && !error && results && <>
      <p role="status">{t("resultsCount")}: {results.totalElements}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20, marginTop: 24 }}>
        {results.content.map(movie => <article key={movie.id}>
          {movie.photoUrl && <img src={movie.photoUrl} alt={movie.title} style={{ width: "100%", borderRadius: 8 }} />}
          <h2 style={{ fontSize: 16 }}><Link to={path(`/films/${movie.id}`)} style={{ color: "#fff" }}>{movie.title}</Link></h2>
          <p>{movie.releaseDate?.slice(0, 4) ?? t("unknownYear")}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
        </article>)}
      </div>
      {results.totalPages > 1 && <nav aria-label={t("pagination")} style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
        <button type="button" disabled={results.number === 0} onClick={() => turnPage(results.number - 1)}>{t("previous")}</button>
        <span>{t("page")} {results.number + 1} {t("of")} {results.totalPages}</span>
        <button type="button" disabled={results.number >= results.totalPages - 1} onClick={() => turnPage(results.number + 1)}>{t("next")}</button>
      </nav>}
    </>}
  </main>;
}
