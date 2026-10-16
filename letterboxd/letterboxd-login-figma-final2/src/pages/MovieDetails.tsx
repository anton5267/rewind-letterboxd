import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { addMovieToList, getUserLists } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface Movie {
  id: number; title: string; shortPlot: string | null; photoUrl: string | null;
  releaseDate: string | null; durationMinutes: number | null; rating: number | null;
  trailerUrl: string | null; genres: { id: number; name: string }[];
  actors: { id: number; name: string; characterName: string | null }[];
  directors: { id: number; name: string }[];
  externalRatings: { source: string; rating: number }[];
  similarMovies: { id: number; title: string; photoUrl: string | null }[];
  myFlags: { watched: boolean; watchlist: boolean; favorites: boolean } | null;
}
interface Review { id: number; username: string; content: string; rating: number; userId: number }
interface List { id: number; name: string }

export default function MovieDetails() {
  const { id } = useParams();
  const movieId = Number(id);
  const { isAuth } = useAuth();
  const { lang, path, t } = useLocale();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
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

  useEffect(() => {
    if (Number.isInteger(movieId) && movieId > 0) void load();
    if (isAuth) {
      getUserLists().then(({ data }) => setLists(data)).catch(() => setLists([]));
      api.get<{ rating: number }>(`/movies/${movieId}/rating/me`).then(({ data }) => setRating(data?.rating ?? 0)).catch(() => setRating(0));
    }
  }, [isAuth, load, movieId]);

  const toggle = async (kind: "watched" | "watchlist" | "favorite", enabled: boolean) => {
    try {
      await (enabled ? api.delete(`/movies/${movieId}/${kind}`) : api.post(`/movies/${movieId}/${kind}`));
      await load();
      setMessage(t("saved"));
    } catch { setError(t("changeListError")); }
  };

  const saveRating = async (value: number) => {
    try {
      await api.put(`/movies/${movieId}/rating`, { rating: value });
      setRating(value);
      await load();
    } catch { setError(t("saveRatingError")); }
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) { setError(t("rateFirst")); return; }
    try {
      await api.post(`/movies/${movieId}/reviews`, { content: reviewText.trim(), rating });
      setReviewText("");
      setMessage(t("reviewPublished"));
      await load();
    } catch { setError(t("createReviewError")); }
  };

  const addToList = async () => {
    if (!selectedList) return;
    try {
      await addMovieToList(Number(selectedList), movieId);
      setMessage(t("filmAdded"));
    } catch { setError(t("addFilmError")); }
  };

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
          <p>{t("directors")}: {movie.directors.map(item => item.name).join(", ") || "—"}</p>
          {movie.trailerUrl && <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">{t("trailer")}</a>}
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
        <div style={{ marginTop: 16 }}>
          <label>{t("addToList")} <select value={selectedList} onChange={event => setSelectedList(event.target.value)}><option value="">{t("chooseList")}</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <button type="button" disabled={!selectedList} onClick={() => void addToList()}>{t("add")}</button>
        </div>
      </section>}
      <section><h2>{t("actors")}</h2><p>{movie.actors.map(item => item.name).join(", ") || "—"}</p></section>
      <section><h2>{t("similarFilms")}</h2><ul>{movie.similarMovies.map(item => <li key={item.id}><Link to={path(`/films/${item.id}`)}>{item.title}</Link></li>)}</ul></section>
      <section><h2>{t("reviews")}</h2>
        {reviews.length === 0 && <p>{t("noReviews")}</p>}
        {reviews.map(item => <article key={item.id}><h3>{item.username} · {item.rating}/5</h3><p>{item.content}</p></article>)}
        {isAuth ? <form onSubmit={createReview}>
          <label>{t("yourReview")}<br /><textarea required maxLength={5000} value={reviewText} onChange={event => setReviewText(event.target.value)} /></label><br />
          <button type="submit">{t("publishReview")}</button>
        </form> : <p><Link to={path("/login")}>{t("login")}</Link> {t("signInToReview")}</p>}
      </section>
    </>}
  </main>;
}
