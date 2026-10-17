import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { changePassword, getProfile, updateProfile } from "../api/profile.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";

interface ProfileData {
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  stats: { ratings: number; reviews: number; watched: number; watchlist: number; favorites: number };
  lists: { id: number; name: string }[];
  recentRatings: { movieId: number; movieTitle: string; rating: number }[];
  recentReviews: { reviewId: number; movieId: number; movieTitle: string; content: string }[];
}

export default function Profile() {
  const { isAuth, ready, logout } = useAuth();
  const navigate = useNavigate();
  const { path, t } = useLocale();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuth) return;
    getProfile().then(({ data }) => {
      setProfile(data);
      setDisplayName(data.displayName ?? "");
      setAvatarUrl(data.avatarUrl ?? "");
    }).catch(() => setError(t("loadProfileError")));
  }, [isAuth]);

  if (!ready) return <main>{t("loading")}</main>;
  if (!isAuth) return <Navigate to={path("/login")} replace />;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) { setError(t("invalidAvatarUrl")); return; }
      const { data } = await updateProfile({ displayName, avatarUrl });
      setProfile(data);
      setMessage(t("nameSaved"));
    } catch { setError(t("saveNameError")); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      try {
        await logout();
        navigate(`${path("/login")}?passwordChanged=1`, { replace: true });
      } catch {
        setError(t("passwordChangedLogoutError"));
      }
    } catch { setError(t("changePasswordError")); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("myProfile")}</h1>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!profile && !error && <p>{t("loading")}</p>}
    {profile && <>
      {profile.avatarUrl && <img src={profile.avatarUrl} alt="" width="96" height="96" />}
      <p>@{profile.username} · {profile.email}</p>
      <section><h2>{t("profileStats")}</h2><p>{t("watched")}: {profile.stats.watched} · {t("watchlist")}: {profile.stats.watchlist} · {t("favorite")}: {profile.stats.favorites} · {t("reviews")}: {profile.stats.reviews} · {t("ratings")}: {profile.stats.ratings}</p></section>
      <form onSubmit={saveName}>
        <label>{t("displayName")} <input value={displayName} minLength={2} maxLength={60} onChange={e => setDisplayName(e.target.value)} /></label>
        <label> {t("avatarUrl")} <input type="url" value={avatarUrl} maxLength={255} placeholder="https://…" onChange={e => setAvatarUrl(e.target.value)} /></label>
        <button type="submit">{t("save")}</button>
      </form>
      <form onSubmit={savePassword} style={{ marginTop: 24 }}>
        <h2>{t("changePassword")}</h2>
        <label>{t("currentPassword")} <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
        <label> {t("newPassword")} <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <button type="submit">{t("changePassword")}</button>
      </form>
      <h2>{t("lists")}</h2>
      <ul>{profile.lists.map(list => <li key={list.id}><Link to={path("/lists")}>{list.name}</Link></li>)}</ul>
      <h2>{t("recentRatings")}</h2>
      <ul>{profile.recentRatings.map(item => <li key={item.movieId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link> — {item.rating}/5</li>)}</ul>
      <h2>{t("recentReviews")}</h2>
      <ul>{profile.recentReviews.map(item => <li key={item.reviewId}><Link to={path(`/films/${item.movieId}`)}>{item.movieTitle}</Link>: {item.content}</li>)}</ul>
    </>}
  </main>;
}
