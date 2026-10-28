import AdminLoading from "./AdminLoading";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { getMovieDetails } from "../api/movies.api";
import { useAuth } from "../context/AuthContext";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import ResilientImage from "./ResilientImage";
import { editorialText, useLocale } from "../i18n";
import styles from "./AdminMovies.module.css";

interface Props {
  onTotalChange: (total: number) => void;
}

const emptyMovie: AdminMovieWrite = { title: "", imdbId: "", releaseDate: "", ageRating: "", rating: null, photoUrl: "", backdropUrl: "", trailerUrl: "", durationMinutes: null, shortPlot: "" };
const emptyMovieCredits = { genres: [] as string[], directors: [] as string[], actors: [] as string[] };

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
  const { lang, t } = useLocale();
  const { user } = useAuth();
  const [data, setData] = useState<Page<AdminMovie> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [qualityRevision, setQualityRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [mutationBusy, setMutationBusy] = useState(false);
  const [movieDraft, setMovieDraft] = useState<AdminMovieWrite>(emptyMovie);
  const [movieCredits, setMovieCredits] = useState(emptyMovieCredits);
  const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminMovie | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorDetailsFailed, setEditorDetailsFailed] = useState(false);
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
  const catalogTitle = useRef<HTMLHeadingElement>(null);
  const catalogFocus = useRef<{ page: number; origin: HTMLElement | null } | null>(null);
  const editingTrigger = useRef<HTMLButtonElement | null>(null);
  const editorRequestId = useRef(0);
  const movieEditor = useRef<HTMLDetailsElement>(null);
  const movieEditorSummary = useRef<HTMLElement | null>(null);
  const movieActionAlert = useRef<HTMLParagraphElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleteDialogCancel = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLElement | null>(null);
  const movieDetailsError = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const scopeGeneration = useRef(0);
  const actionScopeGeneration = useRef(0);
  const saveToken = useRef<object | null>(null);
  const pendingFocus = useRef<{ scope: number; request: number; origin: HTMLElement | null; target: "title" | "return" | "error" | "details-error"; trigger: HTMLButtonElement | null; movieId?: number | null } | null>(null);

  useLayoutEffect(() => {
    catalogFocus.current = null;
  }, [lang, user?.id, user?.role]);

  useLayoutEffect(() => {
    actionScopeGeneration.current += 1;
    setSyncingMovieId(null);
    setTmdbImportBusy(false);
    setSyncMessage(null);
    setSyncError(false);
    setTmdbImportMessage(null);
    setTmdbImportError(false);
  }, [lang, user?.id, user?.role]);

  useEffect(() => {
    const pending = catalogFocus.current;
    if (!pending || pending.page !== page || loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (!mounted.current || catalogFocus.current !== pending) return;
      catalogFocus.current = null;
      if (document.activeElement === document.body || document.activeElement === pending.origin) catalogTitle.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [page, loading, data, error]);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      scopeGeneration.current += 1;
      editorRequestId.current += 1;
      pendingFocus.current = null;
      saveToken.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    scopeGeneration.current += 1;
    editorRequestId.current += 1;
    pendingFocus.current = null;
    saveToken.current = null;
    editingTrigger.current = null;
    setMutationBusy(false);
    setEditorLoading(false);
    setEditorDetailsFailed(false);
    setEditingMovieId(null);
    setMovieDraft(emptyMovie);
    setMovieCredits(emptyMovieCredits);
    setActionError("");
    if (movieEditor.current) movieEditor.current.open = false;
  }, [lang, user?.id, user?.role, page]);

  useEffect(() => {
    if (!pendingDelete || !deleteDialog.current) return;
    if (!deleteDialog.current.open) deleteDialog.current.showModal();
    deleteDialogCancel.current?.focus();
  }, [pendingDelete]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || editorLoading || mutationBusy || (pending.target === "return" && loading)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (!mounted.current || scopeGeneration.current !== pending.scope || editorRequestId.current !== pending.request) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      if (pending.target === "title") {
        if (movieEditor.current?.open) {
          movieTitleInput.current?.focus();
          const heading = catalogTitle.current;
          if (heading) {
            const headerBottom = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
            const hiddenByHeader = heading.getBoundingClientRect().top - headerBottom - 16;
            if (hiddenByHeader < 0) window.scrollBy({ top: hiddenByHeader, behavior: "instant" });
          }
        }
      } else if (pending.target === "details-error") {
        if (movieEditor.current?.open) movieDetailsError.current?.focus();
      } else if (pending.target === "error") movieActionAlert.current?.focus();
      else if (pending.target === "return") {
        const returnButton = pending.movieId == null ? null : document.querySelector<HTMLButtonElement>(`[data-admin-movie-edit-id="${pending.movieId}"]`);
        if (returnButton && !returnButton.disabled) returnButton.focus();
        else if (pending.trigger?.isConnected && !pending.trigger.disabled) pending.trigger.focus();
        else movieEditorSummary.current?.focus();
      }
      else if (pending.trigger?.isConnected && !pending.trigger.disabled) pending.trigger.focus();
      else movieEditorSummary.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lang, page, editingMovieId, editorLoading, editorDetailsFailed, mutationBusy, loading, data, actionError]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminMovies(page, 6)
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
  }, [onTotalChange, page, revision, lang, user?.id, user?.role]);

  useEffect(() => {
    let current = true;
    setQualityLoading(true);
    setQualityError(false);
    getAdminTmdbQuality()
      .then(({ data: response }) => { if (current) setTmdbQuality(response); })
      .catch(() => { if (current) setQualityError(true); })
      .finally(() => { if (current) setQualityLoading(false); });
    return () => { current = false; };
  }, [qualityRevision, user?.id, user?.role]);

  const reloadFirstPage = () => {
    if (page === 0) setRevision(value => value + 1);
    else setPage(0);
  };

  const resetMovieDraft = () => {
    pendingFocus.current = null;
    editorRequestId.current += 1;
    setEditingMovieId(null);
    setEditorLoading(false);
    setEditorDetailsFailed(false);
    setMovieDraft(emptyMovie);
    setMovieCredits(emptyMovieCredits);
  };

  const editMovie = async (movie: AdminMovie, trigger: HTMLButtonElement, origin: HTMLElement | null = trigger) => {
    const requestId = ++editorRequestId.current;
    const scope = scopeGeneration.current;
    const isCurrent = () => mounted.current && scopeGeneration.current === scope && editorRequestId.current === requestId && editingTrigger.current === trigger && movieEditor.current?.open;
    pendingFocus.current = null;
    editingTrigger.current = trigger;
    if (movieEditor.current) movieEditor.current.open = true;
    setEditingMovieId(movie.id);
    setActionError("");
    setEditorLoading(true);
    setEditorDetailsFailed(false);
    setMovieCredits(emptyMovieCredits);
    setMovieDraft({ ...emptyMovie, title: movie.title, releaseDate: movie.releaseDate ?? "", rating: movie.rating, photoUrl: movie.photoUrl ?? "" });
    try {
      const { data: details } = await getMovieDetails(movie.id);
      if (isCurrent()) {
        setMovieCredits({
          genres: (details.genres ?? []).map(genre => genre.name),
          directors: (details.directors ?? []).map(director => director.name),
          actors: (details.actors ?? []).map(actor => actor.characterName ? `${actor.name} (${actor.characterName})` : actor.name),
        });
        setMovieDraft({
          title: details.title,
          imdbId: details.imdbId ?? "",
          releaseDate: details.releaseDate ?? "",
          ageRating: details.ageRating ?? "",
          rating: movie.rating,
          photoUrl: details.photoUrl ?? "",
          backdropUrl: details.backdropUrl ?? "",
          trailerUrl: details.trailerUrl ?? "",
          durationMinutes: details.durationMinutes,
          shortPlot: details.shortPlot ?? "",
        });
        pendingFocus.current = { scope, request: requestId, origin, target: "title", trigger };
      }
    } catch {
      if (isCurrent()) {
        setEditorDetailsFailed(true);
        pendingFocus.current = { scope, request: requestId, origin, target: "details-error", trigger };
      }
    } finally {
      if (isCurrent()) setEditorLoading(false);
    }
  };

  const cancelEdit = () => {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const trigger = editingTrigger.current;
    resetMovieDraft();
    pendingFocus.current = { scope: scopeGeneration.current, request: editorRequestId.current, origin, target: "return", trigger, movieId: editingMovieId };
    if (movieEditor.current) movieEditor.current.open = false;
    editingTrigger.current = null;
  };

  const saveMovie = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutationBusy || saveToken.current !== null) return;
    const token = {};
    saveToken.current = token;
    const scope = scopeGeneration.current;
    const request = editorRequestId.current;
    const trigger = editingTrigger.current;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const currentScope = () => mounted.current && scopeGeneration.current === scope && saveToken.current === token;
    const currentEditor = () => currentScope() && editorRequestId.current === request && movieEditor.current?.open;
    pendingFocus.current = null;
    setMutationBusy(true);
    setActionError("");
    const wasEditing = editingMovieId !== null;
    try {
      const payload = { ...movieDraft, title: movieDraft.title.trim(), imdbId: movieDraft.imdbId || null, releaseDate: movieDraft.releaseDate || null, ageRating: movieDraft.ageRating || null, photoUrl: movieDraft.photoUrl || null, backdropUrl: movieDraft.backdropUrl || null, trailerUrl: movieDraft.trailerUrl || null };
      if (editingMovieId === null) {
        await createAdminMovie(payload);
        if (!currentScope()) return;
        reloadFirstPage();
      } else {
        const { data: updated } = await updateAdminMovie(editingMovieId, payload);
        if (!currentScope()) return;
        setData(current => current ? { ...current, content: current.content.map(item => item.id === updated.id ? updated : item) } : current);
      }
      if (!currentEditor()) return;
      resetMovieDraft();
      if (movieEditor.current) movieEditor.current.open = false;
      pendingFocus.current = { scope, request: editorRequestId.current, origin, target: "return", trigger: wasEditing ? trigger : null, movieId: wasEditing ? editingMovieId : null };
      editingTrigger.current = null;
      setError(false);
    } catch {
      if (currentEditor()) {
        setActionError(wasEditing ? t("adminMovieSaveError") : t("adminMovieCreateError"));
        pendingFocus.current = { scope, request, origin, target: "error", trigger };
      }
    } finally {
      if (currentScope()) {
        saveToken.current = null;
        setMutationBusy(false);
      }
    }
  };

  const removeMovie = async (movie: AdminMovie) => {
    const actionScope = actionScopeGeneration.current;
    const isCurrent = () => mounted.current && actionScopeGeneration.current === actionScope;
    if (mutationBusy || !isCurrent()) return;
    pendingFocus.current = null;
    const deleteFocusOrigin = deleteTrigger.current?.isConnected
      ? deleteTrigger.current
      : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMutationBusy(true);
    setActionError("");
    try {
      await deleteAdminMovie(movie.id);
      if (!isCurrent()) return;
      const nextPage = data?.content.length === 1 && page > 0 ? page - 1 : page;
      catalogFocus.current = { page: nextPage, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
      if (nextPage !== page) setPage(nextPage);
      else {
        setLoading(true);
        setData(null);
        setRevision(value => value + 1);
      }
      if (editingMovieId === movie.id) {
        resetMovieDraft();
        if (movieEditor.current) movieEditor.current.open = false;
        editingTrigger.current = null;
      }
      setError(false);
    } catch {
      if (isCurrent()) {
        setActionError(t("adminMovieDeleteError"));
        pendingFocus.current = {
          scope: scopeGeneration.current,
          request: editorRequestId.current,
          origin: deleteFocusOrigin,
          target: "error",
          trigger: null,
          movieId: editingMovieId,
        };
      }
    } finally {
      if (isCurrent()) setMutationBusy(false);
    }
  };

  const requestMovieDelete = (movie: AdminMovie, trigger: HTMLElement) => {
    if (mutationBusy) return;
    deleteTrigger.current = trigger;
    setPendingDelete(movie);
  };

  const cancelMovieDelete = () => {
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    window.requestAnimationFrame(() => {
      if (deleteTrigger.current?.isConnected) deleteTrigger.current.focus();
    });
  };

  const confirmMovieDelete = () => {
    if (!pendingDelete || mutationBusy) return;
    const movie = pendingDelete;
    if (deleteDialog.current?.open) deleteDialog.current.close();
    setPendingDelete(null);
    void removeMovie(movie);
  };

  const syncMovie = async (movie: AdminMovie) => {
    const actionScope = actionScopeGeneration.current;
    const isCurrent = () => mounted.current && actionScopeGeneration.current === actionScope;
    const tmdbId = parseTmdbId(tmdbIds[movie.id] ?? "");
    if (tmdbId === null) {
      if (isCurrent()) {
        setSyncError(true);
        setSyncMessage(t("tmdbIdRequired"));
      }
      return;
    }
    if (syncingMovieId !== null || !isCurrent()) return;
    setSyncingMovieId(movie.id);
    setSyncMessage(null);
    setSyncError(false);
    setActionError("");
    try {
      const { data: response } = await syncAdminMovieTmdb(movie.id, tmdbId);
      if (!isCurrent()) return;
      setSyncMessage(`${t("tmdbSyncDone")}: ${editorialText(response.title, t("untitledFilm"))} · ${response.genresUpdated} ${t("genres")} · ${response.actorsUpdated} ${t("actors")} · ${response.directorsUpdated} ${t("directors")} · ${response.producersUpdated} ${t("producers")}`);
      setRevision(value => value + 1);
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      if (isCurrent()) {
        setSyncError(true);
        setSyncMessage(t("tmdbSyncError"));
      }
    } finally {
      if (isCurrent()) setSyncingMovieId(null);
    }
  };

  const importTmdbIds = async (event: React.FormEvent) => {
    event.preventDefault();
    const actionScope = actionScopeGeneration.current;
    const isCurrent = () => mounted.current && actionScopeGeneration.current === actionScope;
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
      if (!isCurrent()) return;
      setTmdbImportMessage(`${t("tmdbImportDone")}: ${response.succeeded}/${response.requested}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      if (isCurrent()) {
        setTmdbImportError(true);
        setTmdbImportMessage(t("tmdbImportError"));
      }
    } finally {
      if (isCurrent()) setTmdbImportBusy(false);
    }
  };

  const discoverAndImportTmdb = async (event: React.FormEvent) => {
    event.preventDefault();
    const actionScope = actionScopeGeneration.current;
    const isCurrent = () => mounted.current && actionScopeGeneration.current === actionScope;
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
      if (!isCurrent()) return;
      setTmdbImportMessage(`${t("tmdbDiscoveryDone")}: ${response.imports.succeeded}/${response.discovered} · ${t("page")} ${response.page}/${response.totalPages}`);
      reloadFirstPage();
      setQualityRevision(value => value + 1);
      setError(false);
    } catch {
      if (isCurrent()) {
        setTmdbImportError(true);
        setTmdbImportMessage(t("tmdbImportError"));
      }
    } finally {
      if (isCurrent()) setTmdbImportBusy(false);
    }
  };

  const retry = () => {
    catalogFocus.current = { page, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setLoading(true);
    setData(null);
    setError(false);
    setRevision(value => value + 1);
  };

  const retryQuality = () => setQualityRevision(value => value + 1);
  const editingMovie = editingMovieId === null ? null : data?.content.find(movie => movie.id === editingMovieId) ?? null;

  return (
    <section className={`${styles.section} ${editingMovieId !== null ? styles.editing : ""}`} aria-label={t("adminMovieDatabase")} aria-busy={loading || qualityLoading || mutationBusy || tmdbImportBusy || syncingMovieId !== null}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title} ref={catalogTitle} tabIndex={-1}>{editingMovieId !== null ? t("adminMovieEditor") : t("adminMovieDatabase")}</h2>
        <details className={styles.editor} ref={movieEditor} aria-busy={editorLoading}>
          <summary ref={element => { movieEditorSummary.current = element; }} onClick={event => {
            if (editorLoading) event.preventDefault();
            else if (movieEditor.current?.open) {
              editorRequestId.current += 1;
              pendingFocus.current = null;
            }
          }}>{editingMovieId === null ? t("addMovie") : `${t("editMovie")}: ${editorialText(movieDraft.title, t("untitledFilm"))}`}</summary>
          <div className={styles.editorContent}>
            {editorLoading ? <AdminLoading label={t("loading")} layout="editor" /> : editorDetailsFailed ? <div className={styles.error} ref={movieDetailsError} tabIndex={-1}><RetryNotice className={styles.error} message={t("adminMovieDetailsError")} retryLabel={t("retry")} disabled={editorLoading} busy={editorLoading} onRetry={() => {
              const movie = data?.content.find(item => item.id === editingMovieId);
              const trigger = editingTrigger.current;
              if (movie && trigger) void editMovie(movie, trigger, document.activeElement instanceof HTMLElement ? document.activeElement : null);
            }} /></div> : <form className={styles.movieForm} onSubmit={saveMovie} aria-busy={mutationBusy}>
              <div className={styles.editorPoster} aria-hidden="true"><ResilientImage src={movieDraft.photoUrl} alt="" fallback={<span>{editorialText(movieDraft.title, t("untitledFilm"))}</span>} /></div>
              <div className={styles.editorFields}>
                <label className={`${styles.field} ${styles.editorWideField}`}>{t("movieTitle")}<input ref={movieTitleInput} required maxLength={255} value={movieDraft.title} onChange={event => setMovieDraft({ ...movieDraft, title: event.target.value })} /></label>
                <label className={styles.field}>{t("movieDurationMinutes")}<input type="number" min="1" max="1000" value={movieDraft.durationMinutes ?? ""} onChange={event => setMovieDraft({ ...movieDraft, durationMinutes: event.target.value === "" ? null : Number(event.target.value) })} /></label>
                <label className={styles.field}>{t("releaseDate")}<input type="date" value={movieDraft.releaseDate ?? ""} onChange={event => setMovieDraft({ ...movieDraft, releaseDate: event.target.value })} /></label>
                <label className={styles.field}>{t("imdbId")}<input maxLength={20} value={movieDraft.imdbId ?? ""} onChange={event => setMovieDraft({ ...movieDraft, imdbId: event.target.value })} /></label>
                <label className={styles.field}>{t("ageRating")}<input maxLength={10} value={movieDraft.ageRating ?? ""} onChange={event => setMovieDraft({ ...movieDraft, ageRating: event.target.value })} /></label>
                <label className={styles.field}>{t("rating")}<input type="number" min="0" max="10" step="0.1" value={movieDraft.rating ?? ""} onChange={event => setMovieDraft({ ...movieDraft, rating: event.target.value === "" ? null : Number(event.target.value) })} /></label>
                <label className={styles.field}>{t("posterUrl")}<input type="url" maxLength={255} value={movieDraft.photoUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, photoUrl: event.target.value })} /></label>
                <label className={styles.field}>{t("backdropUrl")}<input type="url" maxLength={255} value={movieDraft.backdropUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, backdropUrl: event.target.value })} /></label>
                <label className={styles.field}>{t("trailerUrl")}<input type="url" maxLength={255} value={movieDraft.trailerUrl ?? ""} onChange={event => setMovieDraft({ ...movieDraft, trailerUrl: event.target.value })} /></label>
              </div>
              {editingMovieId !== null && (movieCredits.genres.length > 0 || movieCredits.directors.length > 0 || movieCredits.actors.length > 0) && <dl className={styles.editorMetadata}>
                <div><dt>{t("genres")}</dt><dd>{movieCredits.genres.length ? movieCredits.genres.join(", ") : t("none")}</dd></div>
                <div><dt>{t("directors")}</dt><dd>{movieCredits.directors.length ? movieCredits.directors.join(", ") : t("none")}</dd></div>
                <div><dt>{t("actors")}</dt><dd>{movieCredits.actors.length ? movieCredits.actors.join(", ") : t("none")}</dd></div>
              </dl>}
              <label className={`${styles.field} ${styles.plotField}`}>{t("description")}<textarea maxLength={10000} rows={5} value={movieDraft.shortPlot ?? ""} onChange={event => setMovieDraft({ ...movieDraft, shortPlot: event.target.value })} /></label>
              <div className={styles.actions}><button type="submit" aria-busy={mutationBusy} disabled={mutationBusy}>{mutationBusy ? t("saving") : editingMovieId === null ? t("create") : t("save")}</button>{editingMovieId !== null && <button type="button" disabled={mutationBusy} onClick={cancelEdit}>{t("cancel")}</button>}{editingMovie && <button type="button" className={styles.deleteAction} disabled={mutationBusy} onClick={event => requestMovieDelete(editingMovie, event.currentTarget)}>{t("deleteMovie")}</button>}</div>
            </form>}
            {editingMovieId !== null && (editorLoading || editorDetailsFailed) && <div className={styles.actions}><button type="button" onClick={cancelEdit}>{t("cancel")}</button></div>}
            {editingMovieId === null && <div className={styles.tmdbPanel}>
              <h3 className={styles.tmdbTitle}>{t("tmdbImportTitle")}</h3>
              {qualityLoading && !tmdbQuality && <p className={styles.feedback} role="status">{t("loading")}</p>}
              {qualityError && <RetryNotice className={styles.error} message={t("tmdbQualityError")} retryLabel={t("retry")} disabled={qualityLoading} busy={qualityLoading} onRetry={retryQuality} />}
              {tmdbQuality && <div className={styles.quality}><strong>{t("tmdbQualityTitle")}</strong><p>{t("tmdbQualitySummary")}: {tmdbQuality.tmdbLinkedMovies}/{tmdbQuality.totalMovies} · {t("tmdbCoverage")}: {tmdbQuality.linkedCoveragePercent.toFixed(1)}% · {t("tmdbCompleteness")}: {tmdbQuality.metadataCompletenessPercent.toFixed(1)}%</p><ul className={styles.qualityList}><li>{t("tmdbMissingPoster")}: {tmdbQuality.missingPoster}</li><li>{t("tmdbMissingBackdrop")}: {tmdbQuality.missingBackdrop}</li><li>{t("tmdbMissingPlot")}: {tmdbQuality.missingPlot}</li><li>{t("tmdbMissingRuntime")}: {tmdbQuality.missingRuntime}</li><li>{t("tmdbMissingTrailer")}: {tmdbQuality.missingTrailer}</li><li>{t("tmdbMissingRating")}: {tmdbQuality.missingTmdbRating}</li></ul></div>}
              <form className={styles.importForm} onSubmit={importTmdbIds}><label className={styles.inlineField}>{t("tmdbIds")}<input aria-label={t("tmdbIds")} placeholder={t("tmdbIdsHint")} value={tmdbImportIds} onChange={event => setTmdbImportIds(event.target.value)} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbImport")}</button></form>
              <form className={`${styles.importForm} ${styles.discoveryForm}`} onSubmit={discoverAndImportTmdb}><label className={styles.inlineField}>{t("page")}<input type="number" min="1" max="500" value={tmdbDiscoveryDraft.page} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, page: event.target.value })} /></label><label className={styles.inlineField}>{t("year")}<input type="number" min="1888" max="2100" value={tmdbDiscoveryDraft.year} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, year: event.target.value })} /></label><label className={styles.inlineField}>{t("genre")}<input type="number" min="1" value={tmdbDiscoveryDraft.genreId} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, genreId: event.target.value })} /></label><label className={styles.inlineField}>{t("minRating")}<input type="number" min="0" max="10" step="0.1" value={tmdbDiscoveryDraft.minRating} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, minRating: event.target.value })} /></label><label className={styles.inlineField}>{t("limit")}<input type="number" min="1" max="20" value={tmdbDiscoveryDraft.limit} onChange={event => setTmdbDiscoveryDraft({ ...tmdbDiscoveryDraft, limit: event.target.value })} /></label><button type="submit" disabled={tmdbImportBusy}>{tmdbImportBusy ? t("loading") : t("tmdbDiscoveryImport")}</button></form>
              {tmdbImportMessage && <p className={tmdbImportError ? styles.error : styles.status} role={tmdbImportError ? "alert" : "status"}>{tmdbImportMessage}</p>}
            </div>}
          </div>
        </details>
      </div>
      {actionError && <p className={styles.error} role="alert" ref={movieActionAlert} tabIndex={-1}>{actionError}</p>}
      <dialog className={styles.deleteDialog} ref={deleteDialog} role="alertdialog" aria-labelledby="admin-movie-delete-title" aria-describedby="admin-movie-delete-description" onCancel={event => {
        event.preventDefault();
        cancelMovieDelete();
      }}>
        <h3 id="admin-movie-delete-title">{t("deleteMovie")}</h3>
        {pendingDelete && <p id="admin-movie-delete-description">{t("deleteMovieConfirm")} <strong>{editorialText(pendingDelete.title, t("untitledFilm"))}</strong></p>}
        <div className={styles.deleteDialogActions}>
          <button type="button" ref={deleteDialogCancel} disabled={mutationBusy} onClick={cancelMovieDelete}>{t("cancel")}</button>
          <button type="button" className={styles.deleteDialogConfirm} disabled={mutationBusy} aria-busy={mutationBusy} onClick={confirmMovieDelete}>{mutationBusy ? t("loading") : t("deleteMovie")}</button>
        </div>
      </dialog>
      {syncMessage && <p className={syncError ? styles.error : styles.status} role={syncError ? "alert" : "status"}>{syncMessage}</p>}
      {loading && <AdminLoading label={t("loading")} layout="movies" />}
      {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={retry} />}
      {editingMovieId === null && data && data.content.length === 0 && <p>{t("noAdminMovies")}</p>}
      {editingMovieId === null && data && <>
        <ul className={styles.movieList} aria-label={t("adminMovieResults")}>{data.content.map(movie => {
          const movieTitle = editorialText(movie.title, t("untitledFilm"));
          return <li className={styles.movieRow} key={movie.id}>
            <div className={styles.poster}><ResilientImage src={movie.photoUrl} alt="" loading="lazy" fallback={<span>{movieTitle}</span>} /></div>
            <div className={styles.movieCardContent}>
              <div className={styles.movieCardHeading}>
                <div><h3>{movieTitle}</h3><p>{movie.releaseDate || "—"}</p></div>
                <span className={styles.movieRating} aria-label={`${t("rating")}: ${movie.rating ?? "—"}`}>★ {movie.rating ?? "—"}</span>
              </div>
              <div className={styles.movieCardActions}>
                <button type="button" data-admin-movie-edit-id={movie.id} disabled={mutationBusy} onClick={event => editMovie(movie, event.currentTarget)}>{t("editMovie")}</button>
                <details className={styles.movieActions}>
                  <summary aria-label={`${t("moreActions")} · ${movieTitle}`}>{t("moreActions")}</summary>
                  <div className={styles.movieActionsPanel}>
                    <button type="button" disabled={mutationBusy} onClick={event => requestMovieDelete(movie, event.currentTarget)}>{t("deleteMovie")}</button>
                    <div className={styles.syncControls}><label className={styles.inlineField}>{t("tmdbId")}<input className={styles.tmdbIdInput} inputMode="numeric" pattern="[0-9]*" aria-label={`${t("tmdbId")} ${movieTitle}`} value={tmdbIds[movie.id] ?? ""} onChange={event => setTmdbIds(current => ({ ...current, [movie.id]: event.target.value }))} /></label><button type="button" disabled={syncingMovieId !== null} onClick={() => void syncMovie(movie)}>{syncingMovieId === movie.id ? t("loading") : t("syncTmdb")}</button></div>
                  </div>
                </details>
              </div>
            </div>
          </li>;
        })}</ul>
        <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminMoviesPagination")} busy={loading || mutationBusy} statusSuffix={data.totalElements} onPageChange={nextPage => {
          if (loading || mutationBusy) return;
          catalogFocus.current = { page: nextPage, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
          setLoading(true);
          setData(null);
          setPage(nextPage);
        }} />
      </>}
    </section>
  );
}
