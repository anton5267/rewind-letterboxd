import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicProfile, getPublicProfileCollection, getPublicProfileLikedReviews, getPublicProfileLists, type PublicCollection, type PublicProfileListPage, type PublicProfileResponse, type PublicProfileReviewPage } from "../api/profile.api";
import type { MoviePage } from "../api/search.api";
import { blockUser, follow, getBlockStatus, getFollowers, getFollowing, getFollowStatus, getUserActivity, type ActivityPage, type BlockStatus, type FollowStatus, type NetworkPage, unblockUser, unfollow } from "../api/social.api";
import ResilientImage from "../components/ResilientImage";
import Pagination from "../components/Pagination";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { useAuth } from "../context/AuthContext";
import { editorialText, formatMovieCount, formatMovieYear, localizeActivityType, useLocale, type TranslationKey } from "../i18n";
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
  { id: "public-profile-stats", label: "profile" },
  { id: "public-profile-collections", label: "watched" },
  { id: "public-profile-liked-reviews", label: "likes" },
  { id: "public-profile-lists", label: "lists" },
] as const satisfies readonly { id: string; label: TranslationKey }[];
const publicProfileSectionIds = publicProfileNavigation.map(({ id }) => id);

export default function PublicProfile() {
  const { id } = useParams();
  const profileId = Number(id);
  const validProfileId = Number.isSafeInteger(profileId) && profileId > 0;
  const { path, t, lang } = useLocale();
  const { isAuth, user } = useAuth();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [activeProfileSection, setActiveProfileSection] = useActiveSection(publicProfileSectionIds, "public-profile-stats", { enabled: profile !== null, rootMargin: "-76px 0px -55% 0px", scopeKey: profile?.id });
  const [error, setError] = useState(false);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [collectionKind, setCollectionKind] = useState<PublicCollection>("watched");
  const [collection, setCollection] = useState<MoviePage | null>(null);
  const [collectionPage, setCollectionPage] = useState(0);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState(false);
  const [collectionAttempt, setCollectionAttempt] = useState(0);
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
  const relationshipMutation = useRef(0);
  currentProfileId.current = profileId;

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
    setCollectionKind(kind);
    setCollectionPage(0);
  };

  const { setTabRef, handleKeyDown } = useRovingTabs(publicCollectionKinds, chooseCollection);

  useEffect(() => {
    relationshipMutation.current += 1;
    setFollowBusy(false);
    setBlockBusy(false);
    setFollowError(false);
    setBlockError(false);
  }, [profileId]);

  const changeFollow = async () => {
    if (!validProfileId || !followStatus || blockStatus?.blocked || followBusy || blockBusy) return;
    const requestId = ++relationshipMutation.current;
    setFollowBusy(true);
    setFollowError(false);
    setFollowStatusError(false);
    const nextFollowing = !followStatus.following;
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId;
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
    if (!validProfileId || !blockStatus || blockBusy || followBusy) return;
    const requestId = ++relationshipMutation.current;
    setBlockBusy(true);
    setBlockError(false);
    const isCurrentRequest = () => relationshipMutation.current === requestId && currentProfileId.current === profileId;
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

  const pageBusy = !profile || collectionLoading || followersLoading || followingLoading || followStatusLoading || blockStatusLoading || activityLoading || publicListsLoading || likedReviewsLoading || followBusy || blockBusy;

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
  return <main className={styles.page} aria-labelledby="public-profile-title" aria-busy={pageBusy}>
    <div className={styles.shell}>
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
      {publicProfileNavigation.map(({ id: sectionId, label }) => <a
        className={`${styles.profileRailLink} ${activeProfileSection === sectionId ? styles.profileRailLinkActive : ""}`}
        key={sectionId}
        href={`#${sectionId}`}
        aria-current={activeProfileSection === sectionId ? "location" : undefined}
        onClick={() => setActiveProfileSection(sectionId)}
      >{t(label)}</a>)}
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
      <div className={styles.tabs} role="tablist" aria-orientation="horizontal" aria-label={t("profileCollections")}>
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
    <section className={styles.section} aria-labelledby="public-profile-followers" aria-busy={followersLoading}>
      <h2 id="public-profile-followers">{t("followers")}</h2>
      {followersLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {followersError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowersAttempt(value => value + 1)} />}
      {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <><ul className={styles.userList}>{followers.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{getUserName(networkUser, t("someone"))}</Link></li>)}</ul><Pagination className={styles.pagination} page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} busy={followersLoading} onPageChange={setFollowersPage} /></>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-following" aria-busy={followingLoading}>
      <h2 id="public-profile-following">{t("following")}</h2>
      {followingLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {followingError && <RetryNotice className={styles.alert} message={t("loadNetworkError")} retryLabel={t("retry")} onRetry={() => setFollowingAttempt(value => value + 1)} />}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <><ul className={styles.userList}>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{getUserName(networkUser, t("someone"))}</Link></li>)}</ul><Pagination className={styles.pagination} page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} busy={followingLoading} onPageChange={setFollowingPage} /></>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-activity" aria-busy={activityLoading}>
      <h2 id="public-profile-activity">{t("recentActivity")}</h2>
      {activityLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {activityError && <RetryNotice className={styles.alert} message={t("loadActivityError")} retryLabel={t("retry")} onRetry={() => setActivityAttempt(value => value + 1)} />}
      {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p>{t("noActivity")}</p> : <><ul className={styles.activityList}>{activity.content.map(item => <li key={item.id}>
        {item.type === "FOLLOW" && <>{localizeActivityType(item.type, t)} {item.relatedUser && <Link to={path(`/users/${item.relatedUser.id}`)}>{getUserName(item.relatedUser, t("someone"))}</Link>}</>}
        {item.type === "RATING" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{editorialText(item.movie.title, t("untitledFilm"))}</Link>}</>}
        {item.type === "REVIEW" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{editorialText(item.movie.title, t("untitledFilm"))}</Link>}</>}
        {item.type === "LIST" && <>{localizeActivityType(item.type, t)} {item.list && editorialText(item.list.name, t("lists"))}</>}
        {!([ "FOLLOW", "RATING", "REVIEW", "LIST" ] as string[]).includes(item.type) && localizeActivityType(item.type, t)}
      </li>)}</ul><Pagination className={styles.pagination} page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} busy={activityLoading} onPageChange={setActivityPage} /></>)}
    </section>
    <section className={styles.section} id="public-profile-lists" aria-labelledby="public-profile-lists-title" aria-busy={publicListsLoading}>
      <h2 id="public-profile-lists-title">{t("publicLists")}</h2>
      {publicListsLoading && <p className={styles.loading} role="status">{t("loading")}</p>}
      {publicListsError && <RetryNotice className={styles.alert} message={t("loadPublicListError")} retryLabel={t("retry")} onRetry={() => setPublicListsAttempt(value => value + 1)} />}
      {!publicListsLoading && !publicListsError && publicLists && (publicLists.content.length === 0 ? <p>{t("noPublicLists")}</p> : <>
        <div className={styles.publicListGrid}>
          {publicLists.content.map(list => {
            const listName = editorialText(list.name, t("lists"));
            return <article className={styles.publicListCard} key={list.id}>
              <Link className={styles.publicListPoster} to={path(`/lists/public/${list.id}`)} aria-label={listName}>
                <ListPosterStack movies={list.previewMovies ?? []} label={listName} fallbackTitle={t("untitledFilm")} size="compact" />
              </Link>
              <div className={styles.publicListBody}>
                <div className={styles.publicListHeading}>
                  <h3 className={styles.publicListTitle}><Link to={path(`/lists/public/${list.id}`)}>{listName}</Link></h3>
                  {list.itemCount != null && <span className={styles.publicListCount}>{formatMovieCount(list.itemCount, lang)}</span>}
                </div>
                {list.description && <p className={styles.publicListDescription}>{list.description}</p>}
                {list.tags.length > 0 && <div className={styles.publicListTags} role="group" aria-label={t("tags")}>
                  {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
                </div>}
              </div>
            </article>;
          })}
        </div>
        <Pagination className={styles.pagination} page={publicListsPage} totalPages={publicLists.totalPages} label={t("publicProfileListsPagination")} busy={publicListsLoading} onPageChange={setPublicListsPage} />
      </>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-reviews"><h2 id="public-profile-reviews">{t("recentReviews")}</h2>{profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <ul className={styles.reviewList}>{profile.recentReviews.map(review => {
      const movieTitle = editorialText(review.movieTitle, t("untitledFilm"));
      return <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: <Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></li>;
    })}</ul>}</section>
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
  </main>;
}
