import { useLocale } from "../i18n";

export default function About() {
  const { t } = useLocale();
  return <main style={{ background: "#151515", color: "white", minHeight: "70vh", padding: "110px 5% 40px" }}>
    <h1>{t("about")} Rewind</h1>
    <p>{t("aboutIntro")}</p>
    <section aria-labelledby="credits-heading">
      <h2 id="credits-heading">{t("filmDataAndImages")}</h2>
      <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
        <img src="/tmdb-logo.svg" alt="TMDB" style={{ width: 150, maxWidth: "100%" }} />
      </a>
      <p>{t("tmdbDisclaimer")}</p>
    </section>
  </main>;
}
