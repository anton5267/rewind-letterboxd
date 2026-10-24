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
    <main className={`${styles.page} ${styles.forgotPage}`} aria-labelledby="forgot-password-title" aria-busy={loading}>
      <div className={styles.card}>

        <button
          type="button"
          className={styles.back}
          aria-label={t("return")}
          onClick={() => navigate(path("/login"))}
        >
          <svg className={styles.backIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10.5" />
            <path d="M13 8 9 12l4 4M9 12h9" />
          </svg>
          <span className={styles.backText}>{t("return")}</span>
        </button>

        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <svg className={styles.lockIllustration} viewBox="0 0 89 102" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="forgot-lock-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b4b4b6" />
              <stop offset="0.38" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dbdbdd" />
            </linearGradient>
            <filter id="forgot-lock-shadow" x="-25%" y="-20%" width="150%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="5.25" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>
          <path
            d="M28 46V29a16.5 16.5 0 0 1 33 0v17h4a7 7 0 0 1 7 7v39a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V53a7 7 0 0 1 7-7h10Z"
            fill="#e5e5e5"
            fillOpacity="0.2"
            stroke="url(#forgot-lock-stroke)"
            strokeOpacity="0.1"
            strokeWidth="2"
          />
          <path
            d="M33 50V33a16.5 16.5 0 0 1 33 0v17h4a7 7 0 0 1 7 7v39a7 7 0 0 1-7 7H23a7 7 0 0 1-7-7V57a7 7 0 0 1 7-7h10Z"
            fill="#222222"
            fillOpacity="0.66"
            stroke="url(#forgot-lock-stroke)"
            strokeOpacity="0.1"
            strokeWidth="2"
            filter="url(#forgot-lock-shadow)"
          />
        </svg>
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

        <div className={styles.divider} aria-hidden="true"><span>Or</span></div>

        {/* → REGISTER */}
        <Link className={styles.create} to={path("/register")}>{t("createAccount")}</Link>

      </div>
    </main>
  );
}
