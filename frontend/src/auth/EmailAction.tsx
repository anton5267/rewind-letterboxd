import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, verifySupabaseEmailAction } from "../api/auth.api";
import { useLocale } from "../i18n";
import styles from "./EmailAction.module.css";

type Action = "signup" | "recovery";

export default function EmailAction() {
  const navigate = useNavigate();
  const { path, t } = useLocale();
  const [action, setAction] = useState<Action | null>(null);
  const [tokenHash, setTokenHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    // Keep one-time credentials in the fragment: browsers never send fragments
    // in HTTP requests, referrers, or static-host access logs.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const source = params.has("token_hash") ? params : query;
    const requestedAction = source.get("rewind_action");
    const requestedType = source.get("type");
    const hash = source.get("token_hash") ?? "";
    const valid = Boolean(hash) && (
      (requestedAction === "signup" && requestedType === "email")
      || (requestedAction === "recovery" && requestedType === "recovery")
    );
    window.history.replaceState(window.history.state, "", window.location.pathname);
    if (valid) {
      setAction(requestedAction as Action);
      setTokenHash(hash);
    } else {
      setError(true);
    }
  }, []);

  const confirm = async () => {
    if (!action || !tokenHash || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    setProfileError(false);
    let verified = false;
    try {
      await verifySupabaseEmailAction(tokenHash, action === "signup" ? "email" : "recovery");
      verified = true;
      setTokenHash("");
      if (action === "recovery") {
        navigate(path("/reset-password"), { replace: true });
        return;
      }
      await getCurrentUser();
      navigate(path("/films"), { replace: true });
    } catch {
      setError(true);
      setProfileError(verified && action === "signup");
      setTokenHash("");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return <main className={styles.page} data-rewind-auth-page aria-labelledby="email-action-title" aria-busy={loading}>
    <section className={styles.card}>
      <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
      <h1 className={styles.title} id="email-action-title">{t(error ? (profileError ? "emailActionProfileTitle" : "emailActionExpiredTitle") : action === "recovery" ? "emailRecoveryTitle" : "emailConfirmTitle")}</h1>
      <p className={styles.description} role={error ? "alert" : undefined}>
        {t(error ? (profileError ? "emailActionProfileError" : "emailActionExpiredBody") : action === "recovery" ? "emailRecoveryBody" : "emailConfirmBody")}
      </p>
      {error ? <Link className={styles.button} to={path(profileError ? "/login" : action === "recovery" ? "/forgot-password" : "/register")}>
        {t(profileError ? "login" : action === "recovery" ? "emailActionRequestReset" : "emailActionRegisterAgain")}
      </Link> : <button className={styles.button} type="button" disabled={!tokenHash || loading} onClick={confirm}>
        {loading ? t("loading") : t(action === "recovery" ? "emailRecoveryConfirm" : "emailConfirmAction")}
      </button>}
      <p className={styles.footer}><Link to={path("/login")}>{t("login")}</Link></p>
    </section>
  </main>;
}
