import type { JournalMedia } from "./journal_media.ts";

export interface JournalArticleResponse extends JournalMedia {
  id: number; slug: string; language: string; category: string; title: string; excerpt: string | null;
  content: string; coverUrl: string | null; audioUrl: string | null; publishedAt: string | null; authorName?: string | null;
}

export interface JournalArchiveEntry { year: number; month: number; articleCount: number }

export interface NewsletterSubscriptionResponse { subscribed: boolean }

export interface AdminJournalArticleRequest extends JournalMedia {
  slug: string; language: "uk" | "en"; category: string; title: string; excerpt: string | null;
  content: string; coverUrl: string | null; audioUrl: string | null; published: boolean;
}

export interface NewsletterQueueResponse { articleId: number; recipients: number }

export interface NewsletterDeliveryStatusResponse { articleId: number; pending: number; sending: number; sent: number; failed: number; cancelled: number }
