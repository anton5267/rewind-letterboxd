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
    <main className={styles.page}>
      <div className={styles.card}>

        {/* ← BACK TO LOGIN */}
        <button
          type="button"
          className={styles.back}
          onClick={() => navigate(path("/login"))}
        >
          ← {t("return")}
        </button>

        <div className={styles.icon}>🔒</div>

        <h1 className={styles.title}>{t("forgotTitle")}</h1>

        <p className={styles.text}>
          {t("forgotDescription")}
        </p>

        <form onSubmit={submit} aria-busy={loading}>
          <input
            className={styles.input}
            type="email"
            placeholder={t("email")}
            aria-label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={150}
            required
          />

          {message && <p className={styles.success} role="status">{message}</p>}
          {error && <p className={styles.error} role="alert">{error}</p>}

          <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>
            {loading ? t("loading") : t("resetPassword")}
          </button>
        </form>

        <div className={styles.divider}>/</div>

        {/* → REGISTER */}
        <Link className={styles.create} to={path("/register")}>{t("createAccount")}</Link>

      </div>
    </main>
  );
}
