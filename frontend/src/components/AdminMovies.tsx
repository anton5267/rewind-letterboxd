import { useEffect, useRef, useState } from "react";
import {
  createAdminMovie,
  deleteAdminMovie,
  discoverAndImportAdminTmdb,
  getAdminMovies,
  getAdminTmdbQuality,
  importAdminTmdb,
  syncAdminMovieTmdb,
  updateAdminMovie,
  type AdminMovie,
  type AdminMovieWrite,
  type TmdbDiscoveryRequest,
  type TmdbQualityReport,
} from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, useLocale } from "../i18n";
import styles from "./AdminMovies.module.css";

interface Props {
  onTotalChange: (total: number) => void;
}

const emptyMovie: AdminMovieWrite = { title: "", releaseDate: "", rating: null, photoUrl: "" };

const parseTmdbId = (value: string): number | null => {
  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const id = Number(normalized);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const parseTmdbIds = (value: string): number[] | null => {
  const ids = value.trim().split(/[\s,]+/).filter(Boolean).map(parseTmdbId);
  if (ids.some(id => id === null)) return null;
  return [...new Set(ids.filter((id): id is number => id !== null))];
};

export default function AdminMovies({ onTotalChange }: Props) {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminMovie> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [qualityRevision, setQualityRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [mutationBusy, setMutationBusy] = useState(false);
  const [movieDraft, setMovieDraft] = useState<AdminMovieWrite>(emptyMovie);
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [tmdbIds, setTmdbIds] = useState<Record<number, string>>({});
  const [syncingMovieId, setSyncingMovieId] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [tmdbImportIds, setTmdbImportIds] = useState("");
  const [tmdbDiscoveryDraft, setTmdbDiscoveryDraft] = useState({ page: "1", year: "", genreId: "", minRating: "", limit: "20" });
  const [tmdbImportBusy, setTmdbImportBusy] = useState(false);
  const [tmdbImportMessage, setTmdbImportMessage] = useState<string | null>(null);
  const [tmdbImportError, setTmdbImportError] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [tmdbQuality, setTmdbQuality] = useState<TmdbQualityReport | null>(null);
  const [qualityLoading, setQualityLoading] = useState(true);
  const [qualityError, setQualityError] = useState(false);
  const movieTitleInput = useRef<HTMLInputElement>(null);
  const editingTrigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminMovies(page)
      .then(({ data: response }) => {
        if (!current) return;
        setTmdbIds(Object.fromEntries(response.content.filter(movie => movie.tmdbId !== null).map(movie => [movie.id, String(movie.tmdbId)])));
        onTotalChange(response.totalElements);
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [onTotalChange, page, revision]);

  useEffect(() => {
    let current = true;
    setQualityLoading(true);
    setQualityError(false);
    getAdminTmdbQuality()
      .then(({ data: response }) => { if (current) setTmdbQuality(response); })
      .catch(() => { if (current) setQualityError(true); })
      .finally(() => { if (current) setQualityLoading(false); });
    return () => { current = false; };
  }, [qualityRevision]);

  const reloadFirstPage = () => {
    if (page === 0) setRevision(value => value + 1);
    else setPage(0);
  };

  const resetMovieDraft = () => {
    setEditingMovieId(null);
    setMovieDraft(emptyMovie);
  };

  const editMovie = (movie: AdminMovie, trigger: HTMLButtonElement) => {
    editingTrigger.current = trigger;
    setEditingMovieId(movie.id);
    setMovieDraft({ title: movie.title, releaseDate: movie.releaseDate ?? "", rating: movie.rating, photoUrl: movie.photoUrl ?? "" });
    movieTitleInput.current?.focus();
  };

  const cancelEdit = () => {
    resetMovieDraft();
    if (editingTrigger.current?.isConnected) editingTrigger.current.focus();
    else movieTitleInput.current?.focus();
    editingTrigger.current = null;
  };

  const saveMovie = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutationBusy) return;
    setMutationBusy(true);
    setActionError("");
    try {
      const payload = { ...movieDraft, title: movieDraft.title.trim(), releaseDate: movieDraft.releaseDate || null, photoUrl: movieDraft.photoUrl || null };
      if (editingMovieId === null) {
        await createAdminMovie(payload);
        reloadFirstPage();
      } else {
        const { data: updated } = await updateAdminMovie(editingMovieId, payload);
        setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      }
      resetMovieDraft();
      setError(false);
    } catch {
      setActionError(editingMovieId === null ? t("adminMovieCreateError") : t("adminMovieSaveError"));
    } finally {
      setMutationBusy(false);
    }
  };

  const removeMovie = async (movie: AdminMovie) => {
    const movieTitle = editorialText(movie.title, t("untitledFilm"));
    if (mutationBusy || !window.confirm(`${t("deleteMovieConfirm")} ${movieTitle}?`)) return;
    setMutationBusy(true);
    setActionError("");
    try {
      await deleteAdminMovie(movie.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
      if (editingMovieId === movie.id) resetMovieDraft();
      setError(false);
    } catch {
      setActionError(t("adminMovieDeleteError"));
    } finally {
      setMutationBusy(false);
    }
  };

  const syncMovie = async (movie: AdminMovie) => {
    const tmdbId = parseTmdbId(tmdbIds[movie.id] ?? "");
    if (tmdbId === null) {
      setSyncError(true);
      setSyncMessage(t("tmdbIdRequired"));
      return;
    }
    if (syncingMovieId !== null) return;
    setSyncingMovieId(movie.id);
    setSyncMessage(null);
    setSyncError(false);
    setActionError("");
    try {
      const { data: response } = await syncAdminMovieTmdb(movie.id, tmdbId);
      setSyncMessage(`${t("tmdbSyncDone")}: ${editorialText(response.title, t("untitledFilm"))} · ${response.genresUpdated} ${t("genres")} · ${response.actorsUpdated} ${t("actors")} · ${response.directorsUpdated} ${t("directors")} · ${response.producersUpdated} ${t("producers")}`);
      setRevision(value => value + 1);
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setSyncError(true);
      setSyncMessage(t("tmdbSyncError"));
    } finally {
      setSyncingMovieId(null);
    }
  };

  const importTmdbIds = async (event: React.FormEvent) => {
    event.preventDefault();
    setTmdbImportError(false);
    const ids = parseTmdbIds(tmdbImportIds);
    if (ids === null || ids.length === 0 || ids.length > 20) {
      setTmdbImportError(true);
      setTmdbImportMessage(t("tmdbImportLimit"));
      return;
    }
    setTmdbImportBusy(true);
    setTmdbImportMessage(null);
    setTmdbImportError(false);
    setActionError("");
    try {
      const { data: response } = await importAdminTmdb(ids);
      setTmdbImportMessage(`${t("tmdbImportDone")}: ${response.succeeded}/${response.requested}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setTmdbImportError(true);
      setTmdbImportMessage(t("tmdbImportError"));
    } finally {
      setTmdbImportBusy(false);
    }
  };

  const discoverAndImportTmdb = async (event: React.FormEvent) => {
    event.preventDefault();
    setTmdbImportError(false);
    const discoveryPage = Number.parseInt(tmdbDiscoveryDraft.page, 10);
    const limit = Number.parseInt(tmdbDiscoveryDraft.limit, 10);
    if (!Number.isInteger(discoveryPage) || discoveryPage < 1 || discoveryPage > 500 || !Number.isInteger(limit) || limit < 1 || limit > 20) {
      setTmdbImportMessage(t("tmdbDiscoveryInvalid"));
      return;
    }
    const request: TmdbDiscoveryRequest = {
      page: discoveryPage,
      limit,
      ...(tmdbDiscoveryDraft.year ? { year: Number(tmdbDiscoveryDraft.year) } : {}),
      ...(tmdbDiscoveryDraft.genreId ? { genreId: Number(tmdbDiscoveryDraft.genreId) } : {}),
      ...(tmdbDiscoveryDraft.minRating ? { minRating: Number(tmdbDiscoveryDraft.minRating) } : {}),
    };
    setTmdbImportBusy(true);
    setTmdbImportMessage(null);
    setTmdbImportError(false);
    setActionError("");
    try {
      const { data: response } = await discoverAndImportAdminTmdb(request);
      setTmdbImportMessage(`${t("tmdbDiscoveryDone")}: ${response.imports.succeeded}/${response.discovered} · ${t("page")} ${response.page}/${response.totalPages}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setTmdbImportError(true);
      setTmdbImportMessage(t("tmdbImportError"));
    } finally {
      setTmdbImportBusy(false);
    }
  };

  const retry = () => {
    setRevision(value => value + 1);
  };

  const retryQuality = () => setQualityRevision(value => value + 1);

  return (
    <section className={styles.section} aria-label={t("adminMovies")} aria-busy={loading || qualityLoading || mutationBusy || tmdbImportBusy || syncingMovieId !== null}>
      <h2 className={styles.title}>{t("adminMovies")}</h2>
       {actionError && <p className={styles.error} role="alert">{actionError}</p>}
       <form className={styles.movieForm} onSubmit={saveMovie} aria-busy={mutationBusy}>
        <label className={styles.field}>{t("movieTitle")}<input ref={movieTitleInput} required maxLength={255} value={movieDraft.title} onChange={event => setMovieDraft({ ...movieDraft, title: event.target.value })} /></label>
        <label className={styles.field}>{t("releaseDate")}<input type="date" value={movieDraft.releaseDate ?? ""} onChange={event => setMovieDraft({ ...movieDraft, releaseDate: event.target.value })} /></label>
        <label className={styles.field}>{t("rating")}<input type="number" min="0" max="10" step="0.1" value={movieDraft.rating ?? ""} onChange={event => setMovieDraft({ ...movieDraft, rating: event.target.value === "" ? null : Number(event.target.value) })} /></label>
        <label className={styles.field}>{t("posterUrl")}<input type="url" value={movieDraft.photoUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, photoUrl: event.target.value })} /></label>
        <div className={styles.actions}><button type="submit" aria-busy={mutationBusy} disabled={mutationBusy}>{mutationBusy ? t("saving") : editingMovieId === null ? t("create") : t("save")}</button>{editingMovieId !== null && <button type="button" disabled={mutationBusy} onClick={cancelEdit}>{t("cancel")}</button>}</div>
      </form>
      <div className={styles.tmdbPanel}>
        <h3 className={styles.tmdbTitle}>{t("tmdbImportTitle")}</h3>
        {qualityLoading && !tmdbQuality && <p className={styles.feedback} role="status">{t("loading")}</p>}
        {qualityError && <RetryNotice className={styles.error} message={t("tmdbQualityError")} retryLabel={t("retry")} disabled={qualityLoading} busy={qualityLoading} onRetry={retryQuality} />}
        {tmdbQuality && <div className={styles.quality}><strong>{t("tmdbQualityTitle")}</strong><p>{t("tmdbQualitySummary")}: {tmdbQuality.tmdbLinkedMovies}/{tmdbQuality.totalMovies} · {t("tmdbCoverage")}: {tmdbQuality.linkedCoveragePercent.toFixed(1)}% · {t("tmdbCompleteness")}: {tmdbQuality.metadataCompletenessPercent.toFixed(1)}%</p><ul className={styles.qualityList}><li>{t("tmdbMissingPoster")}: {tmdbQuality.missingPoster}</li><li>{t("tmdbMissingBackdrop")}: {tmdbQuality.missingBackdrop}</li><li>{t("tmdbMissingPlot")}: {tmdbQuality.missingPlot}</li><li>{t("tmdbMissingRuntime")}: {tmdbQuality.missingRuntime}</li><li>{t("tmdbMissingTrailer")}: {tmdbQuality.missingTrailer}</li><li>{t("tmdbMissingRating")}: {tmdbQuality.missingTmdbRating}</li></ul></div>}
        <form className={styles.importForm} onSubmit={importTmdbIds}><label className={styles.inlineField}>{t("tmdbIds")}<input aria-label={t("tmdbIds")} placeholder={t("tmdbIdsHint")} value={tmdbImportIds} onChange={event => setTmdbImportIds(event.target.value)} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbImport")}</button></form>
        <form className={`${styles.importForm} ${styles.discoveryForm}`} onSubmit={discoverAndImportTmdb}><label className={styles.inlineField}>{t("page")}<input type="number" min="1" max="500" value={tmdbDiscoveryDraft.page} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, page: event.target.value })} /></label><label className={styles.inlineField}>{t("year")}<input type="number" min="1888" max="2100" value={tmdbDiscoveryDraft.year} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, year: event.target.value })} /></label><label className={styles.inlineField}>{t("genre")}<input type="number" min="1" value={tmdbDiscoveryDraft.genreId} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, genreId: event.target.value })} /></label><label className={styles.inlineField}>{t("minRating")}<input type="number" min="0" max="10" step="0.1" value={tmdbDiscoveryDraft.minRating} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, minRating: event.target.value })} /></label><label className={styles.inlineField}>{t("limit")}<input type="number" min="1" max="20" value={tmdbDiscoveryDraft.limit} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, limit: event.target.value })} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbDiscoveryImport")}</button></form>
        {tmdbImportMessage && <p className={tmdbImportError ? styles.error : styles.status} role={tmdbImportError ? "alert" : "status"}>{tmdbImportMessage}</p>}
      </div>
       {syncMessage && <p className={syncError ? styles.error : styles.status} role={syncError ? "alert" : "status"}>{syncMessage}</p>}
      {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
      {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={retry} />}
      {data && data.content.length === 0 && <p>{t("noAdminMovies")}</p>}
      {data && <>
        <ul className={styles.movieList} aria-label={t("adminMovieResults")}>{data.content.map(movie => {
          const movieTitle = editorialText(movie.title, t("untitledFilm"));
          return <li className={styles.movieRow} key={movie.id}>
          <div className={styles.movieMeta}>{movieTitle} · {movie.releaseDate || "—"} · {movie.rating ?? "—"}{" "}
            <button type="button" disabled={mutationBusy} onClick={event => editMovie(movie, event.currentTarget)}>{t("editMovie")}</button>{" "}
            <button type="button" disabled={mutationBusy} onClick={() => void removeMovie(movie)}>{t("deleteMovie")}</button>
            <div className={styles.syncControls}><label className={styles.inlineField}>{t("tmdbId")}<input className={styles.tmdbIdInput} inputMode="numeric" pattern="[0-9]*" aria-label={`${t("tmdbId")} ${movieTitle}`} value={tmdbIds[movie.id] ?? ""} onChange={event => setTmdbIds(current => ({ ...current, [movie.id]: event.target.value }))} /></label><button type="button" disabled={syncingMovieId !== null} onClick={() => void syncMovie(movie)}>{syncingMovieId === movie.id ? t("loading") : t("syncTmdb")}</button></div>
          </div>
        </li>;
        })}</ul>
        <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminMoviesPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
      </>}
    </section>
  );
}
