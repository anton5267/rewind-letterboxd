import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { editorialText, formatDateTime, formatMovieCount, formatMovieYear, formatReviewCount, localizeJournalCategory, useLocale } from "../i18n";
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
  const { isAuth, ready, user } = useAuth();
  const location = useLocation();
  const guestTitle = t("homeTitle");
  const guestTitleSentences = guestTitle.match(/[^.!?]+[.!?]+/g) ?? [guestTitle];
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
  const [loadingAttempt, setLoadingAttempt] = useState(-1);
  const retryFocus = useRef<{ origin: HTMLElement; section: HomeSection | null; targetId: string; scope: string } | null>(null);
  const focusScope = `${location.key}:${lang}:${ready}:${isAuth ? user?.id : "guest"}`;
  const currentFocusScope = useRef(focusScope);
  currentFocusScope.current = focusScope;

  useEffect(() => {
    retryFocus.current = null;
    const clearMovedFocus = (event: FocusEvent) => {
      const pending = retryFocus.current;
      if (pending && event.target instanceof HTMLElement && event.target !== pending.origin && event.target !== document.body) {
        retryFocus.current = null;
      }
    };
    document.addEventListener("focusin", clearMovedFocus);
    return () => {
      retryFocus.current = null;
      document.removeEventListener("focusin", clearMovedFocus);
    };
  }, [focusScope]);

  const retrySection = (section: HomeSection | null, targetId = "home-title") => {
    const origin = document.activeElement;
    retryFocus.current = origin instanceof HTMLElement ? { origin, section, targetId, scope: focusScope } : null;
    setRetry(value => value + 1);
  };

  useEffect(() => {
    const pending = retryFocus.current;
    if (!pending || loadingAttempt !== retry || (pending.section ? sectionLoading[pending.section] : Object.values(sectionLoading).some(Boolean))) return;
    const frame = requestAnimationFrame(() => {
      if (retryFocus.current !== pending || currentFocusScope.current !== pending.scope) return;
      retryFocus.current = null;
      if (pending.origin.isConnected || (document.activeElement !== document.body && document.activeElement !== null)) return;
      const container = document.getElementById(pending.section ? pending.targetId : Object.keys(sectionErrors).length ? "home-retry-summary" : "home-title");
      const heading = pending.section ? container?.querySelector<HTMLElement>("h2") : null;
      const target = heading?.getClientRects().length ? heading : container;
      if (target?.getClientRects().length) target.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [loadingAttempt, retry, sectionLoading, sectionErrors, focusScope]);

  useEffect(() => {
    let current = true;
    setLoadingAttempt(retry);
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
    runSection("reviews", getPopularReviews(0, 4), data => setReviews(data.content));
    runSection("lists", getPublicListFeed("popular", 0, undefined, 3), data => setLists(data.content));
    runSection("reviewers", getPopularReviewers(), data => setReviewers(data));
    runSection("tags", getPopularTags(12), data => setTags(data));
    runSection("recentWatched", getRecentWatched(), data => setRecentWatched(data.content));
    runSection("journal", getJournal(lang), data => setJournal(data.content.slice(0, 3)));
    return () => { current = false; };
  }, [lang, retry]);

  const journalSection = <section id="home-journal" tabIndex={-1} className={`${styles.section} ${styles.journalSection}`} aria-busy={sectionLoading.journal}>
    <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t(isAuth ? "homeLatestNews" : "homeRecentNews")}</h2><Link to={path("/journal")}>{t(isAuth ? "viewAll" : "homeMore")}</Link></div>
    {sectionLoading.journal ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.journal ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("journal", "home-journal")} /> : journal.length === 0 ? <p className={styles.journalEmptyStatus}>{t("noLatestJournal")}</p> : <div className={styles.stack}>{journal.map(article => {
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
  </section>;

  const allSectionsLoading = Object.values(sectionLoading).some(Boolean);

  return <main className={styles.page} aria-labelledby="home-title" aria-busy={allSectionsLoading}>
    <section className={`${styles.hero} ${isAuth ? styles.memberHero : ""} ${!isAuth && lang === "uk" ? styles.guestHeroUk : ""}`}>
      {!isAuth && <p className={styles.eyebrow}>{t("homeEyebrow")}</p>}
      <h1 id="home-title" tabIndex={-1} aria-label={isAuth ? t("homeWelcomeTitle") : guestTitle}>{isAuth ? t("homeWelcomeTitle") : guestTitleSentences.map(sentence => <span className={styles.heroTitleSentence} key={sentence}>{sentence}</span>)}</h1>
      <p>{t(isAuth ? "homeWelcomeSubtitle" : "homeSubtitle")}</p>
      {ready && !isAuth && <div className={styles.actions}>
        <Link className={styles.primary} to={path("/register")}>{t("getStarted")}</Link>
        <Link className={styles.secondary} to={path("/register")}>{t("joinRewind")}</Link>
      </div>}
    </section>

    {allSectionsLoading && <p className={styles.status} role="status">{t("loadingHome")}</p>}
    {Object.keys(sectionErrors).length > 0 && <p id="home-retry-summary" className={styles.status} role="alert" tabIndex={-1}>{t("loadHomeError")} <RetryButton label={t("retry")} onClick={() => retrySection(null)} /></p>}
    <>
      <section id="home-newest" tabIndex={-1} className={`${styles.section} ${styles.leadingSection}`} aria-busy={sectionLoading.newest}>
        <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t(isAuth ? "homeNewOnRewind" : "homeGuestReleases")}</h2><Link to={path("/films")}>{t(isAuth ? "homeYourActivity" : "viewAll")}</Link></div>
        {sectionLoading.newest ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.newest ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("newest", "home-newest")} /> : newest.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={newest} />}
      </section>
      {!isAuth && <section className={styles.guestExplainer} aria-label={t("homeGuestExplainerTitle")}>
        <h2>{t("homeGuestExplainerHeading")}</h2>
        <div className={styles.guestExplainerCard}>
          <svg aria-hidden="true" viewBox="0 0 32 24" focusable="false"><path d="M2 12s5-9 14-9 14 9 14 9-5 9-14 9S2 12 2 12Z"/><circle cx="16" cy="12" r="4"/></svg>
          <p>{t("homeGuestExplainerText")}</p>
        </div>
        <ul className={styles.guestFeatureGrid}>
          {(["homeGuestFeatureTrack", "homeGuestFeatureLike", "homeGuestFeatureShare", "homeGuestFeatureRate", "homeGuestFeatureDiary", "homeGuestFeatureLists"] as const).map(key => <li key={key}>{t(key)}</li>)}
        </ul>
      </section>}
      {!isAuth && <section id="home-guest-reviews" tabIndex={-1} className={styles.guestRecentReviews} aria-busy={sectionLoading.reviews}>
        <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("homeJustReviewed")}</h2><Link to={path("/reviews")}>{t("homeMore")}</Link></div>
        {sectionLoading.reviews ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviews ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("reviews", "home-guest-reviews")} /> : reviews.length === 0 ? <p>{t("noRecentReviews")}</p> : <div className={styles.guestReviewPosters} role="group" aria-label={t("homeJustReviewed")}>{reviews.slice(0, 4).map(review => {
          const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
          return <Link key={review.id} to={path(`/reviews/${review.id}`)} aria-label={`${movieTitle} — ${t("homeJustReviewed")}`}>
            <ResilientImage src={review.moviePhotoUrl} alt="" loading="lazy" fallback={<span aria-hidden="true">{movieTitle.slice(0, 1)}</span>} />
          </Link>;
        })}</div>}
      </section>}
      {!isAuth && <div className={styles.guestPitch}>
        <p className={styles.guestPitchMobile}>{t("homeGuestPitchLead")} {t("homeGuestPitchPrompt")} <Link to={path("/register")}>{t("getStarted")}</Link></p>
        <div className={styles.guestPitchDesktop}>
          <p>{t("homeGuestPitchLead")}</p>
          <p>{t("homeGuestPitchPrompt")} <Link to={path("/register")}>{t("getStarted")}</Link></p>
        </div>
      </div>}
      <section id="home-popular" tabIndex={-1} className={`${styles.section} ${styles.popularSection}`} aria-busy={sectionLoading.popular}>
        <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t(isAuth ? "homePopularOnRewind" : "popularThisWeek")}</h2><Link to={path("/films?sort=rating_desc")}>{t("viewAll")}</Link></div>
        {sectionLoading.popular ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.popular ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("popular", "home-popular")} /> : popular.length === 0 ? <p>{t("noFilms")}</p> : <MovieRow movies={popular} />}
      </section>
      {isAuth && journalSection}
      <section className={styles.grid}>
        <div id="home-reviews" tabIndex={-1} className={`${styles.panel} ${styles.reviewsPanel}`} aria-busy={sectionLoading.reviews}>
          <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("homePopularReviewsThisWeek")}</h2><Link to={path("/reviews")}>{t(isAuth ? "viewAll" : "homeMore")}</Link></div>
          {sectionLoading.reviews ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviews ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("reviews", "home-reviews")} /> : reviews.length === 0 ? <p>{t("noRecentReviews")}</p> : <div className={styles.stack}>{reviews.map(review => {
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
        <section id="home-lists" tabIndex={-1} className={`${styles.panel} ${styles.listsPanel}`} aria-labelledby="home-public-lists-heading" aria-busy={sectionLoading.lists}>
          <div className={styles.sectionHeading}><h2 id="home-public-lists-heading" tabIndex={-1}>{t("homePopularLists")}</h2><Link to={path("/lists/discover?feed=popular")}>{t(isAuth ? "viewAll" : "homeMore")}</Link></div>
          {sectionLoading.lists ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.lists ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("lists", "home-lists")} /> : lists.length === 0 ? <p>{t("noPublicLists")}</p> : <div className={styles.listCards} role="group" aria-label={t("popularLists")} tabIndex={0}>{lists.map(list => {
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
        <div id="home-reviewers" tabIndex={-1} className={styles.panel} aria-busy={sectionLoading.reviewers}>
          <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("popularReviewers")}</h2>{!isAuth && <Link to={path("/community/reviewers")}>{t("homeMore")}</Link>}</div>
          {sectionLoading.reviewers ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.reviewers ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("reviewers", "home-reviewers")} /> : reviewers.length === 0 ? <p>{t("noPopularReviewers")}</p> : <div className={styles.stack}>{reviewers.slice(0, isAuth ? reviewers.length : 3).map(reviewer => <article className={styles.list} key={reviewer.id}>
            <Link className={styles.homeReviewer} to={path(`/users/${reviewer.id}`)}>
              <ResilientImage className={styles.homeReviewerAvatar} src={reviewer.avatarUrl} alt="" fallback={<span className={styles.homeReviewerFallback} aria-hidden="true">{getUserInitial(reviewer)}</span>} />
              <span className={styles.homeReviewerCopy}><strong>{getUserName(reviewer, t("someone"))}</strong><small>{reviewer.watchedCount !== undefined && formatMovieCount(reviewer.watchedCount, lang)}{reviewer.reviewCount !== undefined && `, ${formatReviewCount(reviewer.reviewCount, lang)}`}</small></span>
            </Link>
            <small className={styles.homeReviewerLikes}>{t("likes")}: {reviewer.likes}</small>
          </article>)}</div>}
        </div>
        <div id="home-tags" tabIndex={-1} className={styles.panel} aria-busy={sectionLoading.tags}>
          <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("popularTags")}</h2><Link to={path("/lists/discover")}>{t("viewAll")}</Link></div>
          {sectionLoading.tags ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.tags ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("tags", "home-tags")} /> : tags.length === 0 ? <p>{t("noTags")}</p> : <p className={styles.tagCloud}>{tags.map(tag => <Link key={tag.id} to={path(`/lists/discover?tag=${encodeURIComponent(tag.slug)}`)}>#{tag.name}</Link>)}</p>}
        </div>
      </section>
      {!isAuth && journalSection}
      {isAuth && <section id="home-recent-news" tabIndex={-1} className={`${styles.section} ${styles.memberRecentNewsSection}`} aria-busy={sectionLoading.journal}>
        <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("homeRecentNews")}</h2><Link to={path("/journal")}>{t("homeMore")}</Link></div>
        {sectionLoading.journal ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.journal ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("journal", "home-recent-news")} /> : journal.length === 0 ? <p className={styles.memberRecentNewsEmpty}>{t("noLatestJournal")}</p> : <div className={styles.memberRecentNewsGrid}>
          {journal.slice(0, 3).map(article => {
            const title = editorialText(article.title, t("untitledArticle"));
            return <article className={styles.memberRecentNewsCard} key={article.id}>
              <Link className={styles.memberRecentNewsCover} to={path(`/journal/${article.slug}`)} aria-label={title}>
                <ResilientImage src={article.coverUrl} alt="" loading="lazy" fallback={<span aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <div className={styles.memberRecentNewsCopy}>
                <h3><Link to={path(`/journal/${article.slug}`)}>{title}</Link></h3>
                {article.excerpt && <p>{article.excerpt}</p>}
              </div>
            </article>;
          })}
        </div>}
      </section>}
      <section id="home-recent-watched" tabIndex={-1} className={`${styles.section} ${styles.recentWatchedSection}`} aria-busy={sectionLoading.recentWatched}>
        <div className={styles.sectionHeading}><h2 tabIndex={-1}>{t("recentWatched")}</h2></div>
        {sectionLoading.recentWatched ? <p className={styles.sectionStatus} role="status">{t("loadingHome")}</p> : sectionErrors.recentWatched ? <RetryNotice className={styles.sectionStatus} message={t("loadHomeError")} retryLabel={t("retry")} role={null} onRetry={() => retrySection("recentWatched", "home-recent-watched")} /> : recentWatched.length === 0 ? <p>{t("noRecentWatched")}</p> : <div className={styles.stack}>{recentWatched.map(item => {
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
