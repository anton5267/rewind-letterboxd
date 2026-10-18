import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJournal, getJournalArchive, type JournalArticle, type JournalArchiveEntry } from "../api/journal.api";
import { localizeJournalCategory, useLocale } from "../i18n";

export default function Journal() {
  const { lang, path, t } = useLocale();
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [archive, setArchive] = useState<JournalArchiveEntry[]>([]);
  const [category, setCategory] = useState("");
  const [archiveMonth, setArchiveMonth] = useState<Pick<JournalArchiveEntry, "year" | "month"> | undefined>();
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [lang, category, archiveMonth]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setArticles([]);
    Promise.all([getJournal(lang, category, archiveMonth, page), getJournalArchive(lang)])
      .then(([journal, archiveResponse]) => {
        if (!current) return;
        setArticles(journal.data.content);
        setTotalPages(journal.data.totalPages);
        setArchive(archiveResponse.data);
      })
      .catch(() => { if (current) { setError(true); setTotalPages(0); } })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [lang, category, archiveMonth, page, attempt]);

  return (
    <main aria-busy={loading} style={{ padding: "110px 5% 40px", background: "#151515", color: "white", minHeight: "70vh" }}>
      <h1>{t("journal")}</h1>
      <label>
        {t("journalCategory")} <select value={category} onChange={event => setCategory(event.target.value)}>
          <option value="">{t("allJournalCategories")}</option>
          <option value="Awards">{t("journalAwards")}</option>
          <option value="Community">{t("journalCommunity")}</option>
          <option value="Interviews">{t("journalInterviews")}</option>
          <option value="Platform">{t("journalPlatform")}</option>
          <option value="Podcasts">{t("journalPodcasts")}</option>
          <option value="Newsletter">{t("journalNewsletter")}</option>
        </select>
      </label>
      {archiveMonth && <button type="button" onClick={() => setArchiveMonth(undefined)}>{t("clearArchive")}</button>}
      {loading && <p role="status">{t("loading")}</p>}
      {error && <p role="alert">{t("journalLoadError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p>}
      {!loading && !error && articles.length === 0 && <p>{t("noJournalArticles")}</p>}
      <section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        {!loading && !error && articles.map(article => (
          <article key={article.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 18 }}>
            <small>{localizeJournalCategory(article.category, t)}</small>
            <h2><Link to={path(`/journal/${article.slug}`)}>{article.title}</Link></h2>
            {article.excerpt && <p>{article.excerpt}</p>}
            {article.audioUrl && <span>{t("podcastAudio")}</span>}
          </article>
        ))}
      </section>
      {!loading && !error && totalPages > 1 && <nav aria-label={t("journalPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={page === 0} onClick={() => setPage(value => value - 1)}>{t("previous")}</button>
        <span role="status">{t("page")} {page + 1} {t("of")} {totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>}
      <aside>
        <h2>{t("journalArchive")}</h2>
        {loading ? <p>{t("loading")}</p> : archive.length === 0 ? <p>{t("noJournalArchive")}</p> : (
          <ul>{archive.map(item => (
            <li key={`${item.year}-${item.month}`}>
              <button type="button" onClick={() => setArchiveMonth({ year: item.year, month: item.month })}>{item.year}-{String(item.month).padStart(2, "0")} · {item.articleCount}</button>
            </li>
          ))}</ul>
        )}
      </aside>
    </main>
  );
}
