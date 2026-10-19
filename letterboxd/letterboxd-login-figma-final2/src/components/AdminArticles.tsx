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
import styles from "./AdminArticles.module.css";

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
  const [actionError, setActionError] = useState("");

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
    setActionError("");
    try {
      await createAdminArticle(article);
      setArticle(current => ({ ...emptyArticle, language: current.language, category: current.category }));
      if (page === 0) setRevision(value => value + 1); else setPage(0);
    } catch {
      setActionError(t("adminArticleCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const sendNewsletter = async (item: AdminArticle) => {
    if (!item.publishedAt || newsletterBusyId !== null) return;
    setNewsletterBusyId(item.id);
    setActionError("");
    try {
      await queueAdminNewsletter(item.id);
      const { data: status } = await getAdminNewsletterStatus(item.id);
      setNewsletterStatuses(current => ({ ...current, [item.id]: status }));
    } catch {
      setActionError(t("adminNewsletterError"));
    } finally {
      setNewsletterBusyId(null);
    }
  };

  return <section className={styles.section} aria-label={t("journalEditor")} aria-busy={loading || creating || newsletterBusyId !== null}>
    <h2 className={styles.title}>{t("journalEditor")}</h2>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
    <form className={styles.form} onSubmit={publishArticle} aria-busy={creating}>
      <input className={styles.input} required aria-label={t("articleSlug")} placeholder={t("articleSlug")} value={article.slug} onChange={event => setArticle({ ...article, slug: event.target.value })} />
      <input className={styles.input} required aria-label={t("articleTitle")} placeholder={t("articleTitle")} value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} />
      <input className={styles.input} required aria-label={t("articleCategory")} placeholder={t("articleCategory")} value={article.category} onChange={event => setArticle({ ...article, category: event.target.value })} />
      <select className={styles.select} aria-label={t("articleLanguage")} value={article.language} onChange={event => setArticle({ ...article, language: event.target.value })}><option value="uk">{t("articleLanguageUk")}</option><option value="en">{t("articleLanguageEn")}</option></select>
      <input className={styles.input} aria-label={t("articleExcerpt")} placeholder={t("articleExcerpt")} value={article.excerpt} onChange={event => setArticle({ ...article, excerpt: event.target.value })} />
      <input className={styles.input} type="url" aria-label={t("audioUrl")} placeholder={t("audioUrl")} value={article.audioUrl} onChange={event => setArticle({ ...article, audioUrl: event.target.value })} />
      <textarea className={styles.textarea} required aria-label={t("articleContent")} placeholder={t("articleContent")} value={article.content} onChange={event => setArticle({ ...article, content: event.target.value })} rows={8} />
      <label className={styles.publishToggle}><input type="checkbox" checked={article.published} onChange={event => setArticle({ ...article, published: event.target.checked })} /> {t("publishArticle")}</label>
      <button type="submit" aria-busy={creating} disabled={creating}>{creating ? t("loading") : t("create")}</button>
    </form>
    {loading && <p className={styles.feedback}>{t("loading")}</p>}
    {error && <div><p className={styles.error} role="alert">{t("adminLoadError")}</p><button type="button" onClick={() => setRevision(value => value + 1)}>{t("retry")}</button></div>}
    {data && data.content.length === 0 && <p>{t("noAdminArticles")}</p>}
    {data && <>
      <ul className={styles.articleList}>{data.content.map(item => { const status = newsletterStatuses[item.id]; return <li className={styles.articleRow} key={item.id}>{item.language === "uk" ? t("articleLanguageUk") : t("articleLanguageEn")} · {item.title}{item.audioUrl && ` · ${t("podcastAudio")}`} {item.publishedAt && <><button type="button" aria-busy={newsletterBusyId === item.id} disabled={newsletterBusyId !== null} onClick={() => void sendNewsletter(item)}>{newsletterBusyId === item.id ? t("loading") : t("sendNewsletter")}</button>{status && ` · ${t("newsletterQueueStatus")}: ${status.pending}/${status.sent}/${status.failed}`}</>}</li>; })}</ul>
      <nav className={styles.pagination} aria-label={t("adminArticlesPagination")}>
        <button type="button" disabled={loading || page === 0} onClick={() => setPage(value => Math.max(0, value - 1))}>{t("previous")}</button>
        <span role="status">{t("page")} {data.totalPages === 0 ? 0 : page + 1} {t("of")} {data.totalPages} · {data.totalElements}</span>
        <button type="button" disabled={loading || page + 1 >= data.totalPages} onClick={() => setPage(value => value + 1)}>{t("next")}</button>
      </nav>
    </>}
  </section>;
}
