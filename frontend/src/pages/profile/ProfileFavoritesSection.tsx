import { type ProfileCollection } from "../../api/profile.api";
import { useLocale, editorialText } from "../../i18n";
import styles from "../Profile.module.css";
import { Link } from "react-router-dom";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import ResilientImage from "../../components/ResilientImage";
import { type ProfileFavoritesModel } from "./useProfileFavorites";

interface Props {
  favorites: Pick<
    ProfileFavoritesModel,
    | "favoriteOverviewRef"
    | "favoritePreviewLoading"
    | "favoriteOverviewHeadingRef"
    | "favoritePreviewError"
    | "favoriteRetryFocus"
    | "favoritePreviewAttempt"
    | "setFavoritePreviewLoading"
    | "setFavoritePreviewError"
    | "setFavoritePreviewAttempt"
    | "favoritePreview"
  >;
  sectionTarget: (id: string, kind: ProfileCollection | null) => { search: string; hash: string };
}

export default function ProfileFavoritesSection({ favorites, sectionTarget }: Props) {
  const {
    favoriteOverviewRef,
    favoritePreviewLoading,
    favoriteOverviewHeadingRef,
    favoritePreviewError,
    favoriteRetryFocus,
    favoritePreviewAttempt,
    setFavoritePreviewLoading,
    setFavoritePreviewError,
    setFavoritePreviewAttempt,
    favoritePreview,
  } = favorites;
  const { t, path } = useLocale();

  return <section ref={favoriteOverviewRef} className={`${styles.section} ${styles.previewSection}`} id="profile-overview" aria-labelledby="profile-favorite-preview-title" aria-busy={favoritePreviewLoading}>
        <span id="profile-favorite-preview" aria-hidden="true" /><h2 id="profile-favorite-preview-title" ref={favoriteOverviewHeadingRef} tabIndex={-1}><Link to={sectionTarget("profile-collections", "favorites")}>{t("favoriteFilms")}</Link></h2>
        {favoritePreviewLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {favoritePreviewError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => { favoriteRetryFocus.current = { origin: document.activeElement instanceof HTMLElement ? document.activeElement : null, attempt: favoritePreviewAttempt + 1, target: "overview" }; setFavoritePreviewLoading(true); setFavoritePreviewError(false); setFavoritePreviewAttempt(value => value + 1); }} />}
        {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p className={styles.empty}>{t("noCollectionFilms")}</p> : <ul className={styles.overviewPosterGrid}>
          {favoritePreview.content.slice(0, 4).map(movie => {
            const title = editorialText(movie.title, t("untitledFilm"));
            return <li key={movie.id}><Link className={styles.railPosterLink} to={path(`/films/${movie.id}`)} aria-label={title} title={title}>
              <ResilientImage className={styles.railPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.railPosterFallback}>{title.slice(0, 1).toUpperCase()}</span>} />
            </Link></li>;
          })}
        </ul>)}
      </section>;
}
