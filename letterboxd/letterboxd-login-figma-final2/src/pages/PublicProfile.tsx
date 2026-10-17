import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
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

export default function PublicProfile() {
  const { id } = useParams();
  const { path, t, lang } = useLocale();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setProfile(null); setError(false);
    api.get<Profile>(`/users/${id}/profile`).then(({ data }) => setProfile(data)).catch(() => setError(true));
  }, [id, lang]);

  if (error) return <main style={{ padding: "110px 5% 40px" }}><p role="alert">{t("loadPublicProfileError")}</p></main>;
  if (!profile) return <main style={{ padding: "110px 5% 40px" }}><p>{t("loading")}</p></main>;
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width="96" height="96" />}
    <h1>{profile.displayName}</h1><p>@{profile.username}</p>
    <section><h2>{t("profileStats")}</h2><p>{t("watched")}: {profile.stats.watched} · {t("watchlist")}: {profile.stats.watchlist} · {t("favorite")}: {profile.stats.favorites} · {t("reviews")}: {profile.stats.reviews} · {t("ratings")}: {profile.stats.ratings}</p></section>
    <section><h2>{t("publicLists")}</h2>{profile.lists.length === 0 ? <p>{t("noPublicLists")}</p> : <ul>{profile.lists.map(list => <li key={list.id}><Link to={path(`/lists/public/${list.id}`)}>{list.name}</Link>{list.description && ` — ${list.description}`}</li>)}</ul>}</section>
    <section><h2>{t("recentReviews")}</h2>{profile.recentReviews.length === 0 ? <p>{t("noReviews")}</p> : <ul>{profile.recentReviews.map(review => <li key={review.id}><Link to={path(`/films/${review.movieId}`)}>{review.movieTitle}</Link>{review.rating !== null && ` · ${review.rating}/5`}: {review.content}</li>)}</ul>}</section>
  </main>;
}
