import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import ResilientImage from "../components/ResilientImage";
import { addMovieToList, getUserLists } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { localizeGenreName, useLocale } from "../i18n";
import Comments from "./Comments";
import styles from "./MovieDetails.module.css";

interface Movie {
  id: number; title: string; shortPlot: string | null; photoUrl: string | null; backdropUrl: string | null;
  releaseDate: string | null; durationMinutes: number | null; rating: number | null;
  trailerUrl: string | null; genres: { id: number; name: string }[];
  actors: { id: number; name: string; characterName: string | null }[];
  directors: { id: number; name: string }[];
  producers: { id: number; name: string }[];
  externalRatings: { source: string; rating: number }[];
  similarMovies: { id: number; title: string; photoUrl: string | null; releaseDate: string | null; rating: number | null }[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}
interface Review { id: number; username: string; content: string; rating: number | null; userId: number }
interface ReviewPage { content: Review[]; number: number; totalPages: number; totalElements: number }
interface List { id: number; name: string }

function ReviewLikeButton({ reviewId }: { reviewId: number }) {
  const { isAuth } = useAuth();
  const { t } = useLocale();
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);
  const [statusAttempt, setStatusAttempt] = useState(0);
  const [actionError, setActionError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let current = true;
    setLikes(null);
    setLiked(false);
    setStatusLoading(true);
    setStatusError(false);
    setActionError(false);
    const request = isAuth
      ? api.get<{ liked: boolean; likes: number }>(`/reviews/${reviewId}/like-status`).then(({ data }) => {
        if (!current) return;
        setLiked(data.liked);
        setLikes(data.likes);
      })
      : api.get<number>(`/reviews/${reviewId}/likes`).then(({ data }) => { if (current) setLikes(data); });
    request
      .catch(() => { if (current) setStatusError(true); })
      .finally(() => { if (current) setStatusLoading(false); });
    return () => { current = false; };
  }, [isAuth, reviewId, statusAttempt]);

  const toggle = async () => {
    if (statusLoading || statusError) return;
    setBusy(true);
    setActionError(false);
    try {
      await (liked ? api.delete(`/reviews/${reviewId}/likes`) : api.post(`/reviews/${reviewId}/likes`));
      setLiked(value => !value);
      setLikes(value => Math.max(0, (value ?? 0) + (liked ? -1 : 1)));
    } catch {
      setActionError(true);
    } finally {
      setBusy(false);
    }
  };

  return <p>
    <span>{t("likes")}: {likes ?? "—"}</span>
    {statusLoading && <span aria-live="polite"> {t("loading")}</span>}
    {statusError && <span role="alert"> {t("likeReviewError")} <button type="button" onClick={() => setStatusAttempt(value => value + 1)}>{t("retry")}</button></span>}
    {isAuth && !statusLoading && !statusError && <> {" "}<button type="button" disabled={busy} aria-busy={busy} aria-pressed={liked} onClick={() => void toggle()}>{busy ? t("loading") : liked ? t("unlike") : t("like")}</button></>}
    {actionError && <span role="alert"> {t("likeReviewError")} <button type="button" disabled={busy} aria-busy={busy} onClick={() => void toggle()}>{t("retry")}</button></span>}
  </p>;
}

export default function MovieDetails() {
  const { id } = useParams();
  const movieId = Number(id);
  const { isAuth } = useAuth();
  const { lang, path, t } = useLocale();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(0);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [myReviewReady, setMyReviewReady] = useState(false);
  const [myReviewError, setMyReviewError] = useState(false);
  const [myReviewAttempt, setMyReviewAttempt] = useState(0);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [lists, setLists] = useState<List[]>([]);
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
  const [message, setMessage] = useState("");
  const loadRequest = useRef(0);
  const reviewsRequest = useRef(0);
  const myReviewRequest = useRef(0);

  const loadMovie = useCallback(async () => {
    const requestId = ++loadRequest.current;
    setLoading(true);
    setLoadError("");
    try {
      const details = await api.get<Movie>(`/movies/${movieId}/details`);
      if (requestId !== loadRequest.current) return;
      setMovie(details.data);
    } catch { if (requestId === loadRequest.current) { setMovie(null); setLoadError(t("loadMovieError")); } }
    finally { if (requestId === loadRequest.current) setLoading(false); }
  }, [movieId, lang, loadAttempt]);

  const loadReviews = useCallback(async () => {
    const requestId = ++reviewsRequest.current;
    setReviewsLoading(true);
    setReviewsLoadError(false);
    try {
      const reviewPage = await api.get<ReviewPage>(`/movies/${movieId}/reviews`, { params: { page: reviewsPage, size: 10 } });
      if (requestId !== reviewsRequest.current) return;
      if (reviewsPage > 0 && reviewPage.data.content.length === 0) {
        setReviewsPage(page => page - 1);
        return;
      }
      setReviews(reviewPage.data.content);
      setReviewsTotalPages(reviewPage.data.totalPages);
    } catch {
      if (requestId !== reviewsRequest.current) return;
      setReviews([]);
      setReviewsTotalPages(0);
      setReviewsLoadError(true);
    } finally { if (requestId === reviewsRequest.current) setReviewsLoading(false); }
  }, [movieId, reviewsAttempt, reviewsPage]);

  const load = useCallback(async () => {
    await Promise.all([loadMovie(), loadReviews()]);
  }, [loadMovie, loadReviews]);

  const loadMyReview = useCallback(async () => {
    const requestId = ++myReviewRequest.current;
    try {
      const response = await api.get<Review>(`/movies/${movieId}/reviews/me`);
      if (requestId !== myReviewRequest.current) return;
      setMyReview(response.status === 204 ? null : response.data);
      setMyReviewError(false);
      setMyReviewReady(true);
    } catch (requestError) {
      if (requestId === myReviewRequest.current) {
        setMyReviewError(true);
        setMyReviewReady(true);
      }
      throw requestError;
    }
  }, [movieId]);

  useEffect(() => {
    let current = true;
    if (!isAuth) {
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
  }, [isAuth, listsAttempt]);

  useEffect(() => {
    let current = true;
    if (!isAuth || !Number.isInteger(movieId) || movieId < 1) {
      setRating(0);
      setRatingLoading(false);
      setRatingLoadError(false);
      return () => { current = false; };
    }

    setRatingLoading(true);
    setRatingLoadError(false);
    api.get<{ rating: number }>(`/movies/${movieId}/rating/me`)
      .then(({ data }) => { if (current) setRating(data?.rating ?? 0); })
      .catch(() => {
        if (!current) return;
        setRating(0);
        setRatingLoadError(true);
      })
      .finally(() => { if (current) setRatingLoading(false); });

    return () => { current = false; };
  }, [isAuth, movieId, ratingAttempt]);

  useEffect(() => {
    if (Number.isInteger(movieId) && movieId > 0) void loadMovie();
    if (isAuth) {
      setMyReview(null);
      setMyReviewReady(false);
      void loadMyReview().catch(() => undefined);
    } else {
      setMyReview(null);
    }
  }, [isAuth, loadMovie, loadMyReview, movieId, myReviewAttempt]);

  useEffect(() => {
    if (Number.isInteger(movieId) && movieId > 0) void loadReviews();
  }, [loadReviews, movieId]);

  const toggle = async (kind: "watched" | "watchlist" | "favorite", enabled: boolean) => {
    if (mutationBusy) return;
    setMutationBusy(kind);
    try {
      await (enabled ? api.delete(`/movies/${movieId}/${kind}`) : api.post(`/movies/${movieId}/${kind}`));
      await load();
      setMessage(t("saved"));
    } catch { setError(t("changeListError")); }
    finally { setMutationBusy(null); }
  };

  const saveRating = async (value: number) => {
    if (mutationBusy) return;
    setMutationBusy("rating");
    try {
      if (myReview) {
        await api.patch(`/reviews/${myReview.id}`, { rating: value });
        await loadMyReview();
      } else {
        await api.put(`/movies/${movieId}/rating`, { rating: value });
      }
      setRating(value);
      if (editingReview) setReviewRating(value);
      await load();
      setError("");
    } catch { setError(t("saveRatingError")); }
    finally { setMutationBusy(null); }
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mutationBusy) return;
    const chosenRating = editingReview ? reviewRating : rating;
    if (!chosenRating) { setError(t("rateFirst")); return; }
    setMutationBusy("review");
    try {
      if (editingReview && myReview) {
        await api.patch(`/reviews/${myReview.id}`, { content: reviewText.trim(), rating: chosenRating });
      } else {
        await api.post(`/movies/${movieId}/reviews`, { content: reviewText.trim(), rating: chosenRating });
      }
      setRating(chosenRating);
      setReviewText("");
      setEditingReview(false);
      setMessage(t(editingReview ? "reviewUpdated" : "reviewPublished"));
      setError("");
      await Promise.all([load(), loadMyReview()]);
    } catch { setError(t(editingReview ? "updateReviewError" : "createReviewError")); }
    finally { setMutationBusy(null); }
  };

  const deleteReview = async () => {
    if (!myReview || !window.confirm(t("deleteReviewConfirm"))) return;
    if (mutationBusy) return;
    setMutationBusy("delete-review");
    try {
      await api.delete(`/reviews/${myReview.id}`);
      setEditingReview(false);
      setReviewText("");
      setMessage(t("reviewDeleted"));
      setError("");
      await Promise.all([load(), loadMyReview()]);
    } catch { setError(t("deleteReviewError")); }
    finally { setMutationBusy(null); }
  };

  const deleteRating = async () => {
    if (mutationBusy) return;
    setMutationBusy("delete-rating");
    try {
      await api.delete(`/movies/${movieId}/rating`);
      setRating(0);
      setMessage(t("ratingDeleted"));
      setError("");
      await load();
    } catch { setError(t("deleteRatingError")); }
    finally { setMutationBusy(null); }
  };

  const addToList = async () => {
    if (!selectedList || mutationBusy) return;
    setMutationBusy("list");
    try {
      await addMovieToList(Number(selectedList), movieId);
      setMessage(t("filmAdded"));
    } catch { setError(t("addFilmError")); }
    finally { setMutationBusy(null); }
  };

  const otherReviews = reviews.filter(item => item.id !== myReview?.id);
  const heroImage = movie?.backdropUrl || movie?.photoUrl;

  if (!Number.isInteger(movieId) || movieId < 1) return <main className={styles.state}>{t("invalidMovieId")}</main>;
  return <main className={styles.page} aria-busy={loading || reviewsLoading || mutationBusy !== null}>
    <div className={styles.shell}>
      {loadError && <div className={styles.alert} role="alert">{loadError} <button type="button" onClick={() => setLoadAttempt(value => value + 1)}>{t("retry")}</button></div>}
      {error && <div className={styles.alert} role="alert">{error}</div>}
      {message && <div className={styles.status} role="status">{message}</div>}
      {loading && !movie && <p className={styles.loading} aria-live="polite">{t("loading")}</p>}
      {movie && <>
        <section className={styles.hero} aria-labelledby="movie-title">
          <ResilientImage className={styles.heroBackdrop} src={heroImage} alt="" aria-hidden="true" loading="eager" fallback={null} />
          <div className={styles.heroGrid}>
            <div className={styles.posterFrame}>
              <ResilientImage className={styles.poster} src={movie.photoUrl} alt={`${t("poster")} ${movie.title}`} fallback={<div className={styles.posterFallback} aria-hidden="true">{movie.title.slice(0, 1)}</div>} />
            </div>
            <div className={styles.heroCopy}>
              <h1 id="movie-title">{movie.title}</h1>
              <p className={styles.meta}>{movie.releaseDate?.slice(0, 4) || "—"}{movie.durationMinutes ? ` · ${movie.durationMinutes} ${t("minutes")}` : ""}{movie.rating != null ? ` · ★ ${movie.rating}` : ""}</p>
              {movie.genres.length > 0 && <div className={styles.genres}>{movie.genres.map(item => <span key={item.id}>{localizeGenreName(item.name, lang)}</span>)}</div>}
              {movie.shortPlot && <p className={styles.plot}>{movie.shortPlot}</p>}
              <div className={styles.credits}>
                <p><strong>{t("directors")}:</strong> {movie.directors.length ? movie.directors.map(item => <Link key={item.id} to={path(`/people/director/${item.id}`)}>{item.name}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
                <p><strong>{t("producers")}:</strong> {movie.producers.length ? movie.producers.map(item => <Link key={item.id} to={path(`/people/producer/${item.id}`)}>{item.name}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
                <p><strong>{t("actors")}:</strong> {movie.actors.length ? movie.actors.slice(0, 5).map(item => <Link key={item.id} to={path(`/people/actor/${item.id}`)}>{item.name}{item.characterName ? ` (${item.characterName})` : ""}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
              </div>
              <div className={styles.heroLinks}>
                <div>
                  <h2>{t("trailer")}</h2>
                  {movie.trailerUrl ? <a className={styles.textLink} href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">{t("watchTrailer")}</a> : <p>{t("trailerUnavailable")}</p>}
                </div>
                {movie.externalRatings.length > 0 && <div className={styles.externalRatings} aria-label={t("ratings")}>
                  {movie.externalRatings.map(item => <span key={item.source}><strong>{item.source}</strong> {item.rating}</span>)}
                </div>}
              </div>
            </div>
          </div>
        </section>
        {isAuth && <section className={styles.actionSection} aria-labelledby="my-actions-title">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("myActions")}</p><h2 id="my-actions-title">{t("myActions")}</h2></div>
          <div className={styles.actionButtons}>
            <button className={`${styles.actionButton} ${movie.myFlags?.watched ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "watched"} onClick={() => void toggle("watched", movie.myFlags?.watched ?? false)} aria-pressed={movie.myFlags?.watched ?? false}>{mutationBusy === "watched" ? t("loading") : t("watched")}</button>
            <button className={`${styles.actionButton} ${movie.myFlags?.watchlist ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "watchlist"} onClick={() => void toggle("watchlist", movie.myFlags?.watchlist ?? false)} aria-pressed={movie.myFlags?.watchlist ?? false}>{mutationBusy === "watchlist" ? t("loading") : t("watchlist")}</button>
            <button className={`${styles.actionButton} ${movie.myFlags?.favorites ? styles.actionButtonActive : ""}`} type="button" disabled={mutationBusy !== null} aria-busy={mutationBusy === "favorite"} onClick={() => void toggle("favorite", movie.myFlags?.favorites ?? false)} aria-pressed={movie.myFlags?.favorites ?? false}>{mutationBusy === "favorite" ? t("loading") : t("favorite")}</button>
          </div>
          <div className={styles.ratingRow}>
            {ratingLoading ? <span className={styles.inlineStatus} role="status">{t("loading")}</span> : <span>{t("myRating")}: <strong>{rating || t("none")}</strong></span>}
            {ratingLoadError && <span className={styles.inlineError} role="alert">{t("loadRatingsError")} <button type="button" onClick={() => setRatingAttempt(value => value + 1)}>{t("retry")}</button></span>}
            <div className={styles.ratingButtons} aria-label={t("myRating")}>
              {[1, 2, 3, 4, 5].map(value => <button className={rating === value ? styles.ratingActive : ""} key={value} type="button" disabled={mutationBusy !== null || ratingLoading} onClick={() => void saveRating(value)} aria-label={`${t("rateAs")} ${value}`} aria-pressed={rating === value}>{value} ★</button>)}
            </div>
            {rating > 0 && !myReview && <button className={styles.textButton} type="button" disabled={mutationBusy !== null || ratingLoading} onClick={() => void deleteRating()}>{mutationBusy === "delete-rating" ? t("deleting") : t("deleteRating")}</button>}
          </div>
          <div className={styles.listPicker}>
            {listsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
            {listsLoadError && <p className={styles.alert} role="alert">{t("loadListsError")} <button type="button" onClick={() => setListsAttempt(value => value + 1)}>{t("retry")}</button></p>}
            {!listsLoading && !listsLoadError && lists.length === 0 && <p className={styles.empty}>{t("noLists")}</p>}
            {!listsLoading && !listsLoadError && lists.length > 0 && <>
              <label htmlFor="movie-list">{t("addToList")}</label>
              <select id="movie-list" value={selectedList} onChange={event => setSelectedList(event.target.value)}><option value="">{t("chooseList")}</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select>
              <button className={styles.primaryButton} type="button" disabled={!selectedList || mutationBusy !== null} aria-busy={mutationBusy === "list"} onClick={() => void addToList()}>{mutationBusy === "list" ? t("saving") : t("add")}</button>
            </>}
          </div>
        </section>}
        <section className={`${styles.section} ${styles.similarSection}`} aria-labelledby="similar-title">
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("similarFilms")}</p><h2 id="similar-title">{t("similarFilms")}</h2></div>
          {movie.similarMovies.length === 0 ? <p className={styles.empty}>{t("noSimilarFilms")}</p> : <div className={styles.similarGrid}>{movie.similarMovies.map(item => <Link className={styles.similarCard} key={item.id} to={path(`/films/${item.id}`)}>
            <span className={styles.similarPoster}><ResilientImage src={item.photoUrl} alt="" fallback={<span className={styles.similarFallback} aria-hidden="true">{item.title.slice(0, 1)}</span>} /></span>
            <span className={styles.similarTitle}>{item.title}</span>
            <span className={styles.similarMeta}>{item.releaseDate?.slice(0, 4) || "—"}{item.rating !== null ? ` · ★ ${item.rating}` : ""}</span>
          </Link>)}</div>}
        </section>
        <section className={`${styles.section} ${styles.reviewsSection}`} aria-labelledby="reviews-title" aria-busy={reviewsLoading}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("reviews")}</p><h2 id="reviews-title">{t("reviews")}</h2></div>
          {reviewsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
          {reviewsLoadError && <p className={styles.alert} role="alert">{t("loadReviewsError")} <button type="button" onClick={() => setReviewsAttempt(value => value + 1)}>{t("retry")}</button></p>}
          {isAuth && myReview && <article className={`${styles.review} ${styles.myReview}`}>
            <h3>{t("yourReview")} · {myReview.rating ?? "—"}/5</h3>
            {!editingReview && <><p><Link to={path(`/reviews/${myReview.id}`)}>{myReview.content}</Link></p>
              <div className={styles.reviewActions}><button type="button" disabled={mutationBusy !== null} onClick={() => { setReviewText(myReview.content); setReviewRating(myReview.rating ?? rating); setEditingReview(true); }}>{t("editReview")}</button>
                <button type="button" disabled={mutationBusy !== null} onClick={() => void deleteReview()}>{mutationBusy === "delete-review" ? t("deleting") : t("deleteReview")}</button></div>
              <ReviewLikeButton reviewId={myReview.id} />
              <Comments reviewId={myReview.id} />
            </>}
          </article>}
          {!reviewsLoading && !reviewsLoadError && otherReviews.length === 0 && !myReview && <p className={styles.empty}>{t("noReviews")}</p>}
          {!reviewsLoading && !reviewsLoadError && otherReviews.map(item => <article className={styles.review} key={item.id}><h3><Link to={path(`/reviews/${item.id}`)}>{item.username} · {item.rating ?? "—"}/5</Link></h3><p>{item.content}</p><ReviewLikeButton reviewId={item.id} /><Comments reviewId={item.id} /></article>)}
          {!reviewsLoadError && reviewsTotalPages > 1 && <nav className={styles.pagination} aria-label={t("reviewsPagination")}><button type="button" disabled={reviewsPage === 0 || reviewsLoading} onClick={() => setReviewsPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {reviewsPage + 1} {t("of")} {reviewsTotalPages}</span><button type="button" disabled={reviewsPage + 1 >= reviewsTotalPages || reviewsLoading} onClick={() => setReviewsPage(page => page + 1)}>{t("next")}</button></nav>}
          {isAuth && !myReviewReady && <p className={styles.loading}>{t("loading")}</p>}
          {isAuth && myReviewError && <p className={styles.alert} role="alert">{t("loadMyReviewError")} <button type="button" onClick={() => setMyReviewAttempt(value => value + 1)}>{t("retry")}</button></p>}
          {isAuth && myReviewReady && !myReviewError && (!myReview || editingReview) && <form className={styles.reviewForm} onSubmit={createReview}>
            <label htmlFor="review-content">{t("yourReview")}</label>
            <textarea id="review-content" required maxLength={5000} value={reviewText} onChange={event => setReviewText(event.target.value)} />
            {editingReview && <label htmlFor="review-rating">{t("myRating")}</label>}
            {editingReview && <select id="review-rating" value={reviewRating} onChange={event => setReviewRating(Number(event.target.value))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}/5</option>)}</select>}
             <div className={styles.reviewFormActions}><button className={styles.primaryButton} type="submit" disabled={mutationBusy !== null} aria-busy={mutationBusy === "review"}>{mutationBusy === "review" ? t("saving") : t(editingReview ? "saveReview" : "publishReview")}</button>
              {editingReview && <button type="button" onClick={() => { setEditingReview(false); setReviewText(""); }}>{t("cancel")}</button>}</div>
          </form>}
          {!isAuth && <p className={styles.signIn}><Link to={path("/login")}>{t("login")}</Link> {t("signInToReview")}</p>}
        </section>
      </>}
    </div>
  </main>;
}
