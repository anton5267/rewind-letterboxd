import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResilientImage from "../components/ResilientImage";
import { getPublicListFeed, type PublicList } from "../api/lists.api";
import { getPopularReviews, type RecentReview } from "../api/reviews.api";
import { searchMovies, type MovieCard } from "../api/search.api";
import { getPopularReviewers, getRecentWatched, type PopularReviewer, type RecentWatchedActivity } from "../api/social.api";
import { getPopularTags, type PopularTag } from "../api/tags.api";
import { getJournal, type JournalArticle } from "../api/journal.api";
import { editorialText, localizeJournalCategory, useLocale } from "../i18n";
import styles from "./Home.module.css";

type HomeSection = "popular" | "newest" | "reviews" | "lists" | "reviewers" | "tags" | "recentWatched" | "journal";
type HomeSectionErrors = Partial<Record<HomeSection, true>>;
const HOME_SECTION_LOADING: Record<HomeSection, boolean> = {
  popular: true,
  newest: true,
  reviews: true,
  lists: true,
  reviewers: true,
  tags: true,
  recentWatched: true,
  journal: true,
};

function SectionFailure({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return <p className={styles.sectionStatus} role="alert">{message} <button type="button" onClick={onRetry}>{retryLabel}</button></p>;
}

function MovieRow({ movies }: { movies: MovieCard[] }) {
  const { path, t } = useLocale();
  return <div className={styles.movieRow}>
    {movies.map(movie => <article className={styles.movieCard} key={movie.id}>
      <Link to={path(`/films/${movie.id}`)}>
        <ResilientImage src={movie.photoUrl} alt={`${t("poster")} ${movie.title}`} fallback={<div className={styles.posterFallback}>{movie.title}</div>} />
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
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [lists, setLists] = useState<PublicList[]>([]);
  const [reviewers, setReviewers] = useState<PopularReviewer[]>([]);
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [recentWatched, setRecentWatched] = useState<RecentWatchedActivity[]>([]);
  const [journal, setJournal] = useState<JournalArticle[]>([]);
  const [sectionLoading, setSectionLoading] = useState<Record<HomeSection, boolean>>(HOME_SECTION_LOADING);
  const [sectionErrors, setSectionErrors] = useState<HomeSectionErrors>({});
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let current = true;
    setSectionLoading(HOME_SECTION_LOADING);
    setSectionErrors({});
    setPopular([]);
    setNewest([]);
    setReviews([]);
    setLists([]);
    setReviewers([]);
    setTags([]);
    setRecentWatched([]);
    setJournal([]);
    const runSection = <T,>(section: HomeSection, request: Promise<{ data: T }>, onSuccess: (data: T) => void) => {
      request
        .then(({ data }) => { if (current) onSuccess(data); })
        .catch(() => { if (current) setSectionErrors(value => ({ ...value, [section]: true })); })
        .finally(() => { if (current) setSectionLoading(value => ({ ...value, [section]: false })); });
    };

    runSection("popular", searchMovies({ sort: "rating_desc", page: 0, size: 6 }), data => setPopular(data.content));
    runSection("newest", searchMovies({ sort: "newest", page: 0, size: 6 }), data => setNewest(data.content));
    runSection("reviews", getPopularReviews(), data => setReviews(data.content));
    runSection("lists", getPublicListFeed("popular", 0, undefined, 4), data => setLists(data.content));
    runSection("reviewers", getPopularReviewers(), data => setReviewers(data));
    runSection("tags", getPopularTags(12), data => setTags(data));
    runSection("recentWatched", getRecentWatched(), data => setRecentWatched(data.content));
    runSection("journal", getJournal(lang), data => setJournal(data.content.slice(0, 3)));
    return () => { current = false; };
  }, [lang, retry]);

  const allSectionsLoading = Object.values(sectionLoading).some(Boolean);

  return <main className={styles.page} aria-busy={allSectionsLoading}>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>{t("homeEyebrow")}</p>
      <h1>{t("homeTitle")}</h1>
      <p>{t("homeSubtitle")}</p>
      <div className={styles.actions}>
        <Link className={styles.primary} to={path("/films")}>{t("browseFilms")}</Link>
        <Link className={styles.secondary} to={path("/register")}>{t("joinRewind")}</Link>
      </div>
    </section>

    {allSectionsLoading && <p className={styles.status} role="status">{t("loadingHome")}</p>}
    {Object.keys(sectionErrors).length > 0 && <p className={styles.status} role="alert">{t("loadHomeError")} <button type="button" onClick={() => setRetry(value => value + 1)}>{t("retry")}</button></p>}
    <>
      <section className={styles.section} aria-busy={sectionLoading.popular}>
        <div className={styles.sectionHeading}><h2>{t("popularThisWeek")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        {sectionLoading.popular ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.popular ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : popular.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={popular} />}
      </section>
      <section className={styles.section} aria-busy={sectionLoading.newest}>
        <div className={styles.sectionHeading}><h2>{t("newReleases")}</h2><Link to={path("/films")}>{t("viewAll")}</Link></div>
        {sectionLoading.newest ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.newest ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : newest.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={newest} />}
      </section>
      <section className={styles.section} aria-busy={sectionLoading.recentWatched}>
        <div className={styles.sectionHeading}><h2>{t("recentWatched")}</h2></div>
        {sectionLoading.recentWatched ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.recentWatched ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : recentWatched.length === 0 ? <p>{t("noRecentWatched")}</p> : <div className={styles.stack}>{recentWatched.map(item => item.movie && <article className={styles.review} key={item.id}>
          <p><Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link></p>
          {item.actor && <small><Link to={path(`/users/${item.actor.id}`)}>{item.actor.displayName || item.actor.username}</Link> {t("activityWatched")}</small>}
        </article>)}</div>}
      </section>
      <section className={styles.section} aria-busy={sectionLoading.journal}>
        <div className={styles.sectionHeading}><h2>{t("latestJournal")}</h2><Link to={path("/journal")}>{t("viewAll")}</Link></div>
        {sectionLoading.journal ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.journal ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : journal.length === 0 ? <p>{t("noLatestJournal")}</p> : <div className={styles.stack}>{journal.map(article => <article className={styles.list} key={article.id}>
          <small>{localizeJournalCategory(article.category, t)}</small>
          <h3><Link to={path(`/journal/${article.slug}`)}>{editorialText(article.title, t("untitledArticle"))}</Link></h3>
          {article.excerpt && <p>{article.excerpt}</p>}
        </article>)}</div>}
      </section>
      <section className={styles.grid}>
        <div className={styles.panel} aria-busy={sectionLoading.reviews}>
          <div className={styles.sectionHeading}><h2>{t("homePopularReviews")}</h2></div>
          {sectionLoading.reviews ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviews ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : reviews.length === 0 ? <p>{t("noRecentReviews")}</p> : <div className={styles.stack}>{reviews.map(review => <article className={styles.review} key={review.id}>
            <div className={styles.reviewHeader}>
              <Link className={styles.reviewPoster} to={path(`/films/${review.movieId}`)} aria-label={`${t("poster")} ${review.movieTitle}`}>
                <ResilientImage src={review.moviePhotoUrl} alt="" fallback={<span aria-hidden="true">{review.movieTitle.slice(0, 1)}</span>} />
              </Link>
              <div className={styles.reviewIdentity}>
                <Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>
                <small><Link to={path(`/users/${review.userId}`)}>{review.username}</Link>{review.rating !== null && ` · ${review.rating}/5`}</small>
              </div>
              <ResilientImage className={styles.reviewAvatar} src={review.userAvatarUrl} alt="" fallback={<span className={styles.reviewAvatarFallback} aria-hidden="true">{review.username.slice(0, 1).toUpperCase()}</span>} />
            </div>
            <p className={styles.reviewText}><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
          </article>)}</div>}
        </div>
        <div className={styles.panel} aria-busy={sectionLoading.lists}>
          <div className={styles.sectionHeading}><h2>{t("popularLists")}</h2></div>
          {sectionLoading.lists ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.lists ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : lists.length === 0 ? <p>{t("noPublicLists")}</p> : <div className={styles.stack}>{lists.map(list => <article className={styles.list} key={list.id}>
            <h3><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h3>
            {list.description && <p>{list.description}</p>}
            <small>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{list.ownerUsername}</Link></small>
          </article>)}</div>}
        </div>
        <div className={styles.panel} aria-busy={sectionLoading.reviewers}>
          <div className={styles.sectionHeading}><h2>{t("popularReviewers")}</h2></div>
          {sectionLoading.reviewers ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviewers ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : reviewers.length === 0 ? <p>{t("noPopularReviewers")}</p> : <div className={styles.stack}>{reviewers.map(reviewer => <article className={styles.list} key={reviewer.id}>
            <h3><Link to={path(`/users/${reviewer.id}`)}>{reviewer.displayName || reviewer.username}</Link></h3>
            <small>{t("likes")}: {reviewer.likes}</small>
          </article>)}</div>}
        </div>
        <div className={styles.panel} aria-busy={sectionLoading.tags}>
          <div className={styles.sectionHeading}><h2>{t("popularTags")}</h2><Link to={path("/lists/discover")}>{t("viewAll")}</Link></div>
          {sectionLoading.tags ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.tags ? <SectionFailure message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : tags.length === 0 ? <p>{t("noTags")}</p> : <p className={styles.tagCloud}>{tags.map(tag => <Link key={tag.id} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)}>#{tag.name}</Link>)}</p>}
        </div>
      </section>
    </>
  </main>;
}
