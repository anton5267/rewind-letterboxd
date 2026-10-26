import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth.api";
import { useLocale } from "../i18n";
import styles from "./ResetPassword.module.css";
import { isPasswordWithinByteLimit, MAX_PASSWORD_BYTES } from "../utils/passwordValidation";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  return <ResetPasswordForm key={token} token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const { path, t, lang } = useLocale();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<"passwordByteLimitError" | "confirmMismatch" | "resetInvalid" | "resetRequestError" | null>(null);
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState(0);
  const successMessage = useRef<HTMLParagraphElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const mounted = useRef(false);
  const request = useRef(0);
  const busy = useRef(false);
  const focusIntent = useRef<{ origin: HTMLElement | null } | null>(null);

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current += 1;
      focusIntent.current = null;
    };
  }, []);

  useLayoutEffect(() => { focusIntent.current = null; }, [lang, location.key]);

  useEffect(() => {
    const intent = focusIntent.current;
    if (!intent || loading || (!done && !error)) return;
    const frame = window.requestAnimationFrame(() => {
      if (!mounted.current || focusIntent.current !== intent) return;
      focusIntent.current = null;
      if (document.activeElement !== document.body && document.activeElement !== intent.origin) return;
      (done ? successMessage.current : errorMessage.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [done, error, loading, submission, lang, location.key]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    focusIntent.current = { origin: submitter instanceof HTMLElement ? submitter : document.activeElement instanceof HTMLElement ? document.activeElement : null };
    setSubmission(value => value + 1);
    setError(null);
    if (!isPasswordWithinByteLimit(password) || !isPasswordWithinByteLimit(confirm)) { setError("passwordByteLimitError"); return; }
    if (password !== confirm) { setError("confirmMismatch"); return; }
    busy.current = true;
    const currentRequest = ++request.current;
    const isCurrent = () => mounted.current && request.current === currentRequest;
    setLoading(true);
    try {
      await resetPassword(token, password);
      if (isCurrent()) setDone(true);
    } catch (cause) {
      if (isCurrent()) setError(isAxiosError(cause) && cause.response?.status === 400 ? "resetInvalid" : "resetRequestError");
    }
    finally {
      if (isCurrent()) {
        busy.current = false;
        setLoading(false);
      }
    }
  };

  return <main className={styles.page} data-rewind-auth-page aria-labelledby="reset-password-title" aria-busy={loading}>
    <section className={styles.card}>
      <Link className={styles.back} to={path("/login")}>← {t("return")}</Link>
      <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
      <h1 className={styles.title} id="reset-password-title">{t("resetTitle")}</h1>
      {!token && <p className={styles.missing} role="alert">{t("resetMissing")}</p>}
      {done ? <p ref={successMessage} className={styles.success} role="status" tabIndex={-1}>{t("resetSuccess")} <Link to={path("/login")}>{t("login")}</Link></p> : token && <form className={styles.form} onSubmit={submit} aria-busy={loading}>
        <label className={styles.field} htmlFor="reset-password">
          {t("newPassword")}
          <input className={styles.input} id="reset-password" name="newPassword" type="password" required disabled={loading} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`reset-password-hint${error ? " reset-password-error" : ""}`} />
        </label>
        <p className={styles.passwordHint} id="reset-password-hint">{t("passwordByteLimitHint")}</p>
        <label className={styles.field} htmlFor="reset-password-confirm">
          {t("confirmPassword")}
          <input className={styles.input} id="reset-password-confirm" name="confirmPassword" type="password" required disabled={loading} minLength={8} maxLength={MAX_PASSWORD_BYTES} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`reset-password-hint${error ? " reset-password-error" : ""}`} />
        </label>
        {error && <p ref={errorMessage} tabIndex={-1} className={styles.error} id="reset-password-error" role="alert">{t(error)}</p>}
        <button className={styles.button} type="submit" aria-busy={loading} disabled={loading}>{loading ? t("loading") : t("changePassword")}</button>
      </form>}
    </section>
  </main>;
}
