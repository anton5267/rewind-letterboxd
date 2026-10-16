import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { changePassword, getProfile, updateProfile } from "../api/profile.api";
import { useAuth } from "../context/AuthContext";

interface ProfileData {
  username: string;
  displayName: string;
  email: string;
  lists: { id: number; name: string }[];
  recentRatings: { movieId: number; movieTitle: string; rating: number }[];
  recentReviews: { reviewId: number; movieId: number; movieTitle: string; content: string }[];
}

export default function Profile() {
  const { isAuth } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuth) return;
    getProfile().then(({ data }) => {
      setProfile(data);
      setDisplayName(data.displayName ?? "");
    }).catch(() => setError("Не вдалося завантажити профіль."));
  }, [isAuth]);

  if (!isAuth) return <Navigate to="/login" replace />;

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await updateProfile({ displayName });
      setProfile(data);
      setMessage("Ім'я оновлено.");
    } catch { setError("Не вдалося зберегти ім'я."); }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Пароль змінено.");
    } catch { setError("Перевірте поточний і новий пароль."); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>Мій профіль</h1>
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    {!profile && !error && <p>Завантаження...</p>}
    {profile && <>
      <p>@{profile.username} · {profile.email}</p>
      <form onSubmit={saveName}>
        <label>Відображуване ім'я <input value={displayName} minLength={2} maxLength={60} onChange={e => setDisplayName(e.target.value)} /></label>
        <button type="submit">Зберегти</button>
      </form>
      <form onSubmit={savePassword} style={{ marginTop: 24 }}>
        <h2>Змінити пароль</h2>
        <label>Поточний пароль <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>
        <label> Новий пароль <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <button type="submit">Змінити</button>
      </form>
      <h2>Списки</h2>
      <ul>{profile.lists.map(list => <li key={list.id}><Link to="/lists">{list.name}</Link></li>)}</ul>
      <h2>Останні оцінки</h2>
      <ul>{profile.recentRatings.map(item => <li key={item.movieId}><Link to={`/films/${item.movieId}`}>{item.movieTitle}</Link> — {item.rating}/5</li>)}</ul>
      <h2>Останні огляди</h2>
      <ul>{profile.recentReviews.map(item => <li key={item.reviewId}><Link to={`/films/${item.movieId}`}>{item.movieTitle}</Link>: {item.content}</li>)}</ul>
    </>}
  </main>;
}
