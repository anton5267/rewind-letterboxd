import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";
import { useLocale } from "../i18n";
import { useAuthFieldValidation } from "./useAuthFieldValidation";
import { getAuthReturnTo } from "./authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { path, t, lang } = useLocale();
  const validation = useAuthFieldValidation();
  const returnLocation = getAuthReturnTo(location.state, [path("/profile"), path("/messages"), path("/notifications")]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const busy = useRef(false);
  const focusScope = useRef(0);
  const errorFocus = useRef<{ scope: number; origin: Element | null } | null>(null);
  const destination = useRef({ to: returnLocation ?? path("/films"), replace: returnLocation !== null });
  destination.current = { to: returnLocation ?? path("/films"), replace: returnLocation !== null };

  useLayoutEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; errorFocus.current = null; };
  }, []);

  useLayoutEffect(() => { focusScope.current += 1; errorFocus.current = null; }, [lang, location.key]);

  useEffect(() => {
    const intent = errorFocus.current;
    if (!error || loading || !intent) return;
    const frame = window.requestAnimationFrame(() => {
      if (!mounted.current || errorFocus.current !== intent || focusScope.current !== intent.scope) return;
      errorFocus.current = null;
      if (document.activeElement === document.body || document.activeElement === intent.origin) errorMessage.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, loading]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    const intent = { scope: focusScope.current, origin: document.activeElement };
    errorFocus.current = null;
    setError(false);
    setLoading(true);
    try {
      await login(email.trim(), password);
      if (mounted.current) navigate(destination.current.to, { replace: destination.current.replace });
    } catch {
      if (mounted.current) { errorFocus.current = intent; setError(true); }
    } finally {
      if (mounted.current) { busy.current = false; setLoading(false); }
    }
  };

  return (
    <main className={`${styles.page} ${styles.loginPage}`} data-rewind-auth-page aria-labelledby="login-page-title" aria-busy={loading}>
      <div className={styles.card}>
        <button type="button" className={styles.mobileBack} aria-label={t("return")} onClick={() => navigate(path("/home"))}>←</button>
        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <h1 className={styles.title} id="login-page-title">{t("welcome")}</h1>
        {searchParams.get("passwordChanged") === "1" && <p className={styles.success} role="status">{t("passwordChangedSignIn")}</p>}
        <form className={styles.form} onSubmit={submit} onInvalidCapture={validation.onInvalid} aria-busy={loading}>
          <label className={styles.fieldLabel} htmlFor="login-email">{t("email")}</label>
          <input
            id="login-email"
            name="email"
            type="email"
            placeholder={t("email")}
            className={styles.input}
            value={email}
            disabled={loading}
            onChange={(event) => { setEmail(event.target.value); validation.onInput(event.currentTarget); }}
            autoComplete="email"
            maxLength={150}
            aria-invalid={Boolean(error) || validation.invalid("login-email")}
            aria-describedby={validation.describedBy("login-email", error ? "login-error" : undefined)}
            required
          />
          {validation.message("login-email") && <p className={styles.validation} id="login-email-validation">{validation.message("login-email")}</p>}
          <label className={styles.fieldLabel} htmlFor="login-password">{t("password")}</label>
          <div className={styles.passwordField}>
            <input
              id="login-password"
              name="password"
              type={passwordVisible ? "text" : "password"}
              placeholder={t("password")}
              className={styles.input}
              value={password}
              disabled={loading}
              onChange={(event) => { setPassword(event.target.value); validation.onInput(event.currentTarget); }}
              autoComplete="current-password"
              minLength={6}
              maxLength={100}
              aria-invalid={Boolean(error) || validation.invalid("login-password")}
              aria-describedby={validation.describedBy("login-password", error ? "login-error" : undefined)}
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
          {validation.message("login-password") && <p className={styles.validation} id="login-password-validation">{validation.message("login-password")}</p>}
          <div className={styles.row}>
            <Link className={styles.forgot} to={path("/forgot-password")} state={returnLocation ? { returnTo: returnLocation } : undefined}>
              {t("forgotPassword")}
            </Link>
          </div>
          {error && <p ref={errorMessage} tabIndex={-1} className={styles.error} id="login-error" role="alert">{t("loginError")}</p>}
          <button type="submit" className={styles.button} aria-busy={loading} disabled={loading}>
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>
        <p className={styles.footer}>
          {t("noAccount")} <Link to={path("/register")} state={returnLocation ? { returnTo: returnLocation } : undefined}>{t("createOne")}</Link>
        </p>
      </div>
    </main>
  );
}
