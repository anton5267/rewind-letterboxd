import { Link } from "react-router-dom";
import ResilientImage from "../../components/ResilientImage";
import RetryNotice from "../../components/RetryNotice";
import { editorialText, useLocale } from "../../i18n";
import type { ProfileFavoritesModel } from "./useProfileFavorites";
import styles from "./ProfileFavoriteSettings.module.css";

export interface ProfileFavoriteSettingsProps {
  favorites: Pick<
    ProfileFavoritesModel,
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
    <section ref={favoriteSettingsRef} className={styles.favorites} aria-labelledby="settings-favorites-title" aria-busy={favoritePreviewLoading || favoriteRemovalId !== null}>
      <h2 id="settings-favorites-title" tabIndex={-1}>{t("favoriteFilms")}</h2>
      {favoritePreviewLoading && <p role="status">{t("loading")}</p>}
      {favoritePreviewError && <RetryNotice className={styles.error} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retry} />}
      {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul>
        {favoritePreview.content.slice(0, 4).map((movie, index) => {
          const title = editorialText(movie.title, t("untitledFilm"));
          return <li key={movie.id}>
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
              disabled={favoriteRemovalId !== null}
              onClick={() => void removeFavorite(movie.id, index)}
            >
              <span className={styles.removeMark} aria-hidden="true">
                <img src="/images/profile-favorite-remove.png" width={12} height={12} alt="" />
              </span>
              {favoriteRemovalId === movie.id && <span className="srOnly" role="status">{t("loading")}</span>}
            </button>
          </li>;
        })}
      </ul>)}
      <Link className={styles.manageLink} to={`${path("/profile")}?view=collection&collection=favorites#profile-collections`}>{t("favoriteFilms")} <span aria-hidden="true">→</span></Link>
    </section>
  );
}
