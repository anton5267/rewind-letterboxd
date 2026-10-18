import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import type { MoviePage } from "../api/search.api";
import { blockUser, follow, getBlockStatus, getFollowers, getFollowing, getFollowStatus, getUserActivity, type ActivityPage, type BlockStatus, type FollowStatus, type NetworkPage, unblockUser, unfollow } from "../api/social.api";
import { useAuth } from "../context/AuthContext";
import { localizeActivityType, useLocale } from "../i18n";

interface Profile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  hq: boolean;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  ratingDistribution: { rating: number; count: number }[];
  socialLinks: { platform: string; url: string }[];
  lists: { id: number; name: string; description: string | null }[];
  recentReviews: { id: number; movieId: number; movieTitle: string; content: string; rating: number | null }[];
}

interface PublicListPage {
  content: { id: number; name: string; description: string | null; ownerId: number; ownerUsername: string; tags: string[] }[];
  number: number;
  totalPages: number;
  totalElements: number;
}

type PublicCollection = "watched" | "watchlist" | "favorites";

export default function PublicProfile() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
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
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [networkAttempt, setNetworkAttempt] = useState(0);
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
  const [publicLists, setPublicLists] = useState<PublicListPage | null>(null);
  const [publicListsLoading, setPublicListsLoading] = useState(false);
  const [publicListsError, setPublicListsError] = useState(false);
  const [publicListsPage, setPublicListsPage] = useState(0);
  const [publicListsAttempt, setPublicListsAttempt] = useState(0);
  const [likedReviews, setLikedReviews] = useState<{ content: Profile["recentReviews"]; totalPages: number } | null>(null);
  const [likedReviewsPage, setLikedReviewsPage] = useState(0);
  const [likedReviewsLoading, setLikedReviewsLoading] = useState(false);
  const [likedReviewsError, setLikedReviewsError] = useState(false);
  const [likedReviewsAttempt, setLikedReviewsAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setProfile(null);
    setError(false);
    api.get<Profile>(`/users/${id}/profile`)
      .then(({ data }) => { if (current) setProfile(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [id, lang, profileAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setActivityLoading(true);
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
    setCollectionError(false);
    api.get<MoviePage>(`/users/${id}/collections/${collectionKind}`, { params: { page: collectionPage, size: 12 } })
      .then(({ data }) => { if (current) setCollection(data); })
      .catch(() => { if (current) setCollectionError(true); })
      .finally(() => { if (current) setCollectionLoading(false); });
    return () => { current = false; };
  }, [id, lang, collectionKind, collectionPage, collectionAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setNetworkLoading(true);
    setNetworkError(false);
    Promise.all([getFollowers(id, followersPage), getFollowing(id, followingPage)])
      .then(([followersResponse, followingResponse]) => {
        if (!current) return;
        setFollowers(followersResponse.data);
        setFollowing(followingResponse.data);
      })
      .catch(() => { if (current) setNetworkError(true); })
      .finally(() => { if (current) setNetworkLoading(false); });
    return () => { current = false; };
  }, [id, lang, followersPage, followingPage, networkAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setPublicListsLoading(true);
    setPublicListsError(false);
    api.get<PublicListPage>(`/users/${id}/lists`, { params: { page: publicListsPage, size: 12 } })
      .then(({ data }) => { if (current) setPublicLists(data); })
      .catch(() => { if (current) setPublicListsError(true); })
      .finally(() => { if (current) setPublicListsLoading(false); });
    return () => { current = false; };
  }, [id, lang, publicListsPage, publicListsAttempt]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setLikedReviewsLoading(true);
    setLikedReviewsError(false);
    api.get<{ content: Profile["recentReviews"]; totalPages: number }>(`/users/${id}/liked-reviews`, { params: { page: likedReviewsPage, size: 10 } })
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
    getFollowStatus(id).then(({ data }) => { if (current) setFollowStatus(data); })
      .catch(() => { if (current) setFollowStatus(null); });
    return () => { current = false; };
  }, [id, isAuth, user?.id]);

  useEffect(() => {
    if (!id || !isAuth || user?.id === Number(id)) return;
    let current = true;
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
      const [{ data: status }, { data: followersData }, { data: followingData }] = await Promise.all([getFollowStatus(id), getFollowers(id, followersPage), getFollowing(id, followingPage)]);
      setFollowStatus(status);
      setFollowers(followersData);
      setFollowing(followingData);
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
    } catch {
      setBlockError(true);
    } finally {
      setBlockBusy(false);
    }
  };

  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPublicProfileError")} <button type="button" onClick={() => setProfileAttempt(value => value + 1)}>{t("retry")}</button></p></main>;
  if (!profile) return <main style={{ padding: "110px 5% 40px" }}><p>{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width="96" height="96" />}
    <h1 style={{ overflowWrap: "anywhere" }}>{profile.displayName}{profile.hq && <span aria-label={t("hq")} title={t("hq")} style={{ marginLeft: 8, fontSize: 14, color: "#d8a5ff" }}>{t("hq")}</span>}</h1><p style={{ overflowWrap: "anywhere" }}>@{profile.username}</p>
    {isAuth && user?.id !== profile.id && followStatus && !blockStatus?.blocked && <button type="button" disabled={followBusy} onClick={() => void changeFollow()}>{followStatus.following ? t("unfollow") : t("follow")}</button>}
    {isAuth && user?.id !== profile.id && blockStatus && <button type="button" disabled={blockBusy} onClick={() => void changeBlock()} style={{ marginLeft: 8 }}>{blockStatus.blocked ? t("unblockUser") : t("blockProfileUser")}</button>}
    {isAuth && user?.id !== profile.id && !blockStatus?.blocked && <Link to={path(`/messages?user=${profile.id}`)} style={{ marginLeft: 8 }}>{t("sendMessage")}</Link>}
    {followError && <p role="alert">{t("followError")}</p>}
    {blockError && <p role="alert">{t("blockError")}</p>}
    <section><h2>{t("profileStats")}</h2><p>{t("watched")}: {profile.stats.watched} · {t("watchlist")}: {profile.stats.watchlist} · {t("favorite")}: {profile.stats.favorites} · {t("reviews")}: {profile.stats.reviews} · {t("ratings")}: {profile.stats.ratings}</p>
      <h3>{t("ratingDistribution")}</h3>
      {profile.ratingDistribution.length === 0 ? <p>{t("noRatingDistribution")}</p> : <ul aria-label={t("ratingDistribution")} style={{ listStyle: "none", padding: 0, display: "grid", gap: 6, maxWidth: 420 }}>
        {[5, 4, 3, 2, 1].map(rating => {
          const count = profile.ratingDistribution.find(item => item.rating === rating)?.count ?? 0;
          const max = Math.max(...profile.ratingDistribution.map(item => item.count), 1);
          return <li key={rating} style={{ display: "grid", gridTemplateColumns: "42px 1fr 32px", gap: 8, alignItems: "center" }}><span>{rating}/5</span><span aria-hidden="true" style={{ height: 10, background: "#2a2a2a", borderRadius: 99, overflow: "hidden" }}><span style={{ display: "block", width: `${Math.round((count / max) * 100)}%`, height: "100%", background: "#d8a5ff" }} /></span><strong>{count}</strong></li>;
        })}
      </ul>}
    </section>
    <section><h2>{t("socialLinks")}</h2>{profile.socialLinks.length === 0 ? <p>{t("noSocialLinks")}</p> : <ul>{profile.socialLinks.map(link => <li key={link.platform}><a href={link.url} target="_blank" rel="noreferrer">{link.platform}</a></li>)}</ul>}</section>
    <section>
      <h2>{t("profileCollections")}</h2>
      <div role="tablist" aria-label={t("profileCollections")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(["watched", "watchlist", "favorites"] as const).map(kind => <button key={kind} type="button" role="tab" aria-selected={collectionKind === kind} onClick={() => chooseCollection(kind)}>{kind === "favorites" ? t("favorite") : t(kind)}</button>)}
      </div>
      {collectionLoading && <p>{t("loading")}</p>}
      {collectionError && <p role="alert">{t("loadCollectionError")} <button type="button" onClick={() => setCollectionAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!collectionLoading && !collectionError && collection && <>
        {collection.content.length === 0 ? <p>{t("noCollectionFilms")}</p> : <ul>{collection.content.map(movie => <li key={movie.id}><Link to={path(`/films/${movie.id}`)}>{movie.title}</Link>{movie.releaseDate ? ` (${movie.releaseDate.slice(0, 4)})` : ""}{movie.rating !== null ? ` · ★ ${movie.rating}` : ""}</li>)}</ul>}
        {collection.totalPages > 1 && <nav aria-label={t("pagination")} style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={collectionPage === 0} onClick={() => setCollectionPage(page => page - 1)}>{t("previous")}</button>
          <span>{t("page")} {collectionPage + 1} {t("of")} {collection.totalPages}</span>
          <button type="button" disabled={collectionPage + 1 >= collection.totalPages} onClick={() => setCollectionPage(page => page + 1)}>{t("next")}</button>
        </nav>}
      </>}
    </section>
    <section>
      <h2>{t("followers")}</h2>
      {networkLoading && <p aria-live="polite">{t("loading")}</p>}
      {networkError && <p role="alert">{t("loadNetworkError")} <button type="button" onClick={() => setNetworkAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!networkLoading && !networkError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <><ul>{followers.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul>{followers.totalPages > 1 && <nav aria-label={t("networkPagination")} style={{ display: "flex", gap: 8 }}><button type="button" disabled={followersPage === 0} onClick={() => setFollowersPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {followersPage + 1} {t("of")} {followers.totalPages}</span><button type="button" disabled={followersPage + 1 >= followers.totalPages} onClick={() => setFollowersPage(page => page + 1)}>{t("next")}</button></nav>}</>)}
    </section>
    <section>
      <h2>{t("following")}</h2>
      {!networkLoading && !networkError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <><ul>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul>{following.totalPages > 1 && <nav aria-label={t("networkPagination")} style={{ display: "flex", gap: 8 }}><button type="button" disabled={followingPage === 0} onClick={() => setFollowingPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {followingPage + 1} {t("of")} {following.totalPages}</span><button type="button" disabled={followingPage + 1 >= following.totalPages} onClick={() => setFollowingPage(page => page + 1)}>{t("next")}</button></nav>}</>)}
    </section>
    <section>
      <h2>{t("recentActivity")}</h2>
      {activityLoading && <p aria-live="polite">{t("loading")}</p>}
      {activityError && <p role="alert">{t("loadActivityError")} <button type="button" onClick={() => setActivityAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!activityLoading && !activityError && activity && (activity.content.length === 0 ? <p>{t("noActivity")}</p> : <><ul>{activity.content.map(item => <li key={item.id}>
        {item.type === "FOLLOW" && <>{localizeActivityType(item.type, t)} {item.relatedUser && <Link to={path(`/users/${item.relatedUser.id}`)}>{item.relatedUser.displayName || item.relatedUser.username}</Link>}</>}
        {item.type === "RATING" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "REVIEW" && <>{localizeActivityType(item.type, t)} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "LIST" && <>{localizeActivityType(item.type, t)} {item.list?.name}</>}
        {!([ "FOLLOW", "RATING", "REVIEW", "LIST" ] as string[]).includes(item.type) && localizeActivityType(item.type, t)}
      </li>)}</ul>{activity.totalPages > 1 && <nav aria-label={t("activityPagination")} style={{ display: "flex", gap: 8 }}><button type="button" disabled={activityPage === 0} onClick={() => setActivityPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {activityPage + 1} {t("of")} {activity.totalPages}</span><button type="button" disabled={activityPage + 1 >= activity.totalPages} onClick={() => setActivityPage(page => page + 1)}>{t("next")}</button></nav>}</>)}
    </section>
    <section>
      <h2>{t("publicLists")}</h2>
      {publicListsLoading && <p role="status">{t("loading")}</p>}
      {publicListsError && <p role="alert">{t("loadPublicListError")} <button type="button" onClick={() => setPublicListsAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!publicListsLoading && !publicListsError && publicLists && (publicLists.content.length === 0 ? <p>{t("noPublicLists")}</p> : <>
        <ul>{publicLists.content.map(list => <li key={list.id}><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link>{list.description && ` — ${list.description}`}</li>)}</ul>
        {publicLists.totalPages > 1 && <nav aria-label={t("pagination")} style={{ display: "flex", gap: 8 }}>
          <button type="button" disabled={publicListsPage === 0} onClick={() => setPublicListsPage(page => page - 1)}>{t("previous")}</button>
          <span>{t("page")} {publicListsPage + 1} {t("of")} {publicLists.totalPages}</span>
          <button type="button" disabled={publicListsPage + 1 >= publicLists.totalPages} onClick={() => setPublicListsPage(page => page + 1)}>{t("next")}</button>
        </nav>}
      </>)}
    </section>
    <section><h2>{t("recentReviews")}</h2>{profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <ul>{profile.recentReviews.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: {review.content}</li>)}</ul>}</section>
    <section><h2>{t("likedReviews")}</h2>
      {likedReviewsLoading && <p role="status">{t("loading")}</p>}
      {likedReviewsError && <p role="alert">{t("loadLikedReviewsError")} <button type="button" onClick={() => setLikedReviewsAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!likedReviewsLoading && !likedReviewsError && likedReviews && (likedReviews.content.length === 0 ? <p>{t("noLikedReviews")}</p> : <>
        <ul>{likedReviews.content.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: {review.content}</li>)}</ul>
        {likedReviews.totalPages > 1 && <nav aria-label={t("likedReviewsPagination")} style={{ display: "flex", gap: 8 }}><button type="button" disabled={likedReviewsPage === 0} onClick={() => setLikedReviewsPage(page => page - 1)}>{t("previous")}</button><span>{t("page")} {likedReviewsPage + 1} {t("of")} {likedReviews.totalPages}</span><button type="button" disabled={likedReviewsPage + 1 >= likedReviews.totalPages} onClick={() => setLikedReviewsPage(page => page + 1)}>{t("next")}</button></nav>}
      </>)}
    </section>
  </main>;
}
