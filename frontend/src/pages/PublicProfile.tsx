import PinnedProfileList from "../components/PinnedProfileList";
import ProfileLoading from "../components/ProfileLoading";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { type PublicCollection } from "../api/profile.api";
import ResilientImage from "../components/ResilientImage";
import Pagination from "../components/Pagination";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import PublicProfilePoster from "../components/PublicProfilePoster";
import PublicProfileReviewCard from "../components/PublicProfileReviewCard";
import UserFollowRow from "../components/UserFollowRow";
import { FollowActionsProvider } from "../context/FollowActionsContext";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatDateTime, formatMovieCount, formatMovieYear, localizeActivityType, useLocale, type TranslationKey } from "../i18n";
import ListPosterStack from "../components/ListPosterStack";
import { toTagSlug } from "../utils/tagSlug";
import { safeHttpUrl } from "../utils/externalUrl";
import { getUserHandle, getUserName } from "../utils/userIdentity";
import { useRovingTabs } from "../hooks/useRovingTabs";
import { useActiveSection } from "../hooks/useActiveSection";
import styles from "./PublicProfile.module.css";
import { usePublicProfileIdentity } from "./public-profile/usePublicProfileIdentity";
import { usePublicProfileCollection } from "./public-profile/usePublicProfileCollection";
import { usePublicProfileNetwork } from "./public-profile/usePublicProfileNetwork";
import { usePublicRelationships } from "./public-profile/usePublicRelationships";
import { usePublicProfileContent } from "./public-profile/usePublicProfileContent";
import { publicCollectionKinds, publicProfileNavigation, publicProfileSectionIds, mobileCollectionNavigation } from "./public-profile/publicProfileNavigation";
import PublicProfileIdentity from "./public-profile/PublicProfileIdentity";
import PublicProfileStatistics from "./public-profile/PublicProfileStatistics";

const socialLinkLabelKeys: Record<string, TranslationKey> = {
  website: "socialWebsite",
  instagram: "socialInstagram",
  tiktok: "socialTiktok",
  letterboxd: "socialLetterboxd",
};

export default function PublicProfile() {
  const { id } = useParams();

  const location = useLocation();

  const navigate = useNavigate();

  const requestedView = new URLSearchParams(location.search).get("view");

  const profileView = requestedView === "collection" || requestedView === "lists" || requestedView === "following" || requestedView === "followers" ? requestedView : null;

  const networkView = profileView === "following" || profileView === "followers";

  const [collectionFiltersOpen, setCollectionFiltersOpen] = useState(false);

  const collectionFiltersButtonRef = useRef<HTMLButtonElement>(null);

  const requestedCollection = new URLSearchParams(location.search).get("collection");

  const collectionKind: PublicCollection = requestedCollection === "watchlist" || requestedCollection === "favorites" ? requestedCollection : "watched";

  const profileId = Number(id);

  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;

  const { path, t, lang } = useLocale();

  const { isAuth, user } = useAuth();

  const { profile, error, notFound, profileRetryAlertRef, retryProfile } = usePublicProfileIdentity(profileId);

  const {
    collection, collectionPage, collectionLoading, collectionError, collectionHeadingRef,
    setCollectionPage, changeCollectionPage, retryCollection,
  } = usePublicProfileCollection(profileId, profile, profileView, collectionKind);

  const network = usePublicProfileNetwork(profileId, profile, profileView);

  const {
    followers, followersPage, followersLoading, followersError, followersHeadingRef,
    following, followingPage, followingLoading, followingError, followingHeadingRef,
    networkFocusOrigin, setFollowersPage, setFollowingPage, retryNetworkList, retryFollowingPreview,
  } = network;

  const relationships = usePublicRelationships(profileId, profile, network.refreshNetworkLists);

  const { followStatusLoading, blockStatusLoading, followBusy, blockBusy } = relationships;

  const {
    favoritePreview, favoritePreviewLoading, favoritePreviewError, retryFavorites,
    activity, activityPage, activityLoading, activityError, setActivityPage, retryActivity,
    expandedActivity, expandedReviews, setExpandedActivity, setExpandedReviews,
    publicLists, publicListsLoading, publicListsError, publicListsPage, setPublicListsPage, retryPublicLists,
    currentPublicListTags, profileListTagsKey, profileListTagsExpanded, setExpandedProfileListTagsKey,
    likedReviews, likedReviewsPage, likedReviewsLoading, likedReviewsError, setLikedReviewsPage, retryLikedReviews,
  } = usePublicProfileContent(profileId, profile, profileView);

  const refreshNetwork = useCallback(() => {
    network.refreshNetwork();
    relationships.refreshFollowStatus();
  }, [network.refreshNetwork, relationships.refreshFollowStatus]);

  const [activeProfileSection, setActiveProfileSection] = useActiveSection(publicProfileSectionIds, "public-profile-overview", { enabled: profile !== null, rootMargin: "-76px 0px -55% 0px", scopeKey: `${profile?.id ?? "loading"}:${profileView ?? "overview"}:${location.hash}` });

  const publicRetryFocusScope = JSON.stringify([location.key, lang, profileId, profileView, isAuth, user?.id ?? null]);

  const pendingPublicRetryFocus = useRef<{ section: "favorites" | "activity" | "following-preview" | "public-lists" | "liked-reviews"; scope: string; origin: HTMLElement | null } | null>(null);

  useEffect(() => {
    if (pendingPublicRetryFocus.current?.scope !== publicRetryFocusScope) pendingPublicRetryFocus.current = null;
  }, [publicRetryFocusScope]);

  useEffect(() => {
    const pending = pendingPublicRetryFocus.current;
    if (!pending) return;
    const state = pending.section === "favorites" ? { loading: favoritePreviewLoading, error: favoritePreviewError } :
      pending.section === "activity" ? { loading: activityLoading, error: activityError } :
      pending.section === "following-preview" ? { loading: followingLoading, error: followingError } :
      pending.section === "public-lists" ? { loading: publicListsLoading, error: publicListsError } :
      { loading: likedReviewsLoading, error: likedReviewsError };
    if (state.loading) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingPublicRetryFocus.current !== pending) return;
      pendingPublicRetryFocus.current = null;
      if (pending.scope !== publicRetryFocusScope) return;
      const active = document.activeElement;
      if (active !== document.body && active !== pending.origin) return;
      const section = document.querySelector<HTMLElement>(`[data-retry-focus-section="${pending.section}"]`);
      if (state.error) section?.querySelector<HTMLButtonElement>("[data-retry-button]")?.focus();
      else section?.querySelector<HTMLElement>("h2")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activityError, activityLoading, favoritePreviewError, favoritePreviewLoading, followingError, followingLoading, likedReviewsError, likedReviewsLoading, publicListsError, publicListsLoading, publicRetryFocusScope]);

  const retryPublicSection = (section: NonNullable<typeof pendingPublicRetryFocus.current>["section"]) => {
    pendingPublicRetryFocus.current = { section, scope: publicRetryFocusScope, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null };
    if (section === "favorites") {
      retryFavorites();
    } else if (section === "activity") {
      retryActivity();
    } else if (section === "following-preview") {
      retryFollowingPreview();
    } else if (section === "public-lists") {
      retryPublicLists();
    } else {
      retryLikedReviews();
    }
  };

  const chooseCollection = (kind: PublicCollection) => {
    setCollectionPage(0);
    const search = new URLSearchParams(location.search);
    search.set("collection", kind);
    navigate({ search: `?${search}`, hash: "#public-profile-collections" }, { preventScrollReset: true });
  };

  const handleCollectionFiltersKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !collectionFiltersOpen) return;
    event.preventDefault();
    setCollectionFiltersOpen(false);
    requestAnimationFrame(() => collectionFiltersButtonRef.current?.focus());
  };

  const sectionTarget = (sectionId: string, kind: PublicCollection | null) => {
    const search = new URLSearchParams(location.search);
    if (kind !== null) {
      search.set("collection", kind);
      search.set("view", "collection");
    } else if (sectionId === "public-profile-lists") search.set("view", "lists");
    else if (sectionId === "public-profile-following") search.set("view", "following");
    else if (sectionId === "public-profile-followers") search.set("view", "followers");
    else search.delete("view");
    return { search: search.size ? `?${search}` : "", hash: `#${sectionId}` };
  };

  useEffect(() => { setCollectionFiltersOpen(false); }, [profileView, profileId]);

  const { setTabRef, handleKeyDown } = useRovingTabs(publicCollectionKinds, chooseCollection);

  useEffect(() => {
    if (!profile) return;
    const anchor = location.hash.slice(1);
    if (!publicProfileSectionIds.includes(anchor)) return;
    const frame = window.requestAnimationFrame(() => {
      const section = document.getElementById(anchor);
      // Collection arrows update the URL while keeping keyboard focus in the
      // tablist. Rail links and direct section URLs move to the heading.
      if (section?.contains(document.activeElement) && document.activeElement?.matches('[role="tab"]')) return;
      const heading = section?.matches("h2") ? section : section?.querySelector<HTMLElement>("h2");
      if (profileView && window.matchMedia(networkView ? "(max-width: 767px)" : "(max-width: 767px)").matches) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      else section?.scrollIntoView({ block: "start", behavior: "instant" });
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key, profile?.id, profileView]);

  const pageBusy = !profile || favoritePreviewLoading || collectionLoading || followersLoading || followingLoading || followStatusLoading || blockStatusLoading || activityLoading || publicListsLoading || likedReviewsLoading || followBusy || blockBusy;

  if (error) return <main className={styles.state} aria-labelledby="public-profile-state-title" aria-busy={false}><div className={styles.shell}><h1 id="public-profile-state-title" className="srOnly">{t("profile")}</h1><p className={styles.alert} ref={profileRetryAlertRef} tabIndex={-1} role="alert">{!validProfileId ? t("invalidProfileId") : notFound ? t("profileNotFound") : t("loadPublicProfileError")} {validProfileId && !notFound && <RetryButton label={t("retry")} onClick={() => { retryProfile(); }} />}</p></div></main>;

  if (!profile || profile.id !== profileId) return <main className={styles.state} aria-labelledby="public-profile-state-title" aria-busy={true}><div className={styles.shell}><h1 id="public-profile-state-title" className="srOnly">{t("profile")}</h1><ProfileLoading label={t("loading")} layout="identity" /></div></main>;

  const socialLinks = profile.socialLinks.flatMap(link => {
    const url = safeHttpUrl(link.url);
    if (!url) return [];
    const platform = editorialText(link.platform, t("socialLinks"));
    const normalizedPlatform = platform.toLowerCase();
    const labelKey = socialLinkLabelKeys[normalizedPlatform];
    return [{ platform: normalizedPlatform, url, label: labelKey ? t(labelKey) : platform }];
  });

  const favoritesSearch = new URLSearchParams(location.search);

  favoritesSearch.set("collection", "favorites");

  favoritesSearch.set("view", "collection");

  const collectionHeading = collectionKind === "watched" ? t("watched") : collectionKind === "watchlist" ? t("wantsToSee") : t("likedCollection");

  const viewTitle = networkView ? t(profileView === "following" ? "following" : "followers") : profileView === "lists" ? t("searchLists") : collectionKind === "watched" ? t("films") : collectionKind === "favorites" ? t("likes") : t("watchlist");

  return <FollowActionsProvider><main className={styles.page} data-profile-view={profileView ?? undefined} data-network-view={networkView || undefined} onFocusCapture={event => { const target = event.target; if (target instanceof HTMLElement && !target.closest('[role="dialog"]')) networkFocusOrigin.current = target.matches("[data-network-action]") ? target : null; }} aria-labelledby={profileView ? "public-profile-view-title public-profile-title" : "public-profile-title"} aria-busy={profileView === "collection" ? collectionLoading : profileView === "lists" ? publicListsLoading : networkView ? (profileView === "following" ? followingLoading : followersLoading) : pageBusy}>
    <div className={styles.shell}>
      {profileView && <div className={styles.collectionToolbar}>
        <Link to={sectionTarget("public-profile-overview", null)} aria-label={t("profile")}>←</Link>
        <h1 id="public-profile-view-title" tabIndex={-1}>{viewTitle}</h1>
        {profileView === "collection" ? <button ref={collectionFiltersButtonRef} type="button" aria-label={t("filters")} aria-expanded={collectionFiltersOpen} aria-controls="public-profile-collection-filters" onClick={() => setCollectionFiltersOpen(value => !value)} onKeyDown={handleCollectionFiltersKeyDown}><i className="fa-solid fa-sliders" aria-hidden="true" /></button> : <span />}
      </div>}
      <PublicProfileIdentity profile={profile} followingCount={following?.totalElements} followersCount={followers?.totalElements} relationships={relationships} sectionTarget={sectionTarget} />
    <nav className={styles.profileRail} aria-label={t("profile")}>
      {publicProfileNavigation.map(({ id: sectionId, label, collectionKind: kind }) => {
        const visibleSection = profileView === "collection" ? "public-profile-collections" : profileView === "lists" ? "public-profile-lists" : networkView ? "public-profile-overview" : activeProfileSection;
        const active = (visibleSection === sectionId || (sectionId === "public-profile-overview" && visibleSection === "public-profile-stats")) && (kind === null || collectionKind === kind);
        return <Link
          className={`${styles.profileRailLink} ${active ? styles.profileRailLinkActive : ""}`}
          key={label}
          to={sectionTarget(sectionId, kind)}
          aria-current={active ? "location" : undefined}
          onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (kind !== null) setCollectionPage(0);
            setActiveProfileSection(sectionId);
          }}
        >{t(label)}</Link>;
      })}
    </nav>
    {networkView && <Link className={styles.networkBack} to={sectionTarget("public-profile-overview", null)} aria-label={t("profile")}>←</Link>}
    {!profileView && profile.pinnedListId != null && <PinnedProfileList key={`${profile.id}:${profile.pinnedListId}`} ownerId={profile.id} listId={profile.pinnedListId} />}
    <section className={`${styles.section} ${styles.overviewSection}`} id="public-profile-overview" aria-labelledby="public-profile-favorites-title" aria-busy={favoritePreviewLoading} data-retry-focus-section="favorites">
      <h2 id="public-profile-favorites-title" tabIndex={-1}>{t("favoriteFilms")}</h2>
      {favoritePreviewLoading && <ProfileLoading label={t("loading")} layout="films" />}
      {favoritePreviewError && <RetryNotice className={styles.alert} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => retryPublicSection("favorites")} />}
      {!favoritePreviewLoading && !favoritePreviewError && favoritePreview && (favoritePreview.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul className={styles.previewGrid}>
        {favoritePreview.content.slice(0, 4).map(movie => {
          const title = editorialText(movie.title, t("untitledFilm"));
          return <li key={movie.id}><Link className={styles.previewPosterLink} to={path(`/films/${movie.id}`)} aria-label={title} title={title}>
            <ResilientImage className={styles.previewPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.previewPosterFallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>} />
          </Link></li>;
        })}
      </ul>)}
      {favoritePreview && favoritePreview.totalElements > 4 && <Link className={styles.overviewAction} to={{ search: `?${favoritesSearch}`, hash: "#public-profile-collections" }} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setCollectionPage(0); }}>{t("viewAll")}<span className="srOnly">: {t("favoriteFilms")}</span></Link>}
    </section>
    <section className={`${styles.section} ${styles.overviewSection} ${styles.activityOverview}`} aria-labelledby="public-profile-activity" aria-busy={activityLoading} data-retry-focus-section="activity">
      <h2 id="public-profile-activity" tabIndex={-1}>{t("recentActivity")}</h2>
      {activityLoading && <ProfileLoading label={t("loading")} layout="films" />}
      {activityError && <RetryNotice className={styles.alert} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => retryPublicSection("activity")} />}
      {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p>{t("noActivity")}</p> : <>
        <ul className={`${styles.previewGrid} ${styles.activityPreview}`} id="public-profile-activity-content">{(expandedActivity ? activity.content : activity.content.slice(0, 4)).map(item => {
          const movieTitle = item.movie ? editorialText(item.movie.title, t("untitledFilm")) : null;
          const relatedName = item.relatedUser ? getUserName(item.relatedUser, t("someone")) : null;
          const title = movieTitle ?? relatedName ?? (item.list ? editorialText(item.list.name, t("lists")) : localizeActivityType(item.type, t));
          return <li key={item.id}>
            {item.movie && movieTitle ? <PublicProfilePoster movieId={item.movie.id} title={movieTitle} /> : item.type === "FOLLOW" && item.relatedUser ? <Link className={styles.previewPosterLink} to={path(`/users/${item.relatedUser.id}`)} aria-label={title}><span className={styles.previewPosterFallback} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span></Link> : <div className={styles.activityPlaceholder} aria-hidden="true">{title.slice(0, 1).toUpperCase()}</div>}
            <p className={styles.activityCaption}><span>{localizeActivityType(item.type, t)}</span><strong>{title}</strong><time dateTime={item.createdAt}>{formatDateTime(item.createdAt, lang)}</time></p>
          </li>;
        })}</ul>
        {(expandedActivity || activity.content.length > 4 || activity.totalPages > 1) && <button className={styles.overviewAction} type="button" aria-expanded={expandedActivity} aria-controls="public-profile-activity-content" onClick={() => { if (expandedActivity) setActivityPage(0); setExpandedActivity(value => !value); }}>{expandedActivity ? t("close") : t("viewAll")}<span className="srOnly">: {t("recentActivity")}</span></button>}
        {expandedActivity && <Pagination className={styles.pagination} page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} busy={activityLoading} onPageChange={setActivityPage} />}
      </>)}
    </section>
    <section className={`${styles.section} ${styles.overviewSection}`} aria-labelledby="public-profile-reviews">
      <h2 id="public-profile-reviews">{t("recentReviews")}</h2>
      {profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <>
        <ul className={styles.reviewCards} id="public-profile-reviews-content">{(expandedReviews ? profile.recentReviews : profile.recentReviews.slice(0, 2)).map(review => <PublicProfileReviewCard key={review.id} review={review} profile={profile} />)}</ul>
        {profile.recentReviews.length > 2 && <button className={styles.overviewAction} type="button" aria-expanded={expandedReviews} aria-controls="public-profile-reviews-content" onClick={() => setExpandedReviews(value => !value)}>{expandedReviews ? t("close") : t("viewAll")}<span className="srOnly">: {t("recentReviews")}</span></button>}
      </>}
    </section>
    <section className={`${styles.section} ${styles.overviewSection}`} aria-labelledby="public-profile-following-preview-title" aria-busy={followingLoading} data-retry-focus-section="following-preview">
      <h2 id="public-profile-following-preview-title" tabIndex={-1}><Link to={sectionTarget("public-profile-following", null)}>{t("following")}</Link></h2>
      {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
      {followingError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryPublicSection("following-preview")} />}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <>
        <ul className={styles.followingRail}>{following.content.map(networkUser => {
          const name = getUserName(networkUser, t("someone"));
          return <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)} aria-label={`${name} ${getUserHandle(networkUser, t("someone"))}`} title={name}>
            <ResilientImage src={networkUser.avatarUrl} alt="" width={80} height={80} loading="lazy" fallback={<span className={styles.followingAvatarFallback} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>} />
          </Link></li>;
        })}</ul>
      </>)}
    </section>
    <section className={`${styles.section} ${styles.overviewSection} ${styles.listsOverview}`} id="public-profile-lists" aria-labelledby="public-profile-lists-title" aria-busy={publicListsLoading} data-retry-focus-section="public-lists">
      <h2 id="public-profile-lists-title" tabIndex={-1}>{profileView === "lists" ? t("publicLists") : <Link to={sectionTarget("public-profile-lists", null)}>{t("searchLists")}</Link>}</h2>
      {publicListsLoading && <ProfileLoading label={t("loading")} layout="lists" />}
      {publicListsError && <RetryNotice className={styles.alert} message={t("loadPublicListError")} retryLabel={t("retry")} onRetry={() => retryPublicSection("public-lists")} />}
      {!publicListsLoading && !publicListsError && publicLists && (publicLists.content.length === 0 ? <p>{t("noPublicLists")}</p> : <>
        <div className={styles.publicListGrid}>
          {(profileView === "lists" ? publicLists.content : publicLists.content.slice(0, 1)).map(list => {
            const listName = editorialText(list.name, t("lists"));
            return <article className={styles.publicListCard} key={list.id}>
              <div className={styles.publicListHeading}>
                <h3 className={styles.publicListTitle}><Link to={path(`/lists/public/${list.id}`)}>{listName}</Link></h3>
                {list.itemCount != null && <span className={styles.publicListCount}>{formatMovieCount(list.itemCount, lang)}</span>}
              </div>
              <Link className={styles.publicListPoster} to={path(`/lists/public/${list.id}`)} aria-label={listName}>
                <ListPosterStack movies={list.previewMovies ?? []} label={listName} fallbackTitle={t("untitledFilm")} layout="catalog" />
              </Link>
              <div className={styles.publicListBody}>
                {list.description && <p className={styles.publicListDescription}>{list.description}</p>}
                {profileView !== "lists" && list.tags.length > 0 && <div className={styles.publicListTags} role="group" aria-label={t("tags")}>
                  {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
                </div>}
              </div>
            </article>;
          })}
        </div>
        {profileView === "lists" && <Pagination className={styles.pagination} page={publicListsPage} totalPages={publicLists.totalPages} label={t("publicProfileListsPagination")} busy={publicListsLoading} onPageChange={setPublicListsPage} />}
        {profileView === "lists" && currentPublicListTags.length > 0 && <section className={styles.profileListTagCloud} aria-labelledby="public-profile-list-tags-title">
          <div className={styles.profileListTagHeading}>
            <h3 id="public-profile-list-tags-title">{t("profileListTags")}</h3>
            {currentPublicListTags.length > 3 && <button className={styles.profileListTagMore} type="button" aria-expanded={profileListTagsExpanded} aria-controls="public-profile-list-tags" onClick={() => setExpandedProfileListTagsKey(profileListTagsExpanded ? null : profileListTagsKey)}>{t(profileListTagsExpanded ? "lessTags" : "moreTags")}</button>}
          </div>
          <div className={styles.profileListTagChips} id="public-profile-list-tags">
            {(profileListTagsExpanded ? currentPublicListTags : currentPublicListTags.slice(0, 3)).map(tag => <Link className={styles.profileListTagChip} key={toTagSlug(tag)} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>{tag}</Link>)}
          </div>
        </section>}
      </>)}
    </section>
    <nav className={styles.mobileCollectionNavigation} aria-label={t("profileCollections")}>
      {mobileCollectionNavigation.map(({ id: sectionId, label, collectionKind: kind }) => {
        return <Link key={label} to={sectionTarget(sectionId, kind)} onClick={event => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && kind !== null) setCollectionPage(0);
        }}>{t(label)}<span aria-hidden="true">›</span></Link>;
      })}
    </nav>
    <PublicProfileStatistics profile={profile} />
    <section className={styles.section} aria-labelledby="public-profile-social-links"><h2 id="public-profile-social-links">{t("socialLinks")}</h2>{socialLinks.length === 0 ? <p>{t("noSocialLinks")}</p> : <ul className={styles.socialList}>{socialLinks.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>)}</ul>}</section>
    <section className={styles.section} id="public-profile-collections" aria-labelledby="public-profile-collections-title" aria-busy={collectionLoading}>
      <h2 id="public-profile-collections-title" ref={collectionHeadingRef} tabIndex={-1}>{profileView === "collection" ? collectionHeading : t("profileCollections")}</h2>
      <div className={styles.tabs} data-filters-open={collectionFiltersOpen} id="public-profile-collection-filters" role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")} onKeyDown={handleCollectionFiltersKeyDown}>
        {publicCollectionKinds.map(kind => <button
          className={collectionKind === kind ? styles.tabActive : undefined}
          id={`public-profile-collection-tab-${kind}`}
          key={kind}
          ref={setTabRef(kind)}
          type="button"
          role="tab"
          tabIndex={collectionKind === kind ? 0 : -1}
          aria-selected={collectionKind === kind}
          aria-controls="public-profile-collection-content"
          onClick={() => chooseCollection(kind)}
          onKeyDown={event => handleKeyDown(event, kind)}
        >{kind === "favorites" ? t("favorite") : t(kind)}</button>)}
      </div>
      <div id="public-profile-collection-content" role="tabpanel" tabIndex={0} aria-labelledby={`public-profile-collection-tab-${collectionKind}`}>
        {collectionLoading && <ProfileLoading label={t("loading")} layout="films" />}
        {collectionError && <RetryNotice className={styles.alert} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={retryCollection} />}
        {!collectionLoading && !collectionError && collection && <>
          {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <div className={styles.collectionGrid}>{collection.content.map(movie => {
            const movieTitle = editorialText(movie.title, t("untitledFilm"));
            return <article className={styles.collectionCard} key={movie.id}>
              <Link className={styles.collectionPosterLink} to={path(`/films/${movie.id}`)} aria-label={`${movieTitle} ${t("poster")}`}>
                <ResilientImage className={styles.collectionPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.collectionPosterFallback}>{movieTitle.slice(0, 1).toUpperCase()}</span>} />
              </Link>
              <h3><Link to={path(`/films/${movie.id}`)}>{movieTitle}</Link></h3>
              <p>{formatMovieYear(movie.releaseDate, t("unknownYear"))}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
            </article>;
          })}</div>}
          <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={changeCollectionPage} />
        </>}
      </div>
    </section>
    {(profileView === "following" || (!profileView && location.hash.startsWith("#public-profile-following"))) && <section className={`${styles.section} ${styles.networkSection}`} id="public-profile-following" aria-labelledby="public-profile-following-title" aria-busy={followingLoading}>
      <h2 id="public-profile-following-title" ref={followingHeadingRef} tabIndex={-1}>{t("following")}</h2>
      {followingLoading && <ProfileLoading label={t("loading")} layout="rows" />}
      {followingError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetworkList("following")} />}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <><ul className={styles.networkList}>{following.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" hideMobileNetworkStats onFollowSettled={refreshNetwork} />)}</ul><Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} /></>)}
    </section>}
    {(profileView === "followers" || (!profileView && location.hash.startsWith("#public-profile-followers"))) && <section className={`${styles.section} ${styles.networkSection}`} id="public-profile-followers" aria-labelledby="public-profile-followers-title" aria-busy={followersLoading}>
      <h2 id="public-profile-followers-title" ref={followersHeadingRef} tabIndex={-1}>{t("followers")}</h2>
      {followersLoading && <ProfileLoading label={t("loading")} layout="rows" />}
      {followersError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => retryNetworkList("followers")} />}
      {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <><ul className={styles.networkList}>{followers.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" hideMobileNetworkStats onFollowSettled={refreshNetwork} />)}</ul><Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} /></>)}
    </section>}
    <section className={styles.section} id="public-profile-liked-reviews" aria-labelledby="public-profile-liked-reviews-title" aria-busy={likedReviewsLoading} data-retry-focus-section="liked-reviews"><h2 id="public-profile-liked-reviews-title" tabIndex={-1}>{t("likedReviews")}</h2>
      {likedReviewsLoading && <ProfileLoading label={t("loading")} layout="reviews" />}
      {likedReviewsError && <RetryNotice className={styles.alert} message={t("loadLikedReviewsError")} retryLabel={t("retry")} onRetry={() => retryPublicSection("liked-reviews")} />}
      {!likedReviewsLoading && !likedReviewsError && likedReviews && (likedReviews.content.length === 0 ? <p>{t("noLikedReviews")}</p> : <>
        <ul className={styles.reviewList}>{likedReviews.content.map(review => {
          const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
          return <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: <Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></li>;
        })}</ul>
        <Pagination className={styles.pagination} page={likedReviewsPage} totalPages={likedReviews.totalPages} label={t("likedReviewsPagination")} busy={likedReviewsLoading} onPageChange={setLikedReviewsPage} />
      </>)}
    </section>
    </div>
  </main></FollowActionsProvider>;
}
