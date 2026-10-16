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
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(path("/films"));
    } catch {
      setError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("welcome")}</h1>
        {searchParams.get("passwordChanged") === "1" && <p role="status">{t("passwordChangedSignIn")}</p>}
        <form onSubmit={submit}>
          <input
            type="email"
            placeholder={t("email")}
            aria-label={t("email")}
            className={styles.input}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t("password")}
            aria-label={t("password")}
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <div className={styles.row}>
            <Link className={styles.forgot} to={path("/forgot-password")}>
              {t("forgotPassword")}
            </Link>
          </div>
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>
        <p className={styles.footer}>
          {t("noAccount")} <Link to={path("/register")}>{t("createOne")}</Link>
        </p>
      </div>
    </div>
  );
}
