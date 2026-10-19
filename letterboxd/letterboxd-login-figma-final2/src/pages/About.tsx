import { useLocale } from "../i18n";
import styles from "./About.module.css";

export default function About() {
  const { t } = useLocale();
  return <main className={styles.page}>
    <article className={styles.content} aria-labelledby="about-title">
      <h1 className={styles.title} id="about-title">{t("about")} Rewind</h1>
      <p className={styles.intro}>{t("aboutIntro")}</p>
    <section className={styles.credits} aria-labelledby="credits-heading">
      <h2 className={styles.creditsTitle} id="credits-heading">{t("filmDataAndImages")}</h2>
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
        <img className={styles.logo} src="/tmdb-logo.svg" alt="TMDB" />
      </a>
      <p className={styles.disclaimer}>{t("tmdbDisclaimer")}</p>
    </section>
    </article>
  </main>;
}
