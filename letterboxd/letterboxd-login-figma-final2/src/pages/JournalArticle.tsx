import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJournalArticle, type JournalArticle as Article } from "../api/journal.api";
import { editorialText, formatDateTime, localizeJournalCategory, useLocale } from "../i18n";
import styles from "./JournalArticle.module.css";

export default function JournalArticle() {
  const { slug = "" } = useParams();
  const { lang, path, t } = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    setArticle(null);
    setError(false);
    getJournalArticle(lang, slug)
      .then(({ data }) => { if (current) setArticle(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [lang, slug, attempt]);

  if (error) {
    return (
      <main className={styles.page}>
        <h1 className={styles.stateTitle}>{t("journal")}</h1>
        <div className={styles.error} role="alert">
          {t("journalLoadError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button>
          <div><Link to={path("/journal")}>{t("journal")}</Link></div>
        </div>
      </main>
    );
  }

  if (!article) {
    return <main className={styles.page} aria-busy={true}><h1 className={styles.stateTitle}>{t("journal")}</h1><p className={styles.status} role="status">{t("loading")}</p></main>;
  }

  return (
    <main className={styles.page}>
      <article className={styles.article}>
        <Link className={styles.back} to={path("/journal")}>← {t("journal")}</Link>
        <p className={styles.eyebrow}>{localizeJournalCategory(article.category, t)}</p>
        <h1>{editorialText(article.title, t("untitledArticle"))}</h1>
        <div className={styles.meta}>
          {article.publishedAt && <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>}
          {article.audioUrl && <span>{t("podcastAudio")}</span>}
        </div>
        {article.excerpt?.trim() && <p className={styles.excerpt}>{article.excerpt.trim()}</p>}
        {article.audioUrl && <audio className={styles.audio} controls preload="metadata" src={article.audioUrl} aria-label={t("podcastAudio")}>{t("podcastAudioUnavailable")}</audio>}
        <div className={styles.body}>{editorialText(article.content, t("noArticleContent"))}</div>
      </article>
    </main>
  );
}
