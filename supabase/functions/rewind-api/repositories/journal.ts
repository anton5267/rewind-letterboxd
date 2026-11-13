import type { AdminJournalArticleRequest, JournalArchiveEntry, JournalArticleResponse, NewsletterDeliveryStatusResponse, NewsletterQueueResponse } from "../contracts/journal.ts";
import type { RewindApiRepository } from "../contracts/repository.ts";
import { RewindApiError } from "../http/errors.ts";
import {
  pool,
} from "../runtime/database.ts";
import {
  beginAdminTransaction,
  beginUserTransaction,
} from "../runtime/transactions.ts";
import {
  recordAdminAudit,
} from "./shared/admin_audit.ts";
import {
  pageResult,
  safeId,
} from "./shared/results.ts";

function toJournalArticle(row: {
  id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
  content: string; cover_url: string | null; audio_url: string | null; published_at: string | null; author_name?: string | null;
}): JournalArticleResponse {
  return { id: safeId(row.id, "Journal article ID"), slug: row.slug, language: row.language, category: row.category,
    title: row.title, excerpt: row.excerpt, content: row.content, coverUrl: row.cover_url, audioUrl: row.audio_url,
    publishedAt: row.published_at, authorName: row.author_name ?? null };
}

export const journalRepository: Pick<RewindApiRepository,
  | "getAdminJournalArticles"
  | "queueAdminNewsletter"
  | "getAdminNewsletterStatus"
  | "createAdminJournalArticle"
  | "updateAdminJournalArticle"
  | "getJournal"
  | "getJournalArchive"
  | "getJournalArticle"
  | "getNewsletterSubscription"
  | "updateNewsletterSubscription"
> = {

  async getAdminJournalArticles(authUser, page, size) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: "SELECT COUNT(*)::text AS total FROM rewind.journal_articles", args: [] }),
        connection.queryObject<{
          id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
          content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
        }>({
          text: `SELECT id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at
                 FROM rewind.journal_articles ORDER BY updated_at DESC, id DESC LIMIT $1 OFFSET $2`, args: [size, page * size],
        }),
      ]);
      await connection.queryObject("COMMIT");
      return pageResult(rows.rows.map(toJournalArticle), count.rows[0]?.total ?? "0", page, size);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async queueAdminNewsletter(authUser, articleId) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const article = await connection.queryObject<{ is_published: boolean; category: string }>({
        text: "SELECT is_published, category FROM rewind.journal_articles WHERE id=$1", args: [articleId],
      });
      if (!article.rows[0]) throw new RewindApiError(404, "Article not found");
      if (!article.rows[0].is_published || !["newsletter", "бюлетень"].includes(article.rows[0].category.trim().toLowerCase())) {
        throw new RewindApiError(400, "Only published Newsletter articles can be sent");
      }
      const queued = await connection.queryObject({
        text: `INSERT INTO rewind.newsletter_deliveries (article_id, user_id)
               SELECT $1, ns.user_id FROM rewind.newsletter_subscriptions ns
               JOIN rewind.users u ON u.id=ns.user_id
               WHERE ns.is_subscribed=TRUE AND u.is_active=TRUE
               ON CONFLICT (article_id, user_id) DO NOTHING RETURNING id`, args: [articleId],
      });
      const recipients = queued.rows.length;
      await recordAdminAudit(connection, userId, "JOURNAL_NEWSLETTER_QUEUED", "JOURNAL_ARTICLE", articleId, `queued=${recipients}`);
      await connection.queryObject("COMMIT");
      return { articleId: safeId(String(articleId), "Article ID"), recipients } satisfies NewsletterQueueResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getAdminNewsletterStatus(authUser, articleId) {
    const { connection } = await beginAdminTransaction(authUser);
    try {
      const article = await connection.queryObject({ text: "SELECT id FROM rewind.journal_articles WHERE id=$1", args: [articleId] });
      if (!article.rows.length) { await connection.queryObject("COMMIT"); return null; }
      const result = await connection.queryObject<{
        pending: string; sending: string; sent: string; failed: string; cancelled: string;
      }>({
        text: `SELECT COUNT(*) FILTER (WHERE status='PENDING')::text AS pending,
                      COUNT(*) FILTER (WHERE status='SENDING')::text AS sending,
                      COUNT(*) FILTER (WHERE status='SENT')::text AS sent,
                      COUNT(*) FILTER (WHERE status='FAILED')::text AS failed,
                      COUNT(*) FILTER (WHERE status='CANCELLED')::text AS cancelled
               FROM rewind.newsletter_deliveries WHERE article_id=$1`, args: [articleId],
      });
      await connection.queryObject("COMMIT");
      const row = result.rows[0]!;
      return {
        articleId: safeId(String(articleId), "Article ID"), pending: Number(row.pending), sending: Number(row.sending),
        sent: Number(row.sent), failed: Number(row.failed), cancelled: Number(row.cancelled),
      } satisfies NewsletterDeliveryStatusResponse;
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async createAdminJournalArticle(authUser, body: AdminJournalArticleRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `INSERT INTO rewind.journal_articles
                 (slug, language, category, title, excerpt, content, cover_url, audio_url, is_published, published_at, author_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $9 THEN CURRENT_TIMESTAMP ELSE NULL END,$10)
               RETURNING id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at`,
        args: [body.slug, body.language, body.category, body.title, body.excerpt, body.content, body.coverUrl, body.audioUrl, body.published, userId],
      });
      const article = result.rows[0];
      if (!article) throw new Error("Journal article was not created.");
      await connection.queryObject({
        text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
        args: [userId, "JOURNAL_ARTICLE_CREATED", "JOURNAL_ARTICLE", safeId(article.id, "Journal article ID"), article.language],
      });
      await connection.queryObject("COMMIT");
      return toJournalArticle(article);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateAdminJournalArticle(authUser, id, body: AdminJournalArticleRequest) {
    const { connection, userId } = await beginAdminTransaction(authUser);
    try {
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `UPDATE rewind.journal_articles SET slug=$2, language=$3, category=$4, title=$5, excerpt=$6, content=$7,
                 cover_url=$8, audio_url=$9, is_published=$10,
                 published_at=CASE WHEN $10 THEN COALESCE(published_at,CURRENT_TIMESTAMP) ELSE NULL END
               WHERE id=$1
               RETURNING id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at`,
        args: [id, body.slug, body.language, body.category, body.title, body.excerpt, body.content, body.coverUrl, body.audioUrl, body.published],
      });
      const article = result.rows[0];
      if (!article) { await connection.queryObject("COMMIT"); return null; }
      await connection.queryObject({
        text: "INSERT INTO rewind.admin_audit_logs (admin_id, action, target_type, target_id, metadata) VALUES ($1, $2, $3, $4, $5)",
        args: [userId, "JOURNAL_ARTICLE_UPDATED", "JOURNAL_ARTICLE", id, article.language],
      });
      await connection.queryObject("COMMIT");
      return toJournalArticle(article);
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async getJournal(language, category, year, month, page, size) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const predicates = [`a.is_published = TRUE`, `(a.language = $1 OR (a.language = $2 AND NOT EXISTS (
        SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
          AND preferred.language = $1 AND preferred.is_published = TRUE)) )`];
      const args: unknown[] = [language, fallback];
      if (category !== null) { args.push(category); predicates.push(`a.category = $${args.length}`); }
      if (year !== null && month !== null) {
        const from = new Date(Date.UTC(year, month - 1, 1)).toISOString();
        const to = new Date(Date.UTC(year, month, 1)).toISOString();
        args.push(from, to);
        predicates.push(`a.published_at >= $${args.length - 1}::timestamptz AND a.published_at < $${args.length}::timestamptz`);
      }
      const where = predicates.join(" AND ");
      const [count, rows] = await Promise.all([
        connection.queryObject<{ total: string }>({ text: `SELECT COUNT(*)::text AS total FROM rewind.journal_articles a WHERE ${where}`, args }),
        connection.queryObject<{
          id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
          content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
        }>({
          text: `SELECT a.id::text AS id, a.slug, a.language, a.category, a.title, a.excerpt, a.content,
                       a.cover_url, a.audio_url, a.published_at::text AS published_at,
                       (SELECT COALESCE(NULLIF(BTRIM(author.display_name), ''), author.username)
                         FROM rewind.users author WHERE author.id = a.author_id AND author.is_active = TRUE) AS author_name
                FROM rewind.journal_articles a WHERE ${where}
                ORDER BY a.published_at DESC, a.id DESC LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
          args: [...args, size, page * size],
        }),
      ]);
      return pageResult(rows.rows.map(toJournalArticle), count.rows[0]?.total ?? "0", page, size);
    } finally { connection.release(); }
  },

  async getJournalArchive(language): Promise<JournalArchiveEntry[]> {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const result = await connection.queryObject<{ year: number; month: number; article_count: string }>({
        text: `SELECT EXTRACT(YEAR FROM a.published_at AT TIME ZONE 'UTC')::int AS year,
                      EXTRACT(MONTH FROM a.published_at AT TIME ZONE 'UTC')::int AS month,
                      COUNT(*)::text AS article_count
               FROM rewind.journal_articles a
               WHERE a.is_published = TRUE AND a.published_at IS NOT NULL
                 AND (a.language = $1 OR (a.language = $2 AND NOT EXISTS (
                   SELECT 1 FROM rewind.journal_articles preferred WHERE preferred.slug = a.slug
                     AND preferred.language = $1 AND preferred.is_published = TRUE)))
               GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC`, args: [language, fallback],
      });
      return result.rows.map((row) => ({ year: row.year, month: row.month, articleCount: Number(row.article_count) }));
    } finally { connection.release(); }
  },

  async getJournalArticle(language, slug) {
    const connection = await pool.connect();
    try {
      await connection.queryObject("SET ROLE rewind_edge_app");
      const fallback = language === "en" ? "uk" : "en";
      const result = await connection.queryObject<{
        id: string; slug: string; language: string; category: string; title: string; excerpt: string | null;
        content: string; cover_url: string | null; audio_url: string | null; published_at: string | null;
      }>({
        text: `SELECT id::text AS id, slug, language, category, title, excerpt, content, cover_url, audio_url, published_at::text AS published_at,
                      (SELECT COALESCE(NULLIF(BTRIM(author.display_name), ''), author.username)
                         FROM rewind.users author WHERE author.id = a.author_id AND author.is_active = TRUE) AS author_name
               FROM rewind.journal_articles a WHERE slug = $1 AND is_published = TRUE AND language IN ($2, $3)
               ORDER BY CASE WHEN language = $2 THEN 0 ELSE 1 END LIMIT 1`, args: [slug, language, fallback],
      });
      return result.rows[0] ? toJournalArticle(result.rows[0]) : null;
    } finally { connection.release(); }
  },

  async getNewsletterSubscription(authUser) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      const result = await connection.queryObject<{ is_subscribed: boolean }>({
        text: "SELECT is_subscribed FROM rewind.newsletter_subscriptions WHERE user_id = $1", args: [userId],
      });
      await connection.queryObject("COMMIT");
      return { subscribed: result.rows[0]?.is_subscribed ?? false };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },

  async updateNewsletterSubscription(authUser, subscribed) {
    const { connection, userId } = await beginUserTransaction(authUser);
    try {
      await connection.queryObject({
        text: `INSERT INTO rewind.newsletter_subscriptions (user_id, is_subscribed, subscribed_at)
               VALUES ($1, $2, CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE NULL END)
               ON CONFLICT (user_id) DO UPDATE SET is_subscribed = EXCLUDED.is_subscribed,
                 subscribed_at = EXCLUDED.subscribed_at`, args: [userId, subscribed],
      });
      await connection.queryObject("COMMIT");
      return { subscribed };
    } catch (error) {
      try { await connection.queryObject("ROLLBACK"); } catch { /* transaction may already be closed */ }
      throw error;
    } finally { connection.release(); }
  },
};
