import type { JournalArticleResponse } from "../../contracts/journal.ts";
import { storedJournalMedia } from "../../http/parsers/journal_media.ts";
import { safeId } from "./results.ts";

export interface JournalArticleRow {
  id: string;
  slug: string;
  language: string;
  category: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_url: string | null;
  audio_url: string | null;
  published_at: string | null;
  author_name?: string | null;
  cover_images?: unknown;
  content_blocks?: unknown;
}

export function toJournalArticle(
  row: JournalArticleRow,
): JournalArticleResponse {
  return {
    id: safeId(row.id, "Journal article ID"),
    slug: row.slug,
    language: row.language,
    category: row.category,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverUrl: row.cover_url,
    audioUrl: row.audio_url,
    publishedAt: row.published_at,
    authorName: row.author_name ?? null,
    ...storedJournalMedia(row),
  };
}
