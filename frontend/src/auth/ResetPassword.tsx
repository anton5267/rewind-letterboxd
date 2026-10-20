import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { useLocale } from "../i18n";
import styles from "./ResetPassword.module.css";
import { isPasswordWithinByteLimit, MAX_PASSWORD_BYTES } from "../utils/passwordValidation";

export default function ResetPassword() {
  const { path, t } = useLocale();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const successMessage = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (done) successMessage.current?.focus();
  }, [done]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!isPasswordWithinByteLimit(password) || !isPasswordWithinByteLimit(confirm)) { setError(t("passwordByteLimitError")); return; }
    if (password !== confirm) { setError(t("confirmMismatch")); return; }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch { setError(t("resetInvalid")); }
    finally { setLoading(false); }
  };

  return <main className={styles.page} aria-labelledby="reset-password-title" aria-busy={loading}>
    <section className={styles.card}>
      <Link className={styles.back} to={path("/login")}>← {t("return")}</Link>
      <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
      <h1 className={styles.title} id="reset-password-title">{t("resetTitle")}</h1>
      {!token && <p className={styles.missing} role="alert">{t("resetMissing")}</p>}
      {done ? <p ref={successMessage} className={styles.success} role="status" tabIndex={-1}>{t("resetSuccess")} <Link to={path("/login")}>{t("login")}</Link></p> : token && <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <label className={styles.field} htmlFor="reset-password">
          {t("newPassword")}
          <input className={styles.input} id="reset-password" name="newPassword" type="password" required disabled={loading} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`reset-password-hint${error ? " reset-password-error" : ""}`} />
        </label>
        <p className={styles.passwordHint} id="reset-password-hint">{t("passwordByteLimitHint")}</p>
        <label className={styles.field} htmlFor="reset-password-confirm">
          {t("confirmPassword")}
          <input className={styles.input} id="reset-password-confirm" name="confirmPassword" type="password" required disabled={loading} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`reset-password-hint${error ? " reset-password-error" : ""}`} />
        </label>
        {error && <p className={styles.error} id="reset-password-error" role="alert">{error}</p>}
        <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>{loading ? t("loading") : t("changePassword")}</button>
      </form>}
    </section>
  </main>;
}
