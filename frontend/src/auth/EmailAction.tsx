import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, verifySupabaseEmailAction } from "../api/auth.api";
import { confirmEmailChange } from "../api/emailChange.api";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../i18n";
import styles from "./EmailAction.module.css";

type Action = "signup" | "recovery" | "email_change";

export default function EmailAction() {
  const navigate = useNavigate();
  const { path, t } = useLocale();
  const { isAuth } = useAuth();
  const [action, setAction] = useState<Action | null>(null);
  const [tokenHash, setTokenHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [emailChangeStatus, setEmailChangeStatus] = useState<"pending" | "complete" | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    // Keep one-time credentials in the fragment: browsers never send fragments
    // in HTTP requests, referrers, or static-host access logs.
    const params = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const source = params.has("token_hash") || params.has("rewind_action") ? params : query;
    const requestedAction = source.get("rewind_action");
    const requestedType = source.get("type");
    const hash = source.get("token_hash") ?? "";
    const supported = (
      (requestedAction === "signup" && requestedType === "email")
      || (requestedAction === "recovery" && requestedType === "recovery")
      || (requestedAction === "email_change" && requestedType === "email_change")
    );
    window.history.replaceState(window.history.state, "", window.location.pathname);
    if (supported) setAction(requestedAction as Action);
    if (supported && hash) {
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
      if (action === "email_change") {
        const complete = await confirmEmailChange(tokenHash);
        setTokenHash("");
        if (!complete) {
          setEmailChangeStatus("pending");
          return;
        }
        verified = true;
        await getCurrentUser();
        setEmailChangeStatus("complete");
        return;
      }
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
      setProfileError(verified && action !== "recovery");
      setTokenHash("");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  let title = t("emailConfirmTitle");
  let description = t("emailConfirmBody");
  let button = t("emailConfirmAction");
  let returnTarget = path("/register");
  let returnLabel = t("emailActionRegisterAgain");
  if (action === "recovery") {
    title = t("emailRecoveryTitle");
    description = t("emailRecoveryBody");
    button = t("emailRecoveryConfirm");
    returnTarget = path("/forgot-password");
    returnLabel = t("emailActionRequestReset");
  }
  if (action === "email_change") {
    title = t("emailChangeConfirmTitle");
    description = t("emailChangeConfirmBody");
    button = t("emailConfirmAction");
    returnTarget = isAuth ? `${path("/profile")}?settings=profile` : path("/login");
    returnLabel = isAuth ? t("settings") : t("login");
  }
  if (emailChangeStatus) {
    title = t(emailChangeStatus === "pending" ? "emailChangePendingTitle" : "emailChangeCompleteTitle");
    description = t(emailChangeStatus === "pending" ? "emailChangePendingBody" : "emailChangeCompleteBody");
  }
  if (error) {
    title = t(profileError ? "emailActionProfileTitle" : "emailActionExpiredTitle");
    description = t(profileError ? "emailActionProfileError" : "emailActionExpiredBody");
    if (profileError) { returnTarget = path("/login"); returnLabel = t("login"); }
  }

  return <main className={styles.page} data-rewind-auth-page aria-labelledby="email-action-title" aria-busy={loading}>
    <section className={styles.card}>
      <p className={styles.eyebrow}>{t("accountEyebrow")}</p>
      <h1 className={styles.title} id="email-action-title">{title}</h1>
      <p className={styles.description} role={error ? "alert" : emailChangeStatus ? "status" : undefined}>
        {description}
      </p>
      {error || emailChangeStatus ? <Link className={styles.button} to={returnTarget}>
        {returnLabel}
      </Link> : <button className={styles.button} type="button" disabled={!tokenHash || loading} onClick={confirm}>
        {loading ? t("loading") : button}
      </button>}
      <p className={styles.footer}><Link to={path("/login")}>{t("login")}</Link></p>
    </section>
  </main>;
}
