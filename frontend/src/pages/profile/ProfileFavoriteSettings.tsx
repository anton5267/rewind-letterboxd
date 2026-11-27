import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ListReorderHandle from "../../components/ListReorderHandle";
import ResilientImage from "../../components/ResilientImage";
import RetryNotice from "../../components/RetryNotice";
import { editorialText, useLocale } from "../../i18n";
import type { ProfileFavoritesModel } from "./useProfileFavorites";
import styles from "./ProfileFavoriteSettings.module.css";

export interface ProfileFavoriteSettingsProps {
  favorites: Pick<
    ProfileFavoritesModel,
    | "favoriteOrder"
    | "favoriteSettingsRef"
    | "favoritePreviewLoading"
    | "favoriteRemovalId"
    | "favoritePreviewError"
    | "favoriteRetryFocus"
    | "favoritePreviewAttempt"
    | "setFavoritePreviewLoading"
    | "setFavoritePreviewError"
    | "setFavoritePreviewAttempt"
    | "favoritePreview"
    | "removeFavorite"
  >;
}

export default function ProfileFavoriteSettings({ favorites }: ProfileFavoriteSettingsProps) {
  const { t, path } = useLocale();
  const touchGesture = useRef<{ pointerId: number; sourceId: number; startX: number; startY: number; dragging: boolean } | null>(null);
  const suppressFavoriteClick = useRef<number | null>(null);
  const [draggingMovieId, setDraggingMovieId] = useState<number | null>(null);
  const {
    favoriteOrder,
    favoriteSettingsRef,
    favoritePreviewLoading,
    favoriteRemovalId,
    favoritePreviewError,
    favoriteRetryFocus,
    favoritePreviewAttempt,
    setFavoritePreviewLoading,
    setFavoritePreviewError,
    setFavoritePreviewAttempt,
    favoritePreview,
    removeFavorite,
  } = favorites;

  const retry = () => {
    favoriteRetryFocus.current = {
      origin: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      attempt: favoritePreviewAttempt + 1,
      target: "settings",
    };
    setFavoritePreviewLoading(true);
    setFavoritePreviewError(false);
    setFavoritePreviewAttempt(value => value + 1);
  };

  return (
    <section ref={favoriteSettingsRef} className={styles.favorites} data-profile-favorites aria-labelledby="settings-favorites-title" aria-busy={favoritePreviewLoading || favoriteRemovalId !== null || favoriteOrder.busy}>
      <h2 id="settings-favorites-title" tabIndex={-1}>{t("favoriteFilms")}</h2>
      {favoritePreviewLoading && <p role="status">{t("loading")}</p>}
      {favoriteOrder.busy && <p role="status">{t("saving")}</p>}
      {favoritePreviewError && <RetryNotice className={styles.error} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retry} />}
      {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul data-profile-favorite-posters>
        {favoritePreview.content.slice(0, 4).map((movie, index) => {
          const title = editorialText(movie.title, t("untitledFilm"));
          const disabled = favoriteRemovalId !== null || favoriteOrder.busy;
          return <li
            key={movie.id}
            data-list-item-id={movie.id}
            data-favorite-reordering={draggingMovieId === movie.id || undefined}
            draggable={favoriteOrder.available && !disabled}
            onPointerDown={event => {
              suppressFavoriteClick.current = null;
              if (!favoriteOrder.available || disabled || event.pointerType === "mouse" || !event.isPrimary) return;
              if (!(event.target instanceof Element) || !event.target.closest("[data-favorite-poster]")) return;
              touchGesture.current = { pointerId: event.pointerId, sourceId: movie.id, startX: event.clientX, startY: event.clientY, dragging: false };
            }}
            onPointerMove={event => {
              const gesture = touchGesture.current;
              if (!gesture || gesture.pointerId !== event.pointerId || gesture.sourceId !== movie.id) return;
              const deltaX = event.clientX - gesture.startX;
              const deltaY = event.clientY - gesture.startY;
              if (!gesture.dragging && (Math.abs(deltaX) < 8 || Math.abs(deltaX) <= Math.abs(deltaY))) return;
              event.preventDefault();
              if (!gesture.dragging) {
                gesture.dragging = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraggingMovieId(movie.id);
              }
            }}
            onPointerUp={event => {
              const gesture = touchGesture.current;
              if (!gesture || gesture.pointerId !== event.pointerId || gesture.sourceId !== movie.id) return;
              touchGesture.current = null;
              setDraggingMovieId(null);
              if (!gesture.dragging || disabled) return;
              event.preventDefault();
              suppressFavoriteClick.current = movie.id;
              const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-list-item-id]");
              const targetMovieId = Number(target?.dataset.listItemId);
              if (Number.isSafeInteger(targetMovieId) && targetMovieId !== movie.id && favoritePreview.content.slice(0, 4).some(item => item.id === targetMovieId)) {
                void favoriteOrder.move(movie.id, targetMovieId);
              }
            }}
            onPointerCancel={event => {
              if (touchGesture.current?.pointerId === event.pointerId) touchGesture.current = null;
              setDraggingMovieId(null);
            }}
            onDragStart={event => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", String(movie.id));
            }}
            onDragOver={event => {
              if (favoriteOrder.available && !disabled) event.preventDefault();
            }}
            onDrop={event => {
              event.preventDefault();
              const sourceId = Number(event.dataTransfer.getData("text/plain"));
              if (favoritePreview.content.slice(0, 4).some(item => item.id === sourceId)) {
                void favoriteOrder.move(sourceId, movie.id);
              }
            }}
          >
            <Link className={styles.poster} data-favorite-poster to={path(`/films/${movie.id}`)} aria-label={title} onClick={event => {
              if (suppressFavoriteClick.current !== movie.id) return;
              event.preventDefault();
              suppressFavoriteClick.current = null;
            }}>
              <ResilientImage
                src={movie.photoUrl}
                alt=""
                loading="lazy"
                fallback={<span>{title.slice(0, 1).toUpperCase()}</span>}
              />
            </Link>
            <button
              className={styles.remove}
              data-favorite-remove
              type="button"
              aria-label={`${t("remove")} ${title}`}
              aria-busy={favoriteRemovalId === movie.id}
              disabled={disabled}
              onClick={() => void removeFavorite(movie.id, index)}
            >
              <span className={styles.removeMark} aria-hidden="true">
                <img src="/images/profile-favorite-remove.png" width={12} height={12} alt="" />
              </span>
              {favoriteRemovalId === movie.id && <span className="srOnly" role="status">{t("loading")}</span>}
            </button>
            {favoriteOrder.available && favoritePreview.content.length > 1 && <ListReorderHandle
              itemId={movie.id}
              label={`${t("reorderItem")} ${title}`}
              instructionsId="favorite-reorder-instructions"
              className={styles.reorder}
              disabled={disabled}
              onStep={direction => {
                const target = favoritePreview.content.slice(0, 4)[index + direction];
                if (target) void favoriteOrder.move(movie.id, target.id);
              }}
              onDrop={targetMovieId => {
                if (favoritePreview.content.slice(0, 4).some(item => item.id === targetMovieId)) {
                  void favoriteOrder.move(movie.id, targetMovieId);
                }
              }}
            />}
          </li>;
        })}
      </ul>)}
      {favoriteOrder.available && (favoritePreview?.content.length ?? 0) > 1 && <p id="favorite-reorder-instructions" className={styles.instructions} data-profile-favorite-instructions>
        <span className={styles.desktopInstructions}>{t("favoriteReorderHelp")}</span>
        <span className={styles.phoneInstructions}>{t("favoriteReorderPhoneHelp")}</span>
      </p>}
      <Link className={styles.manageLink} to={`${path("/profile")}?view=collection&collection=favorites#profile-collections`}>{t("favoriteFilms")} <span aria-hidden="true">→</span></Link>
    </section>
  );
}
