import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicList, getPublicListLikeStatus, likePublicList, unlikePublicList, type MoviePreview, type PublicListDetails, type PublicListLikeStatus } from "../api/lists.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieYear, useLocale } from "../i18n";
import { useDialogFocusTrap } from "../hooks/useDialogFocusTrap";
import { toTagSlug } from "../utils/tagSlug";
import { getUserName } from "../utils/userIdentity";
import styles from "./PublicList.module.css";

function MoviePoster({ movie, fallbackTitle }: { movie: MoviePreview; fallbackTitle: string }) {
  const movieTitle = editorialText(movie.title, fallbackTitle);
  return <ResilientImage className={styles.moviePoster} src={movie.photoUrl} alt="" fallback={<div className={styles.moviePosterFallback}>{movieTitle}</div>} />;
}

export default function PublicList() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth } = useAuth();
  const listId = Number(id);
  const validListId = Number.isSafeInteger(listId) && listId > 0;
  const [list, setList] = useState<PublicListDetails | null>(null);
  const [likeStatus, setLikeStatus] = useState<PublicListLikeStatus | null>(null);
  const [likeStatusLoading, setLikeStatusLoading] = useState(false);
  const [likeStatusLoadError, setLikeStatusLoadError] = useState(false);
  const [likeStatusAttempt, setLikeStatusAttempt] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restoreHeadingFocus = useRef(false);
  const closeInformation = useCallback(() => {
    restoreHeadingFocus.current = window.matchMedia("(min-width: 721px)").matches;
    setInfoOpen(false);
  }, []);
  const doneRef = useRef<HTMLButtonElement>(null);
  const informationRef = useDialogFocusTrap<HTMLElement>(infoOpen && !!list && !loading && !error, closeInformation, { initialFocusRef: doneRef });
  useEffect(() => {
    if (!infoOpen && restoreHeadingFocus.current) {
      restoreHeadingFocus.current = false;
      headingRef.current?.focus();
    }
  }, [infoOpen]);
  const mutationRequest = useRef(0);
  const currentListId = useRef(listId);
  currentListId.current = listId;

  useEffect(() => { setInfoOpen(false); }, [listId, lang]);

  useEffect(() => {
    mutationRequest.current += 1;
    setLikeBusy(false);
    setLikeError(false);
  }, [listId, isAuth]);

  useEffect(() => {
    let current = true;
    setList(null);
    setLoading(true);
    setError(false);
    if (!validListId) {
      setError(true);
      setLoading(false);
      return;
    }
    getPublicList(listId)
      .then(({ data }) => { if (current) setList(data); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [listId, validListId, lang, attempt]);

  useEffect(() => {
    if (!isAuth || !validListId) {
      setLikeStatus(null);
      setLikeStatusLoading(false);
      setLikeStatusLoadError(false);
      setLikeError(false);
      return;
    }
    let current = true;
    setLikeStatusLoading(true);
    setLikeStatus(null);
    setLikeStatusLoadError(false);
    setLikeError(false);
    getPublicListLikeStatus(listId)
      .then(({ data }) => { if (current) setLikeStatus(data); })
      .catch(() => {
        if (!current) return;
        setLikeStatus(null);
        setLikeStatusLoadError(true);
      })
      .finally(() => { if (current) setLikeStatusLoading(false); });
    return () => { current = false; };
  }, [listId, isAuth, validListId, lang, likeStatusAttempt]);

  const toggleLike = async () => {
    if (!list || !likeStatus || likeBusy) return;
    const requestId = ++mutationRequest.current;
    const listIdAtStart = list.id;
    const likedAtStart = likeStatus.liked;
    setLikeBusy(true);
    setLikeError(false);
    try {
      if (likedAtStart) await unlikePublicList(listIdAtStart);
      else await likePublicList(listIdAtStart);
      if (requestId !== mutationRequest.current || currentListId.current !== listIdAtStart) return;
      const liked = !likedAtStart;
      setLikeStatus({ liked, likes: Math.max(0, likeStatus.likes + (liked ? 1 : -1)) });
      setList(current => current ? { ...current, likeCount: Math.max(0, current.likeCount + (liked ? 1 : -1)) } : current);
    } catch {
      if (requestId === mutationRequest.current && currentListId.current === listIdAtStart) setLikeError(true);
    } finally {
      if (requestId === mutationRequest.current && currentListId.current === listIdAtStart) setLikeBusy(false);
    }
  };

  if (error) return <main className={styles.statePage} aria-labelledby="public-list-state-title" aria-busy={false}><h1 id="public-list-state-title" className="srOnly">{t("lists")}</h1><p className={styles.stateError} role="alert">{!validListId ? t("invalidListId") : t("loadPublicListError")} {validListId && <RetryButton label={t("retry")} onClick={() => setAttempt(value => value + 1)} />}</p></main>;
  if (loading || !list) return <main className={styles.statePage} aria-labelledby="public-list-state-title" aria-busy={true}><h1 id="public-list-state-title" className="srOnly">{t("lists")}</h1><p className={styles.stateLoading} role="status">{t("loading")}</p></main>;

  const heroImage = list.movies.find(movie => movie.photoUrl)?.photoUrl;
  const listName = editorialText(list.name, t("lists"));
  const ownerName = getUserName({ username: list.ownerUsername }, t("someone"));
  const likeControls = <>
    {isAuth && likeStatusLoading && <span className={styles.inlineStatus} role="status">{t("loading")}</span>}
    {isAuth && likeStatusLoadError && <span className={styles.inlineError} role="alert">{t("listLikeError")} <RetryButton label={t("retry")} onClick={() => setLikeStatusAttempt(value => value + 1)} /></span>}
    {isAuth && likeStatus && <button type="button" disabled={likeBusy} aria-busy={likeBusy} aria-pressed={likeStatus.liked} onClick={() => void toggleLike()}>{likeBusy ? t("loading") : likeStatus.liked ? t("unlikeList") : t("likeList")}</button>}
    {likeError && <span className={styles.inlineError} role="alert">{t("listLikeError")} <RetryButton label={t("retry")} disabled={likeBusy || likeStatusLoading} busy={likeBusy} onClick={() => void toggleLike()} /></span>}
  </>;

  return <main className={styles.page} aria-labelledby="public-list-heading" aria-busy={likeStatusLoading || likeBusy}>
    <div aria-hidden={infoOpen || undefined}>
    <section className={styles.hero} aria-labelledby="public-list-heading">
      <ResilientImage className={styles.heroBackdrop} src={heroImage} alt="" aria-hidden="true" loading="eager" fallback={null} />
      <div className={styles.mobileToolbar}>
        <Link className={styles.mobileBack} to={path("/lists/discover")} aria-label={t("lists")}>←</Link>
        <span>{t("publicLists")}</span>
        <button type="button" className={styles.mobileMore} aria-label={t("listInformation")} aria-haspopup="dialog" aria-expanded={infoOpen} aria-controls="public-list-information" onClick={() => setInfoOpen(true)}>⋯</button>
      </div>
      <div className={styles.heroInner}>
        <p className={styles.eyebrow}>{t("listEyebrow")}</p>
        <h1 ref={headingRef} tabIndex={-1} id="public-list-heading">{listName}</h1>
        <p className={styles.ownerLine}>{t("listBy")} <Link to={path(`/users/${list.ownerId}`)}>{ownerName}</Link></p>
        {list.description && <p className={styles.description}>{list.description}</p>}
        {list.tags.length > 0 && <div className={styles.tags} role="group" aria-label={t("tags")}>
          {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
        </div>}
        <div className={styles.heroActions}>
          <span className={styles.likeCount}>{list.likeCount ?? 0} {t("likes").toLocaleLowerCase(lang)}</span>
          {likeControls}
        </div>
      </div>
    </section>

    <section className={styles.content} aria-labelledby="public-list-films-heading">
      <div className={styles.sectionHeading}>
        <h2 id="public-list-films-heading">{t("films")}</h2>
        <span>{list.movies.length}</span>
      </div>
      {list.movies.length === 0 ? <p className={styles.empty}>{t("emptyPublicList")}</p> : <div className={styles.movieGrid}>
        {list.movies.map((movie, index) => {
          const movieTitle = editorialText(movie.title, t("untitledFilm"));
          return <article className={styles.movieCard} key={movie.id}>
          <Link className={styles.movieMedia} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
            <span className={styles.movieRank} aria-hidden="true">{index + 1}</span>
            <MoviePoster movie={movie} fallbackTitle={movieTitle} />
          </Link>
          <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>
          <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null && <> · ★ {movie.rating}</>}</p>
        </article>;
        })}
      </div>}
    </section>
    </div>
    {infoOpen && <div className={styles.informationBackdrop} onMouseDown={event => { if (event.target === event.currentTarget) { event.preventDefault(); closeInformation(); } }}>
      <section id="public-list-information" ref={informationRef} className={styles.informationDialog} role="dialog" aria-modal="true" aria-labelledby="public-list-information-title">
        <div className={styles.informationHeading}>
          <h2 id="public-list-information-title">{listName}</h2>
          <p>{t("listBy")} <Link to={path(`/users/${list.ownerId}`)}>{ownerName}</Link></p>
        </div>
        <div className={styles.informationCard}>
          <div className={styles.informationLikes}>
            <span className={styles.informationHeart} aria-hidden="true">{likeStatus?.liked ? "♥" : "♡"}</span>
            <span>{likeStatus?.likes ?? list.likeCount ?? 0} {t("likes").toLocaleLowerCase(lang)}</span>
            {likeControls}
          </div>
          <div className={styles.informationTags}>
            <p>{t("tags")}</p>
            {list.tags.length > 0 ? <div className={styles.informationTagLinks}>
              {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
            </div> : <p className={styles.noTags}>{t("noTags")}</p>}
          </div>
        </div>
        <button ref={doneRef} type="button" className={styles.informationDone} onClick={closeInformation}>{t("done")}</button>
      </section>
    </div>}
  </main>;
}
