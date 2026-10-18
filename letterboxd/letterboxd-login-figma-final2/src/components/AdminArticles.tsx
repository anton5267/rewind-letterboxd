import { useEffect, useState } from "react";
import {
  createAdminArticle,
  getAdminArticles,
  getAdminNewsletterStatus,
  queueAdminNewsletter,
  type AdminArticle,
  type NewsletterDeliveryStatus,
  type Page,
} from "../api/admin.api";
import { useLocale } from "../i18n";

const emptyArticle = { slug: "", language: "uk", category: "Новини", title: "", excerpt: "", content: "", coverUrl: "", audioUrl: "", published: false };

export default function AdminArticles() {
  const { t } = useLocale();
  const [data, setData] = useState<Page<AdminArticle> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [article, setArticle] = useState(emptyArticle);
  const [newsletterStatuses, setNewsletterStatuses] = useState<Record<number, NewsletterDeliveryStatus>>({});
  const [newsletterBusyId, setNewsletterBusyId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(false);
    setData(null);
    getAdminArticles(page)
      .then(({ data: response }) => { if (current) setData(response); })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, revision]);

  const publishArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await createAdminArticle(article);
      setArticle(current => ({ ...emptyArticle, language: current.language, category: current.category }));
      if (page === 0) setRevision(value => value + 1); else setPage(0);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setCreating(false);
    }
  };

  const sendNewsletter = async (item: AdminArticle) => {
    if (!item.publishedAt || newsletterBusyId !== null) return;
    setNewsletterBusyId(item.id);
    try {
      await queueAdminNewsletter(item.id);
      const { data: status } = await getAdminNewsletterStatus(item.id);
      setNewsletterStatuses(current => ({ ...current, [item.id]: status }));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setNewsletterBusyId(null);
    }
  };

  return <section aria-label={t("journalEditor")} aria-busy={loading}>
    <h2>{t("journalEditor")}</h2>
    <form onSubmit={publishArticle} style={{ display: "grid", gap: 8, maxWidth: 700 }}>
      <input required placeholder={t("articleSlug")} value={article.slug} onChange={event => setArticle({ ...article, slug: event.target.value })} />
      <input required placeholder={t("articleTitle")} value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} />
      <input required placeholder={t("articleCategory")} value={article.category} onChange={event => setArticle({ ...article, category: event.target.value })} />
      <select aria-label={t("articleLanguage")} value={article.language} onChange={event => setArticle({ ...article, language: event.target.value })}><option value="uk">{t("articleLanguageUk")}</option><option value="en">{t("articleLanguageEn")}</option></select>
      <input placeholder={t("articleExcerpt")} value={article.excerpt} onChange={event => setArticle({ ...article, excerpt: event.target.value })} />
      <input type="url" placeholder={t("audioUrl")} value={article.audioUrl} onChange={event => setArticle({ ...article, audioUrl: event.target.value })} />
      <textarea required placeholder={t("articleContent")} value={article.content} onChange={event => setArticle({ ...article, content: event.target.value })} rows={8} />
      <label><input type="checkbox" checked={article.published} onChange={event => setArticle({ ...article, published: event.target.checked })} /> {t("publishArticle")}</label>
      <button type="submit" disabled={creating}>{creating ? t("loading") : t("create")}</button>
    </form>
    {loading && <p>{t("loading")}</p>}
    {error && <div><p role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminArticles")}</p>}
    {data && <>
      <ul>{data.content.map(item => { const status = newsletterStatuses[item.id]; return <li key={item.id}>{item.language === "uk" ? t("articleLanguageUk") : t("articleLanguageEn")} · {item.title}{item.audioUrl && ` · ${t("podcastAudio")}`} {item.publishedAt && <><button type="button" disabled={newsletterBusyId !== null} onClick={() => void sendNewsletter(item)}>{newsletterBusyId === item.id ? t("loading") : t("sendNewsletter")}</button>{status && ` · ${t("newsletterQueueStatus")}: ${status.pending}/${status.sent}/${status.failed}`}</>}</li>; })}</ul>
      <nav aria-label={t("adminArticlesPagination")} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
