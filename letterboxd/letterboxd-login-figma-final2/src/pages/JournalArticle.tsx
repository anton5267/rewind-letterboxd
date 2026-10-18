import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJournalArticle, type JournalArticle as Article } from "../api/journal.api";
import { localizeJournalCategory, useLocale } from "../i18n";
export default function JournalArticle() {
  const { slug = "" } = useParams(); const { lang, path, t } = useLocale(); const [article, setArticle] = useState<Article | null>(null); const [error, setError] = useState(false); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setArticle(null);
    setError(false);
    getJournalArticle(lang, slug)
      .then(({ data }) => { if (current) setArticle(data); })
      .catch(() => { if (current) setError(true); });
    return () => { current = false; };
  }, [lang, slug, attempt]);
  if (error) return <main style={{ padding: "110px 5%" }}><p role="alert">{t("journalLoadError")} <button type="button" onClick={() => setAttempt(value => value + 1)}>{t("retry")}</button></p><Link to={path("/journal")}>{t("journal")}</Link></main>;
  if (!article) return <main aria-busy="true" style={{ padding: "110px 5%" }}><p role="status">{t("loading")}</p></main>;
  return <main style={{ padding: "110px 5% 40px", background: "#151515", color: "white", minHeight: "70vh", maxWidth: 900 }}><small>{localizeJournalCategory(article.category, t)}</small><h1>{article.title}</h1>{article.excerpt && <p>{article.excerpt}</p>}{article.audioUrl && <audio controls preload="metadata" src={article.audioUrl} aria-label={t("podcastAudio")}>{t("podcastAudioUnavailable")}</audio>}<div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{article.content}</div></main>;
}
