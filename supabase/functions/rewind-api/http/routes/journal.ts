import type { HttpRouteContext } from "../context.ts";
import { optionalInteger, parseRouteId, parseSocialPage } from "../parsers/query.ts";
import { parseAdminJournalArticle } from "../parsers/admin.ts";
import { confirmedAuthUser, json, repositoryFailure } from "../response.ts";

const JOURNAL_PATH = "/api/journal/articles";
const JOURNAL_ARCHIVE_PATH = "/api/journal/articles/archive";
const JOURNAL_ARTICLE_PATTERN = /^\/api\/journal\/articles\/([^/]+)$/;
const NEWSLETTER_SUBSCRIPTION_PATH = "/api/newsletter/subscription";
const ADMIN_JOURNAL_PATH = "/api/admin/journal/articles";
const ADMIN_JOURNAL_ARTICLE_PATTERN = /^\/api\/admin\/journal\/articles\/(\d+)(?:\/(newsletter))?$/;

export async function handleJournalRoutes(context: HttpRouteContext): Promise<Response | null> {
  const { request, path, query, corsHeaders, repository, authVerifier } = context;

  const adminJournalArticleMatch = path.match(ADMIN_JOURNAL_ARTICLE_PATTERN);

  if (path === ADMIN_JOURNAL_PATH || adminJournalArticleMatch) {
    const newsletterRoute = adminJournalArticleMatch?.[2] === "newsletter";
    const allowed = path === ADMIN_JOURNAL_PATH ? ["GET", "POST"] : newsletterRoute ? ["GET", "POST"] : ["PUT"];
    if (!allowed.includes(request.method)) {
      corsHeaders.set("Allow", `${allowed.join(", ")}, OPTIONS`);
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (newsletterRoute) {
        const id = parseRouteId(adminJournalArticleMatch![1]);
        if (id === null) return json({ message: "Invalid article ID" }, 400, corsHeaders);
        if (request.method === "GET") {
          if (!repository.getAdminNewsletterStatus) return json({ message: "Not found" }, 404, corsHeaders);
          const status = await repository.getAdminNewsletterStatus(authUser, id);
          return status ? json(status, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
        }
        if (!repository.queueAdminNewsletter) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.queueAdminNewsletter(authUser, id), 200, corsHeaders);
      }
      if (request.method === "GET") {
        if (!repository.getAdminJournalArticles) return json({ message: "Not found" }, 404, corsHeaders);
        const requestedPage = optionalInteger(query.get("page"), 0);
        let requestedSize = optionalInteger(query.get("size"), 50);
        if (requestedSize === 0) requestedSize = 50;
        return json(await repository.getAdminJournalArticles(authUser, Math.max(0, Math.min(requestedPage, 1000)), Math.max(1, Math.min(requestedSize, 100))), 200, corsHeaders);
      }
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      const article = parseAdminJournalArticle(body);
      if (!article) return json({ message: "Invalid journal article" }, 400, corsHeaders);
      if (path === ADMIN_JOURNAL_PATH) {
        if (!repository.createAdminJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.createAdminJournalArticle(authUser, article), 200, corsHeaders);
      }
      const id = parseRouteId(adminJournalArticleMatch![1]);
      if (id === null) return json({ message: "Invalid article ID" }, 400, corsHeaders);
      if (!repository.updateAdminJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
      const updated = await repository.updateAdminJournalArticle(authUser, id, article);
      return updated ? json(updated, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("Admin journal operation failed", error);
      return repositoryFailure(error, "Unable to manage journal article", corsHeaders);
    }
  }

  const journalArticleMatch = path.match(JOURNAL_ARTICLE_PATTERN);

  if (path === JOURNAL_PATH || path === JOURNAL_ARCHIVE_PATH || journalArticleMatch) {
    if (request.method !== "GET") {
      corsHeaders.set("Allow", "GET, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const language = query.get("language") === "en" ? "en" : "uk";
    try {
      if (path === JOURNAL_ARCHIVE_PATH) {
        if (!repository.getJournalArchive) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getJournalArchive(language), 200, corsHeaders);
      }
      if (journalArticleMatch) {
        if (!repository.getJournalArticle) return json({ message: "Not found" }, 404, corsHeaders);
        let slug: string;
        try { slug = decodeURIComponent(journalArticleMatch[1]); } catch { return json({ message: "Invalid article slug" }, 400, corsHeaders); }
        const article = await repository.getJournalArticle(language, slug);
        return article ? json(article, 200, corsHeaders) : json({ message: "Article not found" }, 404, corsHeaders);
      }
      if (!repository.getJournal) return json({ message: "Not found" }, 404, corsHeaders);
      const rawYear = query.get("year");
      const rawMonth = query.get("month");
      const year = rawYear === null ? null : /^\d{1,4}$/.test(rawYear) ? Number(rawYear) : NaN;
      const month = rawMonth === null ? null : /^\d{1,2}$/.test(rawMonth) ? Number(rawMonth) : NaN;
      if ((rawYear !== null && !Number.isSafeInteger(year)) || (rawMonth !== null && !Number.isSafeInteger(month))
        || ((year === null) !== (month === null)) || (year !== null && (year < 1900 || year > 9999 || month! < 1 || month! > 12))) {
        return json({ message: "Invalid archive month" }, 400, corsHeaders);
      }
      const { page, size } = parseSocialPage(query);
      const category = query.get("category")?.trim() || null;
      return json(await repository.getJournal(language, category, year, month, page, size), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to load journal", corsHeaders);
    }
  }

  if (path === NEWSLETTER_SUBSCRIPTION_PATH) {
    if (!(["GET", "PUT"] as string[]).includes(request.method)) {
      corsHeaders.set("Allow", "GET, PUT, OPTIONS");
      return json({ message: "Method not allowed" }, 405, corsHeaders);
    }
    const authUser = await confirmedAuthUser(request, authVerifier);
    if (!authUser) return json({ message: "Authentication required" }, 401, corsHeaders);
    try {
      if (request.method === "GET") {
        if (!repository.getNewsletterSubscription) return json({ message: "Not found" }, 404, corsHeaders);
        return json(await repository.getNewsletterSubscription(authUser), 200, corsHeaders);
      }
      if (!repository.updateNewsletterSubscription) return json({ message: "Not found" }, 404, corsHeaders);
      let body: unknown;
      try { body = await request.json(); } catch { return json({ message: "Invalid request body" }, 400, corsHeaders); }
      if (!body || typeof body !== "object" || typeof (body as { subscribed?: unknown }).subscribed !== "boolean") {
        return json({ message: "Invalid subscription preference" }, 400, corsHeaders);
      }
      return json(await repository.updateNewsletterSubscription(authUser, (body as { subscribed: boolean }).subscribed), 200, corsHeaders);
    } catch (error) {
      return repositoryFailure(error, "Unable to update newsletter subscription", corsHeaders);
    }
  }

  return null;
}
