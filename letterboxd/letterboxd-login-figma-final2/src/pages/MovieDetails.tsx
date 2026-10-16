import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { addMovieToList, getUserLists } from "../api/lists.api";
import { useAuth } from "../context/AuthContext";

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
    } catch { setError("Не вдалося завантажити фільм."); }
  }, [movieId]);

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
      setMessage("Збережено.");
    } catch { setError("Не вдалося змінити список."); }
  };

  const saveRating = async (value: number) => {
    try {
      await api.put(`/movies/${movieId}/rating`, { rating: value });
      setRating(value);
      await load();
    } catch { setError("Не вдалося зберегти оцінку."); }
  };

  const createReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) { setError("Спочатку поставте оцінку."); return; }
    try {
      await api.post(`/movies/${movieId}/reviews`, { content: reviewText.trim(), rating });
      setReviewText("");
      setMessage("Огляд опубліковано.");
      await load();
    } catch { setError("Не вдалося додати огляд. На один фільм дозволено один активний огляд."); }
  };

  const addToList = async () => {
    if (!selectedList) return;
    try {
      await addMovieToList(Number(selectedList), movieId);
      setMessage("Фільм додано до списку.");
    } catch { setError("Не вдалося додати фільм до списку."); }
  };

  if (!Number.isInteger(movieId) || movieId < 1) return <main>Некоректний номер фільму.</main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "75vh", padding: "110px 5% 40px" }}>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!movie && !error && <p>Завантаження...</p>}
    {movie && <>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
        {movie.photoUrl && <img src={movie.photoUrl} alt={`Постер ${movie.title}`} style={{ width: 220, maxWidth: "100%", alignSelf: "start" }} />}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <h1>{movie.title}</h1>
          <p>{movie.releaseDate?.slice(0, 4)} {movie.durationMinutes && ` · ${movie.durationMinutes} хв`} {movie.rating != null && ` · ★ ${movie.rating}`}</p>
          <p>{movie.genres.map(item => item.name).join(", ")}</p>
          <p>{movie.shortPlot}</p>
          <p>Режисери: {movie.directors.map(item => item.name).join(", ") || "—"}</p>
          {movie.trailerUrl && <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">Переглянути трейлер</a>}
          {movie.externalRatings.map(item => <p key={item.source}>{item.source}: {item.rating}</p>)}
        </div>
      </div>
      {isAuth && <section>
        <h2>Мої дії</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void toggle("watched", movie.myFlags?.watched ?? false)} aria-pressed={movie.myFlags?.watched ?? false}>Переглянуто</button>
          <button type="button" onClick={() => void toggle("watchlist", movie.myFlags?.watchlist ?? false)} aria-pressed={movie.myFlags?.watchlist ?? false}>До перегляду</button>
          <button type="button" onClick={() => void toggle("favorite", movie.myFlags?.favorites ?? false)} aria-pressed={movie.myFlags?.favorites ?? false}>Улюблене</button>
        </div>
        <p>Ваша оцінка: {rating || "немає"}</p>
        {[1, 2, 3, 4, 5].map(value => <button key={value} type="button" onClick={() => void saveRating(value)} aria-label={`Оцінити на ${value}`} aria-pressed={rating === value}>{value} ★</button>)}
        <div style={{ marginTop: 16 }}>
          <label>Додати в список <select value={selectedList} onChange={event => setSelectedList(event.target.value)}><option value="">Оберіть список</option>{lists.map(list => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <button type="button" disabled={!selectedList} onClick={() => void addToList()}>Додати</button>
        </div>
      </section>}
      <section><h2>Актори</h2><p>{movie.actors.map(item => item.name).join(", ") || "—"}</p></section>
      <section><h2>Схожі фільми</h2><ul>{movie.similarMovies.map(item => <li key={item.id}><Link to={`/films/${item.id}`}>{item.title}</Link></li>)}</ul></section>
      <section><h2>Огляди</h2>
        {reviews.length === 0 && <p>Оглядів поки немає.</p>}
        {reviews.map(item => <article key={item.id}><h3>{item.username} · {item.rating}/5</h3><p>{item.content}</p></article>)}
        {isAuth ? <form onSubmit={createReview}>
          <label>Ваш огляд<br /><textarea required maxLength={5000} value={reviewText} onChange={event => setReviewText(event.target.value)} /></label><br />
          <button type="submit">Опублікувати огляд</button>
        </form> : <p><Link to="/login">Увійдіть</Link>, щоб оцінити чи написати огляд.</p>}
      </section>
    </>}
  </main>;
}
