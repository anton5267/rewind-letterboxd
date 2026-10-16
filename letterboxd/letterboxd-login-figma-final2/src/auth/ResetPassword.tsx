import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) { setError("Паролі не збігаються."); return; }
    try {
      await resetPassword(token, password);
      setDone(true);
      setError("");
    } catch { setError("Посилання недійсне або його час минув."); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>Встановити новий пароль</h1>
    {!token && <p role="alert">У посиланні немає токена відновлення.</p>}
    {done ? <p role="status">Пароль змінено. <Link to="/login">Увійти</Link></p> : token && <form onSubmit={submit}>
      <p><label>Новий пароль <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label></p>
      <p><label>Повторіть пароль <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label></p>
      {error && <p role="alert">{error}</p>}
      <button type="submit">Змінити пароль</button>
    </form>}
  </main>;
}
