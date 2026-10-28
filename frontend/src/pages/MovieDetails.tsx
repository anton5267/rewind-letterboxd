import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { clearMovieFlag, getMovieDetails, setMovieFlag, type MovieDetails as MovieDetailsResponse } from "../api/movies.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import MovieActionSheet from "../components/MovieActionSheet";
import ConfirmDialog from "../components/ConfirmDialog";
import { addMovieToList, getUserLists, type UserList } from "../api/lists.api";
import { deleteRating as deleteMovieRating, getUserRating, setRating as setMovieRating } from "../api/ratings.api";
import { createMovieReview, deleteReview as deleteReviewRequest, getMovieReviews, getMyMovieReview, getReviewLikeStatus, getReviewLikes, likeReview, unlikeReview, updateReview, type MovieReview } from "../api/reviews.api";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieYear, localizeGenreName, useLocale } from "../i18n";
import Pagination from "../components/Pagination";
import { safeHttpUrl } from "../utils/externalUrl";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { getUserName } from "../utils/userIdentity";
import Comments from "./Comments";
import styles from "./MovieDetails.module.css";

function ReviewLikeButton({ reviewId }: { reviewId: number }) {
  const { isAuth, user } = useAuth();
  const { t } = useLocale();
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState(false);
  const requestIdentity = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdentity.current;
    let current = true;
    setLikes(null);
    setLiked(false);
    setStatusLoading(true);
    setStatusError(false);
    setActionError(false);
    setBusy(false);
    const request = isAuth
      ? getReviewLikeStatus(reviewId).then(({ data }) => {
        if (!current || requestId !== requestIdentity.current) return;
        setLiked(data.liked);
        setLikes(data.likes);
      })
      : getReviewLikes(reviewId).then(({ data }) => {
        if (current && requestId === requestIdentity.current) setLikes(data);
      });
    request
      .catch(() => { if (current && requestId === requestIdentity.current) setStatusError(true); })
      .finally(() => { if (current && requestId === requestIdentity.current) setStatusLoading(false); });
    return () => { current = false; requestIdentity.current += 1; };
  }, [isAuth, reviewId, statusAttempt, user?.id]);

  const toggle = async () => {
    if (statusLoading || statusError) return;
    const requestId = ++requestIdentity.current;
    const wasLiked = liked;
    setBusy(true);
    setActionError(false);
    try {
      await (wasLiked ? unlikeReview(reviewId) : likeReview(reviewId));
      if (requestId !== requestIdentity.current) return;
      setLiked(!wasLiked);
      setLikes(value => Math.max(0, (value ?? 0) + (wasLiked ? -1 : 1)));
    } catch {
      if (requestId === requestIdentity.current) setActionError(true);
    } finally {
      if (requestId === requestIdentity.current) setBusy(false);
    }
  };

  return <p>
    <span>{t("likes")}: {likes ?? "—"}</span>
    {statusLoading && <span className={styles.inlineStatus} role="status"> {t("loading")}</span>}
    {statusError && <span className={styles.inlineError} role="alert"> {t("likeReviewError")} <RetryButton label={t("retry")} onClick={() => setStatusAttempt(value => value + 1)} /></span>}
    {isAuth && !statusLoading && !statusError && <> {" "}<button type="button" disabled={busy} aria-busy={busy} aria-pressed={liked} onClick={() => void toggle()}>{busy ? t("loading") : liked ? t("unlike") : t("like")}</button></>}
    {actionError && <span className={styles.inlineError} role="alert"> {t("likeReviewError")} <RetryButton label={t("retry")} disabled={busy} busy={busy} onClick={() => void toggle()} /></span>}
  </p>;
}

export default function MovieDetails() {
  const { id } = useParams();
  const movieId = Number(id);
  const validMovieId = Number.isSafeInteger(movieId) && movieId > 0;
  const { isAuth } = useAuth();
  const { lang, path, t } = useLocale();
  const [movie, setMovie] = useState<MovieDetailsResponse | null>(null);
  const [reviews, setReviews] = useState<MovieReview[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const [myReviewReady, setMyReviewReady] = useState(false);
  const [myReviewError, setMyReviewError] = useState(false);
  const [myReviewAttempt, setMyReviewAttempt] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [lists, setLists] = useState<UserList[]>([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsLoadError, setListsLoadError] = useState(false);
  const [listsAttempt, setListsAttempt] = useState(0);
  const [selectedList, setSelectedList] = useState("");
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingLoadError, setRatingLoadError] = useState(false);
  const [ratingAttempt, setRatingAttempt] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsLoadError, setReviewsLoadError] = useState(false);
  const [reviewsAttempt, setReviewsAttempt] = useState(0);
  const [mutationBusy, setMutationBusy] = useState<string | null>(null);
  const [reviewDeleteTrigger, setReviewDeleteTrigger] = useState<HTMLButtonElement | null>(null);
  const [message, setMessage] = useState("");
  const [mobileActionOpen, setMobileActionOpen] = useState(false);
  const loadRequest = useRef(0);
  const reviewsRequest = useRef(0);
  const myReviewRequest = useRef(0);
  const mutationRequest = useRef(0);
  const currentMovieId = useRef(movieId);
  currentMovieId.current = movieId;

  useEffect(() => {
    mutationRequest.current += 1;
    setMovie(null);
    setReviews([]);
    setReviewsPage(0);
    setReviewsTotalPages(0);
    setMyReview(null);
    setMyReviewReady(false);
    setMyReviewError(false);
    setEditingReview(false);
    setReviewText("");
    setReviewRating(0);
    setRating(0);
    setRatingLoadError(false);
    setSelectedList("");
    setError("");
    setMessage("");
    setMutationBusy(null);
    setMobileActionOpen(false);
  }, [movieId]);

  useEffect(() => {
    mutationRequest.current += 1;
    setMutationBusy(null);
    setMobileActionOpen(false);
  }, [isAuth]);

  const loadMovie = useCallback(async () => {
    if (!validMovieId || currentMovieId.current !== movieId) return;
    const requestId = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    try {
      const details = await getMovieDetails(movieId);
      if (requestId !== loadRequest.current || currentMovieId.current !== movieId) return;
      setMovie(details.data);
    } catch { if (requestId === loadRequest.current && currentMovieId.current === movieId) { setMovie(null); setLoadError(t("loadMovieError")); } }
    finally { if (requestId === loadRequest.current && currentMovieId.current === movieId) setLoading(false); }
  }, [lang, loadAttempt, movieId, validMovieId]);

  const loadReviews = useCallback(async () => {
    if (!validMovieId || currentMovieId.current !== movieId) return;
    const requestId = ++reviewsRequest.current;
    setReviewsLoading(true);
    setReviewsLoadError(false);
    try {
      const reviewPage = await getMovieReviews(movieId, reviewsPage);
      if (requestId !== reviewsRequest.current || currentMovieId.current !== movieId) return;
      if (isPageOutOfRange(reviewsPage, reviewPage.data.totalPages)) {
        setReviewsTotalPages(reviewPage.data.totalPages);
        setReviewsPage(getLastPageIndex(reviewPage.data.totalPages));
        return;
      }
      setReviews(reviewPage.data.content);
      setReviewsTotalPages(reviewPage.data.totalPages);
    } catch {
      if (requestId !== reviewsRequest.current || currentMovieId.current !== movieId) return;
      setReviews([]);
      setReviewsTotalPages(0);
      setReviewsLoadError(true);
    } finally { if (requestId === reviewsRequest.current && currentMovieId.current === movieId) setReviewsLoading(false); }
  }, [movieId, reviewsAttempt, reviewsPage, validMovieId]);

  const load = useCallback(async () => {
    await Promise.all([loadMovie(), loadReviews()]);
  }, [loadMovie, loadReviews]);

  const loadMyReview = useCallback(async () => {
    if (!validMovieId || currentMovieId.current !== movieId) return;
    const requestId = ++myReviewRequest.current;
    setMyReviewReady(false);
    setMyReviewError(false);
    try {
      const response = await getMyMovieReview(movieId);
      if (requestId !== myReviewRequest.current || currentMovieId.current !== movieId) return;
      setMyReview(response.status === 204 ? null : response.data);
      setMyReviewError(false);
      setMyReviewReady(true);
    } catch {
      if (requestId === myReviewRequest.current && currentMovieId.current === movieId) {
        setMyReviewError(true);
        setMyReviewReady(true);
      }
    }
  }, [movieId, validMovieId]);

  useEffect(() => {
    let current = true;
    if (!isAuth || !validMovieId) {
      setLists([]);
      setListsLoading(false);
      setListsLoadError(false);
      return () => { current = false; };
    }

    setListsLoading(true);
    setListsLoadError(false);
    getUserLists()
      .then(({ data }) => { if (current) setLists(data); })
      .catch(() => {
        if (!current) return;
        setLists([]);
        setListsLoadError(true);
      })
      .finally(() => { if (current) setListsLoading(false); });

    return () => { current = false; };
  }, [isAuth, listsAttempt, validMovieId]);

  useEffect(() => {
    let current = true;
    if (!isAuth || !validMovieId) {
      setRating(0);
      setRatingLoading(false);
      setRatingLoadError(false);
      return () => { current = false; };
    }

    setRatingLoading(true);
    setRatingLoadError(false);
    getUserRating(movieId)
      .then(({ data }) => { if (current) setRating(data?.rating ?? 0); })
      .catch(() => {
        if (!current) return;
        setRating(0);
        setRatingLoadError(true);
      })
      .finally(() => { if (current) setRatingLoading(false); });

    return () => { current = false; };
  }, [isAuth, movieId, ratingAttempt, validMovieId]);

  useEffect(() => {
    if (validMovieId) void loadMovie();
    if (isAuth) {
      setMyReview(null);
      setMyReviewReady(false);
      setMyReviewError(false);
      void loadMyReview();
    } else {
      setMyReview(null);
    }
  }, [isAuth, loadMovie, loadMyReview, movieId, myReviewAttempt, validMovieId]);

  useEffect(() => {
    setShowAllReviews(false);
    setReviewsPage(0);
  }, [movieId]);

  useEffect(() => {
    if (validMovieId) void loadReviews();
  }, [loadReviews, validMovieId]);

  const startMutation = (kind: string) => {
    if (mutationBusy || currentMovieId.current !== movieId) return null;
    const requestId = ++mutationRequest.current;
    setMutationBusy(kind);
    return requestId;
  };

  const isCurrentMutation = (requestId: number) =>
    requestId === mutationRequest.current && currentMovieId.current === movieId;

  const toggle = async (kind: "watched" | "watchlist" | "favorite", enabled: boolean) => {
    const requestId = startMutation(kind);
    if (requestId === null) return;
    try {
      await (enabled ? clearMovieFlag(movieId, kind) : setMovieFlag(movieId, kind));
      if (!isCurrentMutation(requestId)) return;
      await load();
      if (!isCurrentMutation(requestId)) return;
      setMessage(t("saved"));
    } catch {
      if (isCurrentMutation(requestId)) setError(t("changeListError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const saveRating = async (value: number) => {
    const requestId = startMutation("rating");
    if (requestId === null) return;
    try {
      if (myReview) {
        await updateReview(myReview.id, { rating: value });
        if (!isCurrentMutation(requestId)) return;
        await loadMyReview();
      } else {
        await setMovieRating(movieId, value);
      }
      if (!isCurrentMutation(requestId)) return;
      setRating(value);
      if (editingReview) setReviewRating(value);
      await load();
      if (!isCurrentMutation(requestId)) return;
      setError("");
    } catch {
      if (isCurrentMutation(requestId)) setError(t("saveRatingError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutationBusy || currentMovieId.current !== movieId) return;
    const chosenRating = editingReview ? reviewRating : rating;
    if (!chosenRating) { setError(t("rateFirst")); return; }
    const wasEditing = editingReview;
    const requestId = startMutation("review");
    if (requestId === null) return;
    try {
      if (wasEditing && myReview) {
        await updateReview(myReview.id, { content: reviewText.trim(), rating: chosenRating });
      } else {
        await createMovieReview(movieId, reviewText.trim(), chosenRating);
      }
      if (!isCurrentMutation(requestId)) return;
      setRating(chosenRating);
      setReviewText("");
      setEditingReview(false);
      setMessage(t(wasEditing ? "reviewUpdated" : "reviewPublished"));
      setError("");
      await Promise.all([load(), loadMyReview()]);
      if (!isCurrentMutation(requestId)) return;
    } catch {
      if (isCurrentMutation(requestId)) setError(t(wasEditing ? "updateReviewError" : "createReviewError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const deleteReview = async () => {
    if (!myReview || currentMovieId.current !== movieId) return;
    const requestId = startMutation("delete-review");
    if (requestId === null) return;
    try {
      await deleteReviewRequest(myReview.id);
      if (!isCurrentMutation(requestId)) return;
      setEditingReview(false);
      setReviewText("");
      setMessage(t("reviewDeleted"));
      setError("");
      await Promise.all([load(), loadMyReview()]);
      if (!isCurrentMutation(requestId)) return;
    } catch {
      if (isCurrentMutation(requestId)) setError(t("deleteReviewError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const deleteRating = async () => {
    const requestId = startMutation("delete-rating");
    if (requestId === null) return;
    try {
      await deleteMovieRating(movieId);
      if (!isCurrentMutation(requestId)) return;
      setRating(0);
      setMessage(t("ratingDeleted"));
      setError("");
      await load();
      if (!isCurrentMutation(requestId)) return;
    } catch {
      if (isCurrentMutation(requestId)) setError(t("deleteRatingError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const addToList = async () => {
    if (!selectedList || currentMovieId.current !== movieId) return;
    const requestId = startMutation("list");
    if (requestId === null) return;
    try {
      await addMovieToList(Number(selectedList), movieId);
      if (!isCurrentMutation(requestId)) return;
      setMessage(t("filmAdded"));
    } catch {
      if (isCurrentMutation(requestId)) setError(t("addFilmError"));
    } finally {
      if (isCurrentMutation(requestId)) setMutationBusy(null);
    }
  };

  const closeMobileActions = useCallback(() => setMobileActionOpen(false), []);

  const focusReview = () => {
    closeMobileActions();
    // Run after the sheet's focus-return cleanup so the destination keeps focus.
    window.requestAnimationFrame(() => {
      const composer = document.getElementById("review-content");
      const destination = composer instanceof HTMLTextAreaElement && !composer.disabled
        ? composer : document.getElementById("reviews-title");
      destination?.focus({ preventScroll: true });
      destination?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const shareMovie = useCallback(async () => {
    if (!movie) return;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: editorialText(movie.title, t("untitledFilm")), url: window.location.href });
        setMessage(t("saved"));
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setMessage(t("saved"));
      }
    } catch {
      // A cancelled native share is not an application error.
    }
  }, [movie, t]);

  const otherReviews = reviews.filter(item => item.id !== myReview?.id);
  const renderReviewCard = (item: MovieReview) => {
    const reviewerName = getUserName({ username: item.username }, t("someone"));
    const createdDate = new Date(item.createdAt);
    const reviewDate = Number.isNaN(createdDate.getTime())
      ? item.createdAt
      : new Intl.DateTimeFormat(lang === "uk" ? "uk-UA" : "en-US", { dateStyle: "medium" }).format(createdDate);
    return <article className={styles.review} key={item.id}>
      <h3 className={styles.desktopReviewTitle}><Link to={path(`/reviews/${item.id}`)}>{reviewerName} · {item.rating ?? "—"}/5</Link></h3>
      <div className={styles.mobileReviewHeading}>
        <span className={styles.mobileReviewAvatar} aria-hidden="true">{reviewerName.slice(0, 1).toLocaleUpperCase(lang === "uk" ? "uk-UA" : "en-US")}</span>
        <span className={styles.mobileReviewByline}><Link to={path(`/reviews/${item.id}`)}>{reviewerName}</Link><time dateTime={item.createdAt}>{reviewDate}</time></span>
        <strong className={styles.mobileReviewRating}>{item.rating == null ? "—" : <><img src="/images/movie-star.png" width={8} height={8} alt="" aria-hidden="true" />{item.rating}</>}</strong>
      </div>
      <p>{item.content}</p><ReviewLikeButton reviewId={item.id} /><Comments reviewId={item.id} />
    </article>;
  };
  const heroImage = movie?.backdropUrl || movie?.photoUrl;
  const trailerUrl = safeHttpUrl(movie?.trailerUrl);
  const mobileCrew = movie ? [
    ...movie.actors.slice(0, 5).map(item => ({ id: `actor-${item.id}`, personId: item.id, name: editorialText(item.name, t("unknownPerson")), type: "actor" as const, role: t("actors") })),
    ...movie.directors.slice(0, 2).map(item => ({ id: `director-${item.id}`, personId: item.id, name: editorialText(item.name, t("unknownPerson")), type: "director" as const, role: t("directors") })),
  ].slice(0, 7) : [];
  const movieTitle = movie ? editorialText(movie.title, t("untitledFilm")) : t("untitledFilm");
  const pageBusy = loading || reviewsLoading || listsLoading || ratingLoading || (isAuth && !myReviewReady) || mutationBusy !== null;

  if (!validMovieId) return <main className={styles.state} aria-labelledby="movie-state-title" aria-busy={false}><h1 id="movie-state-title" className="srOnly">{t("films")}</h1><p role="alert">{t("invalidMovieId")}</p></main>;
  return <main className={styles.page} aria-labelledby={movie ? "movie-title" : "movie-state-title"} aria-busy={pageBusy}>
    <div className={styles.shell}>
      {!movie && <h1 id="movie-state-title" className="srOnly">{t("films")}</h1>}
      {loadError && <RetryNotice className={styles.alert} message={loadError} retryLabel={t("retry")} onRetry={() => setLoadAttempt(value => value + 1)} />}
      {error && <div className={styles.alert} role="alert">{error}</div>}
      {message && <div className={styles.status} role="status">{message}</div>}
      {loading && !movie && <><p className="srOnly" role="status">{t("loading")}</p>
        <div className={styles.hero} aria-hidden="true"><div className={styles.heroGrid}>
          <div className={styles.posterFrame}><div className={`${styles.poster} ${styles.skeleton}`} /></div>
          <div className={styles.heroCopy}><div className={styles.mobileTitleControls}><div className={styles.skeletonLine} /></div><div className={styles.skeletonTitle} /><div className={styles.skeletonLine} /><div className={styles.plot}>{[0, 1, 2, 3].map(item => <div className={styles.skeletonLine} key={item} />)}</div></div>
        </div></div>
      </>}
      {movie && <>
        <section className={styles.hero} aria-labelledby="movie-title">
          <ResilientImage className={styles.heroBackdrop} src={heroImage} alt="" aria-hidden="true" loading="eager" fallback={null} />
          <div className={styles.heroToolbar}>
            <Link className={styles.heroToolbarButton} to={path("/films")} aria-label={t("films")}><img src="/images/help-icon-back.png" width={25} height={25} alt="" aria-hidden="true" /></Link>
            <span aria-hidden="true">{movieTitle}</span>
            {isAuth ? <button className={styles.heroToolbarButton} type="button" aria-haspopup="dialog" aria-controls={mobileActionOpen ? "movie-action-sheet" : undefined} aria-expanded={mobileActionOpen} onClick={() => setMobileActionOpen(true)} aria-label={t("myActions")}><img src="/images/movie-more.png" width={25} height={25} alt="" aria-hidden="true" /></button> : <Link className={styles.heroToolbarButton} to={path("/search")} aria-label={t("globalSearch")}>⌕</Link>}
          </div>
          <div className={styles.heroGrid}>
            <div className={styles.posterFrame}>
              <ResilientImage className={styles.poster} src={movie.photoUrl} alt={`${t("poster")} ${movieTitle}`} fallback={<div className={styles.posterFallback} aria-hidden="true">{movieTitle.slice(0, 1)}</div>} />
              <div className={styles.posterTrailer}>{trailerUrl ? <a className={styles.textLink} href={trailerUrl} target="_blank" rel="noopener noreferrer">{t("watchTrailer")}</a> : <p>{t("trailerUnavailable")}</p>}</div>
            </div>
            <div className={styles.heroCopy}>
              <div className={styles.mobileTitleControls}>
                {movie.ageRating && <span className={styles.mobileAgeRating}>{movie.ageRating}</span>}
                {trailerUrl ? <a href={trailerUrl} target="_blank" rel="noopener noreferrer">{t("watchTrailer")}</a> : <span className={styles.mobileTrailerUnavailable}>{t("trailerUnavailable")}</span>}
              </div>
              <h1 id="movie-title">{movieTitle}</h1>
              <ul className={styles.meta} aria-label={t("filmData")}>
                <li>{formatMovieYear(movie.releaseDate, t("unknownYear"))}</li>
                {movie.durationMinutes ? <li>{movie.durationMinutes} {t("minutes")}</li> : null}
                {movie.ageRating ? <li className={styles.desktopMeta}>{movie.ageRating}</li> : null}
                {movie.rating != null ? <li className={styles.desktopMeta}>★ {movie.rating}</li> : null}
              </ul>
              {movie.genres.length > 0 && <div className={styles.genres}>{movie.genres.map(item => <span key={item.id}>{localizeGenreName(item.name, lang)}</span>)}</div>}
              {movie.shortPlot && <p className={styles.plot}>{movie.shortPlot}</p>}
              <div className={styles.credits}>
                <p><strong>{t("directors")}:</strong> {movie.directors.length ? movie.directors.map(item => <Link key={item.id} to={path(`/people/director/${item.id}`)}>{editorialText(item.name, t("unknownPerson"))}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
                <p><strong>{t("producers")}:</strong> {movie.producers.length ? movie.producers.map(item => <Link key={item.id} to={path(`/people/producer/${item.id}`)}>{editorialText(item.name, t("unknownPerson"))}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
                <p><strong>{t("actors")}:</strong> {movie.actors.length ? movie.actors.slice(0, 5).map(item => <Link key={item.id} to={path(`/people/actor/${item.id}`)}>{editorialText(item.name, t("unknownPerson"))}{item.characterName?.trim() ? ` (${item.characterName.trim()})` : ""}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
              </div>
              <div className={styles.heroLinks}>
                <div>
                  <h2>{t("trailer")}</h2>
                  {trailerUrl ? <a className={styles.textLink} href={trailerUrl} target="_blank" rel="noopener noreferrer">{t("watchTrailer")}</a> : <p>{t("trailerUnavailable")}</p>}
                </div>
                {movie.externalRatings.length > 0 && <div className={styles.externalRatings} role="group" aria-label={t("ratings")}>
                  {movie.externalRatings.map(item => <span key={item.source}><strong>{item.source}</strong> {item.rating}</span>)}
                </div>}
              </div>
            </div>
            {isAuth && <section className={`${styles.actionSection} ${styles.heroActions}`} aria-label={t("myActions")}>
              <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("myActions")}</p><h2>{t("myActions")}</h2></div>
              <div className={styles.actionButtons}>
                <button className={`${styles.actionButton} ${movie.myFlags?.watched ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "watched"} onClick={() => void toggle("watched", movie.myFlags?.watched ?? false)} aria-pressed={movie.myFlags?.watched ?? false}><i className="fa-solid fa-eye" aria-hidden="true" />{mutationBusy === "watched" ? t("loading") : t("watched")}</button>
                <button className={`${styles.actionButton} ${movie.myFlags?.favorites ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "favorite"} onClick={() => void toggle("favorite", movie.myFlags?.favorites ?? false)} aria-pressed={movie.myFlags?.favorites ?? false}><i className="fa-solid fa-heart" aria-hidden="true" />{mutationBusy === "favorite" ? t("loading") : t("favorite")}</button>
                <button className={`${styles.actionButton} ${movie.myFlags?.watchlist ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "watchlist"} onClick={() => void toggle("watchlist", movie.myFlags?.watchlist ?? false)} aria-pressed={movie.myFlags?.watchlist ?? false}><i className="fa-solid fa-bookmark" aria-hidden="true" />{mutationBusy === "watchlist" ? t("loading") : t("watchlist")}</button>
              </div>
              <div className={styles.ratingRow}>
                {ratingLoading ? <span className={styles.inlineStatus} role="status">{t("loading")}</span> : <span className={styles.ratingLabel}>{t("rate")}</span>}
                {ratingLoadError && <span className={styles.inlineError} role="alert">{t("loadRatingsError")} <RetryButton label={t("retry")} onClick={() => setRatingAttempt(value => value + 1)} /></span>}
                <div className={styles.ratingButtons} role="group" aria-label={t("myRating")}>
                  {[1, 2, 3, 4, 5].map(value => <button className={rating === value ? styles.ratingActive : ""} key={value} type="button" disabled={mutationBusy !== null || ratingLoading} onClick={() => void saveRating(value)} aria-label={`${t("rateAs")} ${value}`} aria-pressed={rating === value}>★</button>)}
                </div>
                {rating > 0 && !myReview && <button className={styles.textButton} type="button" disabled={mutationBusy !== null || ratingLoading} onClick={() => void deleteRating()}>{mutationBusy === "delete-rating" ? t("deleting") : t("deleteRating")}</button>}
              </div>
              <div className={styles.listPicker}>
                {listsLoading && <><p className="srOnly" role="status">{t("loading")}</p><div className={styles.skeletonControl} aria-hidden="true" /></>}
                {listsLoadError && <RetryNotice className={styles.alert} message={t("loadListsError")} retryLabel={t("retry")} onRetry={() => setListsAttempt(value => value + 1)} />}
                {!listsLoading && !listsLoadError && lists.length === 0 && <p className={styles.empty}>{t("noLists")}</p>}
                {!listsLoading && !listsLoadError && lists.length > 0 && <>
                  <label htmlFor="movie-list">{t("addToList")}</label>
                  <select id="movie-list" value={selectedList} onChange={event => setSelectedList(event.target.value)}><option value="">{t("chooseList")}</option>{lists.map(list => <option key={list.id} value={list.id}>{editorialText(list.name, t("lists"))}</option>)}</select>
                  <button className={styles.primaryButton} type="button" disabled={!selectedList || mutationBusy !== null} aria-busy={mutationBusy === "list"} onClick={() => void addToList()}>{mutationBusy === "list" ? t("saving") : t("add")}</button>
                </>}
              </div>
              <button className={styles.heroActionReview} type="button" onClick={focusReview}>{t("review")}</button>
            </section>}
          </div>
        </section>
        <section className={`${styles.mobileDetailSection} ${styles.mobileRatingSummary}`} aria-labelledby="mobile-rating-title">
          <div className={styles.mobileSectionHeading}><h2 id="mobile-rating-title">{t("ratings")} &amp; {t("reviews")}</h2></div>
          <div className={styles.ratingSummaryRow}>
            <strong className={styles.movieRating}>{movie.rating != null ? <><img src="/images/movie-star.png" width={18} height={18} alt="" aria-hidden="true" />{movie.rating}</> : "—"}</strong>
            {movie.externalRatings.map(item => <span className={styles.externalRatingPill} key={item.source}><strong>{item.source}</strong> {item.rating}</span>)}
          </div>
        </section>
        <section className={styles.mobileDetailSection} aria-labelledby="mobile-crew-title">
          <div className={styles.mobileSectionHeading}><h2 id="mobile-crew-title">{t("castAndCrew")}</h2></div>
          {mobileCrew.length > 0 ? <div className={styles.crewRail}>
            {mobileCrew.map(item => <Link className={styles.crewCard} key={item.id} to={path(`/people/${item.type}/${item.personId}`)}>
              <span className={styles.crewAvatar} aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>
              <strong>{item.name}</strong>
              <small>{item.role}</small>
            </Link>)}
          </div> : <p className={styles.empty}>{t("movieCrewUnavailable")}</p>}
        </section>
        {isAuth && <MovieActionSheet
          open={mobileActionOpen}
          movie={movie}
          rating={rating}
          ratingLoading={ratingLoading}
          ratingLoadError={ratingLoadError}
          mutationBusy={mutationBusy}
          lists={lists}
          listsLoading={listsLoading}
          listsLoadError={listsLoadError}
          selectedList={selectedList}
          onToggle={(kind, enabled) => void toggle(kind, enabled)}
          onSaveRating={value => void saveRating(value)}
          onRetryRating={() => setRatingAttempt(value => value + 1)}
          onDeleteRating={() => void deleteRating()}
          onSelectedListChange={setSelectedList}
          onAddToList={() => void addToList()}
          onRetryLists={() => setListsAttempt(value => value + 1)}
          onReview={focusReview}
          onShare={() => void shareMovie()}
          onClose={closeMobileActions}
        />}
        <section className={`${styles.section} ${styles.reviewsSection}`} data-reviews-expanded={showAllReviews} aria-labelledby="reviews-title" aria-busy={reviewsLoading || (isAuth && !myReviewReady)}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("reviews")}</p><h2 id="reviews-title" tabIndex={-1}><span className={styles.desktopReviewTitle}>{t("reviews")}</span><span className={styles.mobileReviewTitle}>{t("recentReviews")}</span></h2></div>
          {reviewsLoading && <><p className="srOnly" role="status">{t("loading")}</p>{[0, 1].map(item => <div className={`${styles.review} ${styles.skeletonReview}`} aria-hidden="true" key={item}><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /><div className={styles.skeletonLine} /></div>)}</>}
          {reviewsLoadError && <RetryNotice className={styles.alert} message={t("loadReviewsError")} retryLabel={t("retry")} onRetry={() => setReviewsAttempt(value => value + 1)} />}
          {isAuth && myReview && <article className={`${styles.review} ${styles.myReview}`}>
            <h3>{t("yourReview")} · {myReview.rating ?? "—"}/5</h3>
            {!editingReview && <><p><Link to={path(`/reviews/${myReview.id}`)}>{myReview.content}</Link></p>
              <div className={styles.reviewActions}><button type="button" disabled={mutationBusy !== null} onClick={() => { setReviewText(myReview.content); setReviewRating(myReview.rating ?? rating); setEditingReview(true); }}>{t("editReview")}</button>
                <button type="button" disabled={mutationBusy !== null} onClick={event => setReviewDeleteTrigger(event.currentTarget)}>{mutationBusy === "delete-review" ? t("deleting") : t("deleteReview")}</button></div>
              <ReviewLikeButton reviewId={myReview.id} />
              <Comments reviewId={myReview.id} />
            </>}
          </article>}
          {!reviewsLoading && !reviewsLoadError && otherReviews.length === 0 && !myReview && <p className={styles.empty}>{t("noReviews")}</p>}
          {!reviewsLoading && !reviewsLoadError && otherReviews.slice(0, 2).map(renderReviewCard)}
          {!reviewsLoading && !reviewsLoadError && (otherReviews.length > 2 || reviewsTotalPages > 1) && <>
            <button className={styles.allReviewsButton} type="button" aria-expanded={showAllReviews} aria-controls="additional-movie-reviews" onClick={() => setShowAllReviews(value => !value)}>{t(showAllReviews ? "showFewerReviews" : "allReviews")}<span aria-hidden="true">{showAllReviews ? "‹" : "›"}</span></button>
            <div id="additional-movie-reviews" className={styles.additionalReviews}>{otherReviews.slice(2).map(renderReviewCard)}</div>
          </>}
          {!reviewsLoadError && <Pagination className={styles.pagination} page={reviewsPage} totalPages={reviewsTotalPages} label={t("reviewsPagination")} busy={reviewsLoading} onPageChange={page => { setShowAllReviews(false); setReviewsPage(page); }} />}
          {isAuth && !myReviewReady && <p className={styles.loading} role="status">{t("loading")}</p>}
          {isAuth && myReviewError && <RetryNotice className={styles.alert} message={t("loadMyReviewError")} retryLabel={t("retry")} onRetry={() => setMyReviewAttempt(value => value + 1)} />}
          {isAuth && myReviewReady && !myReviewError && (!myReview || editingReview) && <form className={styles.reviewForm} onSubmit={createReview}>
            <label htmlFor="review-content">{t("yourReview")}</label>
            <textarea id="review-content" required maxLength={5000} disabled={mutationBusy !== null} value={reviewText} onChange={event => setReviewText(event.target.value)} />
            {editingReview && <label htmlFor="review-rating">{t("myRating")}</label>}
            {editingReview && <select id="review-rating" disabled={mutationBusy !== null} value={reviewRating} onChange={event => setReviewRating(Number(event.target.value))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}/5</option>)}</select>}
             <div className={styles.reviewFormActions}><button className={styles.primaryButton} type="submit" disabled={mutationBusy !== null} aria-busy={mutationBusy === "review"}>{mutationBusy === "review" ? t("saving") : t(editingReview ? "saveReview" : "publishReview")}</button>
              {editingReview && <button type="button" disabled={mutationBusy !== null} onClick={() => { setEditingReview(false); setReviewText(""); }}>{t("cancel")}</button>}</div>
          </form>}
          {!isAuth && <p className={styles.signIn}><Link to={path("/login")}>{t("login")}</Link> {t("signInToReview")}</p>}
        </section>
        <section className={`${styles.section} ${styles.similarSection}`} aria-labelledby="similar-title">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("similarFilms")}</p><h2 id="similar-title">{t("similarFilms")}</h2></div>
          {movie.similarMovies.length === 0 ? <p className={styles.empty}>{t("noSimilarFilms")}</p> : <div className={styles.similarGrid}>{movie.similarMovies.map(item => {
            const similarTitle = editorialText(item.title, t("untitledFilm"));
            return <Link className={styles.similarCard} key={item.id} to={path(`/films/${item.id}`)}>
              <span className={styles.similarPoster}><ResilientImage src={item.photoUrl} alt="" fallback={<span className={styles.similarFallback} aria-hidden="true">{similarTitle.slice(0, 1)}</span>} /></span>
              <span className={styles.similarTitle}>{similarTitle}</span>
              <span className={styles.similarMeta}>{formatMovieYear(item.releaseDate, t("unknownYear"))}{item.rating !== null ? ` · ★ ${item.rating}` : ""}</span>
            </Link>;
          })}</div>}
        </section>
        <section className={`${styles.section} ${styles.storylineSection}`} aria-labelledby="storyline-title">
          <div className={styles.sectionHeading}><h2 id="storyline-title">{t("storyline")}</h2></div>
          <div className={styles.storylineCard}><h3>{movieTitle}</h3><p className={movie.shortPlot ? undefined : styles.empty}>{movie.shortPlot || t("movieStorylineUnavailable")}</p></div>
        </section>
      </>}
      <ConfirmDialog open={reviewDeleteTrigger !== null} title={t("deleteReview")} description={t("deleteReviewConfirm")} cancelLabel={t("cancel")} confirmLabel={t("deleteReview")} trigger={reviewDeleteTrigger} onCancel={() => setReviewDeleteTrigger(null)} onConfirm={() => { setReviewDeleteTrigger(null); void deleteReview(); }} />
    </div>
  </main>;
}
