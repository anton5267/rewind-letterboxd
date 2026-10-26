import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";
import { useLocale } from "../i18n";

function getProfileReturnLocation(state: unknown, profilePath: string): string | null {
  if (typeof state !== "object" || state === null || !("returnTo" in state)) return null;
  const { returnTo } = state;
  if (typeof returnTo !== "string" || /[\u0000-\u001f\u007f\\]/.test(returnTo)) return null;

  // Only Profile supplies this state. Accept its exact localized pathname,
  // preserving settings queries and form anchors without accepting external URLs.
  const pathname = returnTo.split(/[?#]/, 1)[0];
  return pathname === profilePath || pathname === `${profilePath}/` ? returnTo : null;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { path, t } = useLocale();
  const returnLocation = getProfileReturnLocation(location.state, path("/profile"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const destination = useRef({ to: returnLocation ?? path("/films"), replace: returnLocation !== null });
  destination.current = { to: returnLocation ?? path("/films"), replace: returnLocation !== null };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (error && !loading) errorMessage.current?.focus();
  }, [error, loading]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError(false);
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (mounted.current) navigate(destination.current.to, { replace: destination.current.replace });
    } catch {
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  return (
    <main className={`${styles.page} ${styles.loginPage}`} data-rewind-auth-page aria-labelledby="login-page-title" aria-busy={loading}>
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
          <div className={styles.passwordField}>
            <input
              id="login-password"
              name="password"
              type={passwordVisible ? "text" : "password"}
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
            <button
              type="button"
              className={styles.passwordVisibility}
              aria-label={passwordVisible ? t("hidePassword") : t("showPassword")}
              aria-pressed={passwordVisible}
              onClick={() => setPasswordVisible((visible) => !visible)}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                <circle cx="12" cy="12" r="3" />
                {passwordVisible && <path d="m4 4 16 16" />}
              </svg>
            </button>
          </div>
          <div className={styles.row}>
            <Link className={styles.forgot} to={path("/forgot-password")}>
              {t("forgotPassword")}
            </Link>
          </div>
          {error && <p ref={errorMessage} tabIndex={-1} className={styles.error} id="login-error" role="alert">{t("loginError")}</p>}
          <button type="submit" className={styles.button} aria-busy={loading} disabled={loading}>
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>
        <p className={styles.footer}>
          {t("noAccount")} <Link to={path("/register")}>{t("createOne")}</Link>
        </p>
      </div>
    </main>
  );
}
