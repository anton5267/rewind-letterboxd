import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./ForgotPassword.module.css";
import { forgotPassword } from "../api/auth.api";
import { useLocale } from "../i18n";
import { useAuthFieldValidation } from "./useAuthFieldValidation";
import { getAuthReturnTo } from "./authReturnTo";
import lockDesktop from "./assets/forgot-lock-desktop.svg";
import lockFront from "./assets/forgot-lock-front.svg";
import lockBack from "./assets/forgot-lock-back.svg";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { path, t, lang } = useLocale();
  const validation = useAuthFieldValidation();
  const location = useLocation();
  const returnLocation = getAuthReturnTo(location.state, [path("/profile"), path("/messages"), path("/notifications")]);

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(0);
  const successMessage = useRef<HTMLParagraphElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const activeRequest = useRef<object | null>(null);
  const focusGeneration = useRef(0);
  const pendingFocus = useRef<{ scope: number; origin: HTMLElement | null; target: "success" | "error" } | null>(null);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current = null;
      focusGeneration.current += 1;
      pendingFocus.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    focusGeneration.current += 1;
    pendingFocus.current = null;
  }, [lang, location.key]);

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || loading || (pending.target === "success" ? !message : !error)) return;
    const frame = window.requestAnimationFrame(() => {
      if (pendingFocus.current !== pending) return;
      pendingFocus.current = null;
      if (!mounted.current || focusGeneration.current !== pending.scope) return;
      if (document.activeElement !== document.body && document.activeElement !== pending.origin) return;
      (pending.target === "success" ? successMessage.current : errorMessage.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [error, message, loading, submission, lang, location.key]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRequest.current !== null) return;
    const request = {};
    activeRequest.current = request;
    const scope = focusGeneration.current;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const origin = submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isCurrent = () => mounted.current && activeRequest.current === request;
    const requestFocus = (target: "success" | "error") => {
      if (isCurrent() && focusGeneration.current === scope) pendingFocus.current = { scope, origin, target };
    };
    pendingFocus.current = null;
    setSubmission(value => value + 1);
    setMessage(false);
    setError(false);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      if (!isCurrent()) return;
      setMessage(true);
      requestFocus("success");
    } catch {
      if (!isCurrent()) return;
      setError(true);
      requestFocus("error");
    } finally {
      if (isCurrent()) { activeRequest.current = null; setLoading(false); }
    }
  };

  return (
    <main className={`${styles.page} ${styles.forgotPage}`} data-rewind-auth-page aria-labelledby="forgot-password-title" aria-busy={loading}>
      <div className={styles.card}>

        <button
          type="button"
          className={styles.back}
          aria-label={t("return")}
          onClick={() => navigate(path("/login"), { state: returnLocation ? { returnTo: returnLocation } : undefined })}
        >
          <svg className={styles.backIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="10.5" />
            <path d="M13 8 9 12l4 4M9 12h9" />
          </svg>
          <span className={styles.backText}>{t("return")}</span>
        </button>

        <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
        <div className={styles.lockIllustration} aria-hidden="true"><img className={styles.lockDesktop} src={lockDesktop} alt="" /><img className={styles.lockBack} src={lockBack} alt="" /><img className={styles.lockFront} src={lockFront} alt="" /></div>
        <h1 className={styles.title} id="forgot-password-title">{t("forgotTitle")}</h1>

        <p className={styles.text}>
          {t("forgotDescription")}
        </p>

        <form className={styles.form} onSubmit={submit} onInvalidCapture={validation.onInvalid} aria-busy={loading}>
          <label className={styles.fieldLabel} htmlFor="forgot-password-email">{t("email")}</label>
          <input
            id="forgot-password-email"
            name="email"
            className={styles.input}
            type="email"
            placeholder={t("email")}
            value={email}
            disabled={loading}
            onChange={(e) => { setEmail(e.target.value); validation.onInput(e.currentTarget); }}
            autoComplete="email"
            maxLength={150}
            aria-invalid={Boolean(error) || validation.invalid("forgot-password-email")}
            aria-describedby={validation.describedBy("forgot-password-email", error ? "forgot-password-error" : undefined)}
            required
          />
          {validation.message("forgot-password-email") && <p className={styles.validation} id="forgot-password-email-validation">{validation.message("forgot-password-email")}</p>}

          {message && <p ref={successMessage} tabIndex={-1} className={styles.success} role="status">{t("resetSent")}</p>}
          {error && <p ref={errorMessage} tabIndex={-1} className={styles.error} id="forgot-password-error" role="alert">{t("forgotRequestError")}</p>}

          <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>
            {loading ? t("loading") : t("resetPassword")}
          </button>
        </form>

        <div className={styles.divider} aria-hidden="true"><span>{t("dividerOr")}</span></div>

        {/* → REGISTER */}
        <Link className={styles.create} to={path("/register")} state={returnLocation ? { returnTo: returnLocation } : undefined}>{t("createAccount")}</Link>

      </div>
    </main>
  );
}
