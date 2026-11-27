import { Link, useLocation } from "react-router-dom";
import { useLocale } from "../i18n";
import { getAuthReturnTo } from "./authReturnTo";
import filmImage from "./assets/entry-film.png";
import logo from "./assets/entry-logo.svg";
import styles from "./AuthEntry.module.css";

/** Selected entry frames605:2173/922:1788; direct auth URLs stay available. */
export default function AuthEntry() {
  const { lang, path, t } = useLocale();
  const location = useLocation();
  const returnTo = getAuthReturnTo(location.state, [path("/profile"), path("/messages"), path("/notifications"), path("/lists")]);
  const authState = returnTo ? { returnTo } : undefined;

  return <main className={styles.page} data-rewind-auth-page aria-labelledby="auth-entry-title">
    <section className={styles.card}>
      <Link className={styles.mobileBack} to={path("/home")} aria-label={t("return")}>←</Link>
      <div className={styles.introduction}>
        <h1 id="auth-entry-title">{t("authEntryGreeting")}</h1>
        <p>{t("authEntryIntro")}</p>
      </div>
      <div className={styles.film} aria-hidden="true"><img src={filmImage} alt="" /></div>
      <div className={styles.mobileLogo} aria-hidden="true"><img src={logo} alt="" /></div>
      <div className={styles.actions}>
        <Link className={styles.button} data-auth-entry-action="create-account" to={path("/register")} state={authState}>
          <span className={styles.buttonBacking} data-auth-entry-layer="backing" aria-hidden="true" />
          <span className={styles.buttonFace} data-auth-entry-layer="face" aria-hidden="true" />
          <span className={styles.buttonLabel}>{lang === "en" ? "Create Account" : t("createAccount")}</span>
        </Link>
        <Link className={styles.button} data-auth-entry-action="login" to={path("/login")} state={authState}>
          <span className={styles.buttonBacking} data-auth-entry-layer="backing" aria-hidden="true" />
          <span className={styles.buttonFace} data-auth-entry-layer="face" aria-hidden="true" />
          <span className={styles.buttonLabel}>{lang === "en" ? "Log In" : t("login")}</span>
        </Link>
      </div>
    </section>
  </main>;
}
