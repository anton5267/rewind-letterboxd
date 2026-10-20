import { useEffect, useRef, useState } from "react";
import {
  createAdminArticle,
  getAdminArticles,
  getAdminNewsletterStatus,
  queueAdminNewsletter,
  updateAdminArticle,
  type AdminArticle,
  type NewsletterDeliveryStatus,
} from "../api/admin.api";
import type { Page } from "../api/types";
import Pagination from "./Pagination";
import RetryNotice from "./RetryNotice";
import { editorialText, localizeJournalCategory, useLocale, type Language } from "../i18n";
import { isJournalCategory, journalCategories } from "../utils/journalCategories";
import styles from "./AdminArticles.module.css";

const emptyArticle: { slug: string; language: Language; category: string; title: string; excerpt: string; content: string; coverUrl: string; audioUrl: string; published: boolean } = { slug: "", language: "uk", category: "", title: "", excerpt: "", content: "", coverUrl: "", audioUrl: "", published: false };

export default function AdminArticles() {
  const { lang, t } = useLocale();
  const [data, setData] = useState<Page<AdminArticle> | null>(null);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [article, setArticle] = useState(() => ({ ...emptyArticle, language: lang }));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [legacyCategory, setLegacyCategory] = useState<string | null>(null);
  const slugInput = useRef<HTMLInputElement>(null);
  const editingTrigger = useRef<HTMLButtonElement | null>(null);
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
      .then(({ data: response }) => {
        if (!current) return;
        const lastPage = Math.max(0, response.totalPages - 1);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setData(response);
      })
      .catch(() => { if (current) setError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [page, revision]);

  const editArticle = (item: AdminArticle, trigger: HTMLButtonElement) => {
    editingTrigger.current = trigger;
    setArticle({
      slug: item.slug,
      language: item.language === "en" ? "en" : "uk",
      category: item.category,
      title: item.title,
      excerpt: item.excerpt ?? "",
      content: item.content,
      coverUrl: item.coverUrl ?? "",
      audioUrl: item.audioUrl ?? "",
      published: item.publishedAt !== null,
    });
    setEditingId(item.id);
    setLegacyCategory(isJournalCategory(item.category) ? null : item.category);
    setActionError("");
    slugInput.current?.focus();
  };

  const resetEditor = () => {
    setArticle(current => ({ ...emptyArticle, language: current.language, category: isJournalCategory(current.category) ? current.category : "" }));
    setEditingId(null);
    setLegacyCategory(null);
    setActionError("");
  };

  const cancelEditing = () => {
    resetEditor();
    if (editingTrigger.current?.isConnected) editingTrigger.current.focus();
    else slugInput.current?.focus();
    editingTrigger.current = null;
  };

  const saveArticle = async (event: React.FormEvent) => {
    event.preventDefault();
    if (creating) return;
    setCreating(true);
    setActionError("");
    try {
      const request = {
        ...article,
        slug: article.slug.trim(),
        category: article.category.trim(),
        title: article.title.trim(),
        excerpt: article.excerpt.trim() || null,
        content: article.content.trim(),
        coverUrl: article.coverUrl.trim() || null,
        audioUrl: article.audioUrl.trim() || null,
      };
      if (editingId === null) await createAdminArticle(request);
      else await updateAdminArticle(editingId, request);
      resetEditor();
      if (page === 0) setRevision(value => value + 1); else setPage(0);
    } catch {
      setActionError(t(editingId === null ? "adminArticleCreateError" : "adminArticleSaveError"));
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
    <form className={styles.form} onSubmit={saveArticle} aria-busy={creating}>
      {editingId !== null && <p className={styles.feedback}>{t("editArticle")} · {article.title}</p>}
      <input ref={slugInput} className={styles.input} required maxLength={180} aria-label={t("articleSlug")} placeholder={t("articleSlug")} value={article.slug} onChange={event => setArticle({ ...article, slug: event.target.value })} />
      <input className={styles.input} required maxLength={255} aria-label={t("articleTitle")} placeholder={t("articleTitle")} value={article.title} onChange={event => setArticle({ ...article, title: event.target.value })} />
      <select className={styles.select} required aria-label={t("articleCategory")} value={article.category} onChange={event => setArticle({ ...article, category: event.target.value })}>
        <option value="" disabled>{t("articleCategory")}</option>
        {legacyCategory !== null && <option value={legacyCategory}>{t("articleCurrentCategory")}: {legacyCategory}</option>}
        {journalCategories.map(category => <option key={category} value={category}>{localizeJournalCategory(category, t)}</option>)}
      </select>
      <select className={styles.select} aria-label={t("articleLanguage")} value={article.language} onChange={event => setArticle({ ...article, language: event.target.value as Language })}><option value="uk">{t("articleLanguageUk")}</option><option value="en">{t("articleLanguageEn")}</option></select>
      <input className={styles.input} maxLength={500} aria-label={t("articleExcerpt")} placeholder={t("articleExcerpt")} value={article.excerpt} onChange={event => setArticle({ ...article, excerpt: event.target.value })} />
      <input className={styles.input} type="url" maxLength={500} aria-label={t("articleCoverUrl")} placeholder={t("articleCoverUrl")} value={article.coverUrl} onChange={event => setArticle({ ...article, coverUrl: event.target.value })} />
      <input className={styles.input} type="url" maxLength={500} aria-label={t("audioUrl")} placeholder={t("audioUrl")} value={article.audioUrl} onChange={event => setArticle({ ...article, audioUrl: event.target.value })} />
      <textarea className={styles.textarea} required aria-label={t("articleContent")} placeholder={t("articleContent")} value={article.content} onChange={event => setArticle({ ...article, content: event.target.value })} rows={8} />
      <label className={styles.publishToggle}><input type="checkbox" checked={article.published} onChange={event => setArticle({ ...article, published: event.target.checked })} /> {t("publishArticle")}</label>
      <button type="submit" aria-busy={creating} disabled={creating}>{creating ? t("loading") : t(editingId === null ? "create" : "save")}</button>
      {editingId !== null && <button type="button" disabled={creating} onClick={cancelEditing}>{t("cancel")}</button>}
    </form>
    {loading && <p className={styles.feedback} role="status">{t("loading")}</p>}
    {error && <RetryNotice className={styles.error} message={t("adminLoadError")} retryLabel={t("retry")} disabled={loading} busy={loading} onRetry={() => setRevision(value => value + 1)} />}
    {data && data.content.length === 0 && <p>{t("noAdminArticles")}</p>}
    {data && <>
      <ul className={styles.articleList}>{data.content.map(item => { const status = newsletterStatuses[item.id]; const articleTitle = editorialText(item.title, t("untitledArticle")); return <li className={styles.articleRow} key={item.id}>{item.language === "uk" ? t("articleLanguageUk") : t("articleLanguageEn")} · {articleTitle} · {t(item.publishedAt ? "articlePublished" : "articleDraft")}{item.audioUrl && ` · ${t("podcastAudio")}`}<button type="button" disabled={creating} aria-label={`${t("editArticle")}: ${articleTitle}`} onClick={event => editArticle(item, event.currentTarget)}>{t("editArticle")}</button>{item.publishedAt && <><button type="button" aria-busy={newsletterBusyId === item.id} disabled={newsletterBusyId !== null} onClick={() => void sendNewsletter(item)}>{newsletterBusyId === item.id ? t("loading") : t("sendNewsletter")}</button>{status && ` · ${t("newsletterQueueStatus")}: ${status.pending}/${status.sent}/${status.failed}`}</>}</li>; })}</ul>
      <Pagination className={styles.pagination} page={page} totalPages={data.totalPages} label={t("adminArticlesPagination")} busy={loading} statusSuffix={data.totalElements} onPageChange={setPage} />
    </>}
  </section>;
}
