import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { useLocale } from "../i18n";
import styles from "./NotFound.module.css";

export default function NotFound() {
  const { path, t } = useLocale();
  const heroStyle = {
    "--not-found-hero-image": `url("${import.meta.env.BASE_URL}images/search-hero-desktop.png")`,
  } as CSSProperties;

  return <main className={styles.page} data-page="not-found" aria-labelledby="not-found-title">
    <section className={styles.hero} style={heroStyle}>
      <div className={styles.errorCode} aria-hidden="true">404</div>
      <div className={styles.copy}>
        <h1 id="not-found-title">{t("notFoundTitle")}</h1>
        <p>{t("notFoundMessage")}</p>
        <Link className={styles.back} to={path("/home")}>{t("backToHome")}</Link>
      </div>
    </section>
  </main>;
}
