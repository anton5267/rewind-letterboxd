import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";
import { useLocale } from "../i18n";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { path, t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(path("/films"));
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${styles.page} ${styles.loginPage}`} aria-labelledby="login-page-title" aria-busy={loading}>
      <div className={styles.card}>
        <button type="button" className={styles.mobileBack} aria-label={t("return")} onClick={() => navigate(path("/home"))}>←</button>
        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <h1 className={styles.title} id="login-page-title">{t("welcome")}</h1>
        {searchParams.get("passwordChanged") === "1" && <p className={styles.success} role="status">{t("passwordChangedSignIn")}</p>}
        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className="srOnly" htmlFor="login-email">{t("email")}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder={t("email")}
            className={styles.input}
            value={email}
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            maxLength={150}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
          <label className="srOnly" htmlFor="login-password">{t("password")}</label>
          <input
            id="login-password"
            name="password"
            type="password"
            placeholder={t("password")}
            className={styles.input}
            value={password}
            disabled={loading}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            minLength={6}
            maxLength={100}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
          <div className={styles.row}>
            <Link className={styles.forgot} to={path("/forgot-password")}>
              {t("forgotPassword")}
            </Link>
          </div>
          {error && <p className={styles.error} id="login-error" role="alert">{error}</p>}
          <button type="submit" className={styles.button} aria-busy={loading} disabled={loading}>
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>
        <div className={styles.social} aria-hidden="true">
          <span>{t("signInWith")}</span>
          <span className={styles.socialMark}>G</span>
        </div>
        <p className={styles.footer}>
          {t("noAccount")} <Link to={path("/register")}>{t("createOne")}</Link>
        </p>
      </div>
    </main>
  );
}
