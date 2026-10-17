import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJournalArticle, type JournalArticle as Article } from "../api/journal.api";
import { useLocale } from "../i18n";
export default function JournalArticle() {
  const { slug = "" } = useParams(); const { lang, path, t } = useLocale(); const [article, setArticle] = useState<Article | null>(null); const [error, setError] = useState(false);
  useEffect(() => { getJournalArticle(lang, slug).then(({ data }) => setArticle(data)).catch(() => setError(true)); }, [lang, slug]);
  if (error) return <main style={{ padding: "110px 5%" }}><p role="alert">{t("journalLoadError")}</p><Link to={path("/journal")}>{t("journal")}</Link></main>;
  if (!article) return <main style={{ padding: "110px 5%" }}>{t("loading")}</main>;
  return <main style={{ padding: "110px 5% 40px", background: "#151515", color: "white", minHeight: "70vh", maxWidth: 900 }}><small>{article.category}</small><h1>{article.title}</h1>{article.excerpt && <p>{article.excerpt}</p>}<div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{article.content}</div></main>;
}
