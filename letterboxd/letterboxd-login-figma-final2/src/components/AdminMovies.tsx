import { useEffect, useState } from "react";
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
  type Page,
  type TmdbDiscoveryRequest,
  type TmdbQualityReport,
} from "../api/admin.api";
import { useLocale } from "../i18n";

interface Props {
  onTotalChange: (total: number) => void;
}

const emptyMovie: AdminMovieWrite = { title: "", releaseDate: "", rating: null, photoUrl: "" };

export default function AdminMovies({ onTotalChange }: Props) {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminMovie> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [qualityRevision, setQualityRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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
  const [tmdbQuality, setTmdbQuality] = useState<TmdbQualityReport | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminMovies(page)
      .then(({ data: response }) => {
        if (!current) return;
        setData(response);
        setTmdbIds(Object.fromEntries(response.content.filter(movie => movie.tmdbId !== null).map(movie => [movie.id, String(movie.tmdbId)])));
        onTotalChange(response.totalElements);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [onTotalChange, page, revision]);

  useEffect(() => {
    let current = true;
    getAdminTmdbQuality()
      .then(({ data: response }) => { if (current) setTmdbQuality(response); })
      .catch(() => { if (current) setError(true); });
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

  const editMovie = (movie: AdminMovie) => {
    setEditingMovieId(movie.id);
    setMovieDraft({ title: movie.title, releaseDate: movie.releaseDate ?? "", rating: movie.rating, photoUrl: movie.photoUrl ?? "" });
  };

  const saveMovie = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutationBusy) return;
    setMutationBusy(true);
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
      setError(true);
    } finally {
      setMutationBusy(false);
    }
  };

  const removeMovie = async (movie: AdminMovie) => {
    if (mutationBusy || !window.confirm(`${t("deleteMovieConfirm")} ${movie.title}?`)) return;
    setMutationBusy(true);
    try {
      await deleteAdminMovie(movie.id);
      if (data?.content.length === 1 && page > 0) setPage(value => value - 1);
      else setRevision(value => value + 1);
      if (editingMovieId === movie.id) resetMovieDraft();
      setError(false);
    } catch {
      setError(true);
    } finally {
      setMutationBusy(false);
    }
  };

  const syncMovie = async (movie: AdminMovie) => {
    const tmdbId = Number.parseInt(tmdbIds[movie.id] ?? "", 10);
    if (!Number.isInteger(tmdbId) || tmdbId < 1) {
      setSyncMessage(t("tmdbIdRequired"));
      return;
    }
    if (syncingMovieId !== null) return;
    setSyncingMovieId(movie.id);
    setSyncMessage(null);
    try {
      const { data: response } = await syncAdminMovieTmdb(movie.id, tmdbId);
      setSyncMessage(`${t("tmdbSyncDone")}: ${response.title} · ${response.genresUpdated} ${t("genres")} · ${response.actorsUpdated} ${t("actors")} · ${response.directorsUpdated} ${t("directors")}`);
      setRevision(value => value + 1);
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
      setSyncMessage(t("tmdbSyncError"));
    } finally {
      setSyncingMovieId(null);
    }
  };

  const parseTmdbIds = (value: string) => [...new Set(value.split(/[\s,]+/).map(item => Number.parseInt(item, 10)).filter(id => Number.isInteger(id) && id > 0))];

  const importTmdbIds = async (event: React.FormEvent) => {
    event.preventDefault();
    const ids = parseTmdbIds(tmdbImportIds);
    if (ids.length === 0 || ids.length > 20) {
      setTmdbImportMessage(t("tmdbImportLimit"));
      return;
    }
    setTmdbImportBusy(true);
    setTmdbImportMessage(null);
    try {
      const { data: response } = await importAdminTmdb(ids);
      setTmdbImportMessage(`${t("tmdbImportDone")}: ${response.succeeded}/${response.requested}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
      setTmdbImportMessage(t("tmdbImportError"));
    } finally {
      setTmdbImportBusy(false);
    }
  };

  const discoverAndImportTmdb = async (event: React.FormEvent) => {
    event.preventDefault();
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
    try {
      const { data: response } = await discoverAndImportAdminTmdb(request);
      setTmdbImportMessage(`${t("tmdbDiscoveryDone")}: ${response.imports.succeeded}/${response.discovered} · ${t("page")} ${response.page}/${response.totalPages}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      setError(true);
      setTmdbImportMessage(t("tmdbImportError"));
    } finally {
      setTmdbImportBusy(false);
    }
  };

  const retry = () => {
    setRevision(value => value + 1);
    setQualityRevision(value => value + 1);
  };

  return <section aria-label={t("adminMovies")} aria-busy={loading}>
    <h2>{t("adminMovies")}</h2>
    <form onSubmit={saveMovie} style={{ display: "grid", gap: 8, maxWidth: 700, marginBottom: 16 }}>
      <label>{t("movieTitle")}<input required maxLength={255} value={movieDraft.title} onChange={event => setMovieDraft({ ...movieDraft, title: event.target.value })} /></label>
      <label>{t("releaseDate")}<input type="date" value={movieDraft.releaseDate ?? ""} onChange={event => setMovieDraft({ ...movieDraft, releaseDate: event.target.value })} /></label>
      <label>{t("rating")}<input type="number" min="0" max="10" step="0.1" value={movieDraft.rating ?? ""} onChange={event => setMovieDraft({ ...movieDraft, rating: event.target.value === "" ? null : Number(event.target.value) })} /></label>
      <label>{t("posterUrl")}<input type="url" value={movieDraft.photoUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, photoUrl: event.target.value })} /></label>
      <div><button type="submit" disabled={mutationBusy}>{editingMovieId === null ? t("create") : t("save")}</button>{editingMovieId !== null && <button type="button" disabled={mutationBusy} onClick={resetMovieDraft}>{t("cancel")}</button>}</div>
    </form>
    <div style={{ display: "grid", gap: 12, maxWidth: 700, marginBottom: 16, padding: 12, border: "1px solid #444", borderRadius: 8 }}>
      <h3>{t("tmdbImportTitle")}</h3>
      {tmdbQuality && <div><strong>{t("tmdbQualityTitle")}</strong><p>{t("tmdbQualitySummary")}: {tmdbQuality.tmdbLinkedMovies}/{tmdbQuality.totalMovies} · {t("tmdbCoverage")}: {tmdbQuality.linkedCoveragePercent.toFixed(1)}% · {t("tmdbCompleteness")}: {tmdbQuality.metadataCompletenessPercent.toFixed(1)}%</p><ul><li>{t("tmdbMissingPoster")}: {tmdbQuality.missingPoster}</li><li>{t("tmdbMissingBackdrop")}: {tmdbQuality.missingBackdrop}</li><li>{t("tmdbMissingPlot")}: {tmdbQuality.missingPlot}</li><li>{t("tmdbMissingRuntime")}: {tmdbQuality.missingRuntime}</li><li>{t("tmdbMissingTrailer")}: {tmdbQuality.missingTrailer}</li><li>{t("tmdbMissingRating")}: {tmdbQuality.missingTmdbRating}</li></ul></div>}
      <form onSubmit={importTmdbIds} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><label>{t("tmdbIds")}<input aria-label={t("tmdbIds")} placeholder={t("tmdbIdsHint")} value={tmdbImportIds} onChange={event => setTmdbImportIds(event.target.value)} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbImport")}</button></form>
      <form onSubmit={discoverAndImportTmdb} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><label>{t("page")}<input type="number" min="1" max="500" value={tmdbDiscoveryDraft.page} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, page: event.target.value })} /></label><label>{t("year")}<input type="number" min="1888" max="2100" value={tmdbDiscoveryDraft.year} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, year: event.target.value })} /></label><label>{t("genre")}<input type="number" min="1" value={tmdbDiscoveryDraft.genreId} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, genreId: event.target.value })} /></label><label>{t("minRating")}<input type="number" min="0" max="10" step="0.1" value={tmdbDiscoveryDraft.minRating} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, minRating: event.target.value })} /></label><label>{t("limit")}<input type="number" min="1" max="20" value={tmdbDiscoveryDraft.limit} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, limit: event.target.value })} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbDiscoveryImport")}</button></form>
      {tmdbImportMessage && <p role="status">{tmdbImportMessage}</p>}
    </div>
    {syncMessage && <p role="status">{syncMessage}</p>}
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={retry}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminMovies")}</p>}
    {data && <>
      <ul aria-label={t("adminMovieResults")}>{data.content.map(movie => <li key={movie.id} style={{ marginBottom: 12 }}>
        {movie.title} · {movie.releaseDate || "—"} · {movie.rating ?? "—"}{" "}
        <button type="button" disabled={mutationBusy} onClick={() => editMovie(movie)}>{t("editMovie")}</button>{" "}
        <button type="button" disabled={mutationBusy} onClick={() => void removeMovie(movie)}>{t("deleteMovie")}</button>
        <div style={{ display: "inline-flex", gap: 6, marginLeft: 8 }}><label>{t("tmdbId")}<input inputMode="numeric" pattern="[0-9]*" aria-label={`${t("tmdbId")} ${movie.title}`} value={tmdbIds[movie.id] ?? ""} onChange={event => setTmdbIds(current => ({ ...current, [movie.id]: event.target.value }))} style={{ width: 90 }} /></label><button type="button" disabled={syncingMovieId !== null} onClick={() => void syncMovie(movie)}>{syncingMovieId === movie.id ? t("loading") : t("syncTmdb")}</button></div>
      </li>)}</ul>
      <nav aria-label={t("adminMoviesPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
