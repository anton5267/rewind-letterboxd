import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import type { MoviePage } from "../api/search.api";
import { follow, getFollowers, getFollowing, getFollowStatus, getUserActivity, type ActivityPage, type FollowStatus, type NetworkPage, unfollow } from "../api/social.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface Profile {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  lists: { id: number; name: string; description: string | null }[];
  recentReviews: { id: number; movieId: number; movieTitle: string; content: string; rating: number | null }[];
}

type PublicCollection = "watched" | "watchlist" | "favorites";

export default function PublicProfile() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const { isAuth, user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);
  const [collectionKind, setCollectionKind] = useState<PublicCollection>("watched");
  const [collection, setCollection] = useState<MoviePage | null>(null);
  const [collectionPage, setCollectionPage] = useState(0);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState(false);
  const [followers, setFollowers] = useState<NetworkPage | null>(null);
  const [following, setFollowing] = useState<NetworkPage | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [followStatus, setFollowStatus] = useState<FollowStatus | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState(false);
  const [activity, setActivity] = useState<ActivityPage | null>(null);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    setProfile(null); setError(false);
    api.get<Profile>(`/users/${id}/profile`).then(({ data }) => setProfile(data)).catch(() => setError(true));
  }, [id, lang]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setActivityError(false);
    getUserActivity(id).then(({ data }) => { if (current) setActivity(data); })
      .catch(() => { if (current) setActivityError(true); });
    return () => { current = false; };
  }, [id, lang]);

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
  }, [id, lang, collectionKind, collectionPage]);

  useEffect(() => {
    if (!id) return;
    let current = true;
    setNetworkError(false);
    Promise.all([getFollowers(id), getFollowing(id)])
      .then(([followersResponse, followingResponse]) => {
        if (!current) return;
        setFollowers(followersResponse.data);
        setFollowing(followingResponse.data);
      })
      .catch(() => { if (current) setNetworkError(true); });
    return () => { current = false; };
  }, [id, lang]);

  useEffect(() => {
    if (!id || !isAuth || user?.id === Number(id)) {
      setFollowStatus(null);
      return;
    }
    let current = true;
    getFollowStatus(id).then(({ data }) => { if (current) setFollowStatus(data); })
      .catch(() => { if (current) setFollowStatus(null); });
    return () => { current = false; };
  }, [id, isAuth, user?.id]);

  const chooseCollection = (kind: PublicCollection) => {
    setCollectionKind(kind);
    setCollectionPage(0);
  };

  const changeFollow = async () => {
    if (!id || !followStatus) return;
    setFollowBusy(true);
    setFollowError(false);
    try {
      if (followStatus.following) await unfollow(id); else await follow(id);
      const [{ data: status }, { data: followersData }, { data: followingData }] = await Promise.all([getFollowStatus(id), getFollowers(id), getFollowing(id)]);
      setFollowStatus(status);
      setFollowers(followersData);
      setFollowing(followingData);
    } catch {
      setFollowError(true);
    } finally {
      setFollowBusy(false);
    }
  };

  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPublicProfileError")}</p></main>;
  if (!profile) return <main style={{ padding: "110px 5% 40px" }}><p>{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width="96" height="96" />}
    <h1>{profile.displayName}</h1><p>@{profile.username}</p>
    {isAuth && user?.id !== profile.id && followStatus && <button type="button" disabled={followBusy} onClick={() => void changeFollow()}>{followStatus.following ? t("unfollow") : t("follow")}</button>}
    {isAuth && user?.id !== profile.id && <Link to={path(`/messages?user=${profile.id}`)} style={{ marginLeft: 8 }}>{t("sendMessage")}</Link>}
    {followError && <p role="alert">{t("followError")}</p>}
    <section><h2>{t("profileStats")}</h2><p>{t("watched")}: {profile.stats.watched} · {t("watchlist")}: {profile.stats.watchlist} · {t("favorite")}: {profile.stats.favorites} · {t("reviews")}: {profile.stats.reviews} · {t("ratings")}: {profile.stats.ratings}</p></section>
    <section>
      <h2>{t("profileCollections")}</h2>
      <div role="tablist" aria-label={t("profileCollections")} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(["watched", "watchlist", "favorites"] as const).map(kind => <button key={kind} type="button" role="tab" aria-selected={collectionKind === kind} onClick={() => chooseCollection(kind)}>{kind === "favorites" ? t("favorite") : t(kind)}</button>)}
      </div>
      {collectionLoading && <p>{t("loading")}</p>}
      {collectionError && <p role="alert">{t("loadCollectionError")}</p>}
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
      {networkError && <p role="alert">{t("loadNetworkError")}</p>}
      {!networkError && followers && (followers.content.length === 0 ? <p>{t("noFollowers")}</p> : <ul>{followers.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul>)}
    </section>
    <section>
      <h2>{t("following")}</h2>
      {!networkError && following && (following.content.length === 0 ? <p>{t("noFollowing")}</p> : <ul>{following.content.map(networkUser => <li key={networkUser.id}><Link to={path(`/users/${networkUser.id}`)}>{networkUser.displayName || networkUser.username}</Link></li>)}</ul>)}
    </section>
    <section>
      <h2>{t("recentActivity")}</h2>
      {activityError && <p role="alert">{t("loadActivityError")}</p>}
      {!activityError && activity && (activity.content.length === 0 ? <p>{t("noActivity")}</p> : <ul>{activity.content.map(item => <li key={item.id}>
        {item.type === "FOLLOW" && <>{t("activityFollowed")} {item.relatedUser && <Link to={path(`/users/${item.relatedUser.id}`)}>{item.relatedUser.displayName || item.relatedUser.username}</Link>}</>}
        {item.type === "RATING" && <>{t("activityRated")} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "REVIEW" && <>{t("activityReviewed")} {item.movie && <Link to={path(`/films/${item.movie.id}`)}>{item.movie.title}</Link>}</>}
        {item.type === "LIST" && <>{t("activityCreatedList")} {item.list?.name}</>}
      </li>)}</ul>)}
    </section>
    <section><h2>{t("publicLists")}</h2>{profile.lists.length === 0 ? <p>{t("noPublicLists")}</p> : <ul>{profile.lists.map(list => <li key={list.id}><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link>{list.description && ` — ${list.description}`}</li>)}</ul>}</section>
    <section><h2>{t("recentReviews")}</h2>{profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <ul>{profile.recentReviews.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: {review.content}</li>)}</ul>}</section>
  </main>;
}
