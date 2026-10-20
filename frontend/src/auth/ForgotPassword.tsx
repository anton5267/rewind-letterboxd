import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ForgotPassword.module.css";
import { forgotPassword } from "../api/auth.api";
import { useLocale } from "../i18n";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { path, t } = useLocale();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setMessage(t("resetSent"));
    } catch {
      setError(t("resetInvalid"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page} aria-labelledby="forgot-password-title" aria-busy={loading}>
      <div className={styles.card}>

        <button
          type="button"
          className={styles.back}
          onClick={() => navigate(path("/login"))}
        >
          ← {t("return")}
        </button>

        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <h1 className={styles.title} id="forgot-password-title">{t("forgotTitle")}</h1>

        <p className={styles.text}>
          {t("forgotDescription")}
        </p>

        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className="srOnly" htmlFor="forgot-password-email">{t("email")}</label>
          <input
            id="forgot-password-email"
            name="email"
            className={styles.input}
            type="email"
            placeholder={t("email")}
            value={email}
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            maxLength={150}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "forgot-password-error" : undefined}
            required
          />

          {message && <p className={styles.success} role="status">{message}</p>}
          {error && <p className={styles.error} id="forgot-password-error" role="alert">{error}</p>}

          <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>
            {loading ? t("loading") : t("resetPassword")}
          </button>
        </form>

        <div className={styles.divider} aria-hidden="true" />

        {/* → REGISTER */}
        <Link className={styles.create} to={path("/register")}>{t("createAccount")}</Link>

      </div>
    </main>
  );
}
