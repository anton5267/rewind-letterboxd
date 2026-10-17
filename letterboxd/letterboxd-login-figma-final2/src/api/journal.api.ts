import api from "./axios";
export interface JournalArticle { id: number; slug: string; language: string; category: string; title: string; excerpt: string | null; content: string; coverUrl: string | null; publishedAt: string | null }
export interface JournalPage { content: JournalArticle[]; totalPages: number; totalElements: number }
export interface JournalArchiveEntry { year: number; month: number; articleCount: number }
export const getJournal = (language: string, category?: string, archive?: Pick<JournalArchiveEntry, "year" | "month">) => api.get<JournalPage>("/journal/articles", { params: { language, size: 20, ...(category ? { category } : {}), ...(archive ? { year: archive.year, month: archive.month } : {}) } });
export const getJournalArchive = (language: string) => api.get<JournalArchiveEntry[]>("/journal/articles/archive", { params: { language } });
export const getJournalArticle = (language: string, slug: string) => api.get<JournalArticle>(`/journal/articles/${encodeURIComponent(slug)}`, { params: { language } });
