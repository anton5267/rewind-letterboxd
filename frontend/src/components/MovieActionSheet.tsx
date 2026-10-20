import { useRef } from "react";
import type { MovieDetails } from "../api/movies.api";
import type { UserList } from "../api/lists.api";
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
  onClose,
}: MovieActionSheetProps) {
  const { t } = useLocale();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useDialogFocusTrap<HTMLElement>(open, onClose, { initialFocusRef: closeButtonRef });

  if (!open) return null;

  const busy = mutationBusy !== null;
  const movieTitle = editorialText(movie.title, t("untitledFilm"));
  const flagActions: { kind: MovieFlag; label: string; symbol: string; enabled: boolean }[] = [
    { kind: "watched", label: t("watched"), symbol: "◉", enabled: movie.myFlags?.watched ?? false },
    { kind: "favorite", label: t("favorite"), symbol: "♡", enabled: movie.myFlags?.favorites ?? false },
    { kind: "watchlist", label: t("watchlist"), symbol: "＋", enabled: movie.myFlags?.watchlist ?? false },
  ];

  return <div className={styles.backdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section id="movie-action-sheet" ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="movie-action-title">
      <div className={styles.heading}>
        <div>
          <h2 id="movie-action-title">{movieTitle}</h2>
          <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</p>
        </div>
      </div>

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
          <span className={styles.symbol} aria-hidden="true">{action.symbol}</span>
          <span>{mutationBusy === action.kind ? t("loading") : action.label}</span>
        </button>)}
      </div>

      <div className={styles.ratingBlock}>
        <span className={styles.blockLabel}>{t("rateFilm")}</span>
        <div className={styles.stars} role="group" aria-label={t("myRating")}>
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
        {ratingLoadError && <span className={styles.inlineError} role="alert">{t("loadRatingsError")} <RetryButton label={t("retry")} onClick={onRetryRating} /></span>}
        {rating > 0 && !ratingLoading && !busy && <button className={styles.removeRating} type="button" onClick={onDeleteRating}>{t("deleteRating")}</button>}
      </div>

      <div className={styles.sheetRow}>
        <label htmlFor="mobile-movie-list">{t("addToList")}</label>
        {listsLoading && <span className={styles.inlineStatus} role="status">{t("loading")}</span>}
        {listsLoadError && <span className={styles.inlineError} role="alert">{t("loadListsError")} <RetryButton label={t("retry")} onClick={onRetryLists} /></span>}
        {!listsLoading && !listsLoadError && lists.length === 0 && <span className={styles.inlineStatus}>{t("noLists")}</span>}
        {!listsLoading && !listsLoadError && lists.length > 0 && <div className={styles.listControl}>
          <select id="mobile-movie-list" value={selectedList} onChange={event => onSelectedListChange(event.target.value)} disabled={busy}>
            <option value="">{t("chooseList")}</option>
            {lists.map(list => <option key={list.id} value={list.id}>{editorialText(list.name, t("lists"))}</option>)}
          </select>
          <button type="button" disabled={!selectedList || busy} aria-busy={mutationBusy === "list"} onClick={onAddToList}>{t("add")}</button>
        </div>}
      </div>

      <div className={styles.secondaryActions}>
        <button type="button" onClick={onReview}>{t("review")}</button>
        <button type="button" onClick={onShare}>{t("share")}</button>
      </div>

      <button className={styles.doneButton} ref={closeButtonRef} type="button" onClick={onClose}>{t("done")}</button>
    </section>
  </div>;
}
