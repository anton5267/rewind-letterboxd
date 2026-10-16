import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { useLocale } from "../i18n";

export default function ResetPassword() {
  const { path, t } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) { setError(t("confirmMismatch")); return; }
    try {
      await resetPassword(token, password);
      setDone(true);
      setError("");
    } catch { setError(t("resetInvalid")); }
  };

  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("resetTitle")}</h1>
    {!token && <p role="alert">{t("resetMissing")}</p>}
    {done ? <p role="status">{t("resetSuccess")} <Link to={path("/login")}>{t("login")}</Link></p> : token && <form onSubmit={submit}>
      <p><label>{t("newPassword")} <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label></p>
      <p><label>{t("confirmPassword")} <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} /></label></p>
      {error && <p role="alert">{error}</p>}
      <button type="submit">{t("changePassword")}</button>
    </form>}
  </main>;
}
