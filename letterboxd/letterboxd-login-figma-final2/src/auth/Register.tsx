import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { register } from "../api/auth.api";
import { useLocale } from "../i18n";

export default function Register() {
  const navigate = useNavigate();
  const { path, t } = useLocale();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await register(email, password, nickname);
      setSuccess(true);
    } catch {
      setError(t("registrationError"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUCCESS SCREEN
  if (success) {
    return (
      <main className={styles.page}>
        <div className={styles.card}>
          <h2 className={styles.title} aria-live="polite">{t("accountCreated")} ✅</h2>

          <button
            type="button"
            className={styles.button}
            onClick={() => navigate(path("/login"))}
          >
            {t("goToLogin")}
          </button>
        </div>
      </main>
    );
  }

  // ✅ REGISTER FORM
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("createAccount")}</h1>

        <form onSubmit={submit} aria-busy={loading}>
          <input
            className={styles.input}
            placeholder={t("username")}
            aria-label={t("username")}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="email"
            placeholder={t("email")}
            aria-label={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder={t("password")}
            aria-label={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>
            {loading ? t("loading") : t("createAccount")}
          </button>
        </form>

        {/* ✅ BACK TO LOGIN */}
        <p className={styles.footer}>
          {t("alreadyAccount")} <Link to={path("/login")}>{t("login")}</Link>
        </p>
      </div>
    </main>
  );
}
