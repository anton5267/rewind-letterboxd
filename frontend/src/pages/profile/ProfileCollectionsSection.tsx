import { useRef, useState } from "react";
import { useLocale, editorialText, formatMovieYear } from "../../i18n";
import styles from "../Profile.module.css";
import actionStyles from "./ProfileCollectionsActions.module.css";
import { collectionKinds } from "./profileConstants";
import ProfileLoading from "../../components/ProfileLoading";
import RetryNotice from "../../components/RetryNotice";
import { Link } from "react-router-dom";
import ResilientImage from "../../components/ResilientImage";
import Pagination from "../../components/Pagination";
import { type ProfileCollectionsModel } from "./useProfileCollections";
import { type ProfileRoute } from "./profileRoute";
import { clearMyWatchlist, setMyWatchlistVisibility } from "../../api/profile.api";

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
  watchlistIsPublic: boolean;
}

export default function ProfileCollectionsSection({ collections, route, filmsView, viewTitle, watchlistIsPublic }: Props) {
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
  const { t, path, lang } = useLocale();
  const [isPublic, setIsPublic] = useState(watchlistIsPublic);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOwnWatchlist = profileView === "collection" && collectionKind === "watchlist";

  const toggleVisibility = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const { data: result } = await setMyWatchlistVisibility(!isPublic);
      setIsPublic(result.isPublic);
      setStatus(t(result.isPublic ? "watchlistMadePublic" : "watchlistMadePrivate"));
    } catch {
      setStatus(t("watchlistActionError"));
    } finally {
      setBusy(false);
    }
  };

  const confirmClear = async () => {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const { data: result } = await clearMyWatchlist();
      dialogRef.current?.close();
      setStatus(t("watchlistCleared").replace("{count}", String(result.removed)));
      retryCollection();
    } catch {
      setStatus(t("watchlistActionError"));
    } finally {
      setBusy(false);
    }
  };

  return <>
    <section className={styles.section} id="profile-collections" aria-labelledby="profile-collections-title" aria-busy={collectionLoading}>
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
                {!filmsView && <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>}
                {filmsView ? <div className={styles.collectionRating} role="img" aria-label={movie.rating === null ? `${movieTitle}: Not rated` : `${movieTitle}: ${movie.rating} / 5`}>
                  <span aria-hidden="true" style={{ "--rating-fill": `${Math.max(0, Math.min(5, movie.rating ?? 0)) * 20}%` } as React.CSSProperties}>★★★★★</span>
                </div> : collectionKind === "favorites" ? <div className={styles.collectionLikeMeta} role="img" aria-label={`${movieTitle}: ${t("favorite")}`}>
                  <img src="/images/profile-likes-stars.svg" alt="" aria-hidden="true" />
                  <img src="/images/profile-likes-heart.svg" alt="" aria-hidden="true" />
                </div> : <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>}
              </article>;
            })}
            </div>}
            {filmsView && collection.totalPages > 1 ? <nav className={styles.filmsPagination} aria-label={t("profileCollectionPagination")} aria-busy={collectionLoading}>
              <div className={styles.filmsPaginationPages}>
                {Array.from({ length: Math.min(3, collection.totalPages) }, (_, index) => index).map(page => <button key={page} type="button" aria-current={page === collectionPage ? "page" : undefined} disabled={collectionLoading} onClick={() => changeCollectionPage(page)}>{page + 1}</button>)}
                {collection.totalPages > 4 && <span aria-hidden="true">…</span>}
                {collection.totalPages > 3 && <button type="button" aria-current={collection.totalPages - 1 === collectionPage ? "page" : undefined} disabled={collectionLoading} onClick={() => changeCollectionPage(collection.totalPages - 1)}>{collection.totalPages}</button>}
              </div>
              <button className={styles.filmsOlder} type="button" disabled={collectionLoading || collectionPage + 1 >= collection.totalPages} onClick={() => changeCollectionPage(collectionPage + 1)}>{lang === "en" ? "Older" : "Старіші"}</button>
            </nav> : <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={changeCollectionPage} />}
          </>}
        </div>
      </section>
    {isOwnWatchlist && <div className={actionStyles.actions} role="region" aria-label={t("watchlistActions")}>
      <h2>{t("howToAdd")}</h2>
      <p>{t("watchlistHowToAdd")}</p>
      <div className={actionStyles.buttons}>
        <button type="button" disabled={busy} onClick={toggleVisibility}>{t(isPublic ? "makeWatchlistPrivate" : "makeWatchlistPublic")}</button>
        <button type="button" disabled={busy} onClick={() => dialogRef.current?.showModal()}>{t("clearWatchlist")}</button>
      </div>
      <p className={actionStyles.status} role="status" aria-live="polite">{status}</p>
      <dialog ref={dialogRef} className={actionStyles.dialog} role="alertdialog" aria-labelledby="clear-watchlist-title" aria-describedby="clear-watchlist-description">
        <h3 id="clear-watchlist-title">{t("clearWatchlistQuestion")}</h3>
        <p id="clear-watchlist-description">{t("clearWatchlistConfirmation")}</p>
        <div className={actionStyles.dialogButtons}>
          <button type="button" disabled={busy} onClick={() => dialogRef.current?.close()}>{t("cancel")}</button>
          <button type="button" disabled={busy} onClick={confirmClear}>{t("clearWatchlist")}</button>
        </div>
      </dialog>
    </div>}
  </>;
}
