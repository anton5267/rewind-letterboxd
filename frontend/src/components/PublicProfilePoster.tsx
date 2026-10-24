import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMovieDetails } from "../api/movies.api";
import { getReviewDetails } from "../api/reviews.api";
import { useLocale } from "../i18n";
import ResilientImage from "./ResilientImage";
import RetryButton from "./RetryButton";
import styles from "./PublicProfilePoster.module.css";

interface PosterData { movieId: number; photoUrl: string | null }
interface PosterState { key: string; photoUrl: string | null; loading: boolean; error: boolean; unavailable: boolean }
const moviePhotos = new Map<number, string | null>();
const pendingPhotos = new Map<string, Promise<PosterData>>();

function requestPoster(movieId: number, reviewId?: number): Promise<PosterData> {
  // A review must still pass its own visibility check, even when its film is cached.
  if (reviewId === undefined && moviePhotos.has(movieId)) return Promise.resolve({ movieId, photoUrl: moviePhotos.get(movieId) ?? null });
  const key = reviewId === undefined ? `movie:${movieId}` : `review:${reviewId}`;
  const pending = pendingPhotos.get(key);
  if (pending) return pending;
  const request = (reviewId === undefined
    ? getMovieDetails(movieId).then(({ data }) => ({ movieId: data.id, photoUrl: data.photoUrl }))
    : getReviewDetails(reviewId).then(({ data }) => ({ movieId: data.movie.id, photoUrl: data.movie.photoUrl })))
    .then(data => {
      if (data.movieId !== movieId) throw new Error("Unexpected film in poster response");
      moviePhotos.delete(movieId);
      moviePhotos.set(movieId, data.photoUrl);
      if (moviePhotos.size > 64) moviePhotos.delete(moviePhotos.keys().next().value!);
      return data;
    })
    .finally(() => { pendingPhotos.delete(key); });
  pendingPhotos.set(key, request);
  return request;
}

export function usePublicProfilePoster(movieId: number, reviewId?: number) {
  const key = `${movieId}:${reviewId ?? "movie"}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<PosterState>({ key, photoUrl: null, loading: true, error: false, unavailable: false });
  useEffect(() => {
    let current = true;
    setState({ key, photoUrl: null, loading: true, error: false, unavailable: false });
    requestPoster(movieId, reviewId)
      .then(data => { if (current) setState({ key, photoUrl: data.photoUrl, loading: false, error: false, unavailable: false }); })
      .catch((error: unknown) => {
        if (!current) return;
        const status = (error as { response?: { status?: number } } | null)?.response?.status;
        const unavailable = reviewId !== undefined && (status === 403 || status === 404);
        setState({ key, photoUrl: null, loading: false, error: !unavailable, unavailable });
      });
    return () => { current = false; };
  }, [attempt, key, movieId, reviewId]);
  return { ...(state.key === key ? state : { key, photoUrl: null, loading: true, error: false, unavailable: false }), retry: () => setAttempt(value => value + 1) };
}

interface Props { movieId: number; title: string }

export default function PublicProfilePoster({ movieId, title }: Props) {
  const { path, t } = useLocale();
  const poster = usePublicProfilePoster(movieId);
  return <div className={styles.wrap} aria-busy={poster.loading}>
    <Link className={styles.link} to={path(`/films/${movieId}`)} aria-label={title} title={title}>
      <ResilientImage className={styles.image} src={poster.photoUrl} alt="" loading="lazy" fallback={<span className={styles.fallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
    </Link>
    {poster.error && <div className={styles.retry} role="group" aria-label={`${title}: ${t("loadMovieError")}`}><RetryButton label={t("retry")} onClick={poster.retry} /></div>}
  </div>;
}
