import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJournalArticle, type JournalArticle as Article } from "../api/journal.api";
import ResilientImage from "../components/ResilientImage";
import RetryButton from "../components/RetryButton";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatDateTime, localizeJournalCategory, useLocale } from "../i18n";
import { safeHttpUrl } from "../utils/externalUrl";
import styles from "./JournalArticle.module.css";

export default function JournalArticle() {
  const { slug = "" } = useParams();
  const { lang, path, t } = useLocale();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusAfterRetry = useRef(false);
  const retryOrigin = useRef<Element | null>(null);

  useEffect(() => { focusAfterRetry.current = false; }, [lang, slug]);

  useEffect(() => {
    if (!focusAfterRetry.current || (!article && !error)) return;
    focusAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => {
      if (document.activeElement === document.body || document.activeElement === retryOrigin.current) titleRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [article, error, lang, slug]);

  const retryArticle = () => {
    retryOrigin.current = document.activeElement;
    focusAfterRetry.current = true;
    setAttempt(value => value + 1);
  };

  useEffect(() => {
    let current = true;
    setArticle(null);
    setError(false);
    setAudioError(false);
    setAudioLoading(false);
    getJournalArticle(lang, slug)
      .then(({ data }) => { if (current) setArticle(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [lang, slug, attempt]);

  if (error) {
    return (
      <main className={`${styles.page} ${styles.statePage}`} aria-labelledby="journal-article-state-title" aria-busy={false}>
        <h1 id="journal-article-state-title" className={styles.stateTitle} ref={titleRef} tabIndex={-1}>{t("journal")}</h1>
        <div className={styles.error} role="alert">
          {t("journalLoadError")} <RetryButton label={t("retry")} size="large" onClick={retryArticle} />
          <div><Link to={path("/journal")}>{t("journal")}</Link></div>
        </div>
      </main>
    );
  }

  if (!article) {
    return <main className={styles.page} aria-labelledby="journal-article-state-title" aria-busy={true}>
      <h1 id="journal-article-state-title" className="srOnly" ref={titleRef} tabIndex={-1}>{t("journal")}</h1>
      <p className="srOnly" role="status">{t("loading")}</p>
      <div className={styles.article} aria-hidden="true">
        <div className={styles.mobileToolbar}><span className={styles.skeletonLine} /></div>
        <div className={styles.articleHeader}>
          <div className={styles.articleLead}><div className={styles.skeletonLine} /><div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} /><div className={styles.skeletonLine} /></div>
          <div className={`${styles.coverHero} ${styles.skeleton}`} />
        </div>
      </div>
    </main>;
  }

  const audioUrl = safeHttpUrl(article.audioUrl);
  const title = editorialText(article.title, t("untitledArticle"));
  const articleLang = article.language === "uk" || article.language === "en" ? article.language : lang;
  const retryAudio = () => {
    setAudioError(false);
    audioRef.current?.load();
    audioRef.current?.focus();
  };

  return (
    <main className={styles.page} aria-labelledby="journal-article-title" aria-busy={false}>
      <article className={styles.article}>
        <div className={styles.mobileToolbar}>
          <Link className={styles.mobileBack} to={path("/journal")} aria-label={t("journal")}>←</Link>
          <span>{t("journal")}</span>
        </div>
        <div className={styles.articleHeader}>
          <div className={styles.articleLead}>
            <Link className={styles.back} to={path("/journal")}>← {t("journal")}</Link>
            <p className={styles.eyebrow}>{localizeJournalCategory(article.category, t)}</p>
            <h1 id="journal-article-title" ref={titleRef} tabIndex={-1} lang={article.title?.trim() ? articleLang : lang}>{title}</h1>
            <div className={styles.meta}>
              {article.publishedAt && <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>}
              {audioUrl && <span>{t("podcastAudio")}</span>}
            </div>
          </div>
          <div className={styles.coverHero}>
            <ResilientImage className={styles.coverImage} src={article.coverUrl} alt="" loading="eager" fallback={<span className={styles.coverFallback} aria-hidden="true">REWIND</span>} />
          </div>
        </div>
        <div className={styles.articleContent}>
          {article.excerpt?.trim() && <p className={styles.excerpt} lang={articleLang}>{article.excerpt.trim()}</p>}
          {audioUrl && <div className={styles.audioBlock} role="group" aria-label={t("podcastAudio")} aria-busy={audioLoading}>
            <audio ref={audioRef} className={styles.audio} controls preload="metadata" src={audioUrl} aria-label={t("podcastAudio")}
              onLoadStart={() => setAudioLoading(true)}
              onLoadedMetadata={() => { setAudioLoading(false); setAudioError(false); }}
              onError={() => { setAudioLoading(false); setAudioError(true); }}
            >{t("podcastAudioUnavailable")}</audio>
            {audioLoading && <p className={`${styles.status} ${styles.audioFeedback}`} role="status">{t("loading")}</p>}
            {audioError && <RetryNotice className={`${styles.error} ${styles.audioFeedback}`} message={t("podcastAudioLoadError")} retryLabel={t("retry")} onRetry={retryAudio} />}
          </div>}
          <div className={styles.body} lang={article.content?.trim() ? articleLang : lang}>{editorialText(article.content, t("noArticleContent"))}</div>
        </div>
      </article>
    </main>
  );
}
