import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getPublicListFeed, type PublicList } from "../api/lists.api";
import { getPopularTags, type PopularTag } from "../api/tags.api";
import ListPosterStack from "../components/ListPosterStack";
import Pagination from "../components/Pagination";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatMovieCount, useLocale } from "../i18n";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { toTagSlug } from "../utils/tagSlug";
import { getUserInitial, getUserName } from "../utils/userIdentity";
import styles from "./PublicLists.module.css";

type Feed = "recent" | "popular" | "recently-liked" | "team";
type LandingFeed = "featured" | "popular" | "recentlyLiked" | "recent";

const landingFeedRequests: { key: LandingFeed; feed: Feed }[] = [
  { key: "featured", feed: "team" },
  { key: "popular", feed: "popular" },
  { key: "recentlyLiked", feed: "recently-liked" },
  { key: "recent", feed: "recent" },
];

const createLandingLists = (): Record<LandingFeed, PublicList[]> => ({
  featured: [],
  popular: [],
  recentlyLiked: [],
  recent: [],
});

const createLandingErrors = (): Record<LandingFeed, boolean> => ({
  featured: false,
  popular: false,
  recentlyLiked: false,
  recent: false,
});

const createLandingLoading = (value = false): Record<LandingFeed, boolean> => ({
  featured: value,
  popular: value,
  recentlyLiked: value,
  recent: value,
});

const createLandingRequestIds = (): Record<LandingFeed, number> => ({
  featured: 0,
  popular: 0,
  recentlyLiked: 0,
  recent: 0,
});

export default function PublicLists() {
  const { path, t, lang } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTag = searchParams.get("tag") ?? "";
  const tag = rawTag ? toTagSlug(rawTag) : "";
  const filterLabel = rawTag.trim() || tag;
  const feedParam = searchParams.get("feed");
  const feed: Feed = !tag && (feedParam === "popular" || feedParam === "recently-liked" || feedParam === "team") ? feedParam : "recent";
  const isLanding = !feedParam && !tag;
  const isTagged = Boolean(tag);
  const isFeedView = !isLanding && !isTagged;
  const isCompactFeed = feed === "popular" || feed === "recently-liked";
  const pageSize = feed === "popular" ? 4 : 12;
  const [lists, setLists] = useState<PublicList[]>([]);
  const [tags, setTags] = useState<PopularTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState(false);
  const [tagsAttempt, setTagsAttempt] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [landingLists, setLandingLists] = useState<Record<LandingFeed, PublicList[]>>(createLandingLists);
  const [landingErrors, setLandingErrors] = useState<Record<LandingFeed, boolean>>(createLandingErrors);
  const [landingLoading, setLandingLoading] = useState<Record<LandingFeed, boolean>>(createLandingLoading);
  const landingActive = useRef(false);
  const landingRequestIds = useRef<Record<LandingFeed, number>>(createLandingRequestIds());

  useEffect(() => {
    if (!tag || !feedParam || feedParam === "recent") return;
    const normalized = new URLSearchParams(searchParams);
    normalized.set("feed", "recent");
    navigate({ search: `?${normalized.toString()}`, hash: location.hash }, { replace: true, state: location.state });
  }, [tag, feedParam, searchParams, navigate, location.hash, location.state]);

  const loadLandingFeed = useCallback((key: LandingFeed) => {
    const request = landingFeedRequests.find(item => item.key === key);
    if (!request) return;

    const requestId = landingRequestIds.current[key] + 1;
    landingRequestIds.current[key] = requestId;
    setLandingLoading(value => ({ ...value, [key]: true }));
    setLandingErrors(value => ({ ...value, [key]: false }));

    getPublicListFeed(request.feed, 0, undefined, 6)
      .then(({ data }) => {
        if (!landingActive.current || landingRequestIds.current[key] !== requestId) return;
        setLandingLists(value => ({ ...value, [key]: data.content }));
      })
      .catch(() => {
        if (!landingActive.current || landingRequestIds.current[key] !== requestId) return;
        setLandingErrors(value => ({ ...value, [key]: true }));
      })
      .finally(() => {
        if (!landingActive.current || landingRequestIds.current[key] !== requestId) return;
        setLandingLoading(value => ({ ...value, [key]: false }));
      });
  }, []);

  useEffect(() => {
    setPage(0);
  }, [tag, feed]);

  useEffect(() => {
    if (isLanding) {
      setLoading(false);
      setError(false);
      setLists([]);
      setTotalPages(0);
      return;
    }
    let current = true;
    setLoading(true);
    setError(false);
    setLists([]);
    setTotalPages(0);
    getPublicListFeed(feed, page, tag, pageSize)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(page, data.totalPages)) {
          setPage(getLastPageIndex(data.totalPages));
          return;
        }
        setLists(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        if (!current) return;
        setError(true);
        setTotalPages(0);
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [isLanding, tag, feed, lang, page, pageSize, attempt]);

  useEffect(() => {
    if (!isLanding) {
      landingActive.current = false;
      setLandingLoading(createLandingLoading());
      return;
    }

    landingActive.current = true;
    setLandingLists(createLandingLists());
    setLandingErrors(createLandingErrors());
    setLandingLoading(createLandingLoading());
    landingFeedRequests.forEach(({ key }) => loadLandingFeed(key));
    return () => { landingActive.current = false; };
  }, [isLanding, lang, loadLandingFeed]);

  useEffect(() => {
    let current = true;
    setTagsLoading(true);
    setTagsError(false);
    setTags([]);
    getPopularTags()
      .then(({ data }) => { if (current) setTags(data); })
      .catch(() => { if (current) setTagsError(true); })
      .finally(() => { if (current) setTagsLoading(false); });
    return () => { current = false; };
  }, [lang, tagsAttempt]);

  const feedLinks: { value: Feed; label: string }[] = [
    { value: "recent", label: t("listFeedRecent") },
    { value: "popular", label: t("listFeedPopular") },
    { value: "recently-liked", label: t("listFeedRecentlyLiked") },
    { value: "team", label: t("listFeedTeam") },
  ];

  const landingSections: { key: LandingFeed; feed: Feed; label: string }[] = [
    { key: "featured", feed: "team", label: t("featuredLists") },
    { key: "popular", feed: "popular", label: t("popularThisWeek") },
    { key: "recentlyLiked", feed: "recently-liked", label: t("listFeedRecentlyLiked") },
    { key: "recent", feed: "recent", label: t("listFeedRecent") },
  ];

  const feedHeroTitle = feed === "team"
    ? t("featuredLists")
    : feed === "popular"
      ? t("popularListsTitle")
      : feed === "recently-liked"
        ? t("recentlyLikedListsTitle")
        : t("recentListsTitle");
  const feedHeroIntro = feed === "team"
    ? t("featuredListsIntro")
    : feed === "popular"
      ? t("popularListsIntro")
      : feed === "recently-liked"
        ? t("recentlyLikedListsIntro")
        : t("recentListsIntro");
  const feedSectionHeading = feed === "team"
    ? t("listFeedTeamSection")
    : feed === "popular"
      ? t("popularListsTitle")
      : feed === "recently-liked"
        ? t("recentlyLikedListsTitle")
        : t("recentListsTitle");

  const renderListCard = (list: PublicList, variant: "feed" | "rail" | "liked" | "tagged") => {
    const listName = editorialText(list.name, t("lists"));
    const compact = variant === "feed" && isCompactFeed;
    const tagged = variant === "tagged";
    const landing = variant === "rail" || variant === "liked";
    const popularFeedCard = variant === "feed" && feed === "popular";
    const cardClass = tagged ? styles.taggedCard : landing ? `${styles.card} ${styles.railCard}${variant === "liked" ? ` ${styles.likedCard}` : ""}` : compact ? `${styles.featuredCard}${popularFeedCard ? ` ${styles.popularFeedCard}` : ""}` : `${styles.card}${popularFeedCard ? ` ${styles.popularFeedCard}` : ""}`;
    const posterClass = tagged ? styles.taggedPosterLink : landing ? `${styles.posterLink} ${styles.railPosterLink}` : compact ? styles.featuredPosterLink : styles.posterLink;
    return <article className={cardClass} key={list.id}>
      <Link className={posterClass} to={path(`/lists/public/${list.id}`)} aria-label={listName}>
        <ListPosterStack movies={list.previewMovies ?? []} label={listName} fallbackTitle={t("untitledFilm")} size={compact ? "featured" : "compact"} layout={landing || compact ? "catalog" : "fan"} />
      </Link>
      <div className={styles.cardBody}>
        <h2><Link to={path(`/lists/public/${list.id}`)}>{listName}</Link>{tagged && list.itemCount != null && <span className={styles.taggedCount}>{formatMovieCount(list.itemCount, lang)}</span>}{popularFeedCard && list.itemCount != null && <span className={styles.feedCount}>{formatMovieCount(list.itemCount, lang)}</span>}{variant === "liked" && list.itemCount != null && <span className={styles.landingCount}>{formatMovieCount(list.itemCount, lang)}</span>}</h2>
        {list.description && <p className={styles.description}>{list.description}</p>}
        {list.tags.length > 0 && <div className={styles.cardTags}>{list.tags.slice(0, 3).map(name => <Link key={name} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(name))}`)}>#{name}</Link>)}</div>}
        <p className={styles.meta}><span className={landing ? styles.catalogMetric : undefined}>{list.itemCount != null && <>{formatMovieCount(list.itemCount, lang)} · </>}</span>{t("byUser")} <Link to={path(`/users/${list.ownerId}`)}>{landing && <span className={styles.catalogAvatar} aria-hidden="true">{getUserInitial({ username: list.ownerUsername })}</span>}{getUserName({ username: list.ownerUsername }, t("someone"))}</Link><span className={landing ? styles.catalogMetric : undefined}>{list.likeCount != null && <> · {list.likeCount} {t("likes").toLocaleLowerCase(lang)}</>}</span></p>
      </div>
    </article>;
  };

  const tagsSection = <section className={styles.tagsSection} aria-labelledby="popular-tags-heading" aria-busy={tagsLoading}>
    <div className={styles.sectionHeading}>
      <h2 id="popular-tags-heading">{t("popularTags")}</h2>
      <Link to={path("/lists/discover?feed=recent")}>{t("viewAll")}</Link>
    </div>
    {tagsLoading && <p className={styles.muted} role="status">{t("loading")}</p>}
    {tagsError && <RetryNotice className={styles.alert} message={t("loadTagsError")} retryLabel={t("retry")} onRetry={() => setTagsAttempt(value => value + 1)} />}
    {!tagsLoading && !tagsError && tags.length === 0 && <p className={styles.muted}>{t("noTags")}</p>}
    {!tagsLoading && !tagsError && tags.length > 0 && <div className={styles.tagRail}>
      {tags.map(item => <Link className={tag === item.slug ? styles.selectedTag : undefined} aria-current={tag === item.slug ? "page" : undefined} key={item.id} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(item.slug)}`)}>#{item.name}</Link>)}
    </div>}
  </section>;

  const anyLandingLoading = Object.values(landingLoading).some(Boolean);

  return <main className={`${styles.page} ${isLanding ? styles.landingPage : ""} ${isTagged ? styles.taggedPage : ""} ${isFeedView ? styles.feedPage : ""} ${feed === "team" ? styles.teamFeed : ""}`} aria-labelledby={isTagged ? "lists-grid-heading" : "public-lists-title"} aria-busy={loading || tagsLoading || anyLandingLoading}>
    <div className={styles.shell}>
      <section className={`${styles.hero} ${isLanding ? styles.landingHero : ""} ${isTagged ? styles.taggedHero : ""} ${isFeedView ? styles.feedHero : ""}`}>
        {isTagged ? <>
          <h1 id="public-lists-title" className={styles.visuallyHidden}>{t("discoverLists")}</h1>
          <div className={styles.taggedToolbar}>
            <Link className={styles.taggedBack} to={path("/lists/discover?feed=recent")} aria-label={t("discoverLists")}>←</Link>
            <Link className={styles.taggedSearch} to={path("/search")} aria-label={t("globalSearch")}><span>{t("globalSearchPlaceholder")}</span><span aria-hidden="true">⌕</span></Link>
            <Link className={styles.taggedFilter} to={path("/lists/discover?feed=recent")} aria-label={t("filters")}>☷</Link>
          </div>
        </> : isFeedView ? <>
          <div className={styles.feedToolbar}>
            <Link className={styles.feedBack} to={path("/lists/discover")} aria-label={t("discoverLists")}>←</Link>
            <span className={styles.feedToolbarTitle}>{feedHeroTitle}</span>
            <Link className={styles.feedFilter} to={path("/lists/discover?feed=recent")} aria-label={t("filters")}>☷</Link>
          </div>
          <div className={styles.feedHeroCopy}>
            <p className={styles.eyebrow}>{t("collectionsEyebrow")}</p>
            <h1 id="public-lists-title">{feedHeroTitle}</h1>
            <p>{feedHeroIntro}</p>
          </div>
        </> : <>
          <p className={styles.eyebrow}>{t("collectionsEyebrow")}</p>
          <h1 id="public-lists-title">{t("discoverLists")}</h1>
          <p className={styles.landingIntro}>{t("listsLandingIntro")}</p>
          <div className={styles.heroActions}>
            <Link className={styles.heroAction} to={path("/lists")}>{t("startOwnLists")}</Link>
            <Link className={styles.heroSecondaryAction} to={path("/films")}>{t("films")}</Link>
          </div>
        </>}
      </section>

      {!isLanding && <nav className={styles.feedNav} aria-label={t("listFeeds")}>
        {feedLinks.map(item => <Link
          key={item.value}
          className={feed === item.value ? styles.activeFeed : undefined}
          aria-current={feed === item.value ? "page" : undefined}
          to={path(`/lists/discover?feed=${item.value}`)}
        >{item.label}</Link>)}
      </nav>}

      {!isLanding && !isTagged && !isFeedView && tagsSection}

      {isLanding ? <section className={styles.landingSections} aria-label={t("listFeeds")}>
        {landingSections.map(section => {
          const sectionLoading = landingLoading[section.key];
          return (
            <section className={`${styles.landingSection}${section.key === "recentlyLiked" ? ` ${styles.likedLandingSection}` : ""}`} key={section.key} aria-labelledby={`landing-${section.key}-heading`} aria-busy={sectionLoading}>
              <div className={styles.sectionHeading}>
                <h2 id={`landing-${section.key}-heading`}>{section.label}</h2>
                <Link to={path(`/lists/discover?feed=${section.feed}`)}>{t("viewAll")}</Link>
              </div>
              {sectionLoading && <div className={styles.landingRail} aria-label={t("loading")} role="status">
                {Array.from({ length: 2 }, (_, index) => <div className={`${styles.skeleton} ${styles.railSkeleton}`} key={index} />)}
              </div>}
              {landingErrors[section.key] && <RetryNotice className={styles.alert} message={t("loadPublicListError")} retryLabel={t("retry")} disabled={sectionLoading} onRetry={() => loadLandingFeed(section.key)} />}
              {!sectionLoading && !landingErrors[section.key] && landingLists[section.key].length === 0 && <p className={styles.muted}>{t("noPublicLists")}</p>}
              {!sectionLoading && !landingErrors[section.key] && landingLists[section.key].length > 0 && <div className={styles.landingRail}>
                {landingLists[section.key].map(list => renderListCard(list, section.key === "recentlyLiked" ? "liked" : "rail"))}
              </div>}
            </section>
          );
        })}
      </section> : <>
        <section aria-labelledby="lists-grid-heading" aria-busy={loading}>
          <div className={styles.sectionHeading}>
            <h2 id="lists-grid-heading">{isTagged ? t("listsTaggedHeading") : feedSectionHeading}</h2>
            {feed === "popular" && <span className={styles.popularSortLabel}><span>{t("sortByPopularity")}</span><span aria-hidden="true">⌄</span></span>}
            {tag && <span className={styles.filter}>#{filterLabel}</span>}
          </div>

          {loading && <div className={isTagged ? styles.taggedGrid : isCompactFeed ? styles.featuredGrid : styles.grid} aria-label={t("loading")} role="status">
            {Array.from({ length: pageSize }, (_, index) => <div className={`${styles.skeleton} ${isCompactFeed ? styles.featuredSkeleton : ""}`} key={index} />)}
          </div>}
          {error && <RetryNotice className={styles.alert} message={t("loadPublicListError")} retryLabel={t("retry")} busy={loading} onRetry={() => setAttempt(value => value + 1)} />}
          {!loading && !error && lists.length === 0 && <div className={styles.empty}><p>{tag && feed === "recent" ? t("noTaggedLists") : t("noPublicLists")}</p></div>}
          {!loading && !error && lists.length > 0 && <div className={isTagged ? styles.taggedGrid : isCompactFeed ? styles.featuredGrid : styles.grid}>
            {lists.map(list => renderListCard(list, isTagged ? "tagged" : "feed"))}
          </div>}
        </section>

        <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("publicListsPagination")} busy={loading} onPageChange={setPage} />
        {isFeedView && tagsSection}
      </>}

      {isLanding && tagsSection}
    </div>
  </main>;
}
