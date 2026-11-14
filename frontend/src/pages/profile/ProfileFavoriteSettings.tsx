import ListReorderHandle from "../../components/ListReorderHandle";
import { Link } from "react-router-dom";
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
    <section ref={favoriteSettingsRef} className={styles.favorites} aria-labelledby="settings-favorites-title" aria-busy={favoritePreviewLoading || favoriteRemovalId !== null || favoriteOrder.busy}>
      <h2 id="settings-favorites-title" tabIndex={-1}>{t("favoriteFilms")}</h2>
      {favoritePreviewLoading && <p role="status">{t("loading")}</p>}
      {favoriteOrder.busy && <p role="status">{t("saving")}</p>}
      {favoritePreviewError && <RetryNotice className={styles.error} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retry} />}
      {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul>
        {favoritePreview.content.slice(0, 4).map((movie, index) => {
          const title = editorialText(movie.title, t("untitledFilm"));
          const disabled = favoriteRemovalId !== null || favoriteOrder.busy;
          return <li
            key={movie.id}
            data-list-item-id={movie.id}
            draggable={favoriteOrder.available && !disabled}
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
            <Link className={styles.poster} to={path(`/films/${movie.id}`)} aria-label={title}>
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
      {favoriteOrder.available && (favoritePreview?.content.length ?? 0) > 1 && <p id="favorite-reorder-instructions" className={styles.instructions}>{t("favoriteReorderHelp")}</p>}
      <Link className={styles.manageLink} to={`${path("/profile")}?view=collection&collection=favorites#profile-collections`}>{t("favoriteFilms")} <span aria-hidden="true">→</span></Link>
    </section>
  );
}
