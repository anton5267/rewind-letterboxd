import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { importTmdbMovie, searchTmdbMovies, type TmdbMovieCandidate } from "../api/movies.api";
import { searchMovies, type MoviePage } from "../api/search.api";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import Pagination from "./Pagination";
import RetryButton from "./RetryButton";
import styles from "./ListEntrySearch.module.css";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";

interface Props {
  existingIds: number[];
  busy: boolean;
  onAdd: (movieId: number) => Promise<boolean>;
  embedded?: boolean;
}

export default function ListEntrySearch({ existingIds, busy, onAdd, embedded = false }: Props) {
  const { lang, path, t } = useLocale();
  const { isAuth, ready } = useAuth();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ query: string; page: number; data: MoviePage } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tmdbCandidates, setTmdbCandidates] = useState<TmdbMovieCandidate[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbError, setTmdbError] = useState(false);
  const [tmdbRetry, setTmdbRetry] = useState(0);
  const [tmdbImportId, setTmdbImportId] = useState<number | null>(null);
  const [tmdbImportError, setTmdbImportError] = useState(false);
  const queryRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const data = result?.query === query.trim() && result.page === page ? result.data : null;

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const q = query.trim();
    if (!q) { setLoading(false); setError(false); return; }
    let active = true;
    setLoading(true);
    setError(false);
    const timer = window.setTimeout(() => {
      searchMovies({ q, sort: "newest", page, size: 8 })
        .then(({ data }) => {
          if (!active) return;
          if (isPageOutOfRange(page, data.totalPages)) setPage(getLastPageIndex(data.totalPages));
          else setResult({ query: q, page, data });
        })
        .catch(() => { if (active) { setResult(null); setError(true); } })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, page, retry]);

  useEffect(() => {
    const q = query.trim();
    setTmdbCandidates([]);
    setTmdbError(false);
    setTmdbImportError(false);
    if (q.length < 2) { setTmdbLoading(false); return; }
    let active = true;
    setTmdbLoading(true);
    const timer = window.setTimeout(() => {
      searchTmdbMovies(q, undefined, 1, lang)
        .then(({ data }) => { if (active) setTmdbCandidates(data.content); })
        .catch(() => { if (active) setTmdbError(true); })
        .finally(() => { if (active) setTmdbLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, lang, tmdbRetry]);

  const addTmdbCandidate = async (candidate: TmdbMovieCandidate) => {
    if (!isAuth) return;
    setTmdbImportId(candidate.tmdbId);
    setTmdbImportError(false);
    try {
      const { data } = await importTmdbMovie(candidate.tmdbId);
      if (existingIds.includes(data.movieId)) {
        setQuery("");
        setPage(0);
        setTmdbCandidates([]);
        return;
      }
      const added = await onAdd(data.movieId);
      if (added && alive.current) {
        setQuery("");
        setPage(0);
        setTmdbCandidates([]);
      }
    } catch {
      setTmdbImportError(true);
    } finally { setTmdbImportId(null); }
  };

  const searchField = <>
    <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
    <input ref={queryRef} type="search" aria-label={t("addFilm")} placeholder={embedded ? t("listFilmSearchPlaceholder") : t("addFilm")} value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} />
  </>;

  return <div className={`${styles.search} ${embedded ? styles.embedded : ""}`} role="search" aria-label={t("addFilm")} data-list-editor-film-search={embedded || undefined}>
    {embedded ? <div className={styles.embeddedField}>{searchField}</div> : <form onSubmit={event => event.preventDefault()}>{searchField}</form>}
    {loading && <p role="status">{t("loading")}</p>}
    {error && <p role="alert">{t("loadFilmsError")} <RetryButton label={t("retry")} onClick={() => { setRetry(value => value + 1); queryRef.current?.focus(); }} /></p>}
    {!loading && !error && data && <>
      {data.content.length === 0 && <p>{t("noFilms")}</p>}
      <ul className={styles.results}>{data.content.map(film => <li key={film.id}>
        <button type="button" disabled={busy || existingIds.includes(film.id)} aria-label={`${t("addFilm")} ${editorialText(film.title, t("untitledFilm"))}`} onClick={event => {
          const origin = event.currentTarget;
          void onAdd(film.id).then(added => {
            if (added && alive.current && (document.activeElement === document.body || document.activeElement === origin)) queryRef.current?.focus();
          });
        }}>{editorialText(film.title, t("untitledFilm"))} · {formatMovieYear(film.releaseDate, t("unknownYear"))}</button>
      </li>)}</ul>
      <Pagination page={page} totalPages={data.totalPages} label={t("films")} busy={loading || busy} onPageChange={setPage} />
    </>}
    {query.trim().length >= 2 && <section className={styles.tmdbSection} aria-busy={tmdbLoading} aria-labelledby="list-tmdb-results-title">
      <h3 id="list-tmdb-results-title">{t("tmdbSearchTitle")}</h3>
      {tmdbLoading && <p role="status">{t("loading")}</p>}
      {tmdbError && <p role="alert">{t("tmdbSearchError")} <RetryButton label={t("retry")} onClick={() => setTmdbRetry(value => value + 1)} /></p>}
      {tmdbImportError && <p role="alert">{t("tmdbImportMovieError")}</p>}
      {!tmdbLoading && !tmdbError && tmdbCandidates.length === 0 && <p>{t("tmdbNoMatches")}</p>}
      <ul className={styles.results}>{tmdbCandidates.map(candidate => <li key={candidate.tmdbId}>
        {isAuth
          ? <button type="button" disabled={!ready || busy || tmdbImportId !== null} onClick={() => void addTmdbCandidate(candidate)}>{tmdbImportId === candidate.tmdbId ? t("loading") : `${t("tmdbAddToRewind")} · ${editorialText(candidate.title, t("untitledFilm"))} · ${formatMovieYear(candidate.releaseDate, t("unknownYear"))}`}</button>
          : <Link className={styles.tmdbAction} to={path("/login")} state={{ returnTo: `${location.pathname}${location.search}${location.hash}` }}>{t("login")} · {editorialText(candidate.title, t("untitledFilm"))} · {formatMovieYear(candidate.releaseDate, t("unknownYear"))}</Link>}
      </li>)}</ul>
    </section>}
  </div>;
}
