import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { searchMovies, type MovieCard, type MoviePage } from "../api/search.api";
import { useLocale } from "../i18n";
import styles from "./Home.module.css";

interface Review {
  id: number;
  movieId: number;
  movieTitle: string;
  userId: number;
  username: string;
  content: string;
  rating: number | null;
  createdAt: string;
}

interface PublicList {
  id: number;
  name: string;
  description: string | null;
  ownerUsername: string;
  ownerId: number;
}

interface Page<T> { content: T[] }

function MovieRow({ movies }: { movies: MovieCard[] }) {
  const { path, t } = useLocale();
  return <div className={styles.movieRow}>
    {movies.map(movie => <article className={styles.movieCard} key={movie.id}>
      <Link to={path(`/films/${movie.id}`)}>
        {movie.photoUrl ? <img src={movie.photoUrl} alt={`${t("poster")} ${movie.title}`} /> : <div className={styles.posterFallback}>{movie.title}</div>}
        <h3>{movie.title}</h3>
      </Link>
      <p>{movie.releaseDate?.slice(0, 4) ?? t("unknownYear")}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
    </article>)}
  </div>;
}

export default function Home() {
  const { path, t, lang } = useLocale();
  const [popular, setPopular] = useState<MovieCard[]>([]);
  const [newest, setNewest] = useState<MovieCard[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    Promise.all([
      searchMovies({ sort: "rating_desc", page: 0, size: 6 }),
      searchMovies({ sort: "newest", page: 0, size: 6 }),
      api.get<Page<Review>>("/reviews/recent", { params: { size: 4 } }),
      api.get<Page<PublicList>>("/lists/public", { params: { size: 4 } }),
    ]).then(([popularResponse, newestResponse, reviewsResponse, listsResponse]) => {
      if (!current) return;
      setPopular((popularResponse.data as MoviePage).content);
      setNewest((newestResponse.data as MoviePage).content);
      setReviews(reviewsResponse.data.content);
      setLists(listsResponse.data.content);
    }).catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [lang, retry]);

  return <main className={styles.page}>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{t("homeEyebrow")}</p>
      <h1>{t("homeTitle")}</h1>
      <p>{t("homeSubtitle")}</p>
      <div className={styles.actions}>
        <Link className={styles.primary} to={path("/films")}>{t("browseFilms")}</Link>
        <Link className={styles.secondary} to={path("/register")}>{t("joinRewind")}</Link>
      </div>
    </section>

    {loading && <p className={styles.status}>{t("loadingHome")}</p>}
    {error && <p className={styles.status} role="alert">{t("loadHomeError")} <button type="button" onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></p>}
    {!loading && !error && <>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>{t("popularThisWeek")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        <MovieRow movies={popular} />
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>{t("newReleases")}</h2><Link to={path("/films")}>{t("viewAll")}</Link></div>
        <MovieRow movies={newest} />
      </section>
      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.sectionHeading}><h2>{t("homeRecentReviews")}</h2></div>
          {reviews.length === 0 ? <p>{t("noRecentReviews")}</p> : <div className={styles.stack}>{reviews.map(review => <article className={styles.review} key={review.id}>
            <p><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}</p>
            <p className={styles.reviewText}>{review.content}</p>
            <small><Link to={path(`/users/${review.userId}`)}>{review.username}</Link></small>
          </article>)}</div>}
        </div>
        <div className={styles.panel}>
          <div className={styles.sectionHeading}><h2>{t("popularLists")}</h2></div>
          {lists.length === 0 ? <p>{t("noPublicLists")}</p> : <div className={styles.stack}>{lists.map(list => <article className={styles.list} key={list.id}>
            <h3><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h3>
            {list.description && <p>{list.description}</p>}
            <small>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link></small>
          </article>)}</div>}
        </div>
      </section>
    </>}
  </main>;
}
