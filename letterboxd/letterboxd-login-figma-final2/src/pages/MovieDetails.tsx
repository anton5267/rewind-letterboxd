import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { addMovieToList, getUserLists } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import Comments from "./Comments";

interface Movie {
  id: number; title: string; shortPlot: string | null; photoUrl: string | null;
  releaseDate: string | null; durationMinutes: number | null; rating: number | null;
  trailerUrl: string | null; genres: { id: number; name: string }[];
  actors: { id: number; name: string; characterName: string | null }[];
  directors: { id: number; name: string }[];
  externalRatings: { source: string; rating: number }[];
  similarMovies: { id: number; title: string; photoUrl: string | null; releaseDate: string | null; rating: number | null }[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}
interface Review { id: number; username: string; content: string; rating: number | null; userId: number }
interface List { id: number; name: string }

export default function MovieDetails() {
  const { id } = useParams();
  const movieId = Number(id);
  const { isAuth } = useAuth();
  const { lang, path, t } = useLocale();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [myReviewReady, setMyReviewReady] = useState(false);
  const [myReviewError, setMyReviewError] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedList, setSelectedList] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [details, reviewPage] = await Promise.all([
        api.get<Movie>(`/movies/${movieId}/details`),
        api.get<{ content: Review[] }>(`/movies/${movieId}/reviews`),
      ]);
      setMovie(details.data);
      setReviews(reviewPage.data.content);
      setError("");
    } catch { setError(t("loadMovieError")); }
  }, [movieId, lang]);

  const loadMyReview = useCallback(async () => {
    const response = await api.get<Review>(`/movies/${movieId}/reviews/me`);
    setMyReview(response.status === 204 ? null : response.data);
    setMyReviewError(false);
    setMyReviewReady(true);
  }, [movieId]);

  useEffect(() => {
    if (Number.isInteger(movieId) && movieId > 0) void load();
    if (isAuth) {
      setMyReview(null);
      getUserLists().then(({ data }) => setLists(data)).catch(() => setLists([]));
      api.get<{ rating: number }>(`/movies/${movieId}/rating/me`).then(({ data }) => setRating(data?.rating ?? 0)).catch(() => setRating(0));
      setMyReviewReady(false);
      void loadMyReview().catch(() => { setMyReviewError(true); setMyReviewReady(true); });
    } else {
      setMyReview(null);
    }
  }, [isAuth, load, loadMyReview, movieId]);

  const toggle = async (kind: "watched" | "watchlist" | "favorite", enabled: boolean) => {
    try {
      await (enabled ? api.delete(`/movies/${movieId}/${kind}`) : api.post(`/movies/${movieId}/${kind}`));
      await load();
      setMessage(t("saved"));
    } catch { setError(t("changeListError")); }
  };

  const saveRating = async (value: number) => {
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
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    const chosenRating = editingReview ? reviewRating : rating;
    if (!chosenRating) { setError(t("rateFirst")); return; }
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
  };

  const deleteReview = async () => {
    if (!myReview || !window.confirm(t("deleteReviewConfirm"))) return;
    try {
      await api.delete(`/reviews/${myReview.id}`);
      setEditingReview(false);
      setReviewText("");
      setMessage(t("reviewDeleted"));
      setError("");
      await Promise.all([load(), loadMyReview()]);
    } catch { setError(t("deleteReviewError")); }
  };

  const deleteRating = async () => {
    try {
      await api.delete(`/movies/${movieId}/rating`);
      setRating(0);
      setMessage(t("ratingDeleted"));
      setError("");
      await load();
    } catch { setError(t("deleteRatingError")); }
  };

  const addToList = async () => {
    if (!selectedList) return;
    try {
      await addMovieToList(Number(selectedList), movieId);
      setMessage(t("filmAdded"));
    } catch { setError(t("addFilmError")); }
  };

  const otherReviews = reviews.filter(item => item.id !== myReview?.id);

  if (!Number.isInteger(movieId) || movieId < 1) return <main>{t("invalidMovieId")}</main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "75vh", padding: "110px 5% 40px" }}>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!movie && !error && <p>{t("loading")}</p>}
    {movie && <>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {movie.photoUrl && <img src={movie.photoUrl} alt={`${t("poster")} ${movie.title}`} style={{ width: 220, maxWidth: "100%", alignSelf: "start" }} />}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1>{movie.title}</h1>
          <p>{movie.releaseDate?.slice(0, 4)} {movie.durationMinutes && ` · ${movie.durationMinutes} ${t("minutes")}`} {movie.rating != null && ` · ★ ${movie.rating}`}</p>
          <p>{movie.genres.map(item => item.name).join(", ")}</p>
          <p>{movie.shortPlot}</p>
          <p>{t("directors")}: {movie.directors.length ? movie.directors.map(item => <Link key={item.id} to={path(`/people/director/${item.id}`)}>{item.name}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p>
          <section><h2>{t("trailer")}</h2>{movie.trailerUrl ? <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">{t("watchTrailer")}</a> : <p>{t("trailerUnavailable")}</p>}</section>
          {movie.externalRatings.map(item => <p key={item.source}>{item.source}: {item.rating}</p>)}
        </div>
      </div>
      {isAuth && <section>
        <h2>{t("myActions")}</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void toggle("watched", movie.myFlags?.watched ?? false)} aria-pressed={movie.myFlags?.watched ?? false}>{t("watched")}</button>
          <button type="button" onClick={() => void toggle("watchlist", movie.myFlags?.watchlist ?? false)} aria-pressed={movie.myFlags?.watchlist ?? false}>{t("watchlist")}</button>
          <button type="button" onClick={() => void toggle("favorite", movie.myFlags?.favorites ?? false)} aria-pressed={movie.myFlags?.favorites ?? false}>{t("favorite")}</button>
        </div>
        <p>{t("myRating")}: {rating || t("none")}</p>
        {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" onClick={() => void saveRating(value)} aria-label={`${t("rateAs")} ${value}`} aria-pressed={rating === value}>{value} ★</button>)}
        {rating > 0 && !myReview && <button type="button" onClick={() => void deleteRating()}>{t("deleteRating")}</button>}
        <div style={{ marginTop: 16 }}>
          <label>{t("addToList")} <select value={selectedList} onChange={event => setSelectedList(event.target.value)}><option value="">{t("chooseList")}</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <button type="button" disabled={!selectedList} onClick={() => void addToList()}>{t("add")}</button>
        </div>
      </section>}
      <section><h2>{t("actors")}</h2><p>{movie.actors.length ? movie.actors.map(item => <Link key={item.id} to={path(`/people/actor/${item.id}`)}>{item.name}</Link>).reduce<React.ReactNode[]>((all, node, index) => index ? [...all, ", ", node] : [node], []) : "—"}</p></section>
      <section><h2>{t("similarFilms")}</h2>{movie.similarMovies.length === 0 ? <p>{t("noSimilarFilms")}</p> : <ul>{movie.similarMovies.map(item => <li key={item.id}>{item.photoUrl && <img src={item.photoUrl} alt="" width="48" />} <Link to={path(`/films/${item.id}`)}>{item.title}</Link>{item.releaseDate && ` (${item.releaseDate.slice(0, 4)})`}{item.rating !== null && ` · ★ ${item.rating}`}</li>)}</ul>}</section>
      <section><h2>{t("reviews")}</h2>
        {isAuth && myReview && <article>
          <h3>{t("yourReview")} · {myReview.rating ?? "—"}/5</h3>
          {!editingReview && <><p>{myReview.content}</p>
            <button type="button" onClick={() => { setReviewText(myReview.content); setReviewRating(myReview.rating ?? rating); setEditingReview(true); }}>{t("editReview")}</button>{" "}
            <button type="button" onClick={() => void deleteReview()}>{t("deleteReview")}</button>
            <Comments reviewId={myReview.id} />
          </>}
        </article>}
        {otherReviews.length === 0 && !myReview && <p>{t("noReviews")}</p>}
        {otherReviews.map(item => <article key={item.id}><h3>{item.username} · {item.rating ?? "—"}/5</h3><p>{item.content}</p><Comments reviewId={item.id} /></article>)}
        {isAuth && !myReviewReady && <p>{t("loading")}</p>}
        {isAuth && myReviewError && <p role="alert">{t("loadMyReviewError")}</p>}
        {isAuth && myReviewReady && !myReviewError && (!myReview || editingReview) && <form onSubmit={createReview}>
          <label>{t("yourReview")}<br /><textarea required maxLength={5000} value={reviewText} onChange={event => setReviewText(event.target.value)} /></label><br />
          {editingReview && <label>{t("myRating")}: <select value={reviewRating} onChange={event => setReviewRating(Number(event.target.value))}>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}/5</option>)}</select></label>}{" "}
          <button type="submit">{t(editingReview ? "saveReview" : "publishReview")}</button>{" "}
          {editingReview && <button type="button" onClick={() => { setEditingReview(false); setReviewText(""); }}>{t("cancel")}</button>}
        </form>}
        {!isAuth && <p><Link to={path("/login")}>{t("login")}</Link> {t("signInToReview")}</p>}
      </section>
    </>}
  </main>;
}
