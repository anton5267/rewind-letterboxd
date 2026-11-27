import { useEffect, useRef, useState } from "react";
import type { MovieDetails } from "../api/movies.api";
import type { UserList } from "../api/lists.api";
import { getWatchedDate, setWatchedDate } from "../api/ratings.api";
import RetryButton from "./RetryButton";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import styles from "./MovieActionSheet.module.css";

type MovieFlag = "watched" | "watchlist" | "favorite";

interface MovieActionSheetProps {
  open: boolean;
  movie: MovieDetails;
  rating: number;
  ratingLoading: boolean;
  ratingLoadError: boolean;
  mutationBusy: string | null;
  lists: UserList[];
  listsLoading: boolean;
  listsLoadError: boolean;
  selectedList: string;
  onToggle: (kind: MovieFlag, enabled: boolean) => void;
  onSaveRating: (value: number) => void;
  onRetryRating: () => void;
  onDeleteRating: () => void;
  onSelectedListChange: (value: string) => void;
  onAddToList: () => void;
  onRetryLists: () => void;
  onReview: () => void;
  onShare: () => void;
  onWatchedDateSaved: () => void;
  onClose: () => void;
}

export default function MovieActionSheet({
  open,
  movie,
  rating,
  ratingLoading,
  ratingLoadError,
  mutationBusy,
  lists,
  listsLoading,
  listsLoadError,
  selectedList,
  onToggle,
  onSaveRating,
  onRetryRating,
  onDeleteRating,
  onSelectedListChange,
  onAddToList,
  onRetryLists,
  onReview,
  onShare,
  onWatchedDateSaved,
  onClose,
}: MovieActionSheetProps) {
  const { lang, t } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(open, onClose, { initialFocusRef: closeButtonRef });
  const [listPickerOpen, setListPickerOpen] = useState(false);
  const [watchedOn, setWatchedOn] = useState<string | null>(null);
  const [watchedOnDraft, setWatchedOnDraft] = useState("");
  const [watchedDateLoading, setWatchedDateLoading] = useState(false);
  const [watchedDateError, setWatchedDateError] = useState(false);
  const [watchedDateSaving, setWatchedDateSaving] = useState(false);
  const [dateEditorOpen, setDateEditorOpen] = useState(false);
  const [watchedDateAttempt, setWatchedDateAttempt] = useState(0);

  useEffect(() => {
    if (!open) {
      setListPickerOpen(false);
      setDateEditorOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !movie.myFlags?.watched) {
      setWatchedOn(null);
      setWatchedOnDraft("");
      setWatchedDateError(false);
      setWatchedDateLoading(false);
      return;
    }
    let current = true;
    setWatchedDateLoading(true); setWatchedDateError(false);
    getWatchedDate(movie.id).then(({ data }) => {
      if (!current) return;
      setWatchedOn(data.watchedOn); setWatchedOnDraft(data.watchedOn ?? "");
    }).catch(() => { if (current) setWatchedDateError(true); })
      .finally(() => { if (current) setWatchedDateLoading(false); });
    return () => { current = false; };
  }, [open, movie.id, movie.myFlags?.watched, watchedDateAttempt]);

  if (!open) return null;

  const busy = mutationBusy !== null;
  const movieTitle = editorialText(movie.title, t("untitledFilm"));
  const localToday = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  const displayWatchedDate = (value: string | null) => {
    if (!value) return t("watchedDatePlaceholder");
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
  };
  const saveWatchedDate = async () => {
    if (!watchedOnDraft || watchedDateSaving || busy) return;
    setWatchedDateSaving(true); setWatchedDateError(false);
    try {
      await setWatchedDate(movie.id, watchedOnDraft);
      setWatchedOn(watchedOnDraft); onWatchedDateSaved(); onClose();
    } catch { setWatchedDateError(true); }
    finally { setWatchedDateSaving(false); }
  };
  const flagActions: { kind: MovieFlag; label: string; icon: string; enabled: boolean }[] = [
    { kind: "watched", label: t("watched"), icon: "/images/movie-action-eye.png", enabled: movie.myFlags?.watched ?? false },
    { kind: "favorite", label: t("favorite"), icon: "/images/movie-action-favorite.png", enabled: movie.myFlags?.favorites ?? false },
    { kind: "watchlist", label: t("watchlist"), icon: "/images/movie-action-watchlist.png", enabled: movie.myFlags?.watchlist ?? false },
  ];

  return <div className={styles.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section id="movie-action-sheet" ref={sheetRef} className={`${styles.sheet} ${dateEditorOpen ? styles.dateEditor : ""}`} role="dialog" aria-modal="true" aria-labelledby="movie-action-title">
      {dateEditorOpen ? <>
      <div className={styles.dateEditorHeading}><h2 id="movie-action-title">{movieTitle}</h2><p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p></div>
      <div className={styles.dateEditorContent}>
        <label className={styles.dateRow}><span>{t("watchedDateLabel")}</span><span className={styles.dateRowValue}>{displayWatchedDate(watchedOnDraft || null)}</span><input type="date" aria-label={t("watchedDateLabel")} value={watchedOnDraft} max={localToday} disabled={watchedDateLoading || watchedDateSaving} onChange={event => setWatchedOnDraft(event.target.value)} /></label>
        <div className={styles.dateRatingRow}>
          <div className={styles.dateRating}><span>{t("rated")}</span><div role="group" aria-label={t("myRating")}>{[1,2,3,4,5].map(value => <button className={value <= rating ? styles.dateRatingActive : ""} key={value} type="button" aria-label={`${t("rateAs")} ${value}`} aria-pressed={rating === value} disabled={ratingLoading || busy} onClick={() => onSaveRating(value)}>★</button>)}</div></div>
          <div className={styles.dateLike}><span>{t("like")}</span><button type="button" aria-label={`${movie.myFlags?.favorites ? t("unlike") : t("like")} ${movieTitle}`} aria-pressed={movie.myFlags?.favorites ?? false} disabled={busy} onClick={() => onToggle("favorite", movie.myFlags?.favorites ?? false)}>{movie.myFlags?.favorites ? "♥" : "♡"}</button></div>
        </div>
        <p className={styles.dateSynopsis}>{movie.shortPlot ?? ""}</p>
        {watchedDateLoading && <p className={styles.inlineStatus} role="status">{t("loading")}</p>}
        {watchedDateError && <p className={styles.inlineError} role="alert">{t(watchedOn ? "watchedDateSaveError" : "watchedDateLoadError")} <RetryButton label={t("watchedDateRetry")} onClick={() => setWatchedDateAttempt(value => value + 1)} /></p>}
      </div>
      <div className={styles.dateEditorActions}><button type="button" onClick={onClose}>{t("cancel")}</button><button type="button" disabled={!watchedOnDraft || watchedDateLoading || watchedDateSaving || busy} aria-busy={watchedDateSaving} onClick={() => void saveWatchedDate()}>{watchedDateSaving ? t("saving") : t("saveSetting")}</button></div>
      </> : <>
      <div className={styles.heading}>
        <div>
          <h2 id="movie-action-title">{movieTitle}</h2>
          <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p>
        </div>
      </div>

      <div className={styles.actionPanel}>
        {movie.myFlags?.watched && <>
        <button className={styles.watchedDateRow} type="button" aria-label={`${t("watchedDateEdit")}: ${displayWatchedDate(watchedOn)}`} onClick={() => { setWatchedOnDraft(watchedOn ?? ""); setDateEditorOpen(true); }}>
          <span>{t("watchedDateLabel")}</span><span>{watchedDateLoading ? t("loading") : displayWatchedDate(watchedOn)}</span>
        </button>
        {watchedDateError && <p className={styles.inlineError} role="alert">{t("watchedDateLoadError")} <RetryButton label={t("watchedDateRetry")} onClick={() => setWatchedDateAttempt(value => value + 1)} /></p>}
        </>}
        <div className={styles.flagGrid}>
          {flagActions.map(action => <button
            className={`${styles.flagButton} ${action.enabled ? styles.active : ""}`}
            key={action.kind}
            type="button"
            disabled={busy}
            aria-pressed={action.enabled}
            aria-busy={mutationBusy === action.kind}
            onClick={() => onToggle(action.kind, action.enabled)}
          >
            <img className={styles.symbol} src={action.icon} width={51} height={51} alt="" aria-hidden="true" />
            <span>{mutationBusy === action.kind ? t("loading") : action.kind === "favorite" ? t("like") : action.label}</span>
          </button>)}
        </div>

        <div className={styles.ratingBlock}>
          <span className={styles.blockLabel}>{t("rate")}</span>
          <div className={styles.stars} role="group" aria-label={t("myRating")} data-movie-rating-focus="true" tabIndex={-1}>
            {[1, 2, 3, 4, 5].map(value => <button
              className={`${styles.star} ${rating === value ? styles.starActive : ""}`}
              key={value}
              type="button"
              disabled={busy || ratingLoading}
              aria-pressed={rating === value}
              aria-label={`${t("rateAs")} ${value}`}
              onClick={() => onSaveRating(value)}
            >★</button>)}
          </div>
          {ratingLoading && <span className={styles.inlineStatus} role="status">{t("loading")}</span>}
          {ratingLoadError && <span className={styles.inlineError} role="alert" data-rating-error="true">{t("loadRatingsError")} <RetryButton label={t("retry")} onClick={onRetryRating} /></span>}
          {rating > 0 && !ratingLoading && !busy && <button className={styles.removeRating} type="button" onClick={onDeleteRating}>{t("deleteRating")}</button>}
        </div>

        <div className={styles.sheetRow}>
          <label className={styles.desktopListLabel} htmlFor="mobile-movie-list">{t("addToLists")}</label>
          <button
            className={styles.mobileListToggle}
            type="button"
            data-movie-list-focus="true"
            aria-expanded={listPickerOpen}
            aria-controls="mobile-movie-list-picker"
            disabled={busy}
            onClick={() => setListPickerOpen(value => !value)}
          >{t("addToLists")}</button>
          <div id="mobile-movie-list-picker" className={`${styles.listPicker} ${listPickerOpen ? styles.listPickerOpen : ""}`}>
            {listsLoading && <span className={styles.inlineStatus} role="status">{t("loading")}</span>}
            {listsLoadError && <span className={styles.inlineError} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={onRetryLists} /></span>}
            {!listsLoading && !listsLoadError && lists.length === 0 && <span className={styles.inlineStatus}>{t("noLists")}</span>}
            {!listsLoading && !listsLoadError && lists.length > 0 && <div className={styles.listControl}>
              <select id="mobile-movie-list" aria-label={t("chooseList")} value={selectedList} onChange={event => onSelectedListChange(event.target.value)} disabled={busy}>
                <option value="">{t("chooseList")}</option>
                {lists.map(list => <option key={list.id} value={list.id}>{editorialText(list.name, t("lists"))}</option>)}
              </select>
              <button type="button" disabled={!selectedList || busy} aria-busy={mutationBusy === "list"} onClick={onAddToList}>{t("add")}</button>
            </div>}
          </div>
        </div>

        <div className={styles.secondaryActions}>
          <button type="button" onClick={onReview}>{t("review")}</button>
          <button type="button" onClick={onShare}>{t("share")}</button>
        </div>
      </div>

      <button className={styles.doneButton} ref={closeButtonRef} type="button" onClick={onClose}>{t("done")}</button>
      </>}
    </section>
  </div>;
}
