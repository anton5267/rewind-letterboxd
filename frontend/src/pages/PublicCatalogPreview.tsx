import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { getMovieDetails, type MovieDetails } from "../api/movies.api";
import { getGenres, searchMovies, type Genre, type MovieCard, type MoviePage } from "../api/search.api";
import styles from "./PublicCatalogPreview.module.css";

type Language = "uk" | "en";

function language(value: string | undefined): Language {
  return value === "en" ? "en" : "uk";
}

function text(lang: Language) {
  return lang === "uk"
    ? { title: "Відкрий своє наступне кіно", search: "Назва фільму", genre: "Усі жанри", newest: "Найновіші", rating: "За рейтингом", find: "Знайти", loading: "Завантаження каталогу…", empty: "Фільми не знайдено.", retry: "Спробувати ще раз", back: "← До каталогу", home: "Каталог", readOnly: "Публічний каталог фільмів", release: "Прем’єра", ratingLabel: "Рейтинг спільноти", searchError: "Не вдалося завантажити каталог.", detailError: "Не вдалося завантажити фільм.", runtime: "хв", age: "Віковий рейтинг", director: "Режисер", cast: "У ролях", externalRating: "Зовнішні рейтинги", similar: "Схожі фільми", trailer: "Дивитися трейлер", imdb: "IMDb" }
    : { title: "Find your next film", search: "Film title", genre: "All genres", newest: "Newest", rating: "Top rated", find: "Search", loading: "Loading catalogue…", empty: "No films found.", retry: "Try again", back: "← Back to catalogue", home: "Catalogue", readOnly: "Public film catalogue", release: "Release date", ratingLabel: "Community rating", searchError: "Could not load the catalogue.", detailError: "Could not load this film.", runtime: "min", age: "Age rating", director: "Director", cast: "Cast", externalRating: "External ratings", similar: "Similar films", trailer: "Watch trailer", imdb: "IMDb" };
}

function SiteHeader({ lang }: { lang: Language }) {
  const copy = text(lang);
  const otherLanguage = lang === "uk" ? "en" : "uk";
  return <header className={styles.header}>
    <Link className={styles.brand} to={`/${lang}/home`} aria-label="REWIND">REWIND<span>®</span></Link>
    <span className={styles.headerLabel}>{copy.readOnly}</span>
    <Link className={styles.language} to={`/${otherLanguage}/home`}>{otherLanguage.toUpperCase()}</Link>
  </header>;
}

function MovieTile({ movie, lang }: { movie: MovieCard; lang: Language }) {
  const copy = text(lang);
  return <Link className={styles.movie} to={`/${lang}/films/${movie.id}`}>
    {movie.photoUrl ? <img className={styles.poster} src={movie.photoUrl} alt="" loading="lazy" /> : <div className={styles.posterFallback}>{movie.title}</div>}
    <span className={styles.movieTitle}>{movie.title}</span>
    <span className={styles.meta}>{movie.releaseDate?.slice(0, 4) ?? "—"}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</span>
    <span className="srOnly">{copy.release}</span>
  </Link>;
}

function CatalogPage({ lang }: { lang: Language }) {
  const copy = text(lang);
  const [params, setParams] = useSearchParams();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [genreError, setGenreError] = useState(false);
  const [pageData, setPageData] = useState<MoviePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [draftQuery, setDraftQuery] = useState(params.get("q") ?? "");
  const query = params.get("q") ?? "";
  const genreId = params.get("genreId") ?? "";
  const sort = params.get("sort") ?? "newest";
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0);

  useEffect(() => {
    getGenres().then(({ data }) => { setGenres(data); setGenreError(false); }).catch(() => setGenreError(true));
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    searchMovies({ q: query || undefined, genreId: genreId || undefined, sort, page, size: 24 })
      .then(({ data }) => { if (current) setPageData(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [genreId, page, query, searchAttempt, sort]);

  const setFilter = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(values)) value ? next.set(key, value) : next.delete(key);
    if (!("page" in values)) next.delete("page");
    setParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setFilter({ q: draftQuery.trim() });
  };

  return <main className={styles.main}>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{copy.readOnly}</p>
      <h1>{copy.title}</h1>
      <form className={styles.filters} onSubmit={submitSearch}>
        <label className={styles.srOnly} htmlFor="catalog-title">{copy.search}</label>
        <input id="catalog-title" value={draftQuery} onChange={event => setDraftQuery(event.target.value)} placeholder={copy.search} />
        <label className={styles.srOnly} htmlFor="catalog-genre">{copy.genre}</label>
        <select id="catalog-genre" value={genreId} onChange={event => setFilter({ genreId: event.target.value })}>
          <option value="">{copy.genre}</option>
          {genres.map(genre => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
        </select>
        <label className={styles.srOnly} htmlFor="catalog-sort">{copy.newest}</label>
        <select id="catalog-sort" value={sort} onChange={event => setFilter({ sort: event.target.value })}>
          <option value="newest">{copy.newest}</option><option value="rating_desc">{copy.rating}</option>
        </select>
        <button type="submit">{copy.find}</button>
      </form>
      {genreError && <button className={styles.inlineRetry} onClick={() => getGenres().then(({ data }) => { setGenres(data); setGenreError(false); }).catch(() => setGenreError(true))}>{copy.retry}</button>}
    </section>
    <section className={styles.results} aria-live="polite" aria-busy={loading}>
      {loading && <p className={styles.state}>{copy.loading}</p>}
      {error && <div className={styles.state}><p>{copy.searchError}</p><button onClick={() => setSearchAttempt(value => value + 1)}>{copy.retry}</button></div>}
      {!loading && !error && pageData?.content.length === 0 && <p className={styles.state}>{copy.empty}</p>}
      {!loading && !error && pageData && <>
        <div className={styles.grid}>{pageData.content.map(movie => <MovieTile key={movie.id} movie={movie} lang={lang} />)}</div>
        {pageData.totalPages > 1 && <nav className={styles.pager} aria-label={copy.home}>
          <button disabled={page <= 0} onClick={() => setFilter({ page: String(page - 1) })}>←</button>
          <span>{page + 1} / {pageData.totalPages}</span>
          <button disabled={page + 1 >= pageData.totalPages} onClick={() => setFilter({ page: String(page + 1) })}>→</button>
        </nav>}
      </>}
    </section>
  </main>;
}

function MoviePageView({ lang }: { lang: Language }) {
  const copy = text(lang);
  const { id = "" } = useParams();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setMovie(null); setError(false);
    getMovieDetails(Number(id)).then(({ data }) => { if (current) setMovie(data); }).catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [attempt, id]);

  return <main className={styles.detailMain}>
    <Link className={styles.back} to={`/${lang}/home`}>{copy.back}</Link>
    {error && <div className={styles.state}><p>{copy.detailError}</p><button onClick={() => setAttempt(value => value + 1)}>{copy.retry}</button></div>}
    {!error && !movie && <p className={styles.state}>{copy.loading}</p>}
    {movie && <article className={styles.detail}>
      {movie.backdropUrl && <img className={styles.backdrop} src={movie.backdropUrl} alt="" />}
      {movie.photoUrl && <img className={styles.detailPoster} src={movie.photoUrl} alt="" />}
      <div><p className={styles.eyebrow}>{movie.releaseDate?.slice(0, 4) ?? ""}</p><h1>{movie.title}</h1>
        <div className={styles.filmFacts}>
          {movie.durationMinutes != null && <span>{movie.durationMinutes} {copy.runtime}</span>}
          {movie.ageRating && <span>{copy.age}: {movie.ageRating}</span>}
          {movie.imdbId && /^tt\d+$/.test(movie.imdbId) && <a href={`https://www.imdb.com/title/${movie.imdbId}/`} target="_blank" rel="noreferrer">{copy.imdb} ↗</a>}
        </div>
        {movie.rating != null && <p className={styles.detailRating}>★ {movie.rating} <span>{copy.ratingLabel}</span></p>}
        {movie.genres.length > 0 && <ul className={styles.genreTags}>{movie.genres.map(genre => <li key={genre.id}>{genre.name}</li>)}</ul>}
        {movie.shortPlot && <p className={styles.plot}>{movie.shortPlot}</p>}
        {movie.directors.length > 0 && <section className={styles.detailSection}><h2>{copy.director}</h2><p>{movie.directors.map(person => person.name).join(", ")}</p></section>}
        {movie.actors.length > 0 && <section className={styles.detailSection}><h2>{copy.cast}</h2><ul className={styles.castList}>{movie.actors.map(actor => <li key={actor.id}>{actor.photoUrl && <img src={actor.photoUrl} alt="" loading="lazy" />}<span>{actor.name}{actor.characterName && <small>{actor.characterName}</small>}</span></li>)}</ul></section>}
        {movie.externalRatings.length > 0 && <section className={styles.detailSection}><h2>{copy.externalRating}</h2><p>{movie.externalRatings.map(rating => `${rating.source}: ${rating.rating}${rating.votesCount ? ` (${rating.votesCount.toLocaleString()})` : ""}`).join(" · ")}</p></section>}
        {movie.trailerUrl && <a className={styles.trailer} href={movie.trailerUrl} target="_blank" rel="noreferrer">{copy.trailer} ↗</a>}
        {movie.similarMovies.length > 0 && <section className={styles.detailSection}><h2>{copy.similar}</h2><div className={styles.similarGrid}>{movie.similarMovies.map(similar => <MovieTile key={similar.id} movie={similar} lang={lang} />)}</div></section>}
      </div>
    </article>}
  </main>;
}

export default function PublicCatalogPreview() {
  const { lang: rawLang } = useParams();
  const lang = useMemo(() => language(rawLang), [rawLang]);
  return <div className={styles.app}><SiteHeader lang={lang} /><Routes>
    <Route index element={<Navigate to={`/${lang}/home`} replace />} />
    <Route path="home" element={<CatalogPage lang={lang} />} />
    <Route path="films" element={<CatalogPage lang={lang} />} />
    <Route path="films/discover" element={<CatalogPage lang={lang} />} />
    <Route path="films/:id" element={<MoviePageView lang={lang} />} />
    <Route path="*" element={<Navigate to={`/${lang}/home`} replace />} />
  </Routes></div>;
}
