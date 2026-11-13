import { useEffect, useRef, useState } from "react";
import { searchMovies, type MoviePage } from "../api/search.api";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import Pagination from "./Pagination";
import RetryButton from "./RetryButton";
import styles from "./ListEntrySearch.module.css";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";

interface Props {
  existingIds: number[];
  busy: boolean;
  onAdd: (movieId: number) => Promise<boolean>;
}

export default function ListEntrySearch({ existingIds, busy, onAdd }: Props) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{ query: string; page: number; data: MoviePage } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
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

  return <div className={styles.search} role="search" aria-label={t("addFilm")}>
    <form onSubmit={event => event.preventDefault()}>
      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
      <input ref={queryRef} type="search" aria-label={t("addFilm")} placeholder={t("addFilm")} value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} />
    </form>
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
  </div>;
}
