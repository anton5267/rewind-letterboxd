import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ResilientImage from "../components/ResilientImage";
import ListPosterStack from "../components/ListPosterStack";
import { getPublicListFeed, type PublicList } from "../api/lists.api";
import { getPopularReviews, type RecentReview } from "../api/reviews.api";
import { searchMovies, type MovieCard } from "../api/search.api";
import { getPopularReviewers, getRecentWatched, type PopularReviewer, type RecentWatchedActivity } from "../api/social.api";
import { getPopularTags, type PopularTag } from "../api/tags.api";
import { getJournal, type JournalArticle } from "../api/journal.api";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, formatMovieYear, localizeJournalCategory, useLocale } from "../i18n";
import { getUserInitial, getUserName } from "../utils/userIdentity";
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

function MovieRow({ movies }: { movies: MovieCard[] }) {
  const { path, t } = useLocale();
  return <div className={styles.movieRow}>
    {movies.map(movie => {
      const movieTitle = editorialText(movie.title, t("untitledFilm"));
      return <article className={styles.movieCard} key={movie.id}>
        <Link to={path(`/films/${movie.id}`)} aria-label={movieTitle} title={movieTitle}>
          <ResilientImage src={movie.photoUrl} alt="" fallback={<div className={styles.posterFallback} aria-hidden="true"><span>{movieTitle.slice(0, 1).toUpperCase()}</span></div>} />
          <h3>{movieTitle}</h3>
        </Link>
        <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
      </article>;
    })}
  </div>;
}

export default function Home() {
  const { path, t, lang } = useLocale();
  const { isAuth, ready } = useAuth();
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

  return <main className={styles.page} aria-labelledby="home-title" aria-busy={allSectionsLoading}>
    <section className={`${styles.hero} ${isAuth ? styles.memberHero : ""}`}>
      {!isAuth && <p className={styles.eyebrow}>{t("homeEyebrow")}</p>}
      <h1 id="home-title">{t(isAuth ? "homeWelcomeTitle" : "homeTitle")}</h1>
      <p>{t(isAuth ? "homeWelcomeSubtitle" : "homeSubtitle")}</p>
      {ready && !isAuth && <div className={styles.actions}>
        <Link className={styles.primary} to={path("/films")}>{t("browseFilms")}</Link>
        <Link className={styles.secondary} to={path("/register")}>{t("joinRewind")}</Link>
      </div>}
    </section>

    {allSectionsLoading && <p className={styles.status} role="status">{t("loadingHome")}</p>}
    {Object.keys(sectionErrors).length > 0 && <p className={styles.status} role="alert">{t("loadHomeError")} <RetryButton label={t("retry")} onClick={() => setRetry(value => value + 1)} /></p>}
    <>
      <section className={`${styles.section} ${styles.leadingSection}`} aria-busy={sectionLoading.newest}>
        <div className={styles.sectionHeading}><h2>{t("newReleases")}</h2><Link to={path("/films")}>{t("viewAll")}</Link></div>
        {sectionLoading.newest ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.newest ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : newest.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={newest} />}
      </section>
      <section className={styles.section} aria-busy={sectionLoading.popular}>
        <div className={styles.sectionHeading}><h2>{t("popularThisWeek")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        {sectionLoading.popular ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.popular ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : popular.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={popular} />}
      </section>
      <section className={styles.section} aria-busy={sectionLoading.journal}>
        <div className={styles.sectionHeading}><h2>{t("latestJournal")}</h2><Link to={path("/journal")}>{t("viewAll")}</Link></div>
        {sectionLoading.journal ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.journal ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : journal.length === 0 ? <p>{t("noLatestJournal")}</p> : <div className={styles.stack}>{journal.map(article => {
          const title = editorialText(article.title, t("untitledArticle"));
          return <article className={styles.journalCard} key={article.id}>
            <Link className={styles.journalCoverLink} to={path(`/journal/${article.slug}`)} aria-label={title}>
              <ResilientImage className={styles.journalCover} src={article.coverUrl} alt="" loading="lazy" fallback={<span className={styles.journalCoverFallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
            </Link>
            <div className={styles.journalCopy}>
              <small>{localizeJournalCategory(article.category, t)}</small>
              <h3><Link to={path(`/journal/${article.slug}`)}>{title}</Link></h3>
              {article.excerpt && <p className={styles.preview}>{article.excerpt}</p>}
              <Link className={styles.journalReadMore} to={path(`/journal/${article.slug}`)} aria-label={`${t("readMore")}: ${title}`}>{t("readMore")}</Link>
            </div>
          </article>;
        })}</div>}
      </section>
      <section className={styles.grid}>
        <div className={`${styles.panel} ${styles.reviewsPanel}`} aria-busy={sectionLoading.reviews}>
          <div className={styles.sectionHeading}><h2>{t("homePopularReviews")}</h2><Link to={path("/reviews")}>{t("viewAll")}</Link></div>
          {sectionLoading.reviews ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviews ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : reviews.length === 0 ? <p>{t("noRecentReviews")}</p> : <div className={styles.stack}>{reviews.map(review => {
            const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
            return <article className={styles.reviewCard} key={review.id}>
                <Link className={styles.reviewPoster} to={path(`/films/${review.movieId}`)} aria-label={`${t("poster")} ${movieTitle}`}>
                  <ResilientImage src={review.moviePhotoUrl} alt="" fallback={<span aria-hidden="true">{movieTitle.slice(0, 1)}</span>} />
                </Link>
              <div className={styles.reviewBody}>
                <div className={styles.reviewHeading}>
                  <h3><Link to={path(`/films/${review.movieId}`)}>{movieTitle}</Link></h3>
                  {review.rating !== null && <span className={styles.reviewRating} aria-label={`${t("rating")}: ${review.rating}/5`}><span aria-hidden="true">★ </span>{review.rating}</span>}
                </div>
                <div className={styles.reviewIdentity}>
                  <Link to={path(`/users/${review.userId}`)}>
                    <ResilientImage className={styles.reviewAvatar} src={review.userAvatarUrl} alt="" fallback={<span className={styles.reviewAvatarFallback} aria-hidden="true">{getUserInitial({ username: review.username })}</span>} />
                    <span>{getUserName({ username: review.username }, t("someone"))}</span>
                  </Link>
                  <time dateTime={review.createdAt}>{formatDateTime(review.createdAt, lang)}</time>
                </div>
                <p className={styles.reviewText}><Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></p>
              </div>
            </article>;
          })}</div>}
        </div>
        <section className={`${styles.panel} ${styles.listsPanel}`} aria-labelledby="home-public-lists-heading" aria-busy={sectionLoading.lists}>
          <div className={styles.sectionHeading}><h2 id="home-public-lists-heading">{t("popularLists")}</h2><Link to={path("/lists/discover?feed=popular")}>{t("viewAll")}</Link></div>
          {sectionLoading.lists ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.lists ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : lists.length === 0 ? <p>{t("noPublicLists")}</p> : <div className={styles.listCards} role="group" aria-label={t("popularLists")} tabIndex={0}>{lists.map(list => {
            const listName = editorialText(list.name, t("lists"));
            return <article className={styles.listCard} key={list.id}>
              <Link className={styles.listPosterLink} to={path(`/lists/public/${list.id}`)} aria-label={listName}>
                <ListPosterStack movies={list.previewMovies ?? []} label={listName} fallbackTitle={t("untitledFilm")} layout="strip" />
              </Link>
              <h3><Link to={path(`/lists/public/${list.id}`)}>{listName}</Link></h3>
              {list.description && <p className={styles.preview}>{list.description}</p>}
              <small className={styles.listAuthor}>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>
                <span className={styles.reviewAvatarFallback} aria-hidden="true">{getUserInitial({ username: list.ownerUsername })}</span>
                <span>{getUserName({ username: list.ownerUsername }, t("someone"))}</span>
              </Link></small>
            </article>;
          })}</div>}
        </section>
        <div className={styles.panel} aria-busy={sectionLoading.reviewers}>
          <div className={styles.sectionHeading}><h2>{t("popularReviewers")}</h2></div>
          {sectionLoading.reviewers ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviewers ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : reviewers.length === 0 ? <p>{t("noPopularReviewers")}</p> : <div className={styles.stack}>{reviewers.map(reviewer => <article className={styles.list} key={reviewer.id}>
            <h3><Link to={path(`/users/${reviewer.id}`)}>{getUserName(reviewer, t("someone"))}</Link></h3>
            <small>{t("likes")}: {reviewer.likes}</small>
          </article>)}</div>}
        </div>
        <div className={styles.panel} aria-busy={sectionLoading.tags}>
          <div className={styles.sectionHeading}><h2>{t("popularTags")}</h2><Link to={path("/lists/discover")}>{t("viewAll")}</Link></div>
          {sectionLoading.tags ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.tags ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : tags.length === 0 ? <p>{t("noTags")}</p> : <p className={styles.tagCloud}>{tags.map(tag => <Link key={tag.id} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)}>#{tag.name}</Link>)}</p>}
        </div>
      </section>
      <section className={styles.section} aria-busy={sectionLoading.recentWatched}>
        <div className={styles.sectionHeading}><h2>{t("recentWatched")}</h2></div>
        {sectionLoading.recentWatched ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.recentWatched ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} onRetry={() => setRetry(value => value + 1)} /> : recentWatched.length === 0 ? <p>{t("noRecentWatched")}</p> : <div className={styles.stack}>{recentWatched.map(item => {
          if (!item.movie) return null;
          const movieTitle = editorialText(item.movie.title, t("untitledFilm"));
          return <article className={styles.review} key={item.id}>
            <p><Link to={path(`/films/${item.movie.id}`)}>{movieTitle}</Link></p>
            {item.actor && <small><Link to={path(`/users/${item.actor.id}`)}>{getUserName(item.actor, t("someone"))}</Link> {t("activityWatched")}</small>}
          </article>;
        })}</div>}
      </section>
    </>
  </main>;
}
