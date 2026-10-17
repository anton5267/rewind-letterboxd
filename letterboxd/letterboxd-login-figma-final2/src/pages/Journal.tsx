import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJournal, type JournalArticle } from "../api/journal.api";
import { useLocale } from "../i18n";
export default function Journal() {
  const { lang, path, t } = useLocale(); const [articles, setArticles] = useState<JournalArticle[]>([]); const [error, setError] = useState(false);
  useEffect(() => { getJournal(lang).then(({ data }) => setArticles(data.content)).catch(() => setError(true)); }, [lang]);
  return <main style={{ padding: "110px 5% 40px", background: "#151515", color: "white", minHeight: "70vh" }}><h1>{t("journal")}</h1>{error && <p role="alert">{t("journalLoadError")}</p>}{!error && articles.length === 0 && <p>{t("noJournalArticles")}</p>}<section style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>{articles.map(article => <article key={article.id} style={{ border: "1px solid #444", borderRadius: 8, padding: 18 }}><small>{article.category}</small><h2><Link to={path(`/journal/${article.slug}`)}>{article.title}</Link></h2>{article.excerpt && <p>{article.excerpt}</p>}</article>)}</section></main>;
}
