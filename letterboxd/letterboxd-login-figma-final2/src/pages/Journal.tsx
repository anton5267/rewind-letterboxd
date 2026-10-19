import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJournal, getJournalArchive, type JournalArticle, type JournalArchiveEntry } from "../api/journal.api";
import ResilientImage from "../components/ResilientImage";
import { editorialText, formatDateTime, localizeJournalCategory, useLocale } from "../i18n";
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
    setError(false);
    setArticles([]);
    getJournal(lang, category, archiveMonth, page)
      .then(({ data }) => {
        if (!current) return;
        setArticles(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        if (!current) return;
        setError(true);
        setTotalPages(0);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => { current = false; };
  }, [lang, category, archiveMonth, page, attempt]);

  return (
    <main className={styles.page}>
      <section className={styles.intro}>
        <p className={styles.eyebrow}>{t("journalEyebrow")}</p>
        <h1>{t("journal")}</h1>
        <p>{t("journalIntro")}</p>
      </section>

      <div className={styles.layout}>
        <section className={styles.content} aria-labelledby="journal-content-title" aria-busy={loading}>
          <div className={styles.toolbar}>
            <label className={styles.field}>
              {t("journalCategory")}
              <select value={category} onChange={event => { setCategory(event.target.value); setPage(0); }}>
                <option value="">{t("allJournalCategories")}</option>
                <option value="News">{t("journalNews")}</option>
                <option value="Awards">{t("journalAwards")}</option>
                <option value="Community">{t("journalCommunity")}</option>
                <option value="Interviews">{t("journalInterviews")}</option>
                <option value="Platform">{t("journalPlatform")}</option>
                <option value="Podcasts">{t("journalPodcasts")}</option>
                <option value="Newsletter">{t("journalNewsletter")}</option>
              </select>
            </label>
            {archiveMonth && <button className={styles.clearButton} type="button" onClick={() => { setArchiveMonth(undefined); setPage(0); }}>{t("clearArchive")}</button>}
          </div>

          <h2 id="journal-content-title" className="srOnly">{t("journal")}</h2>
          {loading && <p className={styles.status} role="status">{t("loading")}</p>}
          {error && <p className={styles.error} role="alert">{t("journalLoadError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
          {!loading && !error && articles.length === 0 && <p className={styles.empty}>{t("noJournalArticles")}</p>}

          {!loading && !error && articles.length > 0 && <div className={styles.grid}>
            {articles.map((article, index) => {
              const articlePath = path(`/journal/${encodeURIComponent(article.slug)}`);
              const title = editorialText(article.title, t("untitledArticle"));
              return <article className={`${styles.card} ${index === 0 ? styles.feature : ""}`} key={article.id}>
                <Link className={styles.cover} to={articlePath} aria-label={title}>
                  <ResilientImage src={article.coverUrl} alt="" loading={index === 0 ? "eager" : "lazy"} fallback={<span aria-hidden="true">REWIND</span>} />
                </Link>
                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span>{localizeJournalCategory(article.category, t)}</span>
                    {article.publishedAt && <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>}
                  </div>
                  <h3><Link to={articlePath}>{title}</Link></h3>
                  {article.excerpt?.trim() && <p>{article.excerpt.trim()}</p>}
                  <div className={styles.cardFooter}>
                    <Link className={styles.readLink} to={articlePath}>{t("journalRead")}</Link>
                    <span className={styles.byline}>{article.audioUrl ? t("podcastAudio") : t("journalEyebrow")}</span>
                  </div>
                </div>
                <Link className={styles.thumb} to={articlePath} aria-hidden="true" tabIndex={-1}>
                  <ResilientImage src={article.coverUrl} alt="" loading="lazy" fallback={<span>?</span>} />
                </Link>
              </article>;
            })}
          </div>}

          {!loading && !error && totalPages > 1 && <nav className={styles.pagination} aria-label={t("journalPagination")}>
            <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>{t("previous")}</button>
            <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
            <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>{t("next")}</button>
          </nav>}
        </section>

        <aside className={styles.archive} aria-labelledby="journal-archive-title" aria-busy={archiveLoading}>
          <h2 id="journal-archive-title">{t("journalArchive")}</h2>
          {archiveLoading ? <p className={styles.status} role="status">{t("loading")}</p> : archiveError ? (
            <p className={styles.error} role="alert">{t("journalArchiveError")} <button type="button" onClick={() => setArchiveAttempt(value => value + 1)}>{t("retry")}</button></p>
          ) : archive.length === 0 ? <p className={styles.empty}>{t("noJournalArchive")}</p> : (
            <ul className={styles.archiveList}>
              {archive.map(item => (
                <li key={`${item.year}-${item.month}`}>
                  <button type="button" aria-pressed={archiveMonth?.year === item.year && archiveMonth.month === item.month} onClick={() => { setArchiveMonth({ year: item.year, month: item.month }); setPage(0); }}>
                    {item.year}-{String(item.month).padStart(2, "0")} · {item.articleCount}
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
