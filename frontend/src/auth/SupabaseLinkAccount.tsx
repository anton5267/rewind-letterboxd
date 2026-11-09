import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { completeSupabaseLink } from "../api/auth.api";
import { useLocale } from "../i18n";
import styles from "./SupabaseLinkAccount.module.css";

export default function SupabaseLinkAccount() {
  const { path, t } = useLocale();
  const [accessToken, setAccessToken] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("access_token");
    const errorValue = fragment.get("error_description");
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    if (fragment.get("type") === "signup" && token) setAccessToken(token);
    else if (errorValue || token) setError(true);
  }, []);

  useEffect(() => {
    if (!success) return;
    statusRef.current?.focus();
  }, [success]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessToken || loading) return;
    setLoading(true);
    setError(false);
    try {
      await completeSupabaseLink(accessToken, currentPassword);
      setAccessToken("");
      setCurrentPassword("");
      setSuccess(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return <main className={styles.page}>
    <section className={styles.card} aria-labelledby="supabase-link-heading">
      <h1 className={styles.title} id="supabase-link-heading">{t("supabaseLinkCompleteTitle")}</h1>
      {success ? <>
        <p ref={statusRef} className={styles.success} role="status" tabIndex={-1}>{t("supabaseLinkSuccess")}</p>
        <Link className={styles.button} to={path("/login")}>{t("login")}</Link>
      </> : accessToken ? <>
        <p>{t("supabaseLinkCompleteHint")}</p>
        <form className={styles.form} onSubmit={submit} aria-busy={loading}>
          <label className={styles.fieldLabel} htmlFor="supabase-link-password">{t("currentPassword")}</label>
          <input className={styles.input} id="supabase-link-password" type="password" required disabled={loading} autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
          {error && <p className={styles.error} role="alert">{t("supabaseLinkCompleteError")}</p>}
          <button className={styles.button} type="submit" disabled={loading}>{loading ? t("saving") : t("supabaseLinkComplete")}</button>
        </form>
      </> : <>
        <p className={styles.error} role="alert">{t("supabaseLinkMissingToken")}</p>
        <Link to={path("/login")}>{t("login")}</Link>
      </>}
    </section>
  </main>;
}
