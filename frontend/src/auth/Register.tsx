import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { register } from "../api/auth.api";
import { useLocale } from "../i18n";
import { isPasswordWithinByteLimit, MAX_PASSWORD_BYTES } from "../utils/passwordValidation";

export default function Register() {
  const navigate = useNavigate();
  const { path, t } = useLocale();

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const successHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (success) successHeading.current?.focus();
  }, [success]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    if (!isPasswordWithinByteLimit(password)) { setError(t("passwordByteLimitError")); return; }
    setLoading(true);

    try {
      await register(email.trim(), password, nickname.trim());
      setSuccess(true);
    } catch {
      setError(t("registrationError"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className={`${styles.page} ${styles.registerPage}`} aria-labelledby="register-success-title" aria-busy={false}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
          <h1 ref={successHeading} tabIndex={-1} className={styles.title} id="register-success-title" aria-live="polite">{t("accountCreated")}</h1>

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

  return (
    <main className={`${styles.page} ${styles.registerPage}`} aria-labelledby="register-page-title" aria-busy={loading}>
      <div className={styles.card}>
        <button type="button" className={styles.mobileBack} aria-label={t("return")} onClick={() => navigate(path("/home"))}>←</button>
        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <h1 className={styles.title} id="register-page-title">{t("createAccount")}</h1>

        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className="srOnly" htmlFor="register-username">{t("username")}</label>
          <input
            id="register-username"
            name="username"
            className={styles.input}
            placeholder={t("username")}
            value={nickname}
            disabled={loading}
            onChange={(e) => setNickname(e.target.value)}
            autoComplete="username"
            minLength={3}
            maxLength={50}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "register-error" : undefined}
            required
          />

          <label className="srOnly" htmlFor="register-email">{t("email")}</label>
          <input
            id="register-email"
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
            aria-describedby={error ? "register-error" : undefined}
            required
          />

          <label className="srOnly" htmlFor="register-password">{t("password")}</label>
          <div className={styles.passwordField}>
            <input
              id="register-password"
              name="password"
              className={styles.input}
              type={passwordVisible ? "text" : "password"}
              placeholder={t("password")}
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              maxLength={MAX_PASSWORD_BYTES}
              aria-invalid={Boolean(error)}
              aria-describedby={`register-password-hint${error ? " register-error" : ""}`}
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
          <p className={styles.passwordHint} id="register-password-hint">{t("passwordByteLimitHint")}</p>

          {error && <p className={styles.error} id="register-error" role="alert">{error}</p>}

          <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>
            {loading ? t("loading") : t("createAccount")}
          </button>
        </form>

        <div className={styles.social} aria-hidden="true">
          <span>{t("signInWith")}</span>
          <span className={styles.socialMark}>G</span>
        </div>

        <p className={styles.footer}>
          {t("alreadyAccount")} <Link to={path("/login")}>{t("login")}</Link>
        </p>
      </div>
    </main>
  );
}
