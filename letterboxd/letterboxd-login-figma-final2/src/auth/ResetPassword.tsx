import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { useLocale } from "../i18n";
import styles from "./ResetPassword.module.css";

export default function ResetPassword() {
  const { path, t } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (password !== confirm) { setError(t("confirmMismatch")); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch { setError(t("resetInvalid")); }
    finally { setLoading(false); }
  };

  return <main className={styles.page}>
    <section className={styles.card}>
      <h1 className={styles.title} id="reset-password-title">{t("resetTitle")}</h1>
      {!token && <p className={styles.missing} role="alert">{t("resetMissing")}</p>}
      {done ? <p className={styles.success} role="status">{t("resetSuccess")} <Link to={path("/login")}>{t("login")}</Link></p> : token && <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <label className={styles.field} htmlFor="reset-password">
          {t("newPassword")}
          <input className={styles.input} id="reset-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(error)} />
        </label>
        <label className={styles.field} htmlFor="reset-password-confirm">
          {t("confirmPassword")}
          <input className={styles.input} id="reset-password-confirm" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} aria-invalid={Boolean(error)} />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} type="submit" disabled={loading}>{loading ? t("loading") : t("changePassword")}</button>
      </form>}
    </section>
  </main>;
}
