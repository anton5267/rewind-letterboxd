import { useLocale, editorialText, formatMovieYear } from "../../i18n";
import styles from "../Profile.module.css";
import { collectionKinds } from "./profileConstants";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import { Link } from "react-router-dom";
import ResilientImage from "../../components/ResilientImage";
import Pagination from "../../components/Pagination";
import { type ProfileCollectionsModel } from "./useProfileCollections";
import { type ProfileRoute } from "./profileRoute";

interface Props {
  collections: Pick<
    ProfileCollectionsModel,
    | "collectionLoading"
    | "collectionHeadingRef"
    | "collectionFiltersOpen"
    | "setTabRef"
    | "chooseCollection"
    | "handleCollectionTabKeyDown"
    | "collection"
    | "collectionError"
    | "retryCollection"
    | "collectionPage"
    | "changeCollectionPage"
  >;
  route: Pick<ProfileRoute, "profileView" | "collectionKind">;
  filmsView: boolean;
  viewTitle: string;
}

export default function ProfileCollectionsSection({ collections, route, filmsView, viewTitle }: Props) {
  const {
    collectionLoading,
    collectionHeadingRef,
    collectionFiltersOpen,
    setTabRef,
    chooseCollection,
    handleCollectionTabKeyDown,
    collection,
    collectionError,
    retryCollection,
    collectionPage,
    changeCollectionPage,
  } = collections;
  const { profileView, collectionKind } = route;
  const { t, path } = useLocale();

  return <section className={styles.section} id="profile-collections" aria-labelledby="profile-collections-title" aria-busy={collectionLoading}>
        <h2 id="profile-collections-title" ref={collectionHeadingRef} tabIndex={-1}>{filmsView ? t("watched") : profileView ? viewTitle : t("profileCollections")}</h2>
        <div className={styles.tabs} data-filters-open={collectionFiltersOpen} id="profile-collection-filters" role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")}>
          {collectionKinds.map(kind => <button
            id={`profile-collection-tab-${kind}`}
            key={kind}
            ref={setTabRef(kind)}
            type="button"
            role="tab"
            tabIndex={collectionKind === kind ? 0 : -1}
            aria-selected={collectionKind === kind}
            aria-controls="profile-collection-content"
            onClick={() => chooseCollection(kind)}
            onKeyDown={event => handleCollectionTabKeyDown(event, kind)}
          >
            {kind === "favorites" ? t("favorite") : t(kind)}
          </button>)}
        </div>
        <div id="profile-collection-content" role="tabpanel" tabIndex={collection && collection.content.length > 0 ? -1 : 0} aria-labelledby={`profile-collection-tab-${collectionKind}`}>
          {collectionLoading && <ProfileLoading label={t("loading")} layout="films" />}
          {collectionError && <RetryNotice className={styles.feedback} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retryCollection} />}
          {!collectionLoading && !collectionError && collection && <>
            {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <div className={styles.collectionGrid}>
            {collection.content.map(movie => {
              const movieTitle = editorialText(movie.title, t("untitledFilm"));
              return <article className={styles.collectionCard} key={movie.id}>
                <Link className={styles.collectionPosterLink} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
                  <ResilientImage className={styles.collectionPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.collectionPosterFallback}>{movieTitle.slice(0, 1).toUpperCase()}</span>} />
                </Link>
                <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>
                <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
              </article>;
            })}
            </div>}
            <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={changeCollectionPage} />
          </>}
        </div>
      </section>;
}
