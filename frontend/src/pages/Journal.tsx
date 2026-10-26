import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getJournal, getJournalArchive, type JournalArticle, type JournalArchiveEntry } from "../api/journal.api";
import Pagination from "../components/Pagination";
import ResilientImage from "../components/ResilientImage";
import RetryNotice from "../components/RetryNotice";
import { editorialText, formatArchiveMonth, formatDateTime, localizeJournalCategory, useLocale } from "../i18n";
import { safeHttpUrl } from "../utils/externalUrl";
import { getLastPageIndex, isPageOutOfRange } from "../utils/pagination";
import { journalCategories } from "../utils/journalCategories";
import styles from "./Journal.module.css";

export default function Journal() {
  const { lang, path, t } = useLocale();
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [archive, setArchive] = useState<JournalArchiveEntry[]>([]);
  const [category, setCategory] = useState("");
  const [archiveMonth, setArchiveMonth] = useState<Pick<JournalArchiveEntry, "year" | "month"> | undefined>();
  const [pagination, setPagination] = useState({ lang, page: 0 });
  const page = pagination.lang === lang ? pagination.page : 0;
  const setPage = (nextPage: number) => setPagination({ lang, page: nextPage });
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(true);
  const [archiveError, setArchiveError] = useState(false);
  const [archiveAttempt, setArchiveAttempt] = useState(0);
  const contentRef = useRef<HTMLElement>(null);
  const archiveTitleRef = useRef<HTMLHeadingElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const focusFeedAfterRetry = useRef(false);
  const focusArchiveAfterRetry = useRef(false);
  const feedResultReady = useRef(false);
  const [featureCover, setFeatureCover] = useState<{ key: string; wide: boolean } | null>(null);
  const featureCoverKey = JSON.stringify([lang, page, category, archiveMonth?.year, archiveMonth?.month, articles[0]?.id, articles[0]?.coverUrl]);
  const currentFeatureCoverKey = useRef(featureCoverKey);
  currentFeatureCoverKey.current = featureCoverKey;


  useEffect(() => {
    focusFeedAfterRetry.current = false;
    focusArchiveAfterRetry.current = false;
  }, [lang]);

  useEffect(() => {
    if (!focusFeedAfterRetry.current || loading || !feedResultReady.current) return;
    focusFeedAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => contentRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [loading, error, articles, lang]);

  useEffect(() => {
    if (!focusArchiveAfterRetry.current || archiveLoading) return;
    focusArchiveAfterRetry.current = false;
    const frame = window.requestAnimationFrame(() => archiveTitleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [archiveLoading, archiveError, archive, lang]);

  useEffect(() => {
    setPagination({ lang, page: 0 });
  }, [lang]);

  useEffect(() => {
    let current = true;
    setArchiveLoading(true);
    setArchiveError(false);
    setArchive([]);
    getJournalArchive(lang)
      .then(({ data }) => { if (current) setArchive(data); })
      .catch(() => { if (current) setArchiveError(true); })
      .finally(() => { if (current) setArchiveLoading(false); });
    return () => { current = false; };
  }, [lang, archiveAttempt]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    feedResultReady.current = false;
    setError(false);
    setArticles([]);
    getJournal(lang, category, archiveMonth, page)
      .then(({ data }) => {
        if (!current) return;
        if (isPageOutOfRange(page, data.totalPages)) {
          setPage(getLastPageIndex(data.totalPages));
          return;
        }
        setArticles(data.content);
        setTotalPages(data.totalPages);
        feedResultReady.current = true;
      })
      .catch(() => {
        if (!current) return;
        setError(true);
        setTotalPages(0);
        feedResultReady.current = true;
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [lang, category, archiveMonth, page, attempt]);

  return (
    <main className={styles.page} aria-labelledby="journal-page-title" aria-busy={loading || archiveLoading}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>{t("journalEyebrow")}</p>
        <h1 id="journal-page-title">{t("journal")}</h1>
        <p>{t("journalIntro")}</p>
      </section>

      <div className={styles.layout}>
        <section className={styles.content} ref={contentRef} tabIndex={-1} aria-labelledby="journal-content-title" aria-busy={loading}>
          <div className={styles.toolbar}>
            <label className={styles.field}>
              {t("journalCategory")}
              <select ref={categoryRef} value={category} onChange={event => { focusFeedAfterRetry.current = false; setCategory(event.target.value); setPage(0); }}>
                <option value="">{t("allJournalCategories")}</option>
                {journalCategories.map(value => <option key={value} value={value}>{localizeJournalCategory(value, t)}</option>)}
              </select>
            </label>
            {archiveMonth && <button className={styles.clearButton} type="button" onClick={() => { focusFeedAfterRetry.current = false; setArchiveMonth(undefined); setPage(0); categoryRef.current?.focus(); }}>{t("clearArchive")}</button>}
          </div>

          <h2 id="journal-content-title" className="srOnly">{t("journal")}</h2>
          {loading && <p className={styles.status} role="status">{t("loading")}</p>}
          {error && <RetryNotice className={styles.error} message={t("journalLoadError")} retryLabel={t("retry")} onRetry={() => { focusFeedAfterRetry.current = true; setAttempt(value => value + 1); }} />}
          {!loading && !error && articles.length === 0 && <p className={styles.empty}>{t("noJournalArticles")}</p>}

          {!loading && !error && articles.length > 0 && <div className={styles.grid}>
            {articles.map((article, index) => {
              const articlePath = path(`/journal/${encodeURIComponent(article.slug)}`);
              const title = editorialText(article.title, t("untitledArticle"));
              const articleLang = article.language === "uk" || article.language === "en" ? article.language : lang;
              const titleLang = article.title?.trim() ? articleLang : lang;
              const audioUrl = safeHttpUrl(article.audioUrl);
              return <article className={`${styles.card} ${index === 0 ? styles.feature : ""} ${index === 0 && featureCover?.key === featureCoverKey && featureCover.wide ? styles.wideFeature : ""}`} key={article.id}>
                <Link className={styles.cover} to={articlePath} aria-label={title} lang={titleLang}>
                  <ResilientImage src={article.coverUrl} alt="" loading={index === 0 ? "eager" : "lazy"} fallback={<span aria-hidden="true">REWIND</span>}
                    onLoad={index === 0 ? event => {
                      if (currentFeatureCoverKey.current !== featureCoverKey) return;
                      const image = event.currentTarget;
                      if (image.currentSrc !== safeHttpUrl(article.coverUrl)) return;
                      setFeatureCover({ key: featureCoverKey, wide: image.naturalHeight > 0 && image.naturalWidth > image.naturalHeight });
                    } : undefined}
                    onError={index === 0 ? () => {
                      if (currentFeatureCoverKey.current === featureCoverKey) setFeatureCover({ key: featureCoverKey, wide: false });
                    } : undefined}
                  />
                </Link>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span>{localizeJournalCategory(article.category, t)}</span>
                    {article.publishedAt && <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>}
                  </div>
                  <h3 lang={titleLang}><Link to={articlePath}>{title}</Link></h3>
                  {article.excerpt?.trim() && <p lang={articleLang}>{article.excerpt.trim()}</p>}
                  <div className={styles.cardFooter}>
                    <Link className={styles.readLink} to={articlePath}>{t("journalRead")}</Link>
                    <span className={styles.byline}>{audioUrl ? t("podcastAudio") : t("journalEyebrow")}</span>
                  </div>
                </div>
                <Link className={styles.thumb} to={articlePath} aria-hidden="true" tabIndex={-1}>
                  <ResilientImage src={article.coverUrl} alt="" loading="lazy" fallback={<span>?</span>} />
                </Link>
              </article>;
            })}
          </div>}

          {!loading && !error && <Pagination className={styles.pagination} page={page} totalPages={totalPages} label={t("journalPagination")} busy={loading} onPageChange={nextPage => { focusFeedAfterRetry.current = false; setPage(nextPage); }} />}
        </section>

        <aside className={styles.archive} aria-labelledby="journal-archive-title" aria-busy={archiveLoading}>
          <h2 id="journal-archive-title" ref={archiveTitleRef} tabIndex={-1}>{t("journalArchive")}</h2>
          {archiveLoading ? <p className={styles.status} role="status">{t("loading")}</p> : archiveError ? (
            <RetryNotice className={styles.error} message={t("journalArchiveError")} retryLabel={t("retry")} onRetry={() => { focusArchiveAfterRetry.current = true; setArchiveAttempt(value => value + 1); }} />
          ) : archive.length === 0 ? <p className={styles.empty}>{t("noJournalArchive")}</p> : (
            <ul className={styles.archiveList}>
              {archive.map(item => (
                <li key={`${item.year}-${item.month}`}>
                  <button type="button" aria-pressed={archiveMonth?.year === item.year && archiveMonth.month === item.month} onClick={() => { focusFeedAfterRetry.current = false; setArchiveMonth({ year: item.year, month: item.month }); setPage(0); }}>
                    {formatArchiveMonth(item.year, item.month, lang)} · {item.articleCount}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
