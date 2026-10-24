import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getPublicProfile, getPublicProfileCollection, getPublicProfileLikedReviews, getPublicProfileLists, type PublicCollection, type PublicProfileListPage, type PublicProfileResponse, type PublicProfileReviewPage } from "../api/profile.api";
import type { MoviePage } from "../api/search.api";
import { blockUser, follow, getBlockStatus, getFollowers, getFollowing, getFollowStatus, getUserActivity, type ActivityPage, type BlockStatus, type FollowStatus, type NetworkPage, unblockUser, unfollow } from "../api/social.api";
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
import { isPageOutOfRange, getLastPageIndex } from "../utils/pagination";
import { getUserHandle, getUserName } from "../utils/userIdentity";
import { useRovingTabs } from "../hooks/useRovingTabs";
import { useActiveSection } from "../hooks/useActiveSection";
import styles from "./PublicProfile.module.css";

const publicCollectionKinds = ["watched", "watchlist", "favorites"] as const;
const socialLinkLabelKeys: Record<string, TranslationKey> = {
  website: "socialWebsite",
  instagram: "socialInstagram",
  tiktok: "socialTiktok",
  letterboxd: "socialLetterboxd",
};
const publicProfileNavigation = [
  { id: "public-profile-overview", label: "profile", collectionKind: null },
  { id: "public-profile-collections", label: "films", collectionKind: "watched" },
  { id: "public-profile-collections", label: "watchlist", collectionKind: "watchlist" },
  { id: "public-profile-collections", label: "likes", collectionKind: "favorites" },
  { id: "public-profile-lists", label: "searchLists", collectionKind: null },
] as const satisfies readonly { id: string; label: TranslationKey; collectionKind: PublicCollection | null }[];
const publicProfileSectionIds = ["public-profile-overview", "public-profile-stats", "public-profile-collections", "public-profile-liked-reviews", "public-profile-lists", "public-profile-following", "public-profile-followers"];
const mobileCollectionNavigation = [
  ...publicProfileNavigation.slice(1),
  { id: "public-profile-following", label: "following", collectionKind: null },
  { id: "public-profile-followers", label: "followers", collectionKind: null },
] as const;

export default function PublicProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedView = new URLSearchParams(location.search).get("view");
  const profileView = requestedView === "collection" || requestedView === "lists" || requestedView === "following" || requestedView === "followers" ? requestedView : null;
  const networkView = profileView === "following" || profileView === "followers";
  const [collectionFiltersOpen, setCollectionFiltersOpen] = useState(false);
  const requestedCollection = new URLSearchParams(location.search).get("collection");
  const collectionKind: PublicCollection = requestedCollection === "watchlist" || requestedCollection === "favorites" ? requestedCollection : "watched";
  const profileId = Number(id);
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;
  const { path, t, lang } = useLocale();
  const { isAuth, user } = useAuth();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useActiveSection(publicProfileSectionIds, "public-profile-overview", { enabled: profile !== null, rootMargin: "-76px 0px -55% 0px", scopeKey: `${profile?.id ?? "loading"}:${profileView ?? "overview"}:${location.hash}` });
  const [error, setError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [collection, setCollection] = useState<MoviePage | null>(null);
  const [collectionPage, setCollectionPage] = useState(0);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState(false);
  const [collectionAttempt, setCollectionAttempt] = useState(0);
  const [favoritePreview, setFavoritePreview] = useState<MoviePage | null>(null);
  const [favoritePreviewLoading, setFavoritePreviewLoading] = useState(false);
  const [favoritePreviewError, setFavoritePreviewError] = useState(false);
  const [favoritePreviewAttempt, setFavoritePreviewAttempt] = useState(0);
  const [expandedActivity, setExpandedActivity] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState(false);
  const [followers, setFollowers] = useState<NetworkPage | null>(null);
  const [following, setFollowing] = useState<NetworkPage | null>(null);
  const [followersPage, setFollowersPage] = useState(0);
  const [followingPage, setFollowingPage] = useState(0);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersError, setFollowersError] = useState(false);
  const [followersAttempt, setFollowersAttempt] = useState(0);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState(false);
  const [followingAttempt, setFollowingAttempt] = useState(0);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [followStatusLoading, setFollowStatusLoading] = useState(false);
  const [followStatusError, setFollowStatusError] = useState(false);
  const [followStatusAttempt, setFollowStatusAttempt] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
  const [blockStatusLoading, setBlockStatusLoading] = useState(false);
  const [blockStatusError, setBlockStatusError] = useState(false);
  const [blockStatusAttempt, setBlockStatusAttempt] = useState(0);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockError, setBlockError] = useState(false);
  const [activity, setActivity] = useState<ActivityPage | null>(null);
  const [activityPage, setActivityPage] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState(false);
  const [activityAttempt, setActivityAttempt] = useState(0);
  const [publicLists, setPublicLists] = useState<PublicProfileListPage | null>(null);
  const [publicListsLoading, setPublicListsLoading] = useState(false);
  const [publicListsError, setPublicListsError] = useState(false);
  const [publicListsPage, setPublicListsPage] = useState(0);
  const [publicListsAttempt, setPublicListsAttempt] = useState(0);
  const [likedReviews, setLikedReviews] = useState<PublicProfileReviewPage | null>(null);
  const [likedReviewsPage, setLikedReviewsPage] = useState(0);
  const [likedReviewsLoading, setLikedReviewsLoading] = useState(false);
  const [likedReviewsError, setLikedReviewsError] = useState(false);
  const [likedReviewsAttempt, setLikedReviewsAttempt] = useState(0);
  const currentProfileId = useRef(profileId);
  const currentActorId = useRef<number | null>(null);
  const relationshipMutation = useRef(0);
  currentProfileId.current = profileId;
  currentActorId.current = isAuth ? user?.id ?? null : null;

  useEffect(() => {
    let current = true;
    setProfile(null);
    setError(false);
    if (!validProfileId) {
      setError(true);
      return;
    }
    getPublicProfile(profileId)
      .then(({ data }) => { if (current) setProfile(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [lang, profileAttempt, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setFavoritePreview(null);
    setFavoritePreviewLoading(true);
    setFavoritePreviewError(false);
    getPublicProfileCollection(profileId, "favorites", 0)
      .then(({ data }) => { if (current) setFavoritePreview(data); })
      .catch(() => { if (current) setFavoritePreviewError(true); })
      .finally(() => { if (current) setFavoritePreviewLoading(false); });
    return () => { current = false; };
  }, [favoritePreviewAttempt, lang, profileId, validProfileId]);

  useEffect(() => {
    setExpandedActivity(false);
    setExpandedReviews(false);
    setActivityPage(0);
    setFollowersPage(0);
    setFollowingPage(0);
    setPublicListsPage(0);
    setLikedReviewsPage(0);
  }, [profileId, isAuth, user?.id]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setActivityLoading(true);
    setActivity(null);
    setActivityError(false);
    getUserActivity(profileId, activityPage).then(({ data }) => {
      if (!current) return;
      if (isPageOutOfRange(activityPage, data.totalPages)) {
        setActivityPage(getLastPageIndex(data.totalPages));
        return;
      }
      setActivity(data);
    })
      .catch(() => { if (current) setActivityError(true); })
      .finally(() => { if (current) setActivityLoading(false); });
    return () => { current = false; };
  }, [activityAttempt, activityPage, lang, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setCollectionLoading(true);
    setCollection(null);
    setCollectionError(false);
    getPublicProfileCollection(profileId, collectionKind, collectionPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(collectionPage, data.totalPages)) {
          setCollectionPage(getLastPageIndex(data.totalPages));
          return;
        }
        setCollection(data);
      })
      .catch(() => { if (current) setCollectionError(true); })
      .finally(() => { if (current) setCollectionLoading(false); });
    return () => { current = false; };
  }, [collectionAttempt, collectionKind, collectionPage, lang, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setFollowersLoading(true);
    setFollowers(null);
    setFollowersError(false);
    getFollowers(profileId, followersPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(followersPage, data.totalPages)) {
          setFollowersPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowers(data);
      })
      .catch(() => { if (current) setFollowersError(true); })
      .finally(() => { if (current) setFollowersLoading(false); });
    return () => { current = false; };
  }, [followersAttempt, followersPage, lang, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setFollowingLoading(true);
    setFollowing(null);
    setFollowingError(false);
    getFollowing(profileId, followingPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(followingPage, data.totalPages)) {
          setFollowingPage(getLastPageIndex(data.totalPages));
          return;
        }
        setFollowing(data);
      })
      .catch(() => { if (current) setFollowingError(true); })
      .finally(() => { if (current) setFollowingLoading(false); });
    return () => { current = false; };
  }, [followingAttempt, followingPage, lang, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setPublicListsLoading(true);
    setPublicLists(null);
    setPublicListsError(false);
    getPublicProfileLists(profileId, publicListsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(publicListsPage, data.totalPages)) {
          setPublicListsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setPublicLists(data);
      })
      .catch(() => { if (current) setPublicListsError(true); })
      .finally(() => { if (current) setPublicListsLoading(false); });
    return () => { current = false; };
  }, [lang, profileId, publicListsAttempt, publicListsPage, validProfileId]);

  useEffect(() => {
    if (!validProfileId) return;
    let current = true;
    setLikedReviewsLoading(true);
    setLikedReviews(null);
    setLikedReviewsError(false);
    getPublicProfileLikedReviews(profileId, likedReviewsPage)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(likedReviewsPage, data.totalPages)) {
          setLikedReviewsPage(getLastPageIndex(data.totalPages));
          return;
        }
        setLikedReviews(data);
      })
      .catch(() => { if (current) setLikedReviewsError(true); })
      .finally(() => { if (current) setLikedReviewsLoading(false); });
    return () => { current = false; };
  }, [lang, likedReviewsAttempt, likedReviewsPage, profileId, validProfileId]);

  useEffect(() => {
    if (!validProfileId || !isAuth || user?.id === profileId) {
      setFollowStatus(null);
      setFollowStatusLoading(false);
      setFollowStatusError(false);
      setBlockStatus(null);
      return;
    }
    let current = true;
    setFollowStatus(null);
    setFollowStatusLoading(true);
    setFollowStatusError(false);
    getFollowStatus(profileId).then(({ data }) => { if (current) setFollowStatus(data); })
      .catch(() => { if (current) { setFollowStatus(null); setFollowStatusError(true); } })
      .finally(() => { if (current) setFollowStatusLoading(false); });
    return () => { current = false; };
  }, [followStatusAttempt, isAuth, profileId, user?.id, validProfileId]);

  useEffect(() => {
    if (!validProfileId || !isAuth || user?.id === profileId) {
      setBlockStatus(null);
      setBlockStatusLoading(false);
      setBlockStatusError(false);
      return;
    }
    let current = true;
    setBlockStatus(null);
    setBlockStatusLoading(true);
    setBlockStatusError(false);
    getBlockStatus(profileId).then(({ data }) => { if (current) setBlockStatus(data); })
      .catch(() => { if (current) { setBlockStatus(null); setBlockStatusError(true); } })
      .finally(() => { if (current) setBlockStatusLoading(false); });
    return () => { current = false; };
  }, [blockStatusAttempt, isAuth, profileId, user?.id, validProfileId]);

  const chooseCollection = (kind: PublicCollection) => {
    setCollectionPage(0);
    const search = new URLSearchParams(location.search);
    search.set("collection", kind);
    navigate({ search: `?${search}`, hash: "#public-profile-collections" }, { preventScrollReset: true });
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

  useEffect(() => {
    if (profileView !== "lists") setPublicListsPage(0);
    if (profileView !== "following" && !location.hash.startsWith("#public-profile-following")) setFollowingPage(0);
  }, [profileView, profileId, location.hash]);

  const refreshNetwork = useCallback(() => {
    setFollowersAttempt(value => value + 1);
    setFollowingAttempt(value => value + 1);
    setFollowStatusAttempt(value => value + 1);
  }, []);

  const { setTabRef, handleKeyDown } = useRovingTabs(publicCollectionKinds, chooseCollection);

  useEffect(() => { setCollectionPage(0); }, [collectionKind, profileId]);

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
      if (profileView && window.matchMedia(networkView ? "(max-width: 720px)" : "(max-width: 620px)").matches) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      else section?.scrollIntoView({ block: "start", behavior: "instant" });
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.key, profile?.id, profileView]);

  useEffect(() => {
    relationshipMutation.current += 1;
    setFollowBusy(false);
    setBlockBusy(false);
    setFollowError(false);
    setBlockError(false);
  }, [profileId, isAuth, user?.id]);

  const changeFollow = async () => {
    if (!isAuth || !user?.id || !validProfileId || !followStatus || blockStatus?.blocked || followBusy || blockBusy) return;
    const requestId = ++relationshipMutation.current;
    const requestActorId = user.id;
    setFollowBusy(true);
    setFollowError(false);
    setFollowStatusError(false);
    const nextFollowing = !followStatus.following;
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId && currentActorId.current === requestActorId;
    try {
      if (followStatus.following) await unfollow(profileId); else await follow(profileId);
      if (!isCurrentRequest()) return;
      setFollowStatus(status => status ? { ...status, following: nextFollowing } : status);
      setFollowersAttempt(value => value + 1);
      setFollowingAttempt(value => value + 1);
      try {
        const { data: status } = await getFollowStatus(profileId);
        if (!isCurrentRequest()) return;
        setFollowStatus(status);
        setFollowStatusError(false);
      } catch {
        if (isCurrentRequest()) setFollowStatusError(true);
      }
    } catch {
      if (isCurrentRequest()) setFollowError(true);
    } finally {
      if (isCurrentRequest()) setFollowBusy(false);
    }
  };

  const changeBlock = async () => {
    if (!isAuth || !user?.id || !validProfileId || !blockStatus || blockBusy || followBusy) return;
    const requestId = ++relationshipMutation.current;
    const requestActorId = user.id;
    setBlockBusy(true);
    setBlockError(false);
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId && currentActorId.current === requestActorId;
    try {
      const { data } = blockStatus.blocked ? await unblockUser(profileId) : await blockUser(profileId);
      if (!isCurrentRequest()) return;
      setBlockStatus(data);
      if (data.blocked) setFollowStatus(status => status ? { ...status, following: false } : status);
      setFollowersAttempt(value => value + 1);
      setFollowingAttempt(value => value + 1);
    } catch {
      if (isCurrentRequest()) setBlockError(true);
    } finally {
      if (isCurrentRequest()) setBlockBusy(false);
    }
  };

  const pageBusy = !profile || favoritePreviewLoading || collectionLoading || followersLoading || followingLoading || followStatusLoading || blockStatusLoading || activityLoading || publicListsLoading || likedReviewsLoading || followBusy || blockBusy;

  if (error) return <main className={styles.state} aria-labelledby="public-profile-state-title" aria-busy={false}><div className={styles.shell}><h1 id="public-profile-state-title" className="srOnly">{t("profile")}</h1><p className={styles.alert} role="alert">{!validProfileId ? t("invalidProfileId") : t("loadPublicProfileError")} {validProfileId && <RetryButton label={t("retry")} onClick={() => setProfileAttempt(value => value + 1)} />}</p></div></main>;
  if (!profile) return <main className={styles.state} aria-labelledby="public-profile-state-title" aria-busy={true}><div className={styles.shell}><h1 id="public-profile-state-title" className="srOnly">{t("profile")}</h1><p className={styles.loading} role="status">{t("loading")}</p></div></main>;
  const identityName = getUserName(profile, t("someone"));
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
  const viewTitle = networkView ? t(profileView === "following" ? "following" : "followers") : profileView === "lists" ? t("searchLists") : collectionKind === "watched" ? t("films") : collectionKind === "favorites" ? t("likes") : t("watchlist");
  return <FollowActionsProvider><main className={styles.page} data-profile-view={profileView ?? undefined} data-network-view={networkView || undefined} aria-labelledby={profileView ? "public-profile-view-title public-profile-title" : "public-profile-title"} aria-busy={profileView === "collection" ? collectionLoading : profileView === "lists" ? publicListsLoading : networkView ? (profileView === "following" ? followingLoading : followersLoading) : pageBusy}>
    <div className={styles.shell}>
      {profileView && <div className={styles.collectionToolbar}>
        <Link to={sectionTarget("public-profile-overview", null)} aria-label={t("profile")}>←</Link>
        <h1 id="public-profile-view-title">{viewTitle}</h1>
        {profileView === "collection" ? <button type="button" aria-label={t("filters")} aria-expanded={collectionFiltersOpen} aria-controls="public-profile-collection-filters" onClick={() => setCollectionFiltersOpen(value => !value)}><i className="fa-solid fa-sliders" aria-hidden="true" /></button> : <span />}
      </div>}
      <section className={styles.hero} aria-labelledby="public-profile-title">
        <div className={styles.mobileToolbar}>
          <Link className={styles.mobileBack} to={path("/community")} aria-label={t("community")}>←</Link>
          <span>{t("profile")}</span>
          <Link className={styles.mobileSearch} to={path("/search")} aria-label={t("search")}>⌕</Link>
        </div>
        <div className={styles.identity}>
          <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={112} height={112} fallback={<div className={styles.avatarFallback} aria-hidden="true">{identityName.slice(0, 1).toUpperCase()}</div>} />
          <div className={styles.identityCopy}>
            <p className={styles.eyebrow}>{t("profile")}</p>
            <h1 id="public-profile-title">{identityName}{profile.hq && <span className={styles.hq} aria-label={t("hq")} title={t("hq")}>{t("hq")}</span>}</h1>
            <p className={styles.username}>{getUserHandle(profile, t("someone"))}</p>
          </div>
        </div>
        <dl className={styles.heroMetrics}>
          <div><dt>{t("watched")}</dt><dd>{profile.stats.watched}</dd></div>
          <div><dt>{t("following")}</dt><dd><Link to={sectionTarget("public-profile-following", null)} aria-label={t("following")}>{following?.totalElements ?? "—"}</Link></dd></div>
          <div><dt>{t("followers")}</dt><dd><Link to={sectionTarget("public-profile-followers", null)} aria-label={t("followers")}>{followers?.totalElements ?? "—"}</Link></dd></div>
        </dl>
        {isAuth && user?.id !== profile.id && (followStatus || blockStatus) && <div className={styles.profileActions}>
          {followStatus && !blockStatus?.blocked && <button className={styles.primaryButton} type="button" aria-busy={followBusy} disabled={followBusy || blockBusy} onClick={() => void changeFollow()}>{followBusy ? t("loading") : followStatus.following ? t("unfollow") : t("follow")}</button>}
          {blockStatus && <button className={styles.secondaryButton} type="button" aria-busy={blockBusy} disabled={blockBusy || followBusy} onClick={() => void changeBlock()}>{blockBusy ? t("loading") : blockStatus.blocked ? t("unblockUser") : t("blockProfileUser")}</button>}
          {!blockStatus?.blocked && <Link className={styles.messageLink} to={path(`/messages?user=${profile.id}`)}>{t("sendMessage")}</Link>}
        </div>}
      </section>
      {isAuth && user?.id !== profile.id && (followStatusLoading || blockStatusLoading) && <p className={styles.actionStatus} role="status">{t("loading")}</p>}
      {followStatusError && <RetryNotice className={styles.alert} message={t("loadFollowStatusError")} retryLabel={t("retry")} onRetry={() => setFollowStatusAttempt(value => value + 1)} />}
      {blockStatusError && <RetryNotice className={styles.alert} message={t("loadBlockStatusError")} retryLabel={t("retry")} onRetry={() => setBlockStatusAttempt(value => value + 1)} />}
      {followError && <RetryNotice className={styles.alert} message={t("followError")} retryLabel={t("retry")} disabled={followBusy || blockBusy} busy={followBusy} onRetry={() => void changeFollow()} />}
      {blockError && <RetryNotice className={styles.alert} message={t("blockError")} retryLabel={t("retry")} disabled={blockBusy || followBusy} busy={blockBusy} onRetry={() => void changeBlock()} />}
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
    <section className={`${styles.section} ${styles.overviewSection}`} id="public-profile-overview" aria-labelledby="public-profile-favorites-title" aria-busy={favoritePreviewLoading}>
      <h2 id="public-profile-favorites-title">{t("favoriteFilms")}</h2>
      {favoritePreviewLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {favoritePreviewError && <RetryNotice className={styles.alert} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setFavoritePreviewAttempt(value => value + 1)} />}
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
    <section className={`${styles.section} ${styles.overviewSection} ${styles.activityOverview}`} aria-labelledby="public-profile-activity" aria-busy={activityLoading}>
      <h2 id="public-profile-activity">{t("recentActivity")}</h2>
      {activityLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {activityError && <RetryNotice className={styles.alert} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => setActivityAttempt(value => value + 1)} />}
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
    <section className={`${styles.section} ${styles.overviewSection}`} aria-labelledby="public-profile-following-preview-title" aria-busy={followingLoading}>
      <h2 id="public-profile-following-preview-title"><Link to={sectionTarget("public-profile-following", null)}>{t("following")}</Link></h2>
      {followingLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {followingError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <>
        <ul className={styles.followingRail}>{following.content.map(networkUser => {
          const name = getUserName(networkUser, t("someone"));
          return <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)} aria-label={`${name} ${getUserHandle(networkUser, t("someone"))}`} title={name}>
            <ResilientImage src={networkUser.avatarUrl} alt="" width={80} height={80} loading="lazy" fallback={<span className={styles.followingAvatarFallback} aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>} />
          </Link></li>;
        })}</ul>
      </>)}
    </section>
    <section className={`${styles.section} ${styles.overviewSection} ${styles.listsOverview}`} id="public-profile-lists" aria-labelledby="public-profile-lists-title" aria-busy={publicListsLoading}>
      <h2 id="public-profile-lists-title">{profileView === "lists" ? t("publicLists") : <Link to={sectionTarget("public-profile-lists", null)}>{t("searchLists")}</Link>}</h2>
      {publicListsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {publicListsError && <RetryNotice className={styles.alert} message={t("loadPublicListError")} retryLabel={t("retry")} onRetry={() => setPublicListsAttempt(value => value + 1)} />}
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
                {list.tags.length > 0 && <div className={styles.publicListTags} role="group" aria-label={t("tags")}>
                  {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
                </div>}
              </div>
            </article>;
          })}
        </div>
        {profileView === "lists" && <Pagination className={styles.pagination} page={publicListsPage} totalPages={publicLists.totalPages} label={t("publicProfileListsPagination")} busy={publicListsLoading} onPageChange={setPublicListsPage} />}
      </>)}
    </section>
    <nav className={styles.mobileCollectionNavigation} aria-label={t("profileCollections")}>
      {mobileCollectionNavigation.map(({ id: sectionId, label, collectionKind: kind }) => {
        return <Link key={label} to={sectionTarget(sectionId, kind)} onClick={event => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && kind !== null) setCollectionPage(0);
        }}>{t(label)}<span aria-hidden="true">›</span></Link>;
      })}
    </nav>
    <section className={styles.section} id="public-profile-stats" aria-labelledby="public-profile-stats-title"><h2 id="public-profile-stats-title">{t("profileStats")}</h2><div className={styles.stats}>
      <article className={styles.stat}><strong>{profile.stats.watched}</strong><span>{t("watched")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.watchlist}</strong><span>{t("watchlist")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.favorites}</strong><span>{t("favorite")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.reviews}</strong><span>{t("reviews")}</span></article>
      <article className={styles.stat}><strong>{profile.stats.ratings}</strong><span>{t("ratings")}</span></article>
    </div>
      <div className={styles.distribution}><h3>{t("ratingDistribution")}</h3>
      {profile.ratingDistribution.length === 0 ? <p>{t("noRatingDistribution")}</p> : <ul aria-label={t("ratingDistribution")}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = profile.ratingDistribution.find(item => item.rating === rating)?.count ?? 0;
          const max = Math.max(...profile.ratingDistribution.map(item => item.count), 1);
          return <li key={rating}><span>{rating}/5</span><span className={styles.bar} aria-hidden="true"><span style={{ "--bar-width": `${Math.round((count / max) * 100)}%` } as CSSProperties} /></span><strong>{count}</strong></li>;
        })}
      </ul>}
      </div>
    </section>
    <section className={styles.section} aria-labelledby="public-profile-social-links"><h2 id="public-profile-social-links">{t("socialLinks")}</h2>{socialLinks.length === 0 ? <p>{t("noSocialLinks")}</p> : <ul className={styles.socialList}>{socialLinks.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}</a></li>)}</ul>}</section>
    <section className={styles.section} id="public-profile-collections" aria-labelledby="public-profile-collections-title" aria-busy={collectionLoading}>
      <h2 id="public-profile-collections-title">{t("profileCollections")}</h2>
      <div className={styles.tabs} data-filters-open={collectionFiltersOpen} id="public-profile-collection-filters" role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")}>
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
        {collectionLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
        {collectionError && <RetryNotice className={styles.alert} message={t("loadCollectionError")} retryLabel={t("retry")} onRetry={() => setCollectionAttempt(value => value + 1)} />}
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
          <Pagination className={styles.pagination} page={collectionPage} totalPages={collection.totalPages} label={t("profileCollectionPagination")} busy={collectionLoading} onPageChange={setCollectionPage} />
        </>}
      </div>
    </section>
    {(profileView === "following" || (!profileView && location.hash.startsWith("#public-profile-following"))) && <section className={`${styles.section} ${styles.networkSection}`} id="public-profile-following" aria-labelledby="public-profile-following-title" aria-busy={followingLoading}>
      <h2 id="public-profile-following-title">{t("following")}</h2>
      {followingLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {followingError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <><ul className={styles.networkList}>{following.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}</ul><Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} /></>)}
    </section>}
    {(profileView === "followers" || (!profileView && location.hash.startsWith("#public-profile-followers"))) && <section className={`${styles.section} ${styles.networkSection}`} id="public-profile-followers" aria-labelledby="public-profile-followers-title" aria-busy={followersLoading}>
      <h2 id="public-profile-followers-title">{t("followers")}</h2>
      {followersLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {followersError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowersAttempt(value => value + 1)} />}
      {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <><ul className={styles.networkList}>{followers.content.map(networkUser => <UserFollowRow key={networkUser.id} user={networkUser} href={path(`/users/${networkUser.id}`)} presentation="profileNetwork" onFollowSettled={refreshNetwork} />)}</ul><Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} /></>)}
    </section>}
    <section className={styles.section} id="public-profile-liked-reviews" aria-labelledby="public-profile-liked-reviews-title" aria-busy={likedReviewsLoading}><h2 id="public-profile-liked-reviews-title">{t("likedReviews")}</h2>
      {likedReviewsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {likedReviewsError && <RetryNotice className={styles.alert} message={t("loadLikedReviewsError")} retryLabel={t("retry")} onRetry={() => setLikedReviewsAttempt(value => value + 1)} />}
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
