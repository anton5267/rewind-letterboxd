import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { searchMovies, type MovieCard, type MoviePage } from "../api/search.api";
import { getPopularReviewers, type PopularReviewer } from "../api/social.api";
import { getJournal, type JournalArticle } from "../api/journal.api";
import { localizeJournalCategory, useLocale } from "../i18n";
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
interface Tag { id: number; name: string; slug: string }
interface RecentWatched { id: number; createdAt: string; actor: { id: number; username: string; displayName: string | null } | null; movie: { id: number; title: string } | null }

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
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [recentWatched, setRecentWatched] = useState<RecentWatched[]>([]);
  const [journal, setJournal] = useState<JournalArticle[]>([]);
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
      api.get<Page<Review>>("/reviews/popular", { params: { size: 4 } }),
      api.get<Page<PublicList>>("/lists/public/popular", { params: { size: 4 } }),
      getPopularReviewers(),
      api.get<Tag[]>("/tags/popular", { params: { size: 12 } }),
      api.get<Page<RecentWatched>>("/activity/recent-watched", { params: { size: 6 } }),
      getJournal(lang),
    ]).then(([popularResponse, newestResponse, reviewsResponse, listsResponse, reviewersResponse, tagsResponse, recentWatchedResponse, journalResponse]) => {
      if (!current) return;
      setPopular((popularResponse.data as MoviePage).content);
      setNewest((newestResponse.data as MoviePage).content);
      setReviews(reviewsResponse.data.content);
      setLists(listsResponse.data.content);
      setReviewers(reviewersResponse.data);
      setTags(tagsResponse.data);
      setRecentWatched(recentWatchedResponse.data.content);
      setJournal(journalResponse.data.content.slice(0, 3));
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
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>{t("recentWatched")}</h2></div>
        {recentWatched.length === 0 ? <p>{t("noRecentWatched")}</p> : <div className={styles.stack}>{recentWatched.map(item => item.movie && <article className={styles.review} key={item.id}>
          <p><Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link></p>
          {item.actor && <small><Link to={path(`/users/${item.actor.id}`)}>{item.actor.displayName || item.actor.username}</Link> {t("activityWatched")}</small>}
        </article>)}</div>}
      </section>
      <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>{t("latestJournal")}</h2><Link to={path("/journal")}>{t("viewAll")}</Link></div>
        {journal.length === 0 ? <p>{t("noLatestJournal")}</p> : <div className={styles.stack}>{journal.map(article => <article className={styles.list} key={article.id}>
          <small>{localizeJournalCategory(article.category, t)}</small>
          <h3><Link to={path(`/journal/${article.slug}`)}>{article.title}</Link></h3>
          {article.excerpt && <p>{article.excerpt}</p>}
        </article>)}</div>}
      </section>
      <section className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.sectionHeading}><h2>{t("homePopularReviews")}</h2></div>
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
        <div className={styles.panel}>
          <div className={styles.sectionHeading}><h2>{t("popularReviewers")}</h2></div>
          {reviewers.length === 0 ? <p>{t("noPopularReviewers")}</p> : <div className={styles.stack}>{reviewers.map(reviewer => <article className={styles.list} key={reviewer.id}>
            <h3><Link to={path(`/users/${reviewer.id}`)}>{reviewer.displayName || reviewer.username}</Link></h3>
            <small>{t("likes")}: {reviewer.likes}</small>
          </article>)}</div>}
        </div>
        <div className={styles.panel}>
          <div className={styles.sectionHeading}><h2>{t("popularTags")}</h2><Link to={path("/lists/discover")}>{t("viewAll")}</Link></div>
          {tags.length === 0 ? <p>{t("noTags")}</p> : <p style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{tags.map(tag => <Link key={tag.id} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)}>#{tag.name}</Link>)}</p>}
        </div>
      </section>
    </>}
  </main>;
}
