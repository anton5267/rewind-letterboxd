import { useEffect, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicProfile, getPublicProfileCollection, getPublicProfileLikedReviews, getPublicProfileLists, type PublicCollection, type PublicProfileListPage, type PublicProfileResponse, type PublicProfileReviewPage } from "../api/profile.api";
import type { MoviePage } from "../api/search.api";
import { blockUser, follow, getBlockStatus, getFollowers, getFollowing, getFollowStatus, getUserActivity, type ActivityPage, type BlockStatus, type FollowStatus, type NetworkPage, unblockUser, unfollow } from "../api/social.api";
import ResilientImage from "../components/ResilientImage";
import { useAuth } from "../context/AuthContext";
import { formatMovieCount, localizeActivityType, useLocale } from "../i18n";
import ListPosterStack from "../components/ListPosterStack";
import { toTagSlug } from "../utils/tagSlug";
import { safeHttpUrl } from "../utils/externalUrl";
import styles from "./PublicProfile.module.css";

function Pagination({ page, totalPages, label, onPageChange }: { page: number; totalPages: number; label: string; onPageChange: (page: number) => void }) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;
  return <nav className={styles.pagination} aria-label={label}>
    <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)}>{t("previous")}</button>
    <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
    <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>{t("next")}</button>
  </nav>;
}

export default function PublicProfile() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth, user } = useAuth();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
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
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockStatus | null>(null);
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

  useEffect(() => {
    let current = true;
    setProfile(null);
    setError(false);
    if (!id) {
      setError(true);
      return;
    }
    getPublicProfile(id)
      .then(({ data }) => { if (current) setProfile(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [id, lang, profileAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setActivityLoading(true);
    setActivity(null);
    setActivityError(false);
    getUserActivity(id, activityPage).then(({ data }) => { if (current) setActivity(data); })
      .catch(() => { if (current) setActivityError(true); })
      .finally(() => { if (current) setActivityLoading(false); });
    return () => { current = false; };
  }, [id, lang, activityPage, activityAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setCollectionLoading(true);
    setCollection(null);
    setCollectionError(false);
    getPublicProfileCollection(id, collectionKind, collectionPage)
      .then(({ data }) => { if (current) setCollection(data); })
      .catch(() => { if (current) setCollectionError(true); })
      .finally(() => { if (current) setCollectionLoading(false); });
    return () => { current = false; };
  }, [id, lang, collectionKind, collectionPage, collectionAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setFollowersLoading(true);
    setFollowers(null);
    setFollowersError(false);
    getFollowers(id, followersPage)
      .then(({ data }) => { if (current) setFollowers(data); })
      .catch(() => { if (current) setFollowersError(true); })
      .finally(() => { if (current) setFollowersLoading(false); });
    return () => { current = false; };
  }, [id, lang, followersPage, followersAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setFollowingLoading(true);
    setFollowing(null);
    setFollowingError(false);
    getFollowing(id, followingPage)
      .then(({ data }) => { if (current) setFollowing(data); })
      .catch(() => { if (current) setFollowingError(true); })
      .finally(() => { if (current) setFollowingLoading(false); });
    return () => { current = false; };
  }, [id, lang, followingPage, followingAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setPublicListsLoading(true);
    setPublicLists(null);
    setPublicListsError(false);
    getPublicProfileLists(id, publicListsPage)
      .then(({ data }) => { if (current) setPublicLists(data); })
      .catch(() => { if (current) setPublicListsError(true); })
      .finally(() => { if (current) setPublicListsLoading(false); });
    return () => { current = false; };
  }, [id, lang, publicListsPage, publicListsAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setLikedReviewsLoading(true);
    setLikedReviews(null);
    setLikedReviewsError(false);
    getPublicProfileLikedReviews(id, likedReviewsPage)
      .then(({ data }) => { if (current) setLikedReviews(data); })
      .catch(() => { if (current) setLikedReviewsError(true); })
      .finally(() => { if (current) setLikedReviewsLoading(false); });
    return () => { current = false; };
  }, [id, lang, likedReviewsPage, likedReviewsAttempt]);

  useEffect(() => {
    if (!id || !isAuth || user?.id === Number(id)) {
      setFollowStatus(null);
      setBlockStatus(null);
      return;
    }
    let current = true;
    setFollowStatus(null);
    getFollowStatus(id).then(({ data }) => { if (current) setFollowStatus(data); })
      .catch(() => { if (current) setFollowStatus(null); });
    return () => { current = false; };
  }, [id, isAuth, user?.id]);

  useEffect(() => {
    if (!id || !isAuth || user?.id === Number(id)) return;
    let current = true;
    setBlockStatus(null);
    getBlockStatus(id).then(({ data }) => { if (current) setBlockStatus(data); })
      .catch(() => { if (current) setBlockStatus(null); });
    return () => { current = false; };
  }, [id, isAuth, user?.id]);

  const chooseCollection = (kind: PublicCollection) => {
    setCollectionKind(kind);
    setCollectionPage(0);
  };

  const changeFollow = async () => {
    if (!id || !followStatus || blockStatus?.blocked) return;
    setFollowBusy(true);
    setFollowError(false);
    try {
      if (followStatus.following) await unfollow(id); else await follow(id);
      const { data: status } = await getFollowStatus(id);
      setFollowStatus(status);
      setFollowersAttempt(value => value + 1);
      setFollowingAttempt(value => value + 1);
    } catch {
      setFollowError(true);
    } finally {
      setFollowBusy(false);
    }
  };

  const changeBlock = async () => {
    if (!id || !blockStatus) return;
    setBlockBusy(true);
    setBlockError(false);
    try {
      const { data } = blockStatus.blocked ? await unblockUser(id) : await blockUser(id);
      setBlockStatus(data);
      if (data.blocked) setFollowStatus(status => status ? { ...status, following: false } : status);
      setFollowersAttempt(value => value + 1);
      setFollowingAttempt(value => value + 1);
    } catch {
      setBlockError(true);
    } finally {
      setBlockBusy(false);
    }
  };

  if (error) return <main className={styles.state}><div className={styles.shell}><p className={styles.alert} role="alert">{t("loadPublicProfileError")} <button type="button" onClick={() => setProfileAttempt(value => value + 1)}>{t("retry")}</button></p></div></main>;
  if (!profile) return <main className={styles.state}><div className={styles.shell}><p className={styles.loading} aria-live="polite">{t("loading")}</p></div></main>;
  const socialLinks = profile.socialLinks.flatMap(link => {
    const url = safeHttpUrl(link.url);
    return url ? [{ platform: link.platform, url }] : [];
  });
  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.hero} aria-labelledby="public-profile-title">
        <div className={styles.identity}>
          <ResilientImage className={styles.avatar} src={profile.avatarUrl} alt="" width={112} height={112} fallback={<div className={styles.avatarFallback} aria-hidden="true">{profile.displayName.slice(0, 1).toUpperCase()}</div>} />
          <div className={styles.identityCopy}>
            <p className={styles.eyebrow}>{t("profile")}</p>
            <h1 id="public-profile-title">{profile.displayName}{profile.hq && <span className={styles.hq} aria-label={t("hq")} title={t("hq")}>{t("hq")}</span>}</h1>
            <p className={styles.username}>@{profile.username}</p>
          </div>
        </div>
        {isAuth && user?.id !== profile.id && (followStatus || blockStatus) && <div className={styles.profileActions}>
          {followStatus && !blockStatus?.blocked && <button className={styles.primaryButton} type="button" aria-busy={followBusy} disabled={followBusy} onClick={() => void changeFollow()}>{followBusy ? t("loading") : followStatus.following ? t("unfollow") : t("follow")}</button>}
          {blockStatus && <button className={styles.secondaryButton} type="button" aria-busy={blockBusy} disabled={blockBusy} onClick={() => void changeBlock()}>{blockBusy ? t("loading") : blockStatus.blocked ? t("unblockUser") : t("blockProfileUser")}</button>}
          {!blockStatus?.blocked && <Link className={styles.messageLink} to={path(`/messages?user=${profile.id}`)}>{t("sendMessage")}</Link>}
        </div>}
      </section>
      {followError && <p className={styles.alert} role="alert">{t("followError")} <button type="button" disabled={followBusy} aria-busy={followBusy} onClick={() => void changeFollow()}>{t("retry")}</button></p>}
      {blockError && <p className={styles.alert} role="alert">{t("blockError")} <button type="button" disabled={blockBusy} aria-busy={blockBusy} onClick={() => void changeBlock()}>{t("retry")}</button></p>}
    <section className={styles.section} aria-labelledby="public-profile-stats"><h2 id="public-profile-stats">{t("profileStats")}</h2><div className={styles.stats}>
      <div className={styles.stat}><span>{t("watched")}: <strong>{profile.stats.watched}</strong></span></div>
      <div className={styles.stat}><span>{t("watchlist")}: <strong>{profile.stats.watchlist}</strong></span></div>
      <div className={styles.stat}><span>{t("favorite")}: <strong>{profile.stats.favorites}</strong></span></div>
      <div className={styles.stat}><span>{t("reviews")}: <strong>{profile.stats.reviews}</strong></span></div>
      <div className={styles.stat}><span>{t("ratings")}: <strong>{profile.stats.ratings}</strong></span></div>
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
    <section className={styles.section} aria-labelledby="public-profile-social-links"><h2 id="public-profile-social-links">{t("socialLinks")}</h2>{socialLinks.length === 0 ? <p>{t("noSocialLinks")}</p> : <ul className={styles.socialList}>{socialLinks.map(link => <li key={link.platform}><a href={link.url} target="_blank" rel="noreferrer">{link.platform}</a></li>)}</ul>}</section>
    <section className={styles.section} aria-labelledby="public-profile-collections" aria-busy={collectionLoading}>
      <h2 id="public-profile-collections">{t("profileCollections")}</h2>
      <div className={styles.tabs} role="tablist" aria-label={t("profileCollections")}>
        {(["watched", "watchlist", "favorites"] as const).map(kind => <button className={collectionKind === kind ? styles.tabActive : undefined} id={`public-profile-collection-tab-${kind}`} key={kind} type="button" role="tab" aria-selected={collectionKind === kind} aria-controls="public-profile-collection-content" onClick={() => chooseCollection(kind)}>{kind === "favorites" ? t("favorite") : t(kind)}</button>)}
      </div>
      <div id="public-profile-collection-content" role="tabpanel" tabIndex={0} aria-labelledby={`public-profile-collection-tab-${collectionKind}`}>
        {collectionLoading && <p role="status">{t("loading")}</p>}
        {collectionError && <p role="alert">{t("loadCollectionError")} <button type="button" onClick={() => setCollectionAttempt(value => value + 1)}>{t("retry")}</button></p>}
        {!collectionLoading && !collectionError && collection && <>
          {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <div className={styles.collectionGrid}>{collection.content.map(movie => <article className={styles.collectionCard} key={movie.id}>
            <Link className={styles.collectionPosterLink} to={path(`/films/${movie.id}`)} aria-label={`${movie.title} ${t("poster")}`}>
              <ResilientImage className={styles.collectionPoster} src={movie.photoUrl} alt="" loading="lazy" fallback={<span className={styles.collectionPosterFallback}>{movie.title.slice(0, 1).toUpperCase()}</span>} />
            </Link>
            <h3><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link></h3>
            <p>{movie.releaseDate ? movie.releaseDate.slice(0, 4) : "—"}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</p>
          </article>)}</div>}
          <Pagination page={collectionPage} totalPages={collection.totalPages} label={t("pagination")} onPageChange={setCollectionPage} />
        </>}
      </div>
    </section>
    <section className={styles.section} aria-labelledby="public-profile-followers" aria-busy={followersLoading}>
      <h2 id="public-profile-followers">{t("followers")}</h2>
      {followersLoading && <p role="status" aria-live="polite">{t("loading")}</p>}
      {followersError && <p role="alert">{t("loadNetworkError")} <button type="button" onClick={() => setFollowersAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!followersLoading && !followersError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <><ul className={styles.userList}>{followers.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul><Pagination page={followersPage} totalPages={followers.totalPages} label={t("networkPagination")} onPageChange={setFollowersPage} /></>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-following" aria-busy={followingLoading}>
      <h2 id="public-profile-following">{t("following")}</h2>
      {followingLoading && <p role="status" aria-live="polite">{t("loading")}</p>}
      {followingError && <p role="alert">{t("loadNetworkError")} <button type="button" onClick={() => setFollowingAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!followingLoading && !followingError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <><ul className={styles.userList}>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul><Pagination page={followingPage} totalPages={following.totalPages} label={t("networkPagination")} onPageChange={setFollowingPage} /></>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-activity" aria-busy={activityLoading}>
      <h2 id="public-profile-activity">{t("recentActivity")}</h2>
      {activityLoading && <p role="status" aria-live="polite">{t("loading")}</p>}
      {activityError && <p role="alert">{t("loadActivityError")} <button type="button" onClick={() => setActivityAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p>{t("noActivity")}</p> : <><ul className={styles.activityList}>{activity.content.map(item => <li key={item.id}>
        {item.type === "FOLLOW" && <>{localizeActivityType(item.type, t)} {item.relatedUser && <Link to={path(`/users/${item.relatedUser.id}`)}>{item.relatedUser.displayName || item.relatedUser.username}</Link>}</>}
        {item.type === "RATING" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "REVIEW" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "LIST" && <>{localizeActivityType(item.type, t)} {item.list?.name}</>}
        {!([ "FOLLOW", "RATING", "REVIEW", "LIST" ] as string[]).includes(item.type) && localizeActivityType(item.type, t)}
      </li>)}</ul><Pagination page={activityPage} totalPages={activity.totalPages} label={t("activityPagination")} onPageChange={setActivityPage} /></>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-lists" aria-busy={publicListsLoading}>
      <h2 id="public-profile-lists">{t("publicLists")}</h2>
      {publicListsLoading && <p role="status">{t("loading")}</p>}
      {publicListsError && <p role="alert">{t("loadPublicListError")} <button type="button" onClick={() => setPublicListsAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!publicListsLoading && !publicListsError && publicLists && (publicLists.content.length === 0 ? <p>{t("noPublicLists")}</p> : <>
        <div className={styles.publicListGrid}>
          {publicLists.content.map(list => <article className={styles.publicListCard} key={list.id}>
            <Link className={styles.publicListPoster} to={path(`/lists/public/${list.id}`)} aria-label={list.name}>
              <ListPosterStack movies={list.previewMovies ?? []} label={list.name} size="compact" />
            </Link>
            <div className={styles.publicListBody}>
              <div className={styles.publicListHeading}>
                <h3 className={styles.publicListTitle}><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link></h3>
                {list.itemCount != null && <span className={styles.publicListCount}>{formatMovieCount(list.itemCount, lang)}</span>}
              </div>
              {list.description && <p className={styles.publicListDescription}>{list.description}</p>}
              {list.tags.length > 0 && <div className={styles.publicListTags} aria-label={t("tags")}>
                {list.tags.map(tag => <Link key={tag} to={path(`/lists/discover?feed=recent&tag=${encodeURIComponent(toTagSlug(tag))}`)}>#{tag}</Link>)}
              </div>}
            </div>
          </article>)}
        </div>
        <Pagination page={publicListsPage} totalPages={publicLists.totalPages} label={t("pagination")} onPageChange={setPublicListsPage} />
      </>)}
    </section>
    <section className={styles.section} aria-labelledby="public-profile-reviews"><h2 id="public-profile-reviews">{t("recentReviews")}</h2>{profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <ul className={styles.reviewList}>{profile.recentReviews.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: <Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></li>)}</ul>}</section>
    <section className={styles.section} aria-labelledby="public-profile-liked-reviews" aria-busy={likedReviewsLoading}><h2 id="public-profile-liked-reviews">{t("likedReviews")}</h2>
      {likedReviewsLoading && <p role="status">{t("loading")}</p>}
      {likedReviewsError && <p role="alert">{t("loadLikedReviewsError")} <button type="button" onClick={() => setLikedReviewsAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!likedReviewsLoading && !likedReviewsError && likedReviews && (likedReviews.content.length === 0 ? <p>{t("noLikedReviews")}</p> : <>
        <ul className={styles.reviewList}>{likedReviews.content.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: <Link to={path(`/reviews/${review.id}`)}>{review.content}</Link></li>)}</ul>
        <Pagination page={likedReviewsPage} totalPages={likedReviews.totalPages} label={t("likedReviewsPagination")} onPageChange={setLikedReviewsPage} />
      </>)}
    </section>
    </div>
  </main>;
}
